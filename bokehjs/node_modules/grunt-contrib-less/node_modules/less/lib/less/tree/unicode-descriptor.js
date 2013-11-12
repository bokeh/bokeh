(function (tree) {

tree.UnicodeDescriptor = function (value) {
    this.value = value;
};
tree.UnicodeDescriptor.prototype = {
    type: "UnicodeDescriptor",
    toCSS: function (env) {
        return this.value;
    },
    eval: function () { return this }
};

})(require('../tree'));
