(function (tree) {

tree.Extend = function Extend(selector, option, index) {
    this.selector = selector;
    this.option = option;
    this.index = index;

    switch(option) {
        case "all":
            this.allowBefore = true;
            this.allowAfter = true;
        break;
        default:
            this.allowBefore = false;
            this.allowAfter = false;
        break;
    }
};

tree.Extend.prototype = {
    type: "Extend",
    accept: function (visitor) {
        this.selector = visitor.visit(this.selector);
    },
    eval: function (env) {
        return new(tree.Extend)(this.selector.eval(env), this.option, this.index);
    },
    clone: function (env) {
        return new(tree.Extend)(this.selector, this.option, this.index);
    },
    findSelfSelectors: function (selectors) {
        var selfElements = [],
            i;

        for(i = 0; i < selectors.length; i++) {
            selfElements = selfElements.concat(selectors[i].elements);
        }

        this.selfSelectors = [{ elements: selfElements }];
    }
};

})(require('../tree'));
