//META{"name":"ownerTag"}*//

var ownerTag = function () {};

(function () {
    "use strict";

    // This is super hackish, and will likely break as Discord's internal API changes
    // Anything using this or what it returns should be prepared to catch some exceptions
    function getInternalProps(e) {
        try {
            var reactInternal = e[Object.keys(e).filter(k => k.startsWith("__reactInternalInstance"))[0]];
            return reactInternal._currentElement._owner._instance.props;
        } catch (err) {
            return undefined;
        }
    }

    // Get the relevant user ID for an element, or undefined
    function getUserId(e) {
        var props = getInternalProps(e);
        if (props === undefined) {
            return undefined;
        }

        try {
            return props.user.id;
        } catch (err) {
            // Catch TypeError if no user in props
        }

        try {
            return props.message.author.id;
        } catch (err) {
            // Catch TypeError if no message in props
        }

        return undefined;
    }

    // Helper function for finding all elements matching selector affected by a mutation
    function mutationFind(mutation, selector) {
        var target = $(mutation.target), addedNodes = $(mutation.addedNodes);
        var mutated = target.add(addedNodes).filter(selector);
        var descendants = addedNodes.find(selector);
        var ancestors = target.parents(selector);
        return mutated.add(descendants).add(ancestors);
    }

    // Get user ID of the owner of the currently active server, or undefined
    function getOwnerId() {
        var server = $(".guild.selected")[0];
        if (server === undefined) {
            // Not looking at a server
            return undefined;
        }
        return getInternalProps(server).guild.ownerId;
    }

    // Add owner tags to all untagged elements
    function addTags(elements) {
        elements.not(".kawaii-tagged")
            .append($("<span>", {class: "bot-tag kawaii-tag"}).text("OWNER"))
            .addClass("kawaii-tagged");
    }

    var prevOwnerId;

    ownerTag.prototype.start = function () {
        // Get the ID of the server's owner
        var ownerId = getOwnerId();
        if (ownerId === undefined) {
            return;
        }

        // Get a set of message authors and server members
        var usernames = $(".member-username, .username-wrapper");

        // Process usernames
        addTags(usernames.filter((_, e) => getUserId(e) === ownerId));

        prevOwnerId = ownerId;
    };

    ownerTag.prototype.observer = function (mutation) {
        // Get the ID of the server's owner
        var ownerId = getOwnerId();
        if (ownerId === undefined) {
            return;
        }

        var usernames;
        // Check if changed servers and need to redo member list tagging
        // React likes to make minimal changes to the DOM, so owner tags
        // will stick around (or not get added) when a user is in both this
        // and the previous server.
        if (ownerId !== prevOwnerId) {
            // Get all visible members
            usernames = $(".member-username");
            // Remove tags that were added
            usernames.find(".kawaii-tag").remove();
            usernames.filter(".kawaii-tagged").removeClass("kawaii-tagged");
            // Add the set of message authors affected by this mutation
            usernames = usernames.add(mutationFind(mutation, ".username-wrapper"));
        } else {
            // Get the set of message authors and server members affected by this mutation
            usernames = mutationFind(mutation, ".member-username, .username-wrapper");
        }

        // Process usernames
        addTags(usernames.filter((_, e) => getUserId(e) === ownerId));

        prevOwnerId = ownerId;
    };

    ownerTag.prototype.load = function () {};

    ownerTag.prototype.unload = function () {};

    ownerTag.prototype.stop = function () {
        // Remove tags that were added
        $(".kawaii-tag").remove();
        $(".kawaii-tagged").removeClass("kawaii-tagged");
    };

    ownerTag.prototype.getSettingsPanel = function () {
        return "";
    };

    ownerTag.prototype.getName = function () {
        return "Owner Tags";
    };

    ownerTag.prototype.getDescription = function () {
        return "Show a tag next to a server owner's name";
    };

    ownerTag.prototype.getVersion = function () {
        return "1.0.1";
    };

    ownerTag.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();
