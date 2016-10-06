//META{"name":"kawaiiemotes"}*//

var kawaiiemotes = function () {};

(function () {
    "use strict";

    // Emote data
    function EmoteSet() {
        this.emoteMap = new Map();
        this.template = "";
        this.caseSensitive = true;
        this.emoteStyle = EmoteSet.emoteStyle.STANDARD;
        this.loaded = false;
    };
    // emoteStyle enum
    EmoteSet.emoteStyle = {
        STANDARD: 0, // Surrounded by ":"
        TWITCH: 1, // Composed of "word characters" (\w)
    };
    // template field names enum
    EmoteSet.templateField = {
        PATH: 0, // The unique path component for this emote name
        SIZE: 1, // emote size, usually a single digit between 1 and 4
    };
    EmoteSet.prototype.load = function(){};
    EmoteSet.prototype.getUrl = function (emoteName) {
        if (!this.caseSensitive) {
            emoteName = emoteName.toLowerCase();
        }
        var path = this.emoteMap.get(emoteName);
        if (path === undefined) {
            return undefined;
        }
        return this.template.replace(/{(\d+)}/g, function (match, field) {
            switch (Number(field)) {
                case EmoteSet.templateField.PATH:
                    return path;
                case EmoteSet.templateField.SIZE:
                    return "1";
                default:
                    return match;
            }
        });
    };
    // Create and return an emote element, or undefined if no match found
    EmoteSet.prototype.createEmote = function (emoteName) {
        var emoteURL = this.getUrl(emoteName);
        if (emoteURL === undefined) {
            return undefined;
        }
        if (this.emoteStyle === EmoteSet.emoteStyle.STANDARD) {
            emoteName = ":"+emoteName+":";
        }
        var emote = $("<img>", {
            src: emoteURL,
            draggable: "false",
            alt: emoteName,
            title: emoteName,
            style: "width: auto;", // Some emojis are not square (disrupts notification list though)
            class: "emoji jumboable kawaii-parseemotes",
        });
        return emote;
    };

    // Filter function for "Twitch-style" emotes, to avoid collisions with common words
    // Check if at least 3 word characters, and has at least one capital letter
    // Based on current FFZ naming requirements (older FFZ emotes may not satisfy these requirements)
    // See: https://www.frankerfacez.com/emoticons/submit
    function emoteFilter(name) {
        return (/^\w{3,}$/.test(name) && /[A-Z]/.test(name));
    }

    // Global Twitch emotes (emoteset 0), filtered by emoteFilter
    var twitchEmotes = new EmoteSet();
    twitchEmotes.template = "https://static-cdn.jtvnw.net/emoticons/v1/{0}/{1}.0";
    twitchEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    twitchEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        var self = this;
        // See: https://github.com/justintv/Twitch-API/blob/master/v3_resources/chat.md#get-chatemoticons
        $.ajax("https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=0", {
            accepts: {json: "application/vnd.twitchtv.v3+json"},
            dataType: "json",
            jsonp: false,
            cache: true,
            success: function (data) {
                var loaded = 0;
                var skipped = 0;
                data.emoticon_sets[0].forEach(function (emoticon) {
                    if (emoteFilter(emoticon.code)) {
                        self.emoteMap.set(emoticon.code, emoticon.id);
                        loaded++;
                    } else {
                        skipped++;
                    }
                });
                console.info("KawaiiEmotes:", "Twitch global emotes loaded:", loaded, "skipped:", skipped);
                self.loaded = true;
                callbacks.success(self);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.warn("KawaiiEmotes:", "Twitch global emotes failed to load:", textStatus, "error:", errorThrown);
                callbacks.error(self);
            }
        });
    };

    // Twitch subscriber emotes, filtered by emoteFilter
    var twitchSubEmotes = new EmoteSet();
    twitchSubEmotes.template = "https://static-cdn.jtvnw.net/emoticons/v1/{0}/{1}.0";
    twitchSubEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    twitchSubEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        var self = this;
        // See: https://github.com/justintv/Twitch-API/blob/master/v3_resources/chat.md#get-chatemoticons
        $.ajax("https://api.twitch.tv/kraken/chat/emoticon_images", {
            accepts: {json: "application/vnd.twitchtv.v3+json"},
            dataType: "json",
            jsonp: false,
            cache: true,
            success: function (data) {
                var loaded = 0;
                var skipped = 0;
                data.emoticons.forEach(function (emoticon) {
                    if (emoticon.emoticon_set !== 0 && emoteFilter(emoticon.code)) {
                        self.emoteMap.set(emoticon.code, emoticon.id);
                        loaded++;
                    } else {
                        skipped++;
                    }
                });
                console.info("KawaiiEmotes:", "Twitch subscriber emotes loaded:", loaded, "skipped:", skipped);
                self.loaded = true;
                callbacks.success(self);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.warn("KawaiiEmotes:", "Twitch subscriber emotes failed to load:", textStatus, "error:", errorThrown);
                callbacks.error(self);
            }
        });
    };

    // BetterTTV global emotes, filtered by emoteFilter
    var bttvEmotes = new EmoteSet();
    bttvEmotes.template = "https://cdn.betterttv.net/emote/{0}/{1}x";
    bttvEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    bttvEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        var self = this;
        $.ajax("https://api.betterttv.net/2/emotes", {
            dataType: "json",
            jsonp: false,
            cache: true,
            success: function (data) {
                var loaded = 0;
                var skipped = 0;
                self.template = data.urlTemplate
                    .replace("{{id}}", "{0}")
                    .replace("{{image}}", "{1}x");
                data.emotes.forEach(function (emote) {
                    if (emoteFilter(emote.code)) {
                        self.emoteMap.set(emote.code, emote.id);
                        loaded++;
                    } else {
                        skipped++;
                    }
                });
                console.info("KawaiiEmotes:", "BTTV global emotes loaded:", loaded, "skipped:", skipped);
                self.loaded = true;
                callbacks.success(self);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.warn("KawaiiEmotes:", "BTTV global emotes failed to load:", textStatus, "error:", errorThrown);
                callbacks.error(self);
            }
        });
    };

    // FrankerFaceZ global emotes, filtered by emoteFilter
    var ffzEmotes = new EmoteSet();
    ffzEmotes.template = "https://cdn.frankerfacez.com/emoticon/{0}/{1}";
    ffzEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    ffzEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        var self = this;
        // See: https://www.frankerfacez.com/developers
        $.ajax("https://api.frankerfacez.com/v1/set/global", {
            dataType: "json",
            jsonp: false,
            cache: true,
            success: function (data) {
                var loaded = 0;
                var skipped = 0;
                data.default_sets.forEach(function (set) {
                    data.sets[set].emoticons.forEach(function (emoticon) {
                        if (emoteFilter(emoticon.name)) {
                            self.emoteMap.set(emoticon.name, emoticon.id);
                            loaded++;
                        } else {
                            skipped++;
                        }
                    });
                });
                console.info("KawaiiEmotes:", "FFZ global emotes loaded:", loaded, "skipped:", skipped);
                callbacks.success(self);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.warn("KawaiiEmotes:", "FFZ global emotes failed to load:", textStatus, "error:", errorThrown);
                callbacks.error(self);
            }
        });
    };

    // BD's BTTV2 emote list, unfiltered
    // This is BD's massive set of (more or less) every shared emote from BTTV
    // TODO: Move downloading of this emote set from main thread to this one
    //       Or, at least make it asynchronous
    //       BD's loading should not block on fetching and parsing a 1MB+ JSON file from GitHub
    var bttvLegacyEmotes = new EmoteSet();
    bttvLegacyEmotes.template = "https://cdn.betterttv.net/emote/{0}/{1}x";
    bttvLegacyEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    bttvLegacyEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        if (emotesBTTV2 === undefined) {
            console.warn("KawaiiEmotes:", "BetterDiscord legacy BTTV shared emotes failed to load:", "emotesBTTV2 is undefined");
            callbacks.error(this);
        }
        var self = this;
        (function (data) {
            var loaded = 0;
            var skipped = 0;
            Object.keys(data).forEach(function (name) {
                self.emoteMap.set(name, data[name]);
                loaded++;
            });
            console.info("KawaiiEmotes:", "BetterDiscord legacy BTTV shared emotes loaded:", loaded, "skipped:", skipped);
            self.loaded = true;
            callbacks.success(self);
        })(emotesBTTV2);
    };

    // BD's FFZ emote list, unfiltered
    // This is BD's massive set of (more or less) every public emote from FFZ
    // TODO: Move downloading of this emote set from main thread to this one
    //       Or, at least make it asynchronous
    //       BD's loading should not block on fetching and parsing a 1MB+ JSON file from GitHub
    var ffzLegacyEmotes = new EmoteSet();
    ffzLegacyEmotes.template = "https://cdn.frankerfacez.com/emoticon/{0}/{1}";
    ffzLegacyEmotes.emoteStyle = EmoteSet.emoteStyle.TWITCH;
    ffzLegacyEmotes.load = function (callbacks) {
        callbacks = $.extend({
            success: $.noop,
            error: $.noop,
        }, callbacks);
        if (this.loaded) {
            callbacks.success(this);
            return;
        }
        if (emotesFfz === undefined) {
            console.warn("KawaiiEmotes:", "BetterDiscord legacy FFZ public emotes failed to load:", "emotesFfz is undefined");
            callbacks.error(this);
        }
        var self = this;
        (function (data) {
            var loaded = 0;
            var skipped = 0;
            Object.keys(data).forEach(function (name) {
                self.emoteMap.set(name, data[name]);
                loaded++;
            });
            console.info("KawaiiEmotes:", "BetterDiscord legacy FFZ public emotes loaded:", loaded, "skipped:", skipped);
            self.loaded = true;
            callbacks.success(self);
        })(emotesFfz);
    };

    function initJQueryPlugins($) {
        // jQuery Plugins

        // Make sure that these are set up after jQuery is available, but before we need any of them
        // Should be fine if it happens to be called more than once

        // Get or set the scroll distance from the bottom of an element
        // Usage identical to scrollTop()
        $.fn.scrollBottom = function (val) {
            var elem = this[0];
            if (val === undefined) {
                if (elem === undefined) {
                    return undefined;
                }
                return elem.scrollHeight - (this.scrollTop() + this.height());
            }
            if (elem === undefined) {
                return this;
            }
            return this.scrollTop(elem.scrollHeight - (val + this.height()));
        };

        // Get the set of text nodes contained within a set of elements
        $.fn.textNodes = function () {
            return this.contents().filter(function () { return this.nodeType === Node.TEXT_NODE; });
        };

        // Parse for standard emotes in message text
        $.fn.parseEmotesStandard = function (emoteSets) {
            if (emoteSets === undefined || emoteSets.length === 0) {
                return this;
            }

            this.add(this.find(":not(span, code)")).textNodes().each(function () {
                var sub = [];
                // separate out potential emotes
                // all standard emotes are composed of characters in [a-zA-Z0-9_], i.e. \w between two colons, :
                // use a regex with a capture group, so that we can preserve separators
                var words = this.data.split(/(:[\w#*]+:)/g);
                // non-emoteable words, for building a new text node if necessary
                var nonEmote = [];
                // whether the text in this node has been modified
                var modified = false;

                for (var i = 0; i < words.length; i += 2) {
                    // words[i] is a separator
                    // words[i+1] is our potential emote, or undefined

                    // Keep the separator
                    nonEmote.push(words[i]);
                    if (words[i+1] === undefined) {
                        break;
                    }

                    var emote;
                    if (emoteSets.some(function (set) {
                        emote = set.createEmote(/^:([^:]+):$/.exec(words[i+1])[1]);
                        return (emote !== undefined);
                    })) {
                        modified = true;
                        // Create a new text node from any previous text
                        var text = nonEmote.join("");
                        if (text.length > 0) {
                            sub.push(document.createTextNode(text));
                        }
                        // Clear out stored words
                        nonEmote = [];
                        // Add the emote element
                        sub.push(emote);
                    } else {
                        // Unrecognized as emote, keep the word
                        nonEmote.push(words[i+1]);
                    }
                }
                // If no emotes were found, leave this text node unchanged
                if (modified) {
                    // Replace this node's contents with remaining text
                    this.data = nonEmote.join("");
                }
                $(this).before(sub);
            });

            return this;
        };

        var emoteMods = new Set([
            "flip", "flap", "pulse",
            "spin", "spin2", "spin3",
            "1spin", "2spin", "3spin",
            "shake", "shake2", "shake3",
            "tr", "bl", "br",
        ]);

        // Parse for Twitch-style emotes in message text
        $.fn.parseEmotesTwitch = function (emoteSets) {
            if (emoteSets === undefined || emoteSets.length === 0) {
                return this;
            }

            var emoteModsEnabled = settingsCookie["bda-es-8"];

            // Find and replace Twitch-style emotes
            this.add(this.find(":not(span, code)")).textNodes().each(function () {
                var sub = [];
                // separate out potential emotes
                // all twitch emotes (that we care about) are composed of characters in [a-zA-Z0-9_], i.e. \w
                // colons (:) are allowed when used for emote modifiers
                // use a regex with a capture group, so that we can preserve separators
                var words = this.data.split(/([^\w:]+)/g);
                // non-emoteable words, for building a new text node if necessary
                var nonEmote = [];
                // whether the text in this node has been modified
                var modified = false;
                for (var i = 0; i < words.length; i += 2) {
                    // words[i] is our potential emote (+modifer)
                    // words[i+1] is a separator, or undefined
                    var res = /^(\w*)(?::(.*))?$/.exec(words[i]);
                    // word is our potential emote
                    var word = res[1];
                    // modifier is an emote modifier, or undefined
                    var modifier = res[2];
                    var emote;
                    if (($.inArray(word, bemotes) == -1) && emoteSets.some(function (set) {
                        emote = set.createEmote(word);
                        return (emote !== undefined);
                    })) {
                        modified = true;
                        // Create a new text node from any previous text
                        var text = nonEmote.join("");
                        if (text.length > 0) {
                            sub.push(document.createTextNode(text));
                        }
                        // Clear out stored words
                        nonEmote = [];
                        // Apply any emote mods, if applicable
                        if (emoteModsEnabled && emoteMods.has(modifier)) {
                            emote.addClass("emote"+modifier);
                        }
                        // Add the emote element
                        sub.push(emote);
                    } else {
                        // Unrecognized as emote, keep the word
                        nonEmote.push(words[i]);
                    }
                    // Keep the separator
                    nonEmote.push(words[i+1]);
                }
                // If no emotes were found, leave this text node unchanged
                if (modified) {
                    // Replace this node's contents with remaining text
                    this.data = nonEmote.join("");
                }
                $(this).before(sub);
            });

            return this;
        };

        // Parse emotes (of any style) in message text
        $.fn.parseEmotes = function (emoteSets) {
            if (emoteSets === undefined || emoteSets.length === 0) {
                return this;
            }

            var standardSets = [];
            var twitchSets = [];
            emoteSets.forEach(function (set) {
                if (set.emoteStyle === EmoteSet.emoteStyle.STANDARD) {
                    standardSets.push(set);
                } else if (set.emoteStyle === EmoteSet.emoteStyle.TWITCH) {
                    twitchSets.push(set);
                }
            });

            return this.parseEmotesStandard(standardSets).parseEmotesTwitch(twitchSets);
        };

        // Replace title text with fancy tooltips
        $.fn.fancyTooltip = function () {
            return this.filter("[title]").each(function () {
                var title = $(this).attr("title");
                $(this).addClass("kawaii-fancytooltip").removeAttr("title");
                $(this).on("mouseover.fancyTooltip", function () {
                    // Create and insert tooltip
                    var tooltip = $("<div>").append(title).addClass("tooltip tooltip-top tooltip-normal");
                    $(".tooltips").append(tooltip);

                    // Position the tooltip
                    var position = $(this).offset();
                    position.top -= 30;
                    position.left += $(this).width()/2 - tooltip.width()/2 - 10;
                    tooltip.offset(position);

                    // Set a handler to destroy the tooltip
                    $(this).on("mouseout.fancyTooltip", function () {
                        // remove this handler
                        $(this).off("mouseout.fancyTooltip");
                        tooltip.remove();
                    });
                });
            });
        };
    } // initJQueryPlugins

    // Helper function for finding all elements matching selector affected by a mutation
    function mutationFind(mutation, selector) {
        var target = $(mutation.target), addedNodes = $(mutation.addedNodes);
        var mutated = target.add(addedNodes).filter(selector);
        var descendants = addedNodes.find(selector);
        var ancestors = target.parents(selector);
        return mutated.add(descendants).add(ancestors);
    }

    // Helper function for finding all elements matching selector removed by a mutation
    function mutationFindRemoved(mutation, selector) {
        var removedNodes = $(mutation.removedNodes);
        var mutated = removedNodes.filter(selector);
        var descendants = removedNodes.find(selector);
        return mutated.add(descendants);
    }

    // Revert all emotes
    function revertEmotes() {
        // Swap every emote back to its original text
        $(".kawaii-parseemotes").each(function() {
            var emote = $(this);
            emote.replaceWith(document.createTextNode(emote.attr("alt")));
        });
    }

    // Parse the messages for given emote sets
    function parseEmoteSets(messages, sets) {
        // Figure out whether we're scrolled to the bottom
        var messagesContainer = $(".messages");
        var atBottom = messagesContainer.scrollBottom() < 0.5;

        // When a line is edited, Discord may stuff the new contents inside one of our emotes
        messages.find(".kawaii-parseemotes").contents()
            .parent().trigger("mouseout.fancyTooltip").end()
            .unwrap();
        // Process messages
        messages.parseEmotes(sets);
        if (settingsCookie["bda-es-6"]) {
            messages.find(".kawaii-parseemotes[title]").fancyTooltip();
        }

        // Ensure we're still scrolled to the bottom if necessary
        if (atBottom) {
            messagesContainer.scrollBottom(0);
        }
    }

    var activeEmoteSets = [];

    // Settings updated, rebuild active emote sets and rescan for emotes if necessary
    function updateSettings() {
        var oldEmoteSets = activeEmoteSets.slice();

        if (settingsCookie["bda-es-7"]) {
            activeEmoteSets.push(twitchEmotes);
            activeEmoteSets.push(twitchSubEmotes);
        }

        if (settingsCookie["bda-es-1"]) {
            activeEmoteSets.push(ffzEmotes);
            activeEmoteSets.push(ffzLegacyEmotes);
        }

        if (settingsCookie["bda-es-2"]) {
            activeEmoteSets.push(bttvEmotes);
            activeEmoteSets.push(bttvLegacyEmotes);
        }

        var modified = false;
        if (activeEmoteSets.length !== oldEmoteSets.length) {
            modified = true;
        } else {
            for (var i = 0; i < activeEmoteSets.length; i++) {
                if (activeEmoteSets[i] !== oldEmoteSets[i]) {
                    modified = true;
                    break;
                }
            }
        }
        if (modified) {
            revertEmotes();
            var messages = $(".markup, .message-content").not(":has(.message-content)");
            parseEmoteSets(messages, activeEmoteSets);
        }
    }

    kawaiiemotes.prototype.observer = function (mutation) {
        // Get the set of messages affected by this mutation
        var messages = mutationFind(mutation, ".markup, .message-content").not(":has(.message-content)");
        parseEmoteSets(messages, activeEmoteSets);

        // Clean up any remaining tooltips
        mutationFindRemoved(mutation, ".kawaii-fancytooltip").trigger("mouseout.fancyTooltip");
    };

    // Parse the whole document for a single emote set, if it is active
    function parseEmoteSetIfActive(set) {
        if (activeEmoteSets.indexOf(set) !== -1) {
            var messages = $(".markup, .message-content").not(":has(.message-content)");
            parseEmoteSets(messages, [set]);
        }
    }

    kawaiiemotes.prototype.load = function () {
        initJQueryPlugins($);
    };

    kawaiiemotes.prototype.unload = function () {};

    kawaiiemotes.prototype.start = function () {
        // Save these to be restored later
        EmoteModule.prototype.oldObsCallback = EmoteModule.prototype.obsCallback;
        SettingsPanel.prototype.oldInit = SettingsPanel.prototype.init;
        SettingsPanel.prototype.oldUpdateSettings = SettingsPanel.prototype.updateSettings;
        // Disable this, because this plugin's mutation observer handles it
        EmoteModule.prototype.obsCallback = $.noop;
        // Hook into these to notify when settings are updated
        SettingsPanel.prototype.init = function () {
            this.oldInit();
            updateSettings();
        };
        SettingsPanel.prototype.updateSettings = function () {
            this.oldUpdateSettings();
            updateSettings();
        };

        updateSettings();

        // Load the emote sets if necessary, and parse the document as they load
        twitchEmotes.load({success: parseEmoteSetIfActive});
        twitchSubEmotes.load({success: parseEmoteSetIfActive});
        bttvEmotes.load({success: parseEmoteSetIfActive});
        bttvLegacyEmotes.load({success: parseEmoteSetIfActive});
        ffzEmotes.load({success: parseEmoteSetIfActive});
        ffzLegacyEmotes.load({success: parseEmoteSetIfActive});
    };

    kawaiiemotes.prototype.stop = function () {
        // Restore these
        EmoteModule.prototype.obsCallback = EmoteModule.prototype.oldObsCallback;
        SettingsPanel.prototype.init = SettingsPanel.prototype.oldInit;
        SettingsPanel.prototype.updateSettings = SettingsPanel.prototype.oldUpdateSettings;

        revertEmotes();
    };

    kawaiiemotes.prototype.getSettingsPanel = function () {
        return "";
    };

    kawaiiemotes.prototype.getName = function () {
        return "KawaiiEmotes";
    };

    kawaiiemotes.prototype.getDescription = function () {
        return "Better emote parsing for BetterDiscord";
    };

    kawaiiemotes.prototype.getVersion = function () {
        return "0.1.0";
    };

    kawaiiemotes.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();
