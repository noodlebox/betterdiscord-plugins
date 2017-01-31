//META{"name":"autoGif"}*//

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

var autoGif = function () {};

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

    // Helper function for finding all elements matching selector affected by a mutation
    function mutationFind(mutation, selector) {
        var target = $(mutation.target), addedNodes = $(mutation.addedNodes);
        var mutated = target.add(addedNodes).filter(selector);
        var descendants = addedNodes.find(selector);
        var ancestors = target.parents(selector);
        return mutated.add(descendants).add(ancestors);
    }

    // Automatically play GIFs and "GIFV" Videos
    function processAccessories(mutation) {
        var accessories = mutationFind(mutation, ".accessory");

        // Handle GIF
        accessories.find(".image:has(canvas)").each(function () {
            var image = $(this);
            var canvas = image.children("canvas").first();
            // Replace GIF preview with actual image
            var src = canvas.attr("src");
            if(src !== undefined) {
                image.replaceWith($("<img>", {
                    src: canvas.attr("src"),
                    width: canvas.attr("width"),
                    height: canvas.attr("height"),
                }).addClass("image kawaii-autogif"));
            }
        });

        // Handle GIFV
        accessories.find(".embed-thumbnail-gifv:has(video)").each(function () {
            var embed = $(this);
            var video = embed.children("video").first();
            // Remove the class, embed-thumbnail-gifv, to avoid the "GIF" overlay
            embed.removeClass("embed-thumbnail-gifv").addClass("kawaii-autogif");
            // Prevent the default behavior of pausing the video
            embed.parent().on("mouseout.autoGif", function (event) {
                event.stopPropagation();
            });
            video[0].play();
        });
    }

    // Mark elements with modified state so that they may be restored later
    const animationForced = new WeakSet();

    function animateAvatar() {
        /* jshint validthis: true */
        try {
            const messageGroup = getOwnerInstance(this, {include: ["MessageGroup"]});
            if (messageGroup.state.animatedAvatar) {
                animationForced.add(this);
                setTimeout(() => messageGroup.setState({animate: true}));
            }
        } catch (err) {
            // Something (not surprisingly) broke, but this isn't critical enough to completely bail over
            //console.error("DiscordAutoGif", this, err);
            return;
        }
    }

    function processAvatars(mutation) {
        mutationFind(mutation, ".message-group").each(animateAvatar);
    }

    autoGif.prototype.load = function () {};

    autoGif.prototype.unload = function () {};

    autoGif.prototype.start = function () {
        // process entire document
        var mutation = {target: document, addedNodes: [document]};
        processAccessories(mutation);
        processAvatars(mutation);

        $(".theme-dark, .theme-light").on("mouseleave.autoGif", ".message-group", animateAvatar);
    };

    autoGif.prototype.stop = function () {
        $(".theme-dark, .theme-light").off(".autoGif", ".message-group");
        // Restore original state
        $(".message-group").each(function () {
            if (!animationForced.delete(this)) {
                // This element's state was not modified
                // Don't trigger a pointless re-render with setState
                return;
            }
            try {
                getOwnerInstance(this, {include: ["MessageGroup"]}).setState({animate: false});
            } catch (err) {
                // Something (not surprisingly) broke, but this isn't critical enough to completely bail over
                //console.error("DiscordAutoGif", this, err);
                return;
            }
        });
    };

    autoGif.prototype.observer = function (mutation) {
        processAccessories(mutation);
        processAvatars(mutation);
    };

    autoGif.prototype.getSettingsPanel = function () {
        return "";
    };

    autoGif.prototype.getName = function () {
        return "Autogif";
    };

    autoGif.prototype.getDescription = function () {
        return "Autoplay gifs without having to hover.";
    };

    autoGif.prototype.getVersion = function () {
        return "1.0.0";
    };

    autoGif.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();

/*@end @*/
