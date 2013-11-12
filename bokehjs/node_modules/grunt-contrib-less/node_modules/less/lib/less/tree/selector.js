(function (tree) {

tree.Selector = function (elements, extendList) {
    this.elements = elements;
    this.extendList = extendList || [];
};
tree.Selector.prototype = {
    type: "Selector",
    accept: function (visitor) {
        this.elements = visitor.visit(this.elements);
        this.extendList = visitor.visit(this.extendList)
    },
    match: function (other) {
        var elements = this.elements,
            len = elements.length,
            oelements, olen, max, i;

        oelements = other.elements.slice(
            (other.elements.length && other.elements[0].value === "&") ? 1 : 0);
        olen = oelements.length;
        max = Math.min(len, olen);

        if (olen === 0 || len < olen) {
            return false;
        } else {
            for (i = 0; i < max; i++) {
                if (elements[i].value !== oelements[i].value) {
                    return false;
                }
            }
        }
        return true;
    },
    eval: function (env) {
        return new(tree.Selector)(this.elements.map(function (e) {
            return e.eval(env);
        }), this.extendList.map(function(extend) {
            return extend.eval(env);
        }));
    },
    toCSS: function (env) {
        if (this._css) { return this._css }

        if (this.elements[0].combinator.value === "") {
            this._css = ' ';
        } else {
            this._css = '';
        }

        this._css += this.elements.map(function (e) {
            if (typeof(e) === 'string') {
                return ' ' + e.trim();
            } else {
                return e.toCSS(env);
            }
        }).join('');

        return this._css;
    }
};

})(require('../tree'));
