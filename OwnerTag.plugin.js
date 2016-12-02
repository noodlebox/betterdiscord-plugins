//META{"name":"ownerTag"}*//

/*@cc_on
@if (@_jscript)
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you mistakenly tried to run me directly. (don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.\nJust reload Discord with Ctrl+R.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!\nJust reload Discord with Ctrl+R.", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();
@else @*/

var ownerTag = function () {};

(function () {
    "use strict";

    // This is super hackish, and will likely break as Discord's internal API changes
    // Anything using this or what it returns should be prepared to catch some exceptions
    const getInternalInstance = e => e[Object.keys(e).find(k => k.startsWith("__reactInternalInstance"))];

    function getOwnerInstance(e, {include, exclude=["Popout", "Tooltip", "Scroller", "BackgroundFlash"]} = {}) {
        if (e === undefined) {
            return undefined;
        }

        // Set up filter; if no include filter is given, match all except those in exclude
        const excluding = include === undefined;
        const filter = excluding ? exclude : include;

        // Get displayName of the React class associated with this element
        // Based on getName(), but only check for an explicit displayName
        function getDisplayName(owner) {
            const type = owner._currentElement.type;
            const constructor = owner._instance && owner._instance.constructor;
            return type.displayName || constructor && constructor.displayName || null;
        }
        // Check class name against filters
        function classFilter(owner) {
            const name = getDisplayName(owner);
            return (name !== null && !!(filter.includes(name) ^ excluding));
        }

        // Walk up the hierarchy until a proper React object is found
        for (let prev, curr=getInternalInstance(e); !_.isNil(curr); prev=curr, curr=curr._hostParent) {
            // Before checking its parent, try to find a React object for prev among renderedChildren
            // This finds React objects which don't have a direct counterpart in the DOM hierarchy
            // e.g. Message, ChannelMember, ...
            if (prev !== undefined && !_.isNil(curr._renderedChildren)) {
                /* jshint loopfunc: true */
                let owner = Object.values(curr._renderedChildren)
                    .find(v => !_.isNil(v._instance) && v.getHostNode() === prev.getHostNode());
                if (!_.isNil(owner) && classFilter(owner)) {
                    return owner._instance;
                }
            }

            if (_.isNil(curr._currentElement)) {
                continue;
            }

            // Get a React object if one corresponds to this DOM element
            // e.g. .user-popout -> UserPopout, ...
            let owner = curr._currentElement._owner;
            if (!_.isNil(owner) && classFilter(owner)) {
                return owner._instance;
            }
        }

        return null;
    }

    function getInternalProps(e) {
        if (e === undefined) {
            return undefined;
        }

        try {
            return getOwnerInstance(e).props;
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
        return "1.2.4";
    };

    ownerTag.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();

/*@end @*/
