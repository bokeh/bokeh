"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Horizon class which lets you build your Horizon charts just
passing the arguments to the Chart class and calling the proper functions.
"""
from __future__ import absolute_import, division

import math

from six import string_types

from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, Range1d, DataRange1d, FactorRange, GlyphRenderer, CategoricalAxis
from ...models.glyphs import Patches
from ...properties import Any, Color, Int

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def Horizon(values, index=None, num_folds=3, pos_color='#006400',
            neg_color='#6495ed', xscale='datetime', xgrid=False, ygrid=False,
            **kws):
    """ Create a Horizon chart using :class:`HorizonBuilder <bokeh.charts.builder.horizon_builder.HorizonBuilder>`
    render the geometry from values, index and num_folds.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        index (str|1d iterable, optional): can be used to specify a common custom
            index for all data series as an **1d iterable** of any sort that will be used as
            series common index or a **string** that corresponds to the key of the
            mapping to be used as index (and not as data series) if
            area.values is a mapping (like a dict, an OrderedDict
            or a pandas DataFrame)
        num_folds (int, optional): The number of folds stacked on top
            of each other. (default: 3)
        pos_color (color, optional): The color of the positive folds.
            (default: "#006400")
        neg_color (color, optional): The color of the negative folds.
            (default: "#6495ed")

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        import datetime
        from collections import OrderedDict
        from bokeh.charts import Horizon, output_file, show

        now = datetime.datetime.now()
        dts = [now+datetime.timedelta(seconds=i) for i in range(10)]

        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26, 27, 27, 28, 26, 20]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126, 122, 95, 90, 110, 112]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26, 25, 26, 45, 26, 30]

        hz = Horizon(xyvalues, index='Date', title="Horizon Example", ylabel='Sample Data', xlabel='')

        output_file('horizon.html')
        show(hz)

    """
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
        HorizonBuilder, values, index=index, num_folds=num_folds, pos_color=pos_color,
        neg_color=neg_color, xscale=xscale, xgrid=xgrid, ygrid=ygrid, **kws
    )

    # Hide numerical axis
    chart.left[0].visible = False

    # Add the series names to the y axis
    chart.extra_y_ranges = {"series": FactorRange(factors=chart._builders[0]._series)}
    chart.add_layout(CategoricalAxis(y_range_name="series"), 'left')

    return chart

class HorizonBuilder(Builder):

    """This is the Horizon class and it is in charge of plotting
    Horizon charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, separate the data into
    a number of folds which stack on top of each others.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.

    """

    index = Any(help="""
    An index to be used for all data series as follows:

    - A 1d iterable of any sort that will be used as
        series common index

    - As a string that corresponds to the key of the
        mapping to be used as index (and not as data
        series) if area.values is a mapping (like a dict,
        an OrderedDict or a pandas DataFrame)

    """)

    neg_color = Color("#6495ed", help="""
    The color of the negative folds. (default: "#6495ed")
    """)

    num_folds = Int(3, help="""
    The number of folds stacked on top of each other. (default: 3)
    """)

    pos_color = Color("#006400", help="""
    The color of the positive folds. (default: "#006400")
    """)


    def __init__(self, values, **kws):
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
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.
            palette(list, optional): a list containing the colormap as
                hex values.
            num_folds (int, optional):
            pos_color (hex color string, optional): t
            neg_color (hex color string, optional): the color of
                the negative folds
                (default: #6495ed)

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            x_range (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            y_range (obj): y-associated datarange object for you plot,
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
        super(HorizonBuilder, self).__init__(values, **kws)

        self._fold_names = []
        self._source = None
        self._series = []
        self._fold_height = {}
        self._max_y = 0


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

    def _process_data(self):
        """Use x/y data from the horizon values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the multiple area glyphes inside the ``_yield_renderers`` method.

        """
        for col in self._values.keys():
            if isinstance(self.index, string_types) and col == self.index:
                continue

            self._series.append(col)
            self._max_y = max(max(self._values[col]), self._max_y)

            v_index = [x for x in self._values_index]
            self.set_and_get("x_", col, self.pad_list(v_index))

        self._fold_height = self._max_y / self.num_folds
        self._graph_ratio = self.num_folds / len(self._series)

        fill_alpha = []
        fill_color = []

        for serie_no, serie in enumerate(self._series):

            self.set_and_get('y_', serie, self._values[serie])
            y_origin = serie_no * self._max_y / len(self._series)

            for fold_itr in range(1, self.num_folds + 1):

                layers_datapoints = [self.fold_coordinates(
                    x, fold_itr, self._fold_height, y_origin, self._graph_ratio) for x in self._values[serie]]
                pos_points, neg_points = map(list, zip(*(layers_datapoints)))

                alpha = 1.0 * (abs(fold_itr)) / self.num_folds

                # Y coordinates above 0
                pos_points = self.pad_list(pos_points, y_origin)
                self.set_and_get("y_fold%s_" % fold_itr, serie, pos_points)
                self._fold_names.append("y_fold%s_%s" % (fold_itr, serie))
                fill_color.append(self.pos_color)
                fill_alpha.append(alpha)

                # Y coordinates below 0
                neg_points = self.pad_list(
                    neg_points, self._fold_height * self._graph_ratio + y_origin)
                self.set_and_get("y_fold-%s_" % fold_itr, serie, neg_points)
                self._fold_names.append("y_fold-%s_%s" % (fold_itr, serie))
                fill_color.append(self.neg_color)
                fill_alpha.append(alpha)

                # Groups shown in the legend will only appear once
                if serie_no == 0:
                    self._groups.append(str(self._fold_height * fold_itr))
                    self._groups.append(str(self._fold_height * -fold_itr))

        self.set_and_get('fill_', 'alpha', fill_alpha)
        self.set_and_get('fill_', 'color', fill_color)
        self.set_and_get('x_', 'all', [self._data[
                         'x_%s' % serie] for serie in self._series for y in range(self.num_folds * 2)])
        self.set_and_get(
            'y_', 'all', [self._data[f_name] for f_name in self._fold_names])

    def _set_sources(self):
        """Push the Horizon data into the ColumnDataSource and
        calculate the proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = DataRange1d(range_padding=0)
        self.y_range = Range1d(start=0, end=self._max_y)

    def _yield_renderers(self):
        """Use the patch glyphs to connect the xy points in the time series.
        It requires the positive and negative layers
        Takes reference points from the data loaded at the ColumnDataSource.
        """
        patches = Patches(
            fill_color='fill_color', fill_alpha='fill_alpha', xs='x_all', ys='y_all')
        renderer = GlyphRenderer(data_source=self._source, glyph=patches)
        # self._legends.append((self._groups[i-1], [renderer]))
        yield renderer


        # TODO: Add the tooltips to display the dates and all absolute y values for each series
        # at any vertical places on the plot

        # TODO: Add the legend to display the fold ranges based on the color of
        # the fold
