//META{"name":"agif"}*//

var agif = function () {};

// Autoplay GIFs
agif.prototype.convert = function (target) {
    $(target).find(".image:has(canvas)").each(function() {
        var canvas = $(this).children("canvas").first();
        var src = canvas.attr("src");
        if(src !== undefined) {
            $(this).replaceWith($("<img>", {
                src: canvas.attr("src"),
                width: canvas.attr("width"),
                height: canvas.attr("height")
            }).addClass("image kawaii-agif"));
        }
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
    return "0.2.3";
};
agif.prototype.getAuthor = function () {
    return "noodlebox";
};