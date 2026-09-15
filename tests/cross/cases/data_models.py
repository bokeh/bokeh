# Bokeh imports
from bokeh.core.properties import (
    Any,
    Instance,
    Int,
    Nullable,
    Regex,
)
from bokeh.model import DataModel
from bokeh.models import Div


class ForwardDefault(DataModel):
    payload = Any(default=lambda: Later())
    pattern = Regex(r"(?P<word>foo)", default="foo")


class Later(DataModel):
    child = Nullable(Instance(lambda: Later), default=None)
    value = Int(default=1)


output = Div(text="DataModel definitions loaded")
