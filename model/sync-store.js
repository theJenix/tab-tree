// Internal model: {key : {childids, fixed, index, parentids, px, py, value {color, description, organization, title, url},
// weight, x, y}}

function LocalStore(key) {

    /* Convert from server format to internal format */
    this.translate_in = function translate_in(nodes) {
        return nodes;

       /* return nodes.map(function (node) {
            node.parent = node['parent-id'];
            // FIXME: see FIXME below
            if (!node.id) {
                node.id = node.url;
            }
        });*/
    };

    /* Convert from internal format to server format */
    this.translate_out = function translate_out(nodes) {
        return nodes;
        /*return nodes.map(function (node) {
            if (!node.id) {
                node.id = node.url
            }
        });*/
    };
    this.save = function save(nodeset, error) {
        chrome.storage.local.set({key: this.translate_out(nodeset)});
    };

    this.load = function load(cb) {
        var outer = this;
        chrome.storage.local.get(key, function (obj) {
            if (obj) {
                cb(outer.translate_in(obj.autosave));
            }
        });
    };
}

function ServerStore(base_url) {
    this.debug = true

    // FIXME: the existing code uses node.url as unique id
    // this code assigns an explicit node.id purely to keep the interface
    // clean, but when we translate out we still use node url as id
    // -- the fixme is to straighten out the id thing in the rest of the code
    // and then change these the match.
    /* Convert from server format to internal format */
    this.translate_in = function translate_in(nodes) {
        return nodes;
        /*
        return nodes.map(function (node) {
            node.parent = node['parent-id'];
            node.id = node['node-id'];
        });*/
    };

    /* Convert from internal format to server format */
    this.translate_out = function translate_out(nodes) {
        return nodes;
        /*
        return nodes.map(function (node) {
            node['parent-id'] = node.parent;
            node['node-id'] = node.id
        });*/
    };

    this.save = function save(nodeset, error) {
        var save_url = base_url + "/nodes/all";
        var xhr = new XMLHttpRequest();

        xhr.open("POST", save_url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if(error && xhr.readyState === 4 && xhr.status !== 200) {
                error(xhr.status, xhr.response);
            }
        };
        xhr.send(JSON.stringify({"nodes": this.translate_out(nodeset)}));
    };

    this.load = function load(cb) {
        var load_url = base_url + "/nodes/all";
        var xhr = new XMLHttpRequest();

        var outer = this;
        xhr.open("GET", load_url, true);
        xhr.onreadystatechange = function () {
            //console.log('in onreadystatechange: ' + xhr.readyState);
            if(xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (this.debug) {
                        console.log(xhr.responseText);
                    }
                    obj = JSON.parse(this.responseText);
                    nodes = obj.nodes;
                    cb(outer.translate_in(nodes));
                } else {
                    // TODO: display some kind of error
                    // TODO: FUTUREEEEEEs
                    console.error("" + xhr.status + ": " + xhr.responseText)
                    cb({})
                }
            }
        };
        xhr.send();
    };
}


function SynchronizedStore(local_store, server_store) {

    /* Autosave functionality */

    this.mergeInto = function mergeInto(into, nodes) {
        var modified = false
        // assumes complete tree paths, so we can just fill in gaps without checking parent ids or child ids
        for (var k in nodes) {
            if (!into.has(k)) {
                console.log("Found key to merge: " + k);
                modified = true;
                into[k] = nodes[k];
            }
        }
        /*
        var s1_ids = Set(s1.map(function(x) { return x.id; }));
        var modified = false
        for (var i = 0; i < s2.length; ++i) {
            if (!s1_ids.has(s2[x].id)) {
                modified = true;
                s1.push(s2[i]);
            }
        }*/
        return modified ? into : null;
    };

    this.save = function save(nodes, error) {
        local_store.save(nodes, error);
        server_store.save(nodes, error);
    };

    this.load = function load(cb) {
        // FIXME: can we use async/await?
        var outer = this;
        server_store.load(function(nodes) {
            local_store.load(function(local_nodes) {
                // NOTE: this is onesided...we assume if out of sync changes exist, they will happen on the server
                // and any changes on the client will be sync'd at some time in the future
                // FIXME: this could be dangerous, and should probably be changed
                merged = outer.mergeInto(local_nodes, nodes)
                if (merged) {
                    // TODO: pass in from caller?
                    error_fn = function(code, error) {
                        console.error('Error ' + code + ' saving to server: ' + error);
                    };
                    //this.save(merged, error_fn);
                } else {
                    merged = local_nodes;
                }
                cb(merged);
            });
        });
    }
}
