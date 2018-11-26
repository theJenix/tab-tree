function LinkGraphCons(store) {
    // console.log(store);
    var graph = new Graph();

    function LinkInfo(url, title, description, color) {
        return {
            url: url,
            title: title,
            description: description,
            color: color
        }
    };


    /* Adding nodes */

    this.addNode = function addNode(url, title, description, color, other, parent) {
        var info = new LinkInfo(url, title || "Untitled", description || "No description available", color || "#ccc");
        graph.addNode(url, info);
        this._updateInfo(url, other || {})
        if (parent) {
            graph.addEdge(parent, url);
        }
        this.syncNodes();
    };

    this.addOrganizationNode = function addOrganizationNode(title, description, color, other) {
        var info = new LinkInfo(title, title, description || "No description available", color || "#fff");
        graph.addNode(title, info);
        this._updateInfo(title, {organization: true});
        this._updateInfo(title, other || {})
        this.syncNodes();
    };

    this.addSearchNode = function addSearchNode(url, search, parent) {
        var info = new LinkInfo(url, "Search for " + search, "Search page for " + search, "#3ae");
        graph.addNode(url, info);
        if (parent) {
            graph.addEdge(parent, url);
        }
        this.syncNodes();
    };

    this.addLink = function addLink(from, to) {
        graph.addEdge(from, to);
        this.syncNodes();
    };


    /* Removing nodes */

    this.removeNode = function removeNode(url) {
        graph.removeNode(url);
        this.syncNodes();
    };

    this.collapseNode = function collapseNode(url) {
        var node = graph.getNode(url);
        for (var parentid in node.parentids) {
            for (var childid in node.childids) {
                if (parentid != childid) {
                    graph.addEdge(parentid, childid);
                }
            }
        }
        graph.removeNode(url);
        this.syncNodes();
    };

    this.removeLink = function removeLink(from, to) {
        graph.removeEdge(from, to);
        this.syncNodes();
    };


    /* Updating nodes */

    this.changeColor = function changeColor(url, color) {
        graph.getNode(url).value.color = color;
        this.syncNodes();
    };

    this.setTitle = function setTitle(url, title) {
        if (title) {
            graph.getNode(url).value.title = title;
        }
        this.syncNodes();
    };

    this.setDescription = function setDescription(url, description) {
        if (description) {
            graph.getNode(url).value.description = description;
        }
        this.syncNodes();
    };

    this._updateInfo = function _updateInfo(url, items) {
        //NOTE: this does not sync.  the caller must sync
        var node = graph.getNode(url);
        for (var item in items) {
            node.value[item] = items[item];
        }
    };


    /* Retrieving nodes */

    this.getUrls = function getUrls() {
        return graph.getNodeIds();
    };

    this.getNodes = function getNodes() {
        var nodes = [];
        var urls = graph.getNodeIds();
        for (var i = 0; i < urls.length; i++) {
            nodes.push(graph.getNode(urls[i]));
        }
        return nodes;
    };

    this.getNode = function getNode(url) {
        return graph.getNode(url);
    };

    this.getParentsOfNode = function getParentsOfNode(url) {
        var nodes = [];
        for (var url in graph.getNode(url).parentids) {
            nodes.push(graph.getNode(url));
        }
        return nodes;
    };

    this.getChildrenOfNode = function getChildrenOfNode(url) {
        var nodes = [];
        for (var url in graph.getNode(url).childids) {
            nodes.push(graph.getNode(url));
        }
        return nodes;
    };


    /* Autosave functionality */

    this.syncNodes = function syncNodes() {
        // TODO: pass in from caller?
        error_fn = function(code, error) {
            console.error('Error ' + code + ' saving to server: ' + error);
        };
        store.save(graph.getNodeSet(), error_fn);
    };

    this.loadNodes = function loadNodes() {
        store.load(function(nodes) {
            graph = new Graph(nodes);
        });
    };

    this.loadNodes();
};

