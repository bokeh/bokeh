(function (tree) {

tree.Operation = function (op, operands, isSpaced) {
    this.op = op.trim();
    this.operands = operands;
    this.isSpaced = isSpaced;
};
tree.Operation.prototype = {
    type: "Operation",
    accept: function (visitor) {
        this.operands = visitor.visit(this.operands);
    },
    eval: function (env) {
        var a = this.operands[0].eval(env),
            b = this.operands[1].eval(env),
            temp;

        if (env.isMathOn()) {
            if (a instanceof tree.Dimension && b instanceof tree.Color) {
                if (this.op === '*' || this.op === '+') {
                    temp = b, b = a, a = temp;
                } else {
                    throw { type: "Operation",
                            message: "Can't substract or divide a color from a number" };
                }
            }
            if (!a.operate) {
                throw { type: "Operation",
                        message: "Operation on an invalid type" };
            }

            return a.operate(env, this.op, b);
        } else {
            return new(tree.Operation)(this.op, [a, b], this.isSpaced);
        }
    },
    toCSS: function (env) {
        var separator = this.isSpaced ? " " : "";
        return this.operands[0].toCSS() + separator + this.op + separator + this.operands[1].toCSS();
    }
};

tree.operate = function (env, op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
    }
};

})(require('../tree'));
