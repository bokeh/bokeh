"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Horizon class which lets you build your Horizon charts just
passing the arguments to the Chart class and calling the proper functions.
"""
from __future__ import division

from six import string_types
from collections import OrderedDict, defaultdict
import math

from ._builder import Builder, create_and_build
from ..models import ColumnDataSource, Range1d, DataRange1d, FactorRange, GlyphRenderer, CategoricalAxis
from ..models.glyphs import Patches

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def Horizon(values, index=None, nb_folds=3, pos_color='#006400',
              neg_color='#6495ed', xscale='datetime', **kws):
    tools = kws.get('tools', True)

    if tools == True:
        tools = "save,resize,reset"
    elif isinstance(tools, string_types):
        tools = tools.replace('pan', '')
        tools = tools.replace('wheel_zoom', '')
        tools = tools.replace('box_zoom', '')
        tools = tools.replace(',,', ',')
    kws['tools'] = tools

    chart = create_and_build(
        HorizonBuilder, values, index=index, nb_folds=nb_folds, pos_color=pos_color,
        neg_color=neg_color, xscale=xscale, **kws
    )

    return chart

class HorizonBuilder(Builder):

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
        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        hz = Horizon(xyvalues, index='Date', title="horizon", legend="top_left",
                        ylabel='Stock Prices', filename="stocks_ts.html")
        hz.show()

    """
    def __init__(self, values, index=None, legend=False, palette=None,
                 nb_folds=3, pos_color='#006400', neg_color='#6495ed', **kws):
    #
    # def __init__(self, values, index=None, title=None, xlabel=None, ylabel=None,
    #              legend=False, xscale="datetime", yscale="linear", width=800,
    #              height=600, tools=True, filename=False, server=False,
    #              notebook=False, facet=False, xgrid=False, ygrid=False,
    #              nb_folds=3, pos_color='#006400', neg_color='#6495ed'):
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
            nb_folds (int, optional): the number of folds stacked on
                top of each others.
                (default: 3)
            pos_color (hex color string, optional): the color of the
                positive folds
                (default: #006400)
            neg_color (hex color string, optional): the color of
                the negative folds
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
        self.index = index
        self.nb_folds = nb_folds
        self.pos_color = pos_color
        self.neg_color = neg_color
        self.fold_names = []

#     -        self.source = None
# -        self.xdr = None
# -        self.ydr = None
# -        self.groups = []
        self.series = []
# -        self.fold_height = {}
        self.max_y = 0

        super(HorizonBuilder, self).__init__(
            values, legend=legend, palette=palette
        )
        # super(Horizon, self).__init__(
        #     title, xlabel, ylabel, legend, xscale, yscale, width, height,
        #     tools, filename, server, notebook, facet, xgrid, ygrid
        # )

    # def check_attr(self):
    #     """ Disable zoom and pan tools since horizon plots display a predetermined
    #     data range. Also, secondary axis is broken during zooming.
    #     """
    #     super(Horizon, self).check_attr()
    #     if self._tools == True:
    #         self._tools = "save,resize,reset"
    #     elif isinstance(self._tools, string_types):
    #         self._tools = self._tools.replace('pan', '')
    #         self._tools = self._tools.replace('wheel_zoom', '')
    #         self._tools = self._tools.replace('box_zoom', '')
    #         self._tools = self._tools.replace(',,', ',')

    def fold_coordinates(self, y, fold_no, fold_height, y_origin=0, graph_ratio=1):
        """ Function that calculate the coordinates for a value given a fold
        """
        height = fold_no * fold_height
        quotient, remainder = divmod(abs(y), float(height))
        v = fold_height

        # quotient would be 0 if the coordinate is represented in this fold
        # layer
        if math.floor(quotient) == 0:
            v = 0
            if remainder >= height - fold_height:
                v = remainder - height + fold_height

        v = v * graph_ratio
        # Return tuple of the positive and negative relevant position of
        # the coordinate against the provided fold layer
        if y > 0:
            return (v + y_origin, fold_height * graph_ratio + y_origin)
        else:
            return (y_origin, fold_height * graph_ratio - v + y_origin)

    def pad_list(self, l, padded_value=None):
        """ Function that insert padded values at the start and end of
        the list (l). If padded_value not provided, then duplicate the
        values next to each end of the list
        """
        if len(l) > 0:
            l.insert(0, l[0] if padded_value is None else padded_value)
            l.append(l[-1] if padded_value is None else padded_value)
        return l

    def get_data(self):
        """Use x/y data from the horizon values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the multiple area glyphes inside the ``draw`` method.

        """
        for col in self.values.keys():
            if isinstance(self.index, string_types) and col == self.index:
                continue

            self.series.append(col)
            self.max_y = max(max(self.values[col]), self.max_y)

            v_index = [x for x in self.values_index]
            self.set_and_get("x_", col, self.pad_list(v_index))

        self.fold_height = self.max_y / self.nb_folds
        self.graph_ratio = self.nb_folds / len(self.series)

        fill_alpha = []
        fill_color = []

        for serie_no, serie in enumerate(self.series):

            self.set_and_get('y_', serie, self.values[serie])
            y_origin = serie_no * self.max_y / len(self.series)

            for fold_itr in range(1, self.nb_folds + 1):

                layers_datapoints = [self.fold_coordinates(
                    x, fold_itr, self.fold_height, y_origin, self.graph_ratio) for x in self.values[serie]]
                pos_points, neg_points = map(list, zip(*(layers_datapoints)))

                alpha = 1.0 * (abs(fold_itr)) / self.nb_folds

                # Y coordinates above 0
                pos_points = self.pad_list(pos_points, y_origin)
                self.set_and_get("y_fold%s_" % fold_itr, serie, pos_points)
                self.fold_names.append("y_fold%s_%s" % (fold_itr, serie))
                fill_color.append(self.pos_color)
                fill_alpha.append(alpha)

                # Y coordinates below 0
                neg_points = self.pad_list(
                    neg_points, self.fold_height * self.graph_ratio + y_origin)
                self.set_and_get("y_fold-%s_" % fold_itr, serie, neg_points)
                self.fold_names.append("y_fold-%s_%s" % (fold_itr, serie))
                fill_color.append(self.neg_color)
                fill_alpha.append(alpha)

                # Groups shown in the legend will only appear once
                if serie_no == 0:
                    self.groups.append(str(self.fold_height * fold_itr))
                    self.groups.append(str(self.fold_height * -fold_itr))

        self.set_and_get('fill_', 'alpha', fill_alpha)
        self.set_and_get('fill_', 'color', fill_color)
        self.set_and_get('x_', 'all', [self.data[
                         'x_%s' % serie] for serie in self.series for y in range(self.nb_folds * 2)])
        self.set_and_get(
            'y_', 'all', [self.data[f_name] for f_name in self.fold_names])

    def get_source(self):
        """Push the Horizon data into the ColumnDataSource and
        calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.x_range = DataRange1d(sources=[self.source.columns(self.attr[0])])
        self.y_range = Range1d(start=0, end=self.max_y)

    def draw(self):
        """Use the patch glyphs to connect the xy points in the time series.
        It requires the positive and negative layers
        Takes reference points from the data loaded at the ColumnDataSource.
        """
        patches = Patches(
            fill_color='fill_color', fill_alpha='fill_alpha', xs='x_all', ys='y_all')
        # self.chart.plot.add_glyph(self.source, patches)

        renderer = GlyphRenderer(data_source=self.source, glyph=patches)
        # self._legends.append((self.groups[i-1], [renderer]))
        yield renderer

    def _show_teardown(self):
        """Add the serie names to the y axis, the hover tooltips and legend"""
        p = self.chart.plot

        # Hide numerical axis / TODO: adapt for
        # https://github.com/bokeh/bokeh/issues/1730
        p.left[0].axis_label_text_color = None
        p.left[0].axis_line_color = None
        p.left[0].major_label_text_color = None
        p.left[0].major_tick_line_color = None
        p.left[0].minor_tick_line_color = None

        # Add the series names to the y axis
        p.extra_y_ranges = {"series": FactorRange(factors=self.series)}
        p.add_layout(CategoricalAxis(y_range_name="series"), 'left')

        # TODO: Add the tooltips to display the dates and all absolute y values for each series
        # at any vertical places on the plot

        # TODO: Add the legend to display the fold ranges based on the color of
        # the fold
