from ..core.has_props import abstract
from ..core.properties import Any, Dict, Either, Int, Seq, String
from ..model import Model

@abstract
class LayoutProvider(Model):
    '''

    '''

    pass


class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    graph_layout = Dict(Either(String, Int), Seq(Any), default={}, help="""
    The coordinates of the graph nodes in cartesian space. The dictionary
    keys correspond to a node index and the values are a two element sequence
    containing the x and y coordinates of the node.

    .. code-block:: python
        {
            0 : [0.5, 0.5],
            1 : [1.0, 0.86],
            2 : [0.86, 1],
        }
    """)
