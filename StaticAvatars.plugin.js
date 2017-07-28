//META{"name":"staticAvatars"}*//

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

var staticAvatars = function () {};

(function () {
    "use strict";

    staticAvatars.prototype.start = function () {
        const module = WebpackModules.findByUniqueProperties(["hasAnimatedAvatar", "default"], {cacheOnly: true});
        if (!module) {
            console.error("StaticAvatars:", "unable to monkey patch hasAnimatedAvatar method");
            return;
        }
        this._cancel = monkeyPatch(module, "hasAnimatedAvatar", {instead: ()=>false});
    };

    staticAvatars.prototype.stop = function () {
        if (this._cancel) {
            this._cancel();
            delete this._cancel;
        }
    };

    staticAvatars.prototype.load = function () {};

    staticAvatars.prototype.unload = function () {};

    staticAvatars.prototype.getName = function () {
        return "Static Avatars";
    };

    staticAvatars.prototype.getDescription = function () {
        return "Don't animate avatars in the chat area";
    };

    staticAvatars.prototype.getVersion = function () {
        return "2.0.0";
    };

    staticAvatars.prototype.getAuthor = function () {
        return "noodlebox";
    };

    /**
     * Function with no arguments and no return value that may be called to reverse changes that is done by {@link monkeyPatch} method, restoring (unpatching) original method.
     * @callback cancelPatch
     */

    /**
     * This is a shortcut for calling original method using this and arguments from data object. This is a function without input arguments. This function is defined as `() => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)`
     * @callback originalMethodCall
     * @return {*} The same value, which is returned from original method, also this value would be written into `data.returnValue`
     */

    /**
     * A callback that modifies method logic. Callback is called on each call of original method and have all data about original call. Any of the data can be modified if you need, but do it wisely.
     * @callback doPatchCallback
     * @param {PatchData} data Data object with all information about current that you may need in your patching callback.callback.
     * @return {*} Makes sense only when used as `instead` parameter in {@link monkeyPatch}. If returned something other then undefined - it replaces value in `returnValue` param. If used as `before` or `after` parameters - return value if ignored.
     */

    /**
     * This is function for monkey-patching any object method. Can make patch before, after or instead of target method.
     * Be careful when monkey-patching. Think not only about original functionality of target method and you changes, but also about develovers of other plugins, who may also patch this method before or after you. Try to change target method behaviour little as you can, and try to never change method signatures.
     * By default this function makes log messages about each patching and unpatching, so you and other developers can see what methods a patched. This messages may be suppressed.
     * Display name of patched method is changed, so you can see if function is patched and how many times while debuging or in the stack trace. Also patched function have property `__monkeyPatched` is set to true, in case you want to check something programmatically.
     *
     * @param {object} what Object to be patched. You can can also pass class prototypes to patch all class instances. If you are patching prototype of react component you may also need {@link Renderer.rebindMethods}.
     * @param {string} methodName The name of the target message to be patched.
     * @param {object} options Options object. You should provide at least one of `before`, `after` or `instead` parameters. Other parameters are optional.
     * @param {doPatchCallback} options.before Callback that will be called before original target method call. You can modify arguments here, so it will be passed to original method. Can be combined with `after`.
     * @param {doPatchCallback} options.after Callback that will be called after original target method call. You can modify return value here, so it will be passed to external code which calls target method. Can be combined with `before`.
     * @param {doPatchCallback} options.instead Callback that will be called instead of original target method call. You can get access to original method using `originalMethod` parameter if you want to call it, but you do not have to. Can't be combined with `before` and `after`.
     * @param {boolean} [options.once=false] Set to true if you want automatically unpatch method after first call.
     * @param {boolean} [options.silent=false] Set to true if you want to suppress log messages about patching and unpatching. Useful to avoid clogging the console in case of frequent conditional patching/unpatching, for example from another monkeyPatch callback.
     * @param {boolean} [options.displayName] You can provide meaningful name of class/object provided in `what` param for logging purposes. By default there will be a try to determine name automatically.
     * @return {cancelPatch} Function with no arguments and no return value that should be called to cancel (unpatch) this patch. You should save and run it when your plugin is stopped.
     */
    const monkeyPatch = (what, methodName, options) => {
        const {before, after, instead, once = false, silent = false} = options;
        const displayName = options.displayName || what.displayName || what.name || what.constructor.displayName || what.constructor.name;
        if (!silent) console.log('patch', methodName, 'of', displayName);
        const origMethod = what[methodName];
        const cancel = () => {
            if (!silent) console.log('unpatch', methodName, 'of', displayName);
            what[methodName] = origMethod;
        };
        what[methodName] = function() {
            /**
             * @interface
             * @name PatchData
             * @property {object} thisObject Original `this` value in current call of patched method.
             * @property {Arguments} methodArguments Original `arguments` object in current call of patched method. Please, never change function signatures, as it may cause a lot of problems in future.
             * @property {cancelPatch} cancelPatch Function with no arguments and no return value that may be called to reverse patching of current method. Calling this function prevents running of this callback on further original method calls.
             * @property {function} originalMethod Reference to the original method that is patched. You can use in if you need some special usage. You should explicitly provide this value and method arguments when you call this function.
             * @property {originalMethodCall} callOriginalMethod This is a shortcut for calling original method using this and arguments from data object.
             * @property {*} returnValue This is a value returned from original function call. This property is avilable only in `after` callback, or in `instead` callback after calling `callOriginalMethod` function
             */
            const data = {
                thisObject: this,
                methodArguments: arguments,
                cancelPatch: cancel,
                originalMethod: origMethod,
                callOriginalMethod: () => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)
            };
            if (instead) {
                const tempRet = instead(data);
                if (tempRet !== undefined)
                    data.returnValue = tempRet;
            }
            else {
                if (before) before(data);
                data.callOriginalMethod();
                if (after) after(data);
            }
            if (once) cancel();
            return data.returnValue;
        };
        what[methodName].__monkeyPatched = true;
        what[methodName].displayName = 'patched ' + (what[methodName].displayName || methodName);
        return cancel;
    };

    const WebpackModules = (() => {

        const req = webpackJsonp([], {
            '__extra_id__': (module, exports, req) => exports.default = req
        }, ['__extra_id__']).default;
        delete req.m['__extra_id__'];
        delete req.c['__extra_id__'];

        /**
         * Predicate for searching module
         * @callback modulePredicate
         * @param {*} module Module to test
         * @return {boolean} Thue if it is module that you need
         */

        /**
         * Look through all modules of internal Discord's Webpack and return first one that match filter predicate.
         * At first this function will look thruogh alreary loaded modules cache. If no one of loaded modules is matched - then this function tries to load all modules and match for them. Loading any module may have unexpected side effects, like changing current locale of moment.js, so in that case there will be a warning the console. If no module matches - function will return null. You sould always take such predicate to match something, gut your code should be ready to recieve null in case if Discord update something in codebase.
         * If module is ES6 module and has default property, consider default first, otherwise - full module object.
         * @param {modulePredicate} filter Predicate to match module
         * @param {object} [options] Options object.
         * @param {boolean} [options.cacheOnly=false] Set to true if you want to search only the cache for modules.
         * @return {*} First module that matched by filter or null if none is matched.
         */
        const find = (filter, options = {}) => {
            const {cacheOnly = false} = options;
            for (let i in req.c) {
                if (req.c.hasOwnProperty(i)) {
                    let m = req.c[i].exports;
                    if (m && m.__esModule && m.default && filter(m.default))
                        return m.default;
                    if (m && filter(m))
                        return m;
                }
            }
            if (cacheOnly) {
                console.warn('Cannot find loaded module in cache');
                return null;
            }
            console.warn('Cannot find loaded module in cache. Loading all modules may have unexpected side effects');
            for (let i = 0; i < req.m.length; ++i) {
                let m = req(i);
                if (m && m.__esModule && m.default && filter(m.default))
                    return m.default;
                if (m && filter(m))
                    return m;
            }
            console.warn('Cannot find module');
            return null;
        };

        /**
         * Look through all modules of internal Discord's Webpack and return first object that has all of following properties. You should be ready that in any moment, after Discord update, this function may start returning null (if no such object exists any more) or even some different object with the same properties. So you should provide all property names that you use, and often even some extra properties to make sure you'll get exactly what you want.
         * @see Read {@link find} documentation for more details how search works
         * @param {string[]} propNames Array of property names to look for
         * @param {object} [options] Options object to pass to {@link find}.
         * @return {object} First module that matched by propNames or null if none is matched.
         */
        const findByUniqueProperties = (propNames, options) => find(module => propNames.every(prop => module[prop] !== undefined), options);

        /**
         * Look through all modules of internal Discord's Webpack and return first object that has displayName property with following value. This is useful for searching React components by name. Take into account that not all components are exported as modules. Also there might be several components with same names
         * @see Use {@link ReactComponents} as another way to get react components
         * @see Read {@link find} documentation for more details how search works
         * @param {string} displayName Display name property value to look for
         * @param {object} [options] Options object to pass to {@link find}.
         * @return {object} First module that matched by displayName or null if none is matched.
         */
        const findByDisplayName = (displayName, options) => find(module => module.displayName === displayName, options);

        return {find, findByUniqueProperties, findByDisplayName};

    })();
})();

/*@end @*/
