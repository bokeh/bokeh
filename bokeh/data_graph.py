
import numpy as np

from .faketraits import Enum, Instance, String, Tuple, This
#from bokeh.array_proxy.grapheval import GraphNode
#from bokeh.array_proxy import ArrayProxy


class FactorExprNode(object):
    """ Represents a factor expression, i.e. an algebraic expression composed
    of the blend, nest, and cross operators on factor names
    """

    # The operation to perform on the arguments. If None, then this is a
    # terminal input node just naming a factor (i.e. a "dot" operator)
    op = Enum(None, "blend", "cross", "nest")

    # A flexible number of arguments for the input operation. For the None
    # op, this is a string of the factor name.
    factors = Tuple(This, String)

    def __init__(self, factor=None, op=None, factors=None):
        """ Creates a FactorExprNode. Typically this ctor is only
        called to create a new factor node that names a single factor.
        However, to programmatically construct a FactorExprNode,
        pass in the **factors** and **op** keyword args explicitly.
        (NB: the keyword is "factors", and not "factor".)
        """
        if factors is not None:
            self.factors = factors
        else:
            self.factors = factor
        self.op = op

    def blend(self, rval):
        return FactorExprNode(op='blend', factors=[self, self._asnode(rval)])

    def cross(self, rval):
        return FactorExprNode(op='cross', factors=[self, self._asnode(rval)])

    def nest(self, rval):
        return FactorExprNode(op='nest', factors=[self, self._asnode(rval)])

    def _asnode(self, val):
        if isinstance(val, FactorExprNode):
            return val
        elif isinstance(val, str):
            return FactorExprNode(val)
        else:
            raise ValueError("Factor expressions require a string or factor expression; got %s" % type(val))

    def __add__(self, rval):
        return self.blend(rval)

    def __mul__(self, rval):
        return self.cross(rval)

    def __div__(self, rval):
        return self.nest(rval)

    def __str__(self):
        if self.op is None:
            return "Facet '" + self.factors + "'"
        else:
            return self.op + " operator"
    
    @classmethod
    def from_string_expr(cls, expr):
        """ Takes a factor expression of the form "FOO * BAR" (or any of the 
        other operators) and returns a FactorExprNode
        """
        if "*" in expr:
            ch = "*"
            op = "cross"
        elif "+" in expr:
            ch = "+"
            op = "blend"
        elif "/" in expr:
            ch = "/"
            op = "nest"
        factors = [cls(s.strip()) for s in expr.split(ch)]
        return cls(op=op, factors=factors)

#class AlgebraicExprNode(GraphNode):
#    """ Represents an algebraic expression

#    Currently uses the array_proxy subpackage (from blaze.array_proxy)
#    to represent array expressions.
#    """
#    pass
    

class DataCube(object):
    """ A hypercube or table of records to be plotted. Provides a common
    interface to upstream concrete data sources, e.g. a Numpy record array, a
    Pandas DataFrame, or blaze NDTable.

    The conceptual model is hierarchically nested set of dimensions, ultimately
    resolving to a table with multiple columns, just like an OLAP cube.  Some
    columns are categorical and can act as dimensions for faceting.  Other
    columns represent measure varibles (or "measures"), and typically contain
    the numerical values which determine positions in a scatter or line plot.
    
    The DataCube supports basic faceting and querying of data columns.  Each
    facet operation returns a derived DataCube, and is lazily evaluated.  (The
    derived DataCube internally stores the selection operation that produced
    it.)

    Just as a Numpy array frequently generates views on arrays, a DataCube
    represents a structured, hypercube View of underlying tables.
    """
    
    # Some sort of concrete data table (numpy or pandas)
    _data = Instance

    # The factoring expression that created this datacube (if it is 
    # derived from an upstream one)
    _expr = Instance(FactorExprNode)

    # The parent cube from which this cube is created via _expr. Since
    # the operations we are currently concerned with only ever have a
    # single parent (i.e. they are chained functional style), this is
    # usually a duplicate reference to some upstream FactorExprNode,
    # and is only here for convenience.
    _parent = None
    
    @classmethod
    def from_data(cls, data):
        newcube = cls()
        newcube._data = data
        return newcube

    @classmethod
    def from_expr(cls, parent, expr):
        newcube = cls()
        newcube._parent = parent
        if isinstance(expr, str):
            expr = FactorExprNode(expr)
        newcube._expr = expr
        return newcube

    def __init__(self, data=None):
        self._data = data

    def facet(self, expr):
        """ Returns a new DataCube that contains the result of the 
        **expr** (which can be a simple column name) as its outermost
        dimension.  Can be regarded as a deferred GroupBy().

        """
        return DataCube.from_expr(self, expr)


    def keys(self):
        """ Returns one or two lists of keys which can be used to iterate the
        innermost dimension of this cube, via select() or __getitem__().  

        If a single list is returned, each element may be a single value or
        a tuple.  Single values usually result from a dot or blend operator,
        and tuples of values result from nest operators.
        
        If two lists are returned, then they are turn be treated as the
        dimensions of an outer product, and any combination of tuples from
        those two lists are considered a valid index.

        This triggers an evaluation of our input factor expressions.
        """
        # This function implements the heart of the table logic. We manually
        # combine keys using the operators indicated by FactorExprNode objects.
        # The reason this method is part of DataCube and not implemented in
        # FactorExprNode is because the latter is meant to be a purely
        # declarative representation of the expression graph, not an imperative
        # utility class.
        
        if self._expr is None:
            # We are being asked for the keys of some raw underlying data.
            # If this is a numpy array, just return integer indices. If this
            # is a Pandas DataFrame, we can return its index.
            if isinstance(self._data, np.ndarray):
                return range(self._data.shape[0])
            elif hasattr(self._data, "index"):
                return self._data.index
        else:
            # TODO: For now, all faceting operations require that we have a 
            # pandas DataFrame to compute the factors/levels. Integrate Bryan's
            # Level DType stuff to make this support regular ndarrays.
            if not hasattr(self._data, "groupby"):
                raise RuntimeError("Data needs to support group-by functionality")
            op = self._expr.op
            if op is None:
                # Do a simple group-by
                return self._data.groupby(self._expr.factors)

            elif op == "blend":
                # Set union of keys from the two operands of the blend
                left, right = self._expr.factors
                keys = set.union(set(self._data.groupby(left).keys()), set(self._data.groupby(right).keys()))
                return keys
            
            elif op == "cross":
                return [self._data.groupby(left).keys(), self._data.groupby(right).keys()]

            elif op == "nest":
                # Nested group-by. In effect like a cross that rejects null
                # intersections between its input dimensions.
                # We need to loop over the keyspace of our left operand and
                # then do a group-by according to the factor named in the
                # right operand.  If the left operand is a cross, then we
                # need to do the outer product, and we return two lists.
                # TODO
                raise NotImplementedError 

    def groups(self, *columns):
        """ Returns a list of tuples (key, value), where key is a tuple
        of coordinates from the root hypercube (and whose length depends
        on the number of parents of this DataCube), and value is a dict
        mapping column names from the **columns** positional arguments
        to Numpy arrays.

        For example, calling groups('age', 'height') on a cube
        that is the result of faceting on 'country' and 'gender' would
        result in a return value of:

          [ (('USA', 'male') : {'age': <ndarray>, 'height': <ndarray>}),
            (('USA', 'female') : {'age': <ndarray>, 'height': <ndarray>}),
            (('CAN', 'male') : {'age': <ndarray>, 'height': <ndarray>}),
            (('CAN', 'female') : {'age': <ndarray>, 'height': <ndarray>}),
            (('MEX', 'male') : {'age': <ndarray>, 'height': <ndarray>}),
            (('MEX', 'female') : {'age': <ndarray>, 'height': <ndarray>}),
            ... ]

        """
        # TODO: This really needs to just use Pandas.MultiIndex, stack(),
        # and pivot().  I just need to rework the FactorExprNode stuff
        # to produce a MultiIndex; then, this DataCube can just pass
        # in self._expr.
        raise NotImplementedError

    def group_proxies(self, *columns):
        """ Just like value_groups(), except return ArrayProxies for 
        each of the DataSeries.  This enables Protovis-style syntax
        for building up transformation pipeline.
        """
        raise NotImplementedError

    #def keyshape(self):
    #    """ Returns the number of lists that will be returned by the keys()
    #    method.  If this DataCube wraps a bare ndarray or DataFrame, then
    #    returns 1, because the data is treated as a table, and the index
    #    of a table is 1D.  (Unlike the address space of a hypercube.)

    #    If this DataCube has neither an expression nor data, then it returns 0.
    #    """
    #    if self._expr is None:
    #        # We are a "root level" DataCube, holding on to some data
    #        if self._data is None:
    #            return 0
    #        else:
    #            return 1
    #    elif self._expr.op is None:
    #        # The expression node is just naming a particular column of the
    #        # data; equivalent to the implicit "dot" FactorExpr operator.
    #        return 1
    #    elif self._expr.op in ("blend", "nest"):
    #        # The result of a blend or nest really depends on our operands.  If
    #        # we blend two cross products, or nest one cross product inside a
    #        # non-cross...
    #        # TODO
    #        return 1
    #    elif self._expr.op == "cross":
    #        return 2
    #    else:
    #        raise RuntimeError("Unable to determine key shape for DataCube")

#class DataSet(object):
#    """ A collection of graphable measure variables. Behaves much like a
#    dict, except that it offers ArrayProxies instead of arrays, to support
#    the creation of a functional dataflow on its data.  These proxies can
#    then trigger update events, etc.,

#    Additionally, remembers the keys/query used to extract this DataSet
#    from its parent DataCube.
#    """
#    # TODO: Should just extend Pandas.Series to have a DeferredSeries

