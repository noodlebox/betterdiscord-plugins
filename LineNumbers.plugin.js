//META{"name":"lineNumbers"}*//

var lineNumbers = function () {};

(function () {
    "use strict";

    function processCodeBlocks(mutation) {
        mutationFind(mutation, ".hljs").not(":has(ol)")
            .addClass("kawaii-linenumbers")
            .each(function () {
                this.innerHTML = this.innerHTML.split("\n").map(line => "<li>"+line+"</li>").join("");
            })
            .wrapInner($("<ol>"));
    }

    // Helper function for finding all elements matching selector affected by a mutation
    function mutationFind(mutation, selector) {
        var target = $(mutation.target), addedNodes = $(mutation.addedNodes);
        var mutated = target.add(addedNodes).filter(selector);
        var descendants = addedNodes.find(selector);
        var ancestors = target.parents(selector);
        return mutated.add(descendants).add(ancestors);
    }

    lineNumbers.prototype.start = function () {
        // process entire document
        var mutation = {target: document, addedNodes: [document]};
        processCodeBlocks(mutation);
    };

    lineNumbers.prototype.observer = function (mutation) {
        processCodeBlocks(mutation);
    };

    lineNumbers.prototype.load = function () {};

    lineNumbers.prototype.unload = function () {};

    lineNumbers.prototype.stop = function () {
        $(".kawaii-linenumbers")
            .removeClass("kawaii-linenumbers")
            .find("ol > li")
            .not(":last-child").append(document.createTextNode("\n")).end()
            .contents().unwrap().unwrap();
    };

    lineNumbers.prototype.getSettingsPanel = function () {
        return "";
    };

    lineNumbers.prototype.getName = function () {
        return "Line Numbers";
    };

    lineNumbers.prototype.getDescription = function () {
        return "Add line numbers to code blocks";
    };

    lineNumbers.prototype.getVersion = function () {
        return "0.1.0";
    };

    lineNumbers.prototype.getAuthor = function () {
        return "noodlebox";
    };
})();
