from ..core.properties import Bool, String, Nullable, NonNullable, Dict, List, Tuple, Either, Instance
from ..model import Model, Qualified
from .layouts import LayoutDOM
from .style import Style

class DOMNode(Model, Qualified):
    pass
class Text(DOMNode):
    content = String(default="")
class HTML(DOMNode):
    style = Nullable(Either(Instance(Style), Dict(String, String)))
    children = List(Either(String, Instance(DOMNode), Instance(LayoutDOM)))
class Template(HTML):
    pass
class Span(HTML):
    pass
class Div(HTML):
    pass
class Table(HTML):
    _children = List(Tuple(Instance(DOMNode), Instance(DOMNode)), default=[])
class TableRow(HTML):
    pass
class VBox(HTML):
    pass
class HBox(HTML):
    pass
class Placeholder(DOMNode):
    pass
class Index(Placeholder):
    pass
class ValueRef(Placeholder):
    field = NonNullable(String)
class ColorRef(ValueRef):
    hex = Bool(default=True)
    swatch = Bool(default=True)
