//META{"name":"markAllRead"}*//

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

var markAllRead = function () {};

(function () {
    "use strict";

    // This is super hackish, and will likely break as Discord's internal API changes
    // Anything using this or what it returns should be prepared to catch some exceptions
    const getInternalInstance = e => e[Object.keys(e).find(k => k.startsWith("__reactInternalInstance"))];

    function getOwnerInstance(e, {include, exclude=["Popout", "Tooltip", "Scroller", "BackgroundFlash"]} = {}) {
        if (!e) {
            return null;
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
        for (let prev, curr=getInternalInstance(e); !!curr; prev=curr, curr=curr._hostParent) {
            // Before checking its parent, try to find a React object for prev among renderedChildren
            // This finds React objects which don't have a direct counterpart in the DOM hierarchy
            // e.g. Message, ChannelMember, ...
            if (prev !== undefined && !!curr._renderedChildren) {
                /* jshint loopfunc: true */
                let owner = Object.values(curr._renderedChildren)
                    .find(v => !!v._instance && v.getHostNode() === prev.getHostNode());
                if (!!owner && classFilter(owner)) {
                    return owner._instance;
                }
            }

            if (!curr._currentElement) {
                continue;
            }

            // Get a React object if one corresponds to this DOM element
            // e.g. .user-popout -> UserPopout, ...
            let owner = curr._currentElement._owner;
            if (!!owner && classFilter(owner)) {
                return owner._instance;
            }
        }

        return null;
    }

    // Timeout ID for scheduled iterations
    var tID;

    // Delay between iterations
    const delay = 250;

    // If there is any unread server, mark it as read and schedule to repeat after delay.
    // Returns true if there is any unread server to mark, false otherwise.
    function markAsRead() {
        // Cancel any pending iterations
        clearTimeout(tID);
        tID = undefined;

        // Get first unread guild element
        const el = document.querySelector(".guild.unread .guild-inner");
        const g = getOwnerInstance(el, {include: ["GuildInner"]});

        if (!g) {
            return false;
        }

        // Minimal "event" implementation
        // pageX is chosen to be off screen to the left, plus a random offset.
        // Subsequent right clicks in the same location would only close the menu.
        const ev = {
            preventDefault: a=>a,
            stopPropagation: a=>a,
            pageX: -1000 + Math.random(),
        };

        // Open context menu
        try {
            g.handleContextMenu(ev);
        } catch (err) {
            console.error("MarkAllRead", "failed to open context menu", err);
        }

        // Click context menu item
        setTimeout(() => {
            // FIXME: This seems fragile, will stop working if menu items reordered
            const el = document.querySelector(".context-menu .item span");
            const item = getOwnerInstance(el, {include: ["GuildMarkReadItem"]});
            if (!item) {
                console.warn("MarkAllRead", "unable to find context menu item");
                return;
            }
            
            try {
                item.handleMarkAsRead();
            } catch (err) {
                console.error("MarkAllRead", "failed to mark servers read", err);
                return;
            }

            // Schedule next iteration if all went well
            tID = setTimeout(markAsRead, delay);
        });

        return true;
    }

    // Detect hotkey, Alt+Esc
    // Returns true for anything other than the hotkey combo.
    // For matching combo, returns false to cancel event.
    // FIXME: make this more easily configurable? Also more readable.
    const handleHotkey = e => e.key !== "Escape" || !e.altKey || (markAsRead() && false);

    markAllRead.prototype.start = function () {
        // Add hotkey
        window.addEventListener("keydown", handleHotkey, true);
    };

    markAllRead.prototype.stop = function () {
        // Remove hotkey and cancel any current activity
        window.removeEventListener("keydown", handleHotkey, true);
        clearTimeout(tID);
        tID = undefined;
    };

    markAllRead.prototype.load = function () {};

    markAllRead.prototype.unload = function () {};

    markAllRead.prototype.getName = function () {
        return "Mark All Servers Read";
    };

    markAllRead.prototype.getDescription = function () {
        return "Clear unread notifications on all servers with Alt+Esc";
    };

    markAllRead.prototype.getVersion = function () {
        return "1.0.0";
    };

    markAllRead.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();

/*@end @*/
