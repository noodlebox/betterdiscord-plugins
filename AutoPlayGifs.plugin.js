//META{"name":"agif"}*//

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

var agif = function () {};

// Autoplay GIFs
agif.prototype.convert = function (target) {
    // Handle GIF
    $(target).find(".image:has(canvas)").each(function () {
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
    $(target).find(".embed-thumbnail-gifv:has(video)").each(function () {
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
};

agif.prototype.onMessage = function () {};

agif.prototype.onSwitch = function () {};

agif.prototype.start = function () {
    this.convert(document);
};

agif.prototype.observer = function (e) {
    this.convert(e.target);
};

agif.prototype.load = function () {};
agif.prototype.unload = function () {};
agif.prototype.stop = function () {};
agif.prototype.getSettingsPanel = function () {
    return "";
};

agif.prototype.getName = function () {
    return "Autogif";
};
agif.prototype.getDescription = function () {
    return "Autoplay gifs without having to hover.";
};
agif.prototype.getVersion = function () {
    return "1.0.0";
};
agif.prototype.getAuthor = function () {
    return "noodlebox";
};

/*@end @*/
