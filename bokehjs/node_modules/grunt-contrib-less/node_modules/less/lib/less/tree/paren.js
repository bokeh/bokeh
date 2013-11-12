
(function (tree) {

tree.Paren = function (node) {
    this.value = node;
};
tree.Paren.prototype = {
    type: "Paren",
    accept: function (visitor) {
        this.value = visitor.visit(this.value);
    },
    toCSS: function (env) {
        return '(' + this.value.toCSS(env).trim() + ')';
    },
    eval: function (env) {
        return new(tree.Paren)(this.value.eval(env));
    }
};

})(require('../tree'));
