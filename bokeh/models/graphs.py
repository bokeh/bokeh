from .sources import ColumnDataSource

from ..core.has_props import abstract
from ..core.properties import Any, Instance, Seq, Dict
from ..model import Model

_DEFAULT_NODE_SOURCE = lambda: ColumnDataSource(data=dict(index=[]))

_DEFAULT_EDGE_SOURCE = lambda: ColumnDataSource(data=dict(start=[], end=[]))


@abstract
class LayoutProvider(Model):
    '''

    '''

    pass


class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    layout = Dict(Any, Seq(Any), default={}, help="""
    node_index: [x_coord, y_coord]
    """)

class GraphDataSource(Model):
    '''

    '''

    nodes = Instance(ColumnDataSource, default=_DEFAULT_NODE_SOURCE, help="""
    Stuff and things
    """)

    edges = Instance(ColumnDataSource, default=_DEFAULT_EDGE_SOURCE, help="""
    Stuff and things
    """)
