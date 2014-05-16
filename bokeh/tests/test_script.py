
from bokeh.script import Var, Function, Let, Set, Ref, Clone, Roll, Select, Apply, Str, Num, GetItem
from bokeh.objects import ColumnDataSource

source = ColumnDataSource()

def f():
    ds = Var("ds")
    data = Var("data")
    return Function((),
        Let(ds, Ref(source)),
        Let(data, Clone(ds.get("data"))),
        Set(data["rmin"], Roll(data["rmin"], +1)),
        Set(data["rmax"], Roll(data["rmax"], -1)),
        ds.set("data", data),
        ds.save(),
    )

def g():
    return Function((),
        Let(Var("ds"), Ref(source)),
        Let(Var("data"), Clone(Apply(Select(Var("ds"), "get"), Str("data")))),
        Set(GetItem(Var("data"), Str("rmin")), Roll(GetItem(Var("data"), Str("rmin")), Num(+1))),
        Set(GetItem(Var("data"), Str("rmax")), Roll(GetItem(Var("data"), Str("rmax")), Num(-1))),
        Apply(Select(Var("ds"), "set"), Str("data"), Var("data")),
        Apply(Select(Var("ds"), "save")),
    )

def h():
    return Function(value, Let(scaled, value//1000), If(scaled > 0, Then(Format("%dk", scaled)), Else(Str(value))))
