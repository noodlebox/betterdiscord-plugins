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

    // Get the relevant user color for an element, or undefined
    function getUserColor(e) {
        var props = getInternalProps(e);
        if (props === undefined) {
            return undefined;
        }

        try {
            return props.message.colorString;
        } catch (err) {
            // Catch TypeError if no message in props
        }

        // Return colorString or undefined if not present
        return props.colorString;
    }

    // Get the relevant guild ID for an element, or undefined
    function getGuildId(e) {
        var props = getInternalProps(e);
        if (props === undefined) {
            return undefined;
        }

        try {
            return props.guild.id;
        } catch (err) {
            // Catch TypeError if no guild in props
        }

        return undefined;
    }

    // Get the relevant guild owner ID for an element, or undefined
    function getOwnerId(e) {
        var props = getInternalProps(e);
        if (props === undefined) {
            return undefined;
        }

        try {
            return props.guild.ownerId;
        } catch (err) {
            // Catch TypeError if no guild in props
        }

        return undefined;
    }

    var prevGuildId;

    function processServer(mutation) {
        var guild, guildId, ownerId, usernames, tags;

        guild = $(".guild.selected")[0];

        // Get the ID of the server
        guildId = getGuildId(guild);

        // Get the ID of the server's owner
        ownerId = getOwnerId(guild);
        if (ownerId === undefined) {
            // (Probably) not looking at a server
            return;
        }

        // Check if changed servers and need to redo member list tagging
        // React likes to make minimal changes to the DOM, so owner tags
        // will stick around (or not get added) when a user is in both this
        // and the previous server.
        if (guildId !== prevGuildId) {
            // Get all visible members
            usernames = $(".member-username-inner");
            // Remove tags that were added
            usernames.siblings(".kawaii-tag").remove();
            usernames.filter(".kawaii-tagged").removeClass("kawaii-tagged");
            // Add the set of message authors affected by this mutation
            usernames = usernames.add(mutationFind(mutation, ".user-name"));
        } else {
            // Get the set of message authors and server members affected by this mutation
            usernames = mutationFind(mutation, ".member-username-inner, .user-name");
        }

        // Process usernames
        usernames.filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged").after(function () {
            var color = getUserColor(this);
            var tag = $("<span>", {
                class: "bot-tag kawaii-tag",
            }).text("OWNER");
            if (color !== null) {
                tag.css("background-color", color);
            }
            return tag;
        }).addClass("kawaii-tagged");

        tags = mutationFind(mutation, ".discord-tag");

        tags.filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged")
            .append($("<span>", {class: "bot-tag bot-tag-invert kawaii-tag"}).text("OWNER"))
            .addClass("kawaii-tagged");

        prevGuildId = guildId;
    }

    function processProfile(mutation) {
        var profile, userId, guilds;

        profile = mutationFind(mutation, "#user-profile-modal");
        userId = getUserId(profile[0]);
        if (userId === undefined) {
            // (Probably) not looking at a profile
            return;
        }

        guilds = profile.find(".guild .avatar-large");

        guilds.filter((_, e) => getOwnerId(e) === userId).parent().not(".kawaii-tagged")
            .append($("<span>", {class: "bot-tag kawaii-tag"}).text("OWNER"))
            .addClass("kawaii-tagged");
    }

    // Helper function for finding all elements matching selector affected by a mutation
    function mutationFind(mutation, selector) {
        var target = $(mutation.target), addedNodes = $(mutation.addedNodes);
        var mutated = target.add(addedNodes).filter(selector);
        var descendants = addedNodes.find(selector);
        var ancestors = target.parents(selector);
        return mutated.add(descendants).add(ancestors);
    }

    ownerTag.prototype.start = function () {
        // process entire document
        var mutation = {target: document, addedNodes: [document]};
        processServer(mutation);
        processProfile(mutation);
    };

    ownerTag.prototype.observer = function (mutation) {
        processServer(mutation);
        processProfile(mutation);
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
        return "1.2.2";
    };

    ownerTag.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();
