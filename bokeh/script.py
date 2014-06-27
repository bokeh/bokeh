from six import integer_types, string_types

class Expr(object):

    @property
    def _precedence(self):
        return 1000

    def parenthesize(self, expr, level=None):
        js = expr.toJS()

        if expr._precedence <= (level or self._precedence):
            return "(%s)" % js
        else:
            return js

    def lift(self, expr):
        if isinstance(expr, Expr):
            return expr
        elif isinstance(expr, string_types):
            return Str(expr)
        elif isinstance(expr, (float,) + integer_types):
            return Num(expr)
        else:
            raise ValueError("can't lift %r to an expression" % expr)

    def _hashable(self):
        raise NotImplementedError

    def __hash__(self):
        return hash((self.__class__.__name__,) + self._hashable())

    def __eq__(self, other):
        return isinstance(other, self.__class__) and self._hashable() == other._hashable()

    def __ne__(self, other):
        return not self.__eq__(other)

    def __call__(self, *args):
        return Apply(self, *args)

    def __getattr__(self, name):
        return Select(self, name)

    def __getitem__(self, item):
        return GetItem(self, item)

    def toJS(self):
        raise NotImplementedError

class Var(Expr):

    def __init__(self, name):
        assert isinstance(name, string_types)
        self.name = name

    def _hashable(self):
        return (self.name,)

    def __repr__(self):
        return "Var(%r)" % self.name

    def toJS(self):
        return self.name

class Let(Expr):

    def __init__(self, lhs, rhs):
        self.lhs = self.lift(lhs)
        self.rhs = self.lift(rhs)

    def _hashable(self):
        return (self.lhs, self.rhs)

    def __repr__(self):
        return "Let(%s, %s)" % (self.lhs, self.rhs)

    def toJS(self):
        return "var %s = %s" % (self.lhs.toJS(), self.rhs.toJS())

class Set(Expr):

    def __init__(self, lhs, rhs):
        self.lhs = self.lift(lhs)
        self.rhs = self.lift(rhs)

    def _hashable(self):
        return (self.lhs, self.rhs)

    def __repr__(self):
        return "Set(%s, %s)" % (self.lhs, self.rhs)

    def toJS(self):
        return "%s = %s" % (self.lhs.toJS(), self.rhs.toJS())

class Select(Expr):

    def __init__(self, expr, name):
        assert isinstance(name, string_types)
        self.expr = self.lift(expr)
        self.name = name

    def _hashable(self):
        return (self.expr, self.name)

    def __repr__(self):
        return "Select(%s, %r)" % (self.expr, self.name)

    def toJS(self):
        return "%s.%s" % (self.expr.toJS(), self.name)

class Apply(Expr):

    def __init__(self, expr, *args):
        self.expr = self.lift(expr)
        self.args = [ self.lift(arg) for arg in args ]

    def _hashable(self):
        return (self.expr, tuple(self.args))

    def __repr__(self):
        return "Apply(%s, %s)" % (self.expr, ", ".join([ str(arg) for arg in self.args ]))

    def toJS(self):
        return "%s(%s)" % (self.expr.toJS(), ", ".join([ arg.toJS() for arg in self.args ]))

class GetItem(Expr):

    def __init__(self, expr, item):
        self.expr = self.lift(expr)
        self.item = self.lift(item)

    def _hashable(self):
        return (self.expr, self.item)

    def __repr__(self):
        return "GetItem(%s, %s)" % (self.expr, self.item)

    def toJS(self):
        return "%s[%s]" % (self.expr.toJS(), self.item.toJS())

class Function(Expr):

    def __init__(self, args, *body):
        assert all(isinstance(args, string_types) for arg in args)
        self.args = args
        self.body = [ self.lift(expr) for expr in body ]

    def _hashable(self):
        return (tuple(self.args), tuple(self.body))

    def __repr__(self):
        return "Function(%r, %s)" % (self.args, ", ".join([ str(expr) for expr in self.body ]))

    def toJS(self):
        args = ", ".join([ arg.toJS() for arg in self.args ])
        body = "; ".join([ expr.toJS() for expr in self.body ])
        return "(function(%s) { %s })" % (args, body)

class Neg(Expr):

    def __init__(self, expr):
        self.expr = self.lift(expr)

    def _hashable(self):
        return (self.expr,)

    def __repr__(self):
        return "Neg(%s)" % self.expr

    def toJS(self):
        return "-%s" % self.parenthesize(self.expr)

class Atom(Expr):

    def _hashable(self):
        return (self.value,)

class Str(Atom):

    def __init__(self, value):
        assert isinstance(value, string_types)
        self.value = value

    def __repr__(self):
        return "Str(%r)" % self.value

    def toJS(self):
        return "\"" + self.value + "\""

class Num(Atom):

    def __init__(self, value):
        assert isinstance(value, (float,) + integer_types)
        self.value = value

    def __repr__(self):
        return "Num(%s)" % self.value

    def toJS(self):
        return str(self.value)

def require(module):
    return Apply(Var("require"), module)

Bokeh = require("main")

def Ref(obj):
    from bokeh.plot_object import PlotObject
    if isinstance(obj, PlotObject):
        ref = obj.get_ref()
        return Apply(Select(Apply(Select(Bokeh, "Collections"), Str(ref["type"])), "get"), Str(ref["id"]))
    else:
        raise ValueError("expected a PlotObject, got %r" % obj)

def Clone(expr):
    return Apply(Select(Var("_"), "clone"), expr)

def Roll(array, n):
    head = Apply(Select(array, "slice"), Num(0), Neg(n))
    tail = Apply(Select(array, "slice"), Neg(n))
    return Apply(Select(tail, "concat"), head)

def symbols(*names):
    return [ Var(name) for name in names ]
