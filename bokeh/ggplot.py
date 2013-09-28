"""
An implementation of GGPlot in Python.

The functions try to mimic the R interface, for better or for worse, but
there is an underlying object model for the actual graphics pipeline that
is constructed.

"""

#from traits import api as traits
#from traits.api import HasTraits, Any, Enum, Int, List, Str, Trait

from .properties import HasProps, Any, Either, Enum, Int, List, String

from pandas_plot_data import PandasPlotData

DefaultStyle = dict(
    color = "black",
    fill_color = "lightgray",
    shape = 0,
    size = 4,
    justification = "left",
    line_type = "solid",
    line_weight = 1
    )

class Aesthetic(HasProps):
    """ Acts as a data and visual configuration template which is
    passed in to gpplot()
    """

    x = String(None)
    y = String(None)

    color = String(None)
    fill_color = String(None)

    # Shape can be:
    #   an integer in 0..25 for the various symbols
    #   a single character to use as the literal symbol
    #   a "." to draw the smallest rectangle
    #   None, to draw nothing
    # All symbols have a foreground color; symbols 19-25 also have bgcolor
    shape = Either(String, Int, default=0)

    # Size in millimeters
    size = Int(1)

    # Justification can also be a number between 0..1, giving position
    # within the string
    #justification = Enum("left", "right", "center", "bottom", "top")

    line_type = Enum("solid", "dashed", "dotted", "dotdash",
                     "longdash", "twodash", "blank")
    line_weight = Int(None)

    #binwidth = Float()
    #label = String()
    #ymin = Float()
    #ymax = Float()
    #group = String()

    def __init__(self, x=None, y=None, **kwtraits):
        if x:
            self.x = x
        if y:
            self.y = y
        super(Aesthetic, self).__init__(**kwtraits)

    def __add__(self, aes):
        """ Returns a new Aesthetic class that represents the merger of this
        instance with another one.  This instance (LHS) takes lower
        precedence, and its values are masked by ones in RHS argument.
        """
        newaes = self.clone()
        for prop_name in aes.properties():
            if getattr(aes, prop_name) is not None:
                setattr(newaes, prop_name, getattr(aes, prop_name))
        return newaes

    def merge_defaults(self):
        """ Fills in all trait values that are None with values from the
        DefaultStyle dictionary.
        """
        for prop_name in self.properties():
            if getattr(self, prop_name) is None:
                setattr(self, prop_name, DefaultStyle[prop_name])


class Geom(Aesthetic):
    """ Represents the geometry definition returned by geom_*() family
    of functions.

    Typically, created with an optional 'position' and/or optional
    aesthetic definitions.
    """

    position = Enum("identity", "dodge", "jitter", "fill", "stack")

    def plot(self, plotclient, datasource, aes, title=None):
        raise NotImplementedError

class GeomPoint(Geom):

    def plot(self, plotclient, datasource, aes, title=None):
        props = self.properties()
        aes = aes + self
        aes.merge_defaults()
        #p = plotclient.scatter((aes.x, aes.y), type="scatter", color=aes.fill,
        #        outline_color=aes.color, marker_size=aes.size,
        #        line_width=aes.line_weight, )
        p = plotclient.scatter(aes.x, aes.y, color=aes.color, data_source=datasource)
        if title:
            p.plotmodel.set('title', title)
        return p


class GeomLine(Geom):

    def plot(self, plotclient, datasource, aes, title=None):
        aes = aes + self
        aes.merge_defaults()
        #p = plot.plot((aes.x, aes.y), type="line", color=aes.fill,
        #        line_width=aes.line_weight,
        #        line_style=self._convert_line_style(aes.line_type))
        p = plotclient.plot(aes.x, aes.y, color=aes.color, data_source=datasource)
        if title:
            p.set('title', title)
        return p

class Tool(HasProps):
    type = Enum("pan", "zoom", "regression")
    button = Enum(None, "left", "right")

class GGPlot(HasProps):
    """ Represents a Grammar of Graphics plot.

    Most of the ggplot functions extend or manipulate this object, by adding
    new renderers and changing the data pipeline (or extracting statistics
    from data).

    The most common operation on this object is the '+' operator, which
    adds renderers to the plot.
    """

    # Pandas dataframe
    dataset = Any()

    # Instance of Aesthetic which usually defines the data columns
    aes = Any()

    # list of Geom objects that define the actual things to plot on the
    # graph itself
    geoms = List()

    facet_layout = Any()

    _plot_title = String()

    def __init__(self, dataset=None, **kw):
        super(GGPlot, self).__init__(dataset=dataset, **kw)

    def __add__(self, obj):
        """ Appends another graphical element to this plot, or, in the
        case of facets, causes this plot to perform a re-layout.
        """
        # Check to see if a facet or a geom is being passed in
        if isinstance(obj, Geom):
            print "added geom:", obj
            self.geoms.append(obj)
        elif isinstance(obj, Facet):
            print "setting facet:", obj
            self.facet_layout = obj
        elif isinstance(obj, Aesthetic):
            if self.aes is None:
                self.aes = obj
                # Use the first aesthetic we get to set the window title
                self.set_title(obj.x + " * " + obj.y)
            else:
                self.aes = self.aes + obj
        return self

    def set_title(self, title):
        """ Sets the title of this plot to **title** """
        self._plot_title = title

    def to_html(self, notebook=False):
        """ Returns HTML representing the plot. Does not include any headers
        or javascript dependencies, etc.

        If **notebook** is True, then does the right things for producing
        output that can be embedded in IPython notebook.
        """

        import mpl
        client = mpl.PlotClient()

        if notebook:
            client.notebooksources()

        # Create the data source
        ppd = PandasPlotData(self.dataset)

        if self.facet_layout is None:
            datasource = client.make_source(**dict((dataname, ppd.get_data(dataname)) for dataname in ppd.list_data()))
            for g in self.geoms:
                p = g.plot(client, datasource, self.aes)
            if notebook:
                return p
            else:
                return client.htmldump()

        else:
            # Use the PandasPlotData to create a list of faceted data sources
            facet_pds = ppd.facet(self.facet_layout.factors)

            container = None
            if self.facet_layout.ftype == "grid":
                # Determine the shape by looking at the first faceted datasource.
                # Reaching into the facet_pds is sort of gorpy; need to think
                # of a better interface for PandasPlotData.
                levels = facet_pds[0]._groupby.grouper.levels
                grid_shape = (len(levels[0]), len(levels[1]))

                plots = []
                pd_dict = dict((pd.group_key, pd) for pd in facet_pds)
                factors = self.facet_layout.factors
                title = factors[0] + "=%d, " + factors[1] + "=%d"
                for i in levels[0]:
                    plotrow = []
                    for j in levels[1]:
                        if (i,j) in pd_dict:
                            pd = pd_dict[(i,j)]
                            datasource = client.make_source(
                                            **dict((dataname, pd.get_data(dataname)) for dataname in pd.list_data()))

                            plot = self.geoms[0].plot(client, datasource, self.aes)
                            if len(self.geoms) > 1:
                                [g.plot(client, datasource, self.aes) for g in self.geoms[1:]]
                        else:
                            # Create a new empty plot area
                            plot = client._newxyplot()
                        plotrow.append(plot)
                        client.figure()
                    plots.append(plotrow)

                container = client.grid(plots)

            elif self.facet_layout.ftype == "wrap":
                pass

            if notebook:
                return container
            else:
                return container.htmldump()



class Facet(HasProps):
    factors = List()
    ftype = Enum("wrap", "grid")

    @classmethod
    def grid(cls, left="", right=""):
        return cls(factors=[left, right], ftype="grid")

    @classmethod
    def wrap(cls, factor=""):
        return cls(factors=[factor], ftype="wrap")

class Factor(HasProps):
    """ Represents a factorization ("uniquification") of a particular
    column.  This is typically used to generate the unique set of values
    for a categorical dimension, to feed in to things like facets and
    color scales.
    """

    attr = String()

    def __init__(self, attr):
        self.attr = attr

