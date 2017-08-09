# betterdiscord-plugins
Assorted small plugins for [BetterDiscord](https://github.com/Jiiks/BetterDiscordApp)

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
