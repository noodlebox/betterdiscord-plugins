# betterdiscord-plugins
~~Assorted small plugins for [BetterDiscord](https://github.com/Jiiks/BetterDiscordApp)~~

## No longer maintained
These plugins were written for a much older and very different version of Discord and BetterDiscord than exists today. They may load if there is some support for "legacy" style plugins, but they most likely will not do anything useful. They remain available here for historical purposes. If you are looking for something more useful today, here's some links for the modern version of BetterDiscord:

[BetterDiscord Homepage](https://betterdiscord.app/)

[BetterDiscord Plugins](https://betterdiscord.app/plugins)

[BetterDiscord's Support Discord](https://discord.gg/sbA3xCJ)

I haven't personally used BetterDiscord in several years, mostly depending on pull requests to fix minor bugs caused by Discord updates. From what I've seen though, the modern BetterDiscord plugin API is much improved compared to earlier versions, making it easier for plugin creators to cooperate with native Discord features with less jank while being less prone to [XSS vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting), a flaw common in many older plugins where authors were not specifically looking out for these sorts of issues. 

If I do become active with BD plugin development again in the future, this repo will be updated. For now, look to more active plugin developers.

## Plugins

### AutoPlayGifs.plugin.js
Autoplay GIF and GIFV without having to hover.

### LineNumbers.plugin.js
Add line numbers to code blocks.

### OwnerTag.plugin.js
Show a tag next to a server owner's name.

### SilentTyping.plugin.js
Don't send typing notifications.

### StaticAvatars.plugin.js
Never animate avatars.

### KawaiiEmotes.plugin.js
Better emote parsing for BetterDiscord. Fixes a few issues:

- Makes tooltips and styling more consistent with standard emoji
- Parses more reliably, including on message edits
- Designed to load emote lists asynchronously
- Scrollable tab-completion menu for emotes

## Notes

Thanks to samogot for the very useful [Discord Internals library](https://github.com/samogot/betterdiscord-plugins/tree/master/v2/1Lib%20Discord%20Internals). Installing the library plugin is optional. If the library plugin is installed (version 1.4 or higher), SilentTyping and StaticAvatars will make use of it. Otherwise, they will fall back onto a bundled version of the necessary code from the library.
