"""
An implementation of GGPlot in Python.

The functions try to mimic the R interface, for better or for worse, but 
there is an underlying object model for the actual graphics pipeline that
is constructed.

"""

from traits import api as traits
from traits.api import HasTraits, Any, Enum, Float, Function, Int, List, Str, Trait

from chaco import api as chaco
from chaco.tools.api import PanTool, ZoomTool, RegressionLasso, RegressionOverlay

from pandas_plot_data import PandasPlotData

DefaultStyle = dict(
    color = "black",
    fill = "lightgray",
    shape = 0,
    size = 4, 
    justification = "left",
    line_type = "solid",
    line_weight = 1
    )

class Aesthetic(HasTraits):
    """ Acts as a data and visual configuration template which is
    passed in to gpplot()
    """

    x = Trait(None, Str)
    y = Trait(None, Str)

    color = Trait(None, Str)
    fill = Trait(None, Str)

    # Shape can be:
    #   an integer in 0..25 for the various symbols
    #   a single character to use as the literal symbol
    #   a "." to draw the smallest rectangle
    #   None, to draw nothing
    # All symbols have a foreground color; symbols 19-25 also have bgcolor
    shape = Trait(None, Str, Int)

    # Size in millimeters
    size = Trait(None, Int)

    # Justification can also be a number between 0..1, giving position
    # within the string
    #justification = Enum("left", "right", "center", "bottom", "top")

    line_type = Trait(None, Enum("solid", "dashed", "dotted", "dotdash",
                     "longdash", "twodash", "blank"))
    line_weight = Trait(None, Int)

    #binwidth = Float()
    #label = Str()
    #ymin = Float()
    #ymax = Float()
    #group = Str()

    def __init__(self, x=None, y=None, **kwtraits):
        super(Aesthetic, self).__init__(**kwtraits)
        if x:
            self.x = x
        if y:
            self.y = y

    def __add__(self, aes):
        """ Returns a new Aesthetic class that represents the merger of this
        instance with another one.  This instance (LHS) takes lower 
        precedence, and its values are masked by ones in RHS argument.
        """
        newaes = self.clone_traits()
        for trait_name in set(aes.trait_names()) - set(("trait_modified", "trait_added")):
            if getattr(aes, trait_name) is not None:
                setattr(self, trait_name, getattr(aes, trait_name))
        return newaes

    def merge_defaults(self):
        """ Fills in all trait values that are None with values from the
        DefaultStyle dictionary.
        """
        for trait_name in set(self.trait_names()) - set(("trait_modified", "trait_added")):
            if getattr(self, trait_name) is None:
                setattr(self, trait_name, DefaultStyle[trait_name])


class Geom(Aesthetic):
    """ Represents the geometry definition returned by geom_*() family
    of functions.

    Typically, created with an optional 'position' and/or optional
    aesthetic definitions.
    """

    position = Enum("identity", "dodge", "jitter", "fill", "stack")

    def __init__(self, **kwtraits):
        HasTraits.__init__(self, **kwtraits)

    def plot(self, plot, aes):
        raise NotImplementedError


class GeomPoint(Geom):
    
    _renderer = Any()

    def plot(self, plot, aes):
        aes = aes + self
        aes.merge_defaults()
        p = plot.plot((aes.x, aes.y), type="scatter", color=aes.fill,
                outline_color=aes.color, marker_size=aes.size,
                line_width=aes.line_weight, )
        #print "GeomPoint plot of", aes.x, ",", aes.y
        self._renderer = p[0]


class GeomLine(Geom):
    
    _renderer = Any()

    def plot(self, plot, aes):
        aes = aes + self
        aes.merge_defaults()
        p = plot.plot((aes.x, aes.y), type="line", color=aes.fill,
                line_width=aes.line_weight, 
                line_style=self._convert_line_style(aes.line_type))
        #print "GeomLine plot of", aes.x, ",", aes.y
        self._renderer = p[0]

    def _convert_line_style(self, line_style):
        # For now this is just an enum map, but ggplot's line_type can
        # also define the dash pattern numerically, and we will need to
        # convert them to Kiva-style dash patterns.
        return {"blank": None,  # Not correct; what do with this?
                "solid": "solid",
                "dashed": "dash",
                "dotted": "dot",
                "dotdash": "dot dash",
                "longdash": "long dash", 
                "twodash": "long dash"   # Not correct
                }[line_style]


class Tool(HasTraits):
    type = Enum("pan", "zoom", "regression")
    button = Enum(None, "left", "right")

class GGPlot(HasTraits):
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

    # The window object in the current session that contains the plot
    # corresponding to this plot
    window = Any()
    
    # The redraw function to call 
    display_hook = Function()
    
    def __init__(self, dataset, **kw):
        super(GGPlot, self).__init__(dataset=dataset, **kw)

    def __add__(self, obj):
        """ Appends another graphical element to this plot, or, in the
        case of facets, causes this plot to perform a re-layout.
        """
        # Check to see if a facet or a geom is being passed in
        if isinstance(obj, Geom):
            print "added geom:", obj
            self.geoms.append(obj)
            if self.window is not None:
                self._update_plot()
        elif isinstance(obj, Facet):
            print "setting facet:", obj
            self.facet_layout = obj
        elif isinstance(obj, Aesthetic):
            if self.aes is None:
                self.aes = obj
                # Use the first aesthetic we get to set the window title
                if self.window:
                    self.window.set_title(obj.x + " * " + obj.y)
            else:
                self.aes + obj
        elif isinstance(obj, Tool):
            self._add_tool(obj)
        if self.window is not None:
            self._redraw()
        return self

    def show_plot(self):
        from chaco import shell
        if self.window is None:
            win_num = shell.session.new_window()
            self.window = shell.session.get_window(win_num)
            if self.aes is not None:
                self.window.set_title(self.aes.x + " * " + self.aes.y)
            plot = self.window.get_container()
            self._initialize_plot(plot)
            plot.request_redraw()
        else:
            self._update_plot()
        
    def _initialize_plot(self, plotcontainer):
        # Create the data source
        ppd = PandasPlotData(self.dataset)
        plotcontainer.data = ppd

        if self.facet_layout is None:
            [g.plot(plotcontainer, self.aes) for g in self.geoms]

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
                print "Factors:", self.facet_layout.factors
                print "Grid of shape:", grid_shape
                print "Levels:", levels[0], levels[1]

                container = chaco.GridContainer(padding=20, fill_padding=True,
                        bgcolor="lightgray", use_backbuffer=False,
                        shape=grid_shape, spacing=(10,10))
                pd_dict = dict((pd.group_key, pd) for pd in facet_pds)
                factors = self.facet_layout.factors
                title = factors[0] + "=%d, " + factors[1] + "=%d"
                for i in levels[0]:
                    for j in levels[1]:
                        if (i,j) in pd_dict:
                            plot = chaco.Plot(pd_dict[(i,j)], title=title%(i,j),
                                    padding=15)
                            plot.index_range.tight_bounds = False
                            plot.value_range.tight_bounds = False
                            [g.plot(plot, self.aes) for g in self.geoms]
                        else:
                            plot = chaco.OverlayPlotContainer(bgcolor="lightgray")
                        container.add(plot)

            
            elif self.facet_layout.ftype == "wrap":
                # This is not really wrapping, instead just using a horizontal
                # plot container.
                container = chaco.HPlotContainer(padding=40, fill_padding=True,
                        bgcolor="lightgray", use_backbuffer=True, spacing=20)

            self.window.set_container(container)
            container.request_redraw()


    def _update_plot(self):
        # Very simple right now: check our list of Geoms and if they
        # don't have a renderer, then plot them.
        for g in self.geoms:
            if g._renderer is None:
                print "Updating plot with geom", g
                g.plot(self.window.get_container(), self.aes)
        self._redraw()

    def _add_tool(self, toolspec):
        # depending on the kind of tool, we have to attach it to different
        # things in the plot component hierarchy.
        if toolspec.type == "regression":
            # Find the first scatterplot
            for g in self.geoms:
                if isinstance(g._renderer, chaco.ScatterPlot):
                    plot = g._renderer
                    tool = RegressionLasso(plot,
                            selection_datasource=plot.index)
                    plot.tools.append(tool)
                    plot.overlays.append(RegressionOverlay(plot, 
                                        lasso_selection=tool))
                    break
            else:
                print "Unable to find a suitable scatterplot for regression tool"

        elif toolspec.type == "pan":
            cont = self.window.get_container()
            tool = PanTool(cont)
            if toolspec.button is not None:
                tool.drag_button = toolspec.button
            cont.tools.append(tool)

        elif toolspec.type == "zoom":
            cont = self.window.get_container()
            zoom = ZoomTool(cont, tool_mode="box", always_on=False)
            cont.overlays.append(zoom)
                
    
    def _redraw(self):
        """ Private method that is called whenever a change is made 
        that should cause an interactive display update.
        By default this is a NOP so that this module can be used in
        library form, and not merely in interactive mode.
        """
        if self.window:
            self.window.get_container().invalidate_and_redraw()
        return


class Facet(HasTraits):
    factors = List()
    ftype = Enum("wrap", "grid")

    @classmethod
    def grid(cls, left="", right=""):
        return cls(factors=[left, right], ftype="grid")

    @classmethod
    def wrap(cls, factor=""):
        return cls(factors=[factor], ftype="wrap")


class Factor(HasTraits):
    """ Represents a factorization ("uniquification") of a particular 
    column.  This is typically used to generate the unique set of values
    for a categorical dimension, to feed in to things like facets and 
    color scales.
    """

    attr = Str()

    def __init__(self, attr):
        self.attr = attr

