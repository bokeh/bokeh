from .sources import ColumnDataSource

from ..core.has_props import abstract
from ..core.properties import Any, Dict, Either, Instance, Int, Seq, String
from ..core.validation import error
from ..core.validation.errors import MISSING_GRAPH_DATA_SOURCE_SUBCOLUMN
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


_DEFAULT_NODE_SOURCE = lambda: ColumnDataSource(data=dict(index=[]))


_DEFAULT_EDGE_SOURCE = lambda: ColumnDataSource(data=dict(start=[], end=[]))


class GraphDataSource(Model):
    '''

    '''

    @error(MISSING_GRAPH_DATA_SOURCE_SUBCOLUMN)
    def _check_missing_subcolumns(self):
        missing = []
        if "index" not in self.nodes.column_names:
            missing.append("index")
        if "start" not in self.edges.column_names:
            missing.append("start")
        if "end" not in self.edges.column_names:
            missing.append("end")

        if missing:
            return " ,".join(missing) + " [%s]" % self

    nodes = Instance(ColumnDataSource, default=_DEFAULT_NODE_SOURCE, help="""
    A ColumnDataSource corresponding the graph nodes. It's required that the
    source have a column named ``index``, which contain the lookup values of
    the nodes.
    """)

    edges = Instance(ColumnDataSource, default=_DEFAULT_EDGE_SOURCE, help="""
    A ColumnDataSource corresponding to the graph edges. It's required that the
    source have two columns named ``start`` and ``edge``, which contain the
    start and edge nodes of an edge.
    """)

    layout_provider = Instance(LayoutProvider, help="""
    An instance of a LayoutProvider that supplies the layout of the network
    graph in cartesian space.
    """)
