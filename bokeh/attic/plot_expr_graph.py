
from .properties import Function, Instance, List, This, String, Color, Enum, Int, Array

class PlotExprNode(object):
    """ A node in the Plot Expression Graph. Used to express the AST of the
    user's plot expression, mostly as they entered it using the various 
    ggplot-style functions.
    """

    # Our parent node
    parent = This

    # A list of other PlotExprNodes
    children = List(This)

    def __init__(self):
        self.children = []
        self.parent = None

    def __add__(self, node):
        """ Adds given **node** as one of our children, and sets this node
        as its parent
        """
        if node is None:
            raise RuntimeError("Cannot add NoneType to plot expression")
        self.children.append(node)
        node.parent = self
        return node
       
    def _debug_print(self, indent=0):
        """ Returns a string form of this node and its children, with the
        given indent level.
        """
        # TODO: implement _debug_print
        raise NotImplementedError

class BokehPlot(PlotExprNode):
    """ Represents a plot or series of plots. Serves as the "root" of the
    plot expression hierarchy.  Holds the reference to a dataset.
    """
    def __init__(self, data=None):
        super(BokehPlot, self).__init__()
        self.data = data


class FacetGrid(PlotExprNode):
    
    factor_expr = Instance(PlotExprNode)


class FacetWrap(PlotExprNode):
    
    factor_expr = Instance(PlotExprNode)


class Aes(PlotExprNode):
    x = String
    y = String

    # Common aesthetic properties
    color = Color
    fill_color = Color
    line_type = Enum("solid", "dashed", "dotted", "dotdash", "twodash", "longdash")
    shape = Enum("cirle", "square", "dot", "cross", "triangle")
    size = Int
    justification = Enum("left", "right", "center")

    def __init__(self, **kwargs):
        super(Aes, self).__init__()
        # Explicitly call setattr instead of just updating __dict__
        # because these may be handled as properties
        for k,v in kwargs:
            setattr(self, k, v)

    def auto_palette(self, attribute, keys):
        """ Creates an internal auto-palette mapping the keys (1 array or
        two, for crosses) to values of the given attribute.
        """
        pass

DefaultStyle = dict(
    color = "black",
    fill_color = "lightgray",
    shape = 0,
    size = 4, 
    justification = "left",
    line_type = "solid",
    line_weight = 1
    )

class Geom(PlotExprNode):
    """ Base class for Geoms

    Most geoms will define additional geometric attributes which can
    be used for protovis-style scripting.  The geometric variables
    that are defined on each Geom class can be set to literal arrays
    or ArrayProxies.  When they are read, however, they return
    ArrayProxies.
    """

    # Optional upstream Aes node that this geom look at first
    aes = Instance

    def get_aesthetic(self, var):
        """ Returns the value of a particular aesthetic variable
        for this Geom. Traverses the upstream hierarchy of plot 
        expression objects.
        """
        if self.aes is not None:
            if hasattr(self.aes, var):
                return getattr(self.aes, var)

        node = self.parent
        while node is not None:
            if isinstance(node, Aes):
                if hasattr(node, var):
                    return getattr(node, var)
            else:
                node = node.parent
        # Couldn't find a value, return a default
        return DefaultStyle[var]


class GeomPoint(Geom):
    x = Instance   #ArrayProxy
    y = Instance   #ArrayProxy

    # TODO: position functions are not supported right now
    position = Function

    @property
    def x(self):
        pass

    @x.setter
    def x(self, val):
        pass

    @property
    def y(self):
        pass

    @y.setter
    def y(self, val):
        pass


class GeomLine(Geom):
    x = Array
    y = Array

class GeomBar(Geom):
    left = Array
    right = Array
    top = Array
    bottom = Array

class GeomArea(Geom):
    x = Array
    y = Array
    x2 = Array
    y2 = Array

class GeomWedge(Geom):
    # GeomWedge is really a bit of a hack until we implement real coords;
    # it's just a GeomArea in polar coords
    r = Array
    theta = Array
    r2 = Array
    theta2 = Array





