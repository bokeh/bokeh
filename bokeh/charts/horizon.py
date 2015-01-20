"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Horizon class which lets you build your Horizon charts just
passing the arguments to the Chart class and calling the proper functions.
"""

from six import string_types
from collections import OrderedDict
import math

from ._chartobject import ChartObject
from ..models import ColumnDataSource, Range1d, DataRange1d, FactorRange, HoverTool, CategoricalAxis

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Horizon(ChartObject):
    """This is the Horizon class and it is in charge of plotting
    Horizon charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, separate the data into
    a number of folds which stack on top of each others.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.

    Examples:
        import datetime
        from collections import OrderedDict
        from bokeh.charts import Horizon

        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(5)]
        dtss = ['%s'%dt for dt in dts]
        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        ts = Horizon(xyvalues, index='Date', title="horizon",
                        ylabel='Stock Prices', filename="stocks_ts.html")
        ts.legend("top_left").show()

    """
    def __init__(self, values, index=None, title=None, xlabel=None, ylabel=None,
                 legend=False, xscale="datetime", yscale="linear", width=800,
                 height=600, tools=True, filename=False, server=False, nb_folds=3,
                 notebook=False, facet=False, xgrid=False, ygrid=False,
                 pos_color='#006400', neg_color='#6495ed'):
        """
        Args:
            values (iterable): iterable 2d representing the data series
                values matrix.
            index (str|1d iterable, optional): can be used to specify a
                common custom index for all data series as follows:
                    - As a 1d iterable of any sort (of datetime values)
                        that will be used as series common index
                    - As a string that corresponds to the key of the
                        mapping to be used as index (and not as data
                        series) if area.values is a mapping (like a dict,
                        an OrderedDict or a pandas DataFrame). The values
                        must be datetime values.
            title (str, optional): the title of your chart. Defaults
                to None.
            xlabel (str, optional): the x-axis label of your chart.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your chart.
                Defaults to None.
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.
            xscale (str, optional): the x-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``datetime``.
            yscale (str, optional): the y-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your chart in pixels.
                Defaults to 800.
            height (int, optional): the height of you chart in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in
                your chart. Defaults to True
            filename (str or bool, optional): the name of the file where
                your chart. will be written. If you pass True to this
                argument, it will use ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your chart in
                the server. If you pass True to this argument, it will
                use ``untitled`` as the name in the server.
                Defaults to False.
            notebook (bool, optional): whether to output to IPython notebook
                (default: False)
            facet (bool, optional): generate multiple areas on multiple
                separate charts for each series if True. Defaults to
                False
            xgrid (bool, optional): whether to display x grid lines
                (default: True)
            ygrid (bool, optional): whether to display y grid lines
                (default: True)
            pos_color (hex color string): the color of the positive folds
                (default: #006400)
            neg_color (hex color string): the color of the negative folds
                (default: #6495ed)

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        self.values = values
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.series = []
        self.fold_height = {}
        self.max_y = 0
        self.data = dict()
        self.attr = []
        self.index = index
        self.nb_folds = nb_folds
        self.pos_color = pos_color
        self.neg_color = neg_color

        super(Horizon, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet, xgrid, ygrid
        )

    def get_data(self):
        """Take the x/y data from the horizon values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the multiple area glyphes inside the ``draw`` method.

        """

        def fold_coordinates(y, fold_no, fold_height, y_origin=0):
            """ Function that calculate the coordinates for a value given a fold
            """
            height = fold_no * fold_height
            quotient, remainder = divmod(abs(y), float(height))
            v = fold_height
            if math.floor(quotient) == 0:
                v = (remainder - height + fold_height) if remainder >= height - fold_height else 0
            return (v + y_origin, fold_height + y_origin) if y > 0 else (y_origin, fold_height - v + y_origin)

        for col in self.values.keys():
            if isinstance(self.index, string_types) and col == self.index:
                continue
 
            self.series.append(col)
            self.set_and_get("x_", col, self.values_index)
            self.max_y = max(max(self.values[col]), self.max_y)

        self.fold_height = self.max_y / self.nb_folds
        for serie_no, serie in enumerate(self.series):
            y_origin = serie_no * self.fold_height
            for fold_itr in range(1, self.nb_folds + 1):
                layers_datapoints = [fold_coordinates(x, fold_itr, self.fold_height, y_origin) for x in self.values[serie]]
                pos_points, neg_points = zip(*(layers_datapoints))
                
                # *************
                # This is clearly a hack in order to correctly close the area from the origin
                # by removing the starting and tailing points from the list and replacing by a value at the
                # origin of the layer on the y axis
                pos_points = (y_origin,) + pos_points[1:-1] + (y_origin,)
                neg_points = (self.fold_height+y_origin,) + neg_points[1:-1] + (self.fold_height+y_origin,)
                # *************

                self.set_and_get("y_fold%s_" % fold_itr, serie, pos_points)
                self.set_and_get("y_fold-%s_" % fold_itr, serie, neg_points)

    def get_source(self):
        """Push the Horizon data into the ColumnDataSource and
        calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.xdr = DataRange1d(sources=[self.source.columns(self.attr[0])])
        self.ydr = Range1d(start=0, end=self.max_y)

    def draw(self):
        """Use the patch glyphs to connect the xy points in the time series.
        It requires the positive and negative layers
        Takes reference points from the data loaded at the ColumnDataSource.
        """
        for serie_no, serie in enumerate(self.series):
            for fold_itr in range(-self.nb_folds, self.nb_folds + 1):
                if fold_itr == 0: continue
                alpha = 1.0 * (abs(fold_itr)) / self.nb_folds
                color = self.pos_color if fold_itr > 0 else self.neg_color
                self.chart.make_patch(self.source, 'x_%s' % serie, 'y_fold%s_%s' % (fold_itr, serie), color, fill_alpha=alpha)
                if serie_no == 0:
                    self.groups.append(str(self.fold_height * fold_itr))

    def _show_teardown(self):
        """Add the serie names to the y axis and the hover tooltips"""
        p = self.chart.plot

        # Hide numerical axis
        p.left[0].axis_label_text_color = None
        p.left[0].axis_line_color = None
        p.left[0].major_label_text_color = None
        p.left[0].major_tick_line_color = None
        p.left[0].minor_tick_line_color = None

        # Add the series names to the y axis
        p.extra_y_ranges = {"series": FactorRange(factors=self.series)}
        p.add_layout(CategoricalAxis(y_range_name="series"), 'left')

        # TODO: Add the other tooltips like the serie name and the y value of that serie for that position
        p.add_tools(HoverTool(tooltips=[("index", "$values_index")]))
