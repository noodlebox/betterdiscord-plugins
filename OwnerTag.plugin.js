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
            const type = owner.type;
            const constructor = owner.stateNode && owner.stateNode.constructor;
            return type && type.displayName || constructor && constructor.displayName || null;
        }

        // Check class name against filters
        function classFilter(owner) {
            const name = getDisplayName(owner);
            return (name !== null && !!(filter.includes(name) ^ excluding));
        }

        let curr = getInternalInstance(e);
        while (curr) {
            if (classFilter(curr)) {
                return curr.stateNode;
            }
            curr = curr.return;
        }

        return null;
    }

    getOwnerInstance.displayName = 'getOwnerInstance';

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

    // Convert colorString to array of RGB values
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    // Check whether colorString is brighter than middle gray
    // See: https://stackoverflow.com/a/3943023/6807290
    function isBright(color){
        var c = hexToRgb(color);
        return !!c && (c[0]*0.299 + c[1]*0.587 + c[2]*0.114) > 186;
    }

    // Get the relevant guild ID for an element, or undefined
    function getGuildId(e) {
        var owner = getOwnerInstance(e);
        if (owner === undefined) {
            return undefined;
        }

        try {
            return owner.props.guild.id;
        } catch (err) {
            // Catch TypeError if no guild in props
        }

        try {
            return owner.state.guild.id;
        } catch (err) {
            // Catch TypeError if no guild in state
        }

        return undefined;
    }

    // Get the relevant guild owner ID for an element, or undefined
    function getOwnerId(e) {
        var owner = getOwnerInstance(e);
        if (owner === undefined) {
            return undefined;
        }

        try {
            return owner.props.guild.ownerId;
        } catch (err) {
            // Catch TypeError if no guild in props
        }

        try {
            return owner.state.guild.ownerId;
        } catch (err) {
            // Catch TypeError if no guild in state
        }

        return undefined;
    }

    function addTag() {
        /* jshint validthis: true */
        var color = getUserColor(this);
        var tag = $("<span>", {
            class: "kawaii-tag",
        }).text("OWNER");

        if (color !== null) {
            tag.css("background-color", color);

            if (isBright(color)) {
                tag.addClass("kawaii-tag-bright");
            }
        }
        return tag;
    }

    var prevGuildId;

    function processServer(mutation) {
        var chat, guildId, ownerId, members, authors, tags;

        chat = $(".chat")[0];

        // Get the ID of the server
        guildId = getGuildId(chat);

        // Get the ID of the server's owner
        ownerId = getOwnerId(chat);
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
            members = $(".member-username-inner");
            // Remove tags that were added
            members.siblings(".kawaii-tag").remove();
            members.filter(".kawaii-tagged").removeClass("kawaii-tagged");
        } else {
            members = mutationFind(mutation, ".member-username-inner");
        }

        // Get the set of message authors affected by this mutation
        authors = mutationFind(mutation, ".user-name");

        if (!authors.closest(".message-group").hasClass("compact")) {
            // If not in compact mode, process the same as guild members
            members = members.add(authors);
        } else {
            // Process authors (tag before of name in compact mode)
            authors.filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged")
                .before(addTag)
                .addClass("kawaii-tagged");
        }

        // Process guild members
        members.filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged")
            .after(addTag)
            .addClass("kawaii-tagged");

        // User profile popout
        mutationFind(mutation, ".userPopout-4pfA0d .headerTag-3zin_i")
            .filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged")
            .append($("<span>", {class: "kawaii-tag kawaii-tag-invert header-kawaii-tag"}).text("OWNER"))
            .addClass("kawaii-tagged");

        // Fullscreen popout (modal)
        mutationFind(mutation, ".header-info-inner .discord-tag")
            .filter((_, e) => getUserId(e) === ownerId).not(".kawaii-tagged")
            .append($("<span>", {class: "kawaii-tag"}).text("OWNER"))
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
            .append($("<span>", {class: "kawaii-tag"}).text("OWNER"))
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

    // Default colors (https://discordapp.com/branding)
    // #7289DA - "Blurple"
    // #23272A - "Not quite black"
    var css = `
    .kawaii-tag {
        background: #7289da;
        font-size: 10px;
        font-weight: 500;
        color: #fff!important;
        margin-left: 6px;
        padding: 1px 2px;
        border-radius: 3px;
        text-transform: uppercase;
        vertical-align: bottom;
        line-height: 16px;
        -ms-flex-negative: 0;
        flex-shrink: 0;
    }

    .compact .kawaii-tag {
        margin: 0 3px 0 0;
    }

    .header-kawaii-tag {
        line-height: 22px;
    }

    .kawaii-tag-bright {
        color: #23272A!important;
    }

    .kawaii-tag-invert {
        background: #fff;
        color: #7289da!important;
    }`;

    ownerTag.prototype.start = function () {
        BdApi.injectCSS("kawaii-tag-css", css);
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
        BdApi.clearCSS("kawaii-tag-css");
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
        return "1.3.4";
    };

    ownerTag.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();

/*@end @*/
