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

    ownerTag.prototype.start = function () {
        // Get the ID of the server's owner
        var ownerId = getOwnerId();
        if (ownerId === undefined) {
            return;
        }

        // Get the set of username elements belonging to the owner
        var usernames = $(".username-wrapper")
            .filter((_, e) => getInternalProps(e).message.author.id === ownerId);
        var members = $(".member-username")
            .filter((_, e) => getInternalProps(e).user.id === ownerId);

        // Process usernames
        addTags(usernames.add(members));
    };

    ownerTag.prototype.observer = function (mutation) {
        // Get the ID of the server's owner
        var ownerId = getOwnerId();
        if (ownerId === undefined) {
            return;
        }

        // Get the set of username elements belonging to the owner
        var usernames = mutationFind(mutation, ".username-wrapper")
            .filter((_, e) => getInternalProps(e).message.author.id === ownerId);
        var members = mutationFind(mutation, ".member-username")
            .filter((_, e) => getInternalProps(e).user.id === ownerId);

        // Process usernames
        addTags(usernames.add(members));
    };

    ownerTag.prototype.onSwitch = function () {
        this.stop();
        this.start();
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
        return "1.0.0";
    };

    ownerTag.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();
