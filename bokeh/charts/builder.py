''' This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Builder class, a minimal prototype class to build more chart
types on top of it.

'''
from __future__ import absolute_import

import numpy as np
from six import string_types

from bokeh.core.enums import SortDirection
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Bool, Color, Dict, Either, Enum, Instance, List, String, Tuple
from bokeh.models.ranges import FactorRange, Range, Range1d
from bokeh.models.sources import ColumnDataSource
from bokeh.util.deprecation import deprecated

from .attributes import AttrSpec, CatAttr, ColorAttr
from .chart import Chart
from .data_source import ChartDataSource, OrderedAssigner
from .models import CompositeGlyph
from .properties import Dimension, ColumnLabel
from .utils import build_hover_tooltips, collect_attribute_columns, label_from_index_dict

def create_and_build(builder_class, *data, **kws):
    """A factory function for handling Chart and Builder generation.

    Returns:
        :class:`Chart`
    """
    if getattr(builder_class, 'dimensions') is None:
        raise NotImplementedError('Each builder must specify its dimensions, %s does not.' % builder_class.__name__)

    if getattr(builder_class, 'default_attributes') is None:
        raise NotImplementedError('Each builder must specify its default_attributes, %s does not.' % builder_class.__name__)

    builder_props = set(builder_class.properties()) | \
        set(getattr(builder_class, "__deprecated_attributes__", []))

    # append dimensions to the builder props
    for dim in builder_class.dimensions:
        builder_props.add(dim)

    # append attributes to the builder props
    for attr_name in builder_class.default_attributes.keys():
        builder_props.add(attr_name)

    # create the new builder
    builder_kws = {k: v for k, v in kws.items() if k in builder_props}
    builder = builder_class(*data, **builder_kws)

    # create a chart to return, since there isn't one already
    chart_kws = {k: v for k, v in kws.items() if k not in builder_props}
    chart = Chart(**chart_kws)
    chart.add_builder(builder)
    chart.start_plot()

    return chart


class Builder(HasProps):
    """ A prototype class to inherit each new chart Builder type.

    It provides useful methods to be used by the inherited builder classes,
    in order to automate most of the charts creation tasks and leave the
    core customization to specialized builder classes. In that pattern
    inherited builders just need to provide the following methods:

    Required:

    * :meth:`~bokeh.charts.builder.Builder.yield_renderers`: yields the glyphs to be
      rendered into the plot. Here you should call the
      :meth:`~bokeh.charts.builder.Builder.add_glyph` method so that the builder can
      setup the legend for you.
    * :meth:`~bokeh.charts.builder.Builder.set_ranges`: setup the ranges for the
      glyphs. This is called after glyph creation, so you are able to inspect the
      comp_glyphs for their minimum and maximum values. See the
      :meth:`~bokeh.charts.builder.Builder.create` method for more information on
      when this is called and how the builder provides the ranges to the containing
      :class:`Chart` using the :meth:`Chart.add_ranges` method.

    Optional:

    * :meth:`~bokeh.charts.builder.Builder.setup`: provides an area
      where subclasses of builder can introspect properties, setup attributes, or change
      property values. This is called before
      :meth:`~bokeh.charts.builder.Builder.process_data`.
    * :meth:`~bokeh.charts.builder.Builder.process_data`: provides an area
      where subclasses of builder can manipulate the source data before renderers are
      created.

    """

    # Optional Inputs
    x_range = Instance(Range)
    y_range = Instance(Range)

    xlabel = String()
    ylabel = String()

    xscale = String()
    yscale = String()

    palette = List(Color, help="""Optional input to override the default palette used
        by any color attribute.
        """)

    # Dimension Configuration

    """
    The dimension labels that drive the position of the
    glyphs. Subclasses should implement this so that the Builder
    base class knows which dimensions it needs to operate on.
    An example for a builder working with cartesian x and y
    coordinates would be dimensions = ['x', 'y']. You should
    then instantiate the x and y dimensions as attributes of the
    subclass of builder using the :class:`Dimension
    <bokeh.charts.properties.Dimension>` class. One for x, as x
    = Dimension(...), and one as y = Dimension(...).
    """
    dimensions = None # None because it MUST be overridden

    """
    The dimension labels that must exist to produce the
    glyphs. This specifies what are the valid configurations for
    the chart, with the option of specifying the type of the
    columns. The
    :class:`~bokeh.charts.data_source.ChartDataSource` will
    inspect this property of your subclass of Builder and use
    this to fill in any required dimensions if no keyword
    arguments are used.
    """
    req_dimensions = []

    # Attribute Configuration
    attributes = Dict(String, Instance(AttrSpec), help="""
        The attribute specs used to group data. This is a mapping between the role of
        the attribute spec (e.g. 'color') and the
        :class:`~bokeh.charts.attributes.AttrSpec` class (e.g.,
        :class:`~bokeh.charts.attributes.ColorAttr`). The Builder will use this
        attributes property during runtime, which will consist of any attribute specs
        that are passed into the chart creation function (e.g.,
        :class:`~bokeh.charts.Bar`), ones that are created for the user from simple
        input types (e.g. `Bar(..., color='red')` or `Bar(..., color=<column_name>)`),
        or lastly, the attribute spec found in the default_attributes configured for
        the subclass of :class:`~bokeh.charts.builder.Builder`.
        """)

    """
    The default attribute specs used to group data. This is
    where the subclass of Builder should specify what the
    default attributes are that will yield attribute values to
    each group of data, and any specific configuration. For
    example, the :class:`ColorAttr` utilizes a default palette
    for assigning color based on groups of data. If the user
    doesn't assign a column of the data to the associated
    attribute spec, then the default attrspec is used, which
    will yield a constant color value for each group of
    data. This is by default the first color in the default
    palette, but can be customized by setting the default color
    in the ColorAttr.
    """
    default_attributes = None # None because it MUST be overridden

    # Derived properties (created by Builder at runtime)
    attribute_columns = List(ColumnLabel, help="""
        All columns used for specifying attributes for the Chart. The Builder will set
        this value on creation so that the subclasses can know the distinct set of columns
        that are being used to assign attributes.
        """)

    comp_glyphs = List(Instance(CompositeGlyph), help="""
        A list of composite glyphs, where each represents a unique subset of data. The
        composite glyph is a helper class that encapsulates all low level
        :class:`~bokeh.models.glyphs.Glyph`, that represent a higher level group of
        data. For example, the :class:`BoxGlyph` is a single class that yields
        each :class:`GlyphRenderer` needed to produce a Box on a :class:`BoxPlot`. The
        single Box represents a full array of values that are aggregated, and is made
        up of multiple :class:`~bokeh.models.glyphs.Rect` and
        :class:`~bokeh.models.glyphs.Segment` glyphs.
        """)

    labels = List(String, help="""Represents the unique labels to be used for legends.""")

    """List of attributes to use for legends."""
    label_attributes = []

    """
    Used to assign columns to dimensions when no selections have been provided. The
    default behavior is provided by the :class:`OrderedAssigner`, which assigns
    a single column to each dimension available in the `Builder`'s `dims` property.
    """
    column_selector = OrderedAssigner

    comp_glyph_types = List(Instance(CompositeGlyph))

    sort_dim = Dict(String, Bool, default={})

    sort_legend = List(Tuple(String, Bool), help="""
        List of tuples to use for sorting the legend, in order that they should be
        used for sorting. This sorting can be different than the sorting used for the
        rest of the chart. For example, you might want to sort only on the column
        assigned to the color attribute, or sort it descending. The order of each tuple
        is (Column, Ascending).
        """)

    legend_sort_field = String(help="""
        Attribute that should be used to sort the legend, for example: color,
        dash, maker, etc. Valid values for this property depend on the type
        of chart.
        """)

    legend_sort_direction = Enum(SortDirection, help="""
    Sort direction to apply to :attr:`~bokeh.charts.builder.Builder.sort_legend`.
    Valid values are: `ascending` or `descending`.
    """)

    source = Instance(ColumnDataSource)

    tooltips = Either(List(Tuple(String, String)), List(String), Bool, default=None,
                      help="""
        Tells the builder to add tooltips to the chart by either using the columns
        specified to the chart attributes (True), or by generating tooltips for each
        column specified (list(str)), or by explicit specification of the tooltips
        using the valid input for the `HoverTool` tooltips kwarg.
        """)

    __deprecated_attributes__ = ('sort_legend',)

    def __init__(self, *args, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            data (:ref:`userguide_charts_data_types`): source data for the chart
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.

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
                to the ChartDataSource for each Builder class.
            attr (list(AttrSpec)): to be filled with the new attributes created after
                loading the data dict.
        """
        data = None
        if len(args) != 0 or len(kws) != 0:

            # chart dimensions can be literal dimensions or attributes
            attrs = list(self.default_attributes.keys())
            dims = self.dimensions + attrs

            # pop the dimension inputs from kwargs
            data_args = {}
            for dim in dims:
                if dim in kws.keys():
                    data_args[dim] = kws[dim]

            # build chart data source from inputs, given the dimension configuration
            data_args['dims'] = tuple(dims)
            data_args['required_dims'] = tuple(self.req_dimensions)
            data_args['attrs'] = attrs
            data_args['column_assigner'] = self.column_selector
            data = ChartDataSource.from_data(*args, **data_args)

            # make sure that the builder dimensions have access to the chart data source
            for dim in self.dimensions:
                getattr(getattr(self, dim), 'set_data')(data)

            # handle input attrs and ensure attrs have access to data
            attributes = self._setup_attrs(data, kws)

            # remove inputs handled by dimensions and chart attributes
            for dim in dims:
                kws.pop(dim, None)
        else:
            attributes = dict()

        kws['attributes'] = attributes
        super(Builder, self).__init__(**kws)

        # collect unique columns used for attributes
        self.attribute_columns = collect_attribute_columns(**self.attributes)

        for k in self.__deprecated_attributes__:
            if k in kws:
                setattr(self, k, kws[k])

        self._data = data
        self._legends = []

    def _setup_attrs(self, data, kws):
        """Handle overridden attributes and initialize them with data.

        Makes sure that all attributes have access to the data
        source, which is used for mapping attributes to groups
        of data.

        Returns:
            None

        """
        source = ColumnDataSource(data.df)
        attr_names = self.default_attributes.keys()
        custom_palette = kws.get('palette')

        attributes = dict()

        for attr_name in attr_names:

            attr = kws.pop(attr_name, None)

            # if given an attribute use it
            if isinstance(attr, AttrSpec):
                attributes[attr_name] = attr

            # if we are given columns, use those
            elif isinstance(attr, (str, list)):
                attributes[attr_name] = self.default_attributes[attr_name]._clone()

                # override palette if available
                if isinstance(attributes[attr_name], ColorAttr):
                    if custom_palette is not None:
                        attributes[attr_name].iterable = custom_palette

                attributes[attr_name].setup(data=source, columns=attr)

            else:
                # override palette if available
                if (isinstance(self.default_attributes[attr_name], ColorAttr) and
                        custom_palette is not None):
                    attributes[attr_name] = self.default_attributes[attr_name]._clone()
                    attributes[attr_name].iterable = custom_palette
                else:
                    attributes[attr_name] = self.default_attributes[attr_name]._clone()

        # make sure all have access to data source
        for attr_name in attr_names:
            attributes[attr_name].update_data(data=source)

        return attributes

    def setup(self):
        """Perform any initial pre-processing, attribute config.

        Returns:
            None

        """
        pass

    def process_data(self):
        """Make any global data manipulations before grouping.

        It has to be implemented by any of the inherited class
        representing each different chart type. It is the place
        where we make specific calculations for each chart.

        Returns:
            None

        """
        pass

    def yield_renderers(self):
        """ Generator that yields the glyphs to be draw on the plot

        It has to be implemented by any of the inherited class
        representing each different chart type.

        Yields:
            :class:`GlyphRenderer`
        """
        raise NotImplementedError('Subclasses of %s must implement _yield_renderers.' %
                                  self.__class__.__name__)

    def set_ranges(self):
        """Calculate and set the x and y ranges.

        It has to be implemented by any of the subclasses of builder
        representing each different chart type, and is called after
        :meth:`yield_renderers`.

        Returns:
            None

        """
        raise NotImplementedError('Subclasses of %s must implement _set_ranges.' %
                                  self.__class__.__name__)

    def get_dim_extents(self):
        """Helper method to retrieve maximum extents of all the renderers.

        Returns:
            a dict mapping between dimension and value for x_max, y_max, x_min, y_min

        """
        return {'x_max': max([renderer.x_max for renderer in self.comp_glyphs]),
                'y_max': max([renderer.y_max for renderer in self.comp_glyphs]),
                'x_min': min([renderer.x_min for renderer in self.comp_glyphs]),
                'y_min': min([renderer.y_min for renderer in self.comp_glyphs])
                }

    def add_glyph(self, group, glyph):
        """Add a composite glyph.

        Manages the legend, since the builder might not want all attribute types
        used for the legend.

        Args:
            group (:class:`DataGroup`): the data the `glyph` is associated with
            glyph (:class:`CompositeGlyph`): the glyph associated with the `group`

        Returns:
            None
        """
        if isinstance(glyph, list):
            for sub_glyph in glyph:
                self.comp_glyphs.append(sub_glyph)
        else:
            self.comp_glyphs.append(glyph)

        # handle cases where builders have specified which attributes to use for labels
        label = None
        if len(self.label_attributes) > 0:
            for attr in self.label_attributes:
                # this will get the last attribute group label for now
                if self.attributes[attr].columns is not None:
                    label = self._get_group_label(group, attr=attr)

        # if no special case for labeling, just use the group label
        if label is None:
            label = self._get_group_label(group, attr='label')

        # add to legend if new and unique label
        if str(label) not in self.labels and label is not None:
            self._legends.append((label, glyph.renderers))
            self.labels.append(label)

    def _get_group_label(self, group, attr='label'):
        """Get the label of the group by the attribute name.

        Args:
            group (:attr:`DataGroup`: the group of data
            attr (str, optional): the attribute name containing the label, defaults to
                'label'.

        Returns:
            str: the label for the group
        """
        if attr is 'label':
            label = group.label
        else:
            label = group[attr]
            if isinstance(label, dict):
                label = tuple(label.values())

        return self._get_label(label)

    @staticmethod
    def _get_label(raw_label):
        """Converts a label by string or tuple to a string representation.

        Args:
            raw_label (str or tuple(any, any)): a unique identifier for the data group

        Returns:
            str: a label that is usable in charts
        """
        # don't convert None type to string so we can test for it later
        if raw_label is None:
            return None

        if (isinstance(raw_label, tuple) or isinstance(raw_label, list)) and \
                       len(raw_label) == 1:
            raw_label = raw_label[0]
        elif isinstance(raw_label, dict):
            raw_label = label_from_index_dict(raw_label)

        return str(raw_label)

    def collect_attr_kwargs(self):
        if hasattr(super(self.__class__, self), 'default_attributes'):
            attrs = set(self.default_attributes.keys()) - set(
                (super(self.__class__, self).default_attributes or {}).keys())
        else:
            attrs = set()
        return attrs

    def get_group_kwargs(self, group, attrs):
        return {attr: group[attr] for attr in attrs}

    def create(self, chart=None):
        """Builds the renderers, adding them and other components to the chart.

        Args:
            chart (:class:`Chart`, optional): the chart that will contain the glyph
                renderers that the `Builder` produces.

        Returns:
            :class:`Chart`
        """
        # call methods that allow customized setup by subclasses
        self.setup()
        self.process_data()

        # create and add renderers to chart
        renderers = self.yield_renderers()
        if chart is None:
            chart = Chart()
        chart.add_renderers(self, renderers)

        # handle ranges after renders, since ranges depend on aggregations
        # ToDo: should reconsider where this occurs
        self.set_ranges()
        chart.add_ranges('x', self.x_range)
        chart.add_ranges('y', self.y_range)

        # sort the legend if we are told to
        self._legends = self._sort_legend(
                self.legend_sort_field, self.legend_sort_direction,
                self._legends, self.attributes)

        # always contribute legends, let Chart sort it out
        chart.add_legend(self._legends)

        chart.add_labels('x', self.xlabel)
        chart.add_labels('y', self.ylabel)

        chart.add_scales('x', self.xscale)
        chart.add_scales('y', self.yscale)

        if self.tooltips is not None:
            tooltips = build_hover_tooltips(hover_spec=self.tooltips,
                                            chart_cols=self.attribute_columns)
            chart.add_tooltips(tooltips)

        return chart

    @classmethod
    def generate_help(cls):
        help_str = ''
        for comp_glyph in cls.comp_glyph_types:
            help_str += str(comp_glyph.glyph_properties())

        return help_str

    @staticmethod
    def _sort_legend(legend_sort_field, legend_sort_direction, legends, attributes):
        """Sort legends sorted by looping though sort_legend items (
        see :attr:`Builder.sort_legend` for more details)
        """
        if legend_sort_field:
            if len(attributes[legend_sort_field].columns) > 0:

                # TODO(fpliger): attributes should be consistent and not
                #               need any type checking but for
                #               the moment it is not, specially when going
                #               though a process like binning or when data
                #               is built for HeatMap, Scatter, etc...
                item_order = [x[0] if isinstance(x, tuple) else x
                    for x in attributes[legend_sort_field].items]

                item_order = [str(x) if not isinstance(x, string_types)
                    else x for x in item_order]

                def foo(leg):
                    return item_order.index(leg[0])
                reverse = legend_sort_direction == 'descending'
                return list(sorted(legends, key=foo, reverse=reverse))

        return legends

    @property
    def sort_legend(self):
        deprecated((0, 12, 0), 'Chart.sort_legend', 'Chart.legend_sort_field')
        return [(self.legend_sort_field, self.legend_sort_direction)]

    @sort_legend.setter
    def sort_legend(self, value):
        deprecated((0, 12, 0), 'Chart.sort_legend', 'Chart.legend_sort_field')
        self.legend_sort_field, direction = value[0]
        if direction:
            self.legend_sort_direction = "ascending"
        else:
            self.legend_sort_direction = "descending"

class XYBuilder(Builder):
    """Implements common functionality for XY Builders."""

    x = Dimension('x')
    y = Dimension('y')

    dimensions = ['x', 'y']
    req_dimensions = [['x'],
                      ['y'],
                      ['x', 'y']]

    default_attributes = {'color': ColorAttr()}

    def set_ranges(self):
        """Calculate and set the x and y ranges."""
        # ToDo: handle when only single dimension is provided
        extents = self.get_dim_extents()

        endx = extents['x_max']
        startx = extents['x_min']
        self.x_range = self._get_range('x', startx, endx)

        endy = extents['y_max']
        starty = extents['y_min']
        self.y_range = self._get_range('y', starty, endy)

        if self.xlabel is None:
            if self.x.selection is not None:
                select = self.x.selection
                if not isinstance(select, list):
                    select = [select]
            else:
                select = ['']
            self.xlabel = ', '.join(select)

        if self.ylabel is None:
            if self.y.selection is not None:
                select = self.y.selection
                if not isinstance(select, list):
                    select = [select]
            else:
                select = ['']
            self.ylabel = ', '.join(select)

    def _get_range(self, dim, start, end):
        """Create a :class:`Range` for the :class:`Chart`.

        Args:
            dim (str): the name of the dimension, which is an attribute of the builder
            start: the starting value of the range
            end: the ending value of the range

        Returns:
            :class:`Range`
        """
        dim_ref = getattr(self, dim)
        values = dim_ref.data
        dtype = dim_ref.dtype

        sort = self.sort_dim.get(dim)

        # object data or single value
        if dtype.name == 'object':
            factors = values.drop_duplicates()
            if sort:
                # TODO (fpliger):   this handles pandas API change so users do not experience
                #                   the related annoying deprecation warning. This is probably worth
                #                   removing when pandas deprecated version (0.16) is "old" enough
                try:
                    factors.sort_values(inplace=True)
                except AttributeError:
                    factors.sort(inplace=True)

            setattr(self, dim + 'scale', 'categorical')
            return FactorRange(factors=factors.tolist())
        elif np.issubdtype(dtype, np.datetime64):
            setattr(self, dim + 'scale', 'datetime')
            return Range1d(start=start, end=end)
        else:

            if end == 'None' or (end - start) == 0:
                setattr(self, dim + 'scale', 'categorical')
                return FactorRange(factors=['None'])
            else:
                diff = end - start
                setattr(self, dim + 'scale', 'linear')
                return Range1d(start=start - 0.1 * diff, end=end + 0.1 * diff)


class AggregateBuilder(Builder):
    """A base class for deriving specific builders performing aggregation with stats.

    The typical AggregateBuilder takes a single dimension of values.
    """

    values = Dimension('values')

    default_attributes = {'label': CatAttr(),
                          'color': ColorAttr()}
