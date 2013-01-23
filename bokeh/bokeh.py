
from . import plot_expr_graph as peg
from .data_graph import FactorExprNode

def ggplot(data=None, aes=None):
    p = peg.BokehPlot(data)
    if aes is not None:
        return p + aes
    else:
        return p

def aes(x=None, y=None, **kw):
    return peg.Aes(**kw)

def geom_point(position=None, aes=None):
    """ **position** is one of the position_* adjustment
    functions like jitter, dodge, etc.
    """
    g = peg.GeomPoint()
    if aes:
        g.aes = aes
    if position is not None:
        g.position = position
    return g
    
def geom_line(aes=None):
    if aes:
        g = peg.GeomLine(aes)
    else:
        g = peg.GeomLine()
    return g

def facet_grid(factor_expr):
    node = peg.FacetGrid()
    node.factor_expr = FactorExprNode.from_string_expr(factor_expr)
    return node

def facet_wrap(factor_expr):
    node = peg.FacetWrap()
    node.factor_expr = FactorExprNode.from_string_expr(factor_expr)
    return node





