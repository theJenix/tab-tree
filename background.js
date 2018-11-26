
// Create the link graph and the synchronized storage
// TODO this should be reloaded with some regularity, at least when the tab tree page is opened, but possibly have a listener/websocket/long poll dealy with the server
LinkGraph = new LinkGraphCons(new SynchronizedStore(new LocalStore("autosave"), new ServerStore(server_url)));

function openTab(url) {
    chrome.tabs.create({
        url: url
    });
}

function updateGraphVisualization() {
    chrome.runtime.sendMessage("UpdateVisualization");
}

var nonLinkContexts = ['page', 'frame', 'selection', 'editable',
                       'image', 'video', 'audio'];

function createPageMenuItem(title, parent, onclick) {
    var menuItem = {
        title: title,
        contexts: nonLinkContexts
    }
    if (parent) {
        menuItem.parentId = parent;
    }
    if (onclick) {
        menuItem.onclick = onclick;
    }
    return menuItem;
}

function createContextMenusForVisualization() {
    chrome.contextMenus.removeAll();
    var root = chrome.contextMenus.create({
        title: 'TabTree',
        contexts: nonLinkContexts
    },
        function() {
            chrome.contextMenus.create(createPageMenuItem(
                'Create organization...',
                root,
                function(info, tab) {
                    var title = prompt("Enter a title");
                    if (title && !LinkGraph.getNode(title)) {
                        var description = prompt("Enter a description");
                        LinkGraph.addOrganizationNode(title, description);
                        updateGraphVisualization();
                    } else {
                        alert("Title must be unique and nonempty");
                    }
                }));
        });
}

function createContextMenus(currentTabInGraph) {
    chrome.contextMenus.removeAll();

    if (currentTabInGraph) {
        var root = chrome.contextMenus.create({
                title: 'TabTree',
                contexts: nonLinkContexts
            },
            function() {
                chrome.contextMenus.create(createPageMenuItem(
                    'Remove page from tree',
                    root,
                    function(info, tab) {
                        LinkGraph.removeNode(info.pageUrl);
                        createContextMenus(false);
                        updateGraphVisualization();
                    }));
                var updatePage = chrome.contextMenus.create(createPageMenuItem(
                        'Update page',
                        root),
                    function() {
                        chrome.contextMenus.create(createPageMenuItem(
                            'Change title',
                            updatePage,
                            function(info, tab) {
                                LinkGraph.setTitle(info.pageUrl, prompt("Enter a title"));
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Change description',
                            updatePage,
                            function(info, tab) {
                                LinkGraph.setDescription(info.pageUrl, prompt("Enter a description"));
                                updateGraphVisualization();
                            }));
                    });
                var markPage = chrome.contextMenus.create(createPageMenuItem(
                        'Change color...',
                        root),
                    function() {
                        chrome.contextMenus.create(createPageMenuItem(
                            'Red',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#e00");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Orange',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#f70");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Yellow',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#fe2");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Green',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#3d0");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Blue',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#3ae");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Purple',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#a0d");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'White',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#fff");
                                updateGraphVisualization();
                            }));
                        chrome.contextMenus.create(createPageMenuItem(
                            'Gray',
                            markPage,
                            function(info, tab) {
                                LinkGraph.changeColor(info.pageUrl, "#ccc");
                                updateGraphVisualization();
                            }));
                    });
                chrome.contextMenus.create({
                    type: 'separator',
                    parentId: root
                });
                chrome.contextMenus.create(createPageMenuItem(
                    'Search from this page',
                    root,
                    function(info, tab) {
                        var query = prompt("Enter a query");
                        if (query) {
                            var url = "https://www.google.com/#q=" + encodeURI(query);
                            LinkGraph.addSearchNode(url, query, info.pageUrl);
                            openTab(url);
                            updateGraphVisualization();
                        }
                    }));
                chrome.contextMenus.create(createPageMenuItem(
                    'Close tab',
                    root,
                    function(info, tab) {
                        chrome.tabs.remove(tab.id, function () {});
                    }));
            });

        chrome.contextMenus.create({
            title: 'Add this link as child page',
            contexts: ['link'],
            onclick: function(info, tab) {
                if (LinkGraph.getNode(info.linkUrl)) {
                    LinkGraph.addLink(info.pageUrl, info.linkUrl);
                } else {
                    chrome.tabs.executeScript(null, {code: 'document.activeElement.innerHTML'}, function(results) {
                        LinkGraph.addNode(info.linkUrl, results[0], null, null, null, info.pageUrl);
                    });
                }
                updateGraphVisualization();
            }});
    } else {
        chrome.contextMenus.create(createPageMenuItem(
            'Add page to tree',
            root,
            function(info, tab) {
                LinkGraph.addNode(info.pageUrl, tab.title);
                createContextMenus(true);
                updateGraphVisualization();
            }));
        chrome.contextMenus.create(createPageMenuItem(
            'Add page to tree and close',
            root,
            function(info, tab) {
                LinkGraph.addNode(info.pageUrl, tab.title);
                createContextMenus(true);
                updateGraphVisualization();
                chrome.tabs.remove(tab.id, function () {});
            }));
    }
}

var activeTabId = -1;

function createContextMenusForUrl(url) {
    if (url) {
        if (url.endsWith("visualization/graph-viewer.html")) {
            createContextMenusForVisualization();
        } else {
            createContextMenus(LinkGraph.getNode(url));
        }
    }
}
chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTabId = activeInfo.tabId;
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        createContextMenusForUrl(tab.url);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tabId === activeTabId && changeInfo.url) {
        createContextMenusForUrl(changeInfo.url);
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    openTab("visualization/graph-viewer.html");
});
