(function (tree) {

tree.Element = function (combinator, value, index) {
    this.combinator = combinator instanceof tree.Combinator ?
                      combinator : new(tree.Combinator)(combinator);

    if (typeof(value) === 'string') {
        this.value = value.trim();
    } else if (value) {
        this.value = value;
    } else {
        this.value = "";
    }
    this.index = index;
};
tree.Element.prototype = {
    type: "Element",
    accept: function (visitor) {
        this.combinator = visitor.visit(this.combinator);
        this.value = visitor.visit(this.value);
    },
    eval: function (env) {
        return new(tree.Element)(this.combinator,
                                 this.value.eval ? this.value.eval(env) : this.value,
                                 this.index);
    },
    toCSS: function (env) {
        var value = (this.value.toCSS ? this.value.toCSS(env) : this.value);
        if (value == '' && this.combinator.value.charAt(0) == '&') {
            return '';
        } else {
            return this.combinator.toCSS(env || {}) + value;
        }
    }
};

tree.Attribute = function (key, op, value) {
    this.key = key;
    this.op = op;
    this.value = value;
};
tree.Attribute.prototype = {
    type: "Attribute",
    accept: function (visitor) {
        this.value = visitor.visit(this.value);
    },
    eval: function (env) {
        return new(tree.Attribute)(this.key.eval ? this.key.eval(env) : this.key,
            this.op, (this.value && this.value.eval) ? this.value.eval(env) : this.value);
    },
    toCSS: function (env) {
        var value = this.key.toCSS ? this.key.toCSS(env) : this.key;

        if (this.op) {
            value += this.op;
            value += (this.value.toCSS ? this.value.toCSS(env) : this.value);
        }

        return '[' + value + ']';
    }
};

tree.Combinator = function (value) {
    if (value === ' ') {
        this.value = ' ';
    } else {
        this.value = value ? value.trim() : "";
    }
};
tree.Combinator.prototype = {
    type: "Combinator",
    toCSS: function (env) {
        return {
            ''  : '',
            ' ' : ' ',
            ':' : ' :',
            '+' : env.compress ? '+' : ' + ',
            '~' : env.compress ? '~' : ' ~ ',
            '>' : env.compress ? '>' : ' > ',
            '|' : env.compress ? '|' : ' | '
        }[this.value];
    }
};

})(require('../tree'));
