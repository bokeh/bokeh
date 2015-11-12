"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Builder class, a minimal prototype class to build more chart
types on top of it.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from .attributes import AttrSpec, ColorAttr, CatAttr
from .chart import Chart
from .data_source import ChartDataSource
from .models import CompositeGlyph
from .properties import Dimension, ColumnLabel
from .utils import collect_attribute_columns
from .data_source import OrderedAssigner
from ..models.ranges import Range, Range1d, FactorRange
from ..models.sources import ColumnDataSource
from ..properties import (HasProps, Instance, List, String, Property,
                          Either, Dict)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def create_and_build(builder_class, *data, **kws):
    """A factory function for handling Chart and Builder generation.

    Returns:
        :class:`Chart`
    """
    if isinstance(builder_class.dimensions, Property):
        raise NotImplementedError('Each builder must specify its dimensions.')

    if isinstance(builder_class.default_attributes, Property):
        raise NotImplementedError('Each builder must specify its dimensions.')

    builder_props = set(builder_class.properties())

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
    chart_kws = { k:v for k,v in kws.items() if k not in builder_props}
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

    # Dimension Configuration
    dimensions = List(String, help="""The dimension
        labels that drive the position of the glyphs. Subclasses should implement this
        so that the Builder base class knows which dimensions it needs to operate on.
        An example for a builder working with cartesian x and y coordinates would be
        dimensions = ['x', 'y']. You should then instantiate the x and y dimensions as
        attributes of the subclass of builder using the
        :class:`Dimension <bokeh.charts.properties.Dimension>` class. One for x,
        as x = Dimension(...), and one as y = Dimension(...).
        """)

    req_dimensions = Either(List(String), List(List(String)), List(Dict(String, String)),
                            help="""
        The dimension labels that must exist to produce the glyphs. This specifies what
        are the valid configurations for the chart, with the option of specifying the
        type of the columns. The :class:`~bokeh.charts.data_source.ChartDataSource` will
        inspect this property of your subclass of Builder and use this to fill in any
        required dimensions if no keyword arguments are used.
        """)

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

    default_attributes = Dict(String, Instance(AttrSpec), help="""
        The default attribute specs used to group data. This is where the subclass of
        Builder should specify what the default attributes are that will yield
        attribute values to each group of data, and any specific configuration. For
        example, the :class:`ColorAttr` utilizes a default palette for assigning color
        based on groups of data. If the user doesn't assign a column of the data to the
        associated attribute spec, then the default attrspec is used, which will yield
        a constant color value for each group of data. This is by default the first
        color in the default palette, but can be customized by setting the default color
        in the ColorAttr.
        """)

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
    label_attributes = List(String, help="""List of attributes to use for legends.""")

    """
    Used to assign columns to dimensions when no selections have been provided. The
    default behavior is provided by the :class:`OrderedAssigner`, which assigns
    a single column to each dimension available in the `Builder`'s `dims` property.
    """
    column_selector = OrderedAssigner

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
        attributes = dict()
        for attr_name in attr_names:

            attr = kws.pop(attr_name, None)

            # if given an attribute use it
            if isinstance(attr, AttrSpec):
                attributes[attr_name] = attr

            # if we are given columns, use those
            elif isinstance(attr, str) or isinstance(attr, list):
                attributes[attr_name] = self.default_attributes[attr_name]._clone()
                attributes[attr_name].setup(data=source, columns=attr)

            else:
                attributes[attr_name] = self.default_attributes[attr_name]._clone()

        # make sure all have access to data source
        for attr_name in attr_names:
            attributes[attr_name].data = source

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

        return str(raw_label)

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

        # always contribute legends, let Chart sort it out
        chart.add_legend(self._legends)

        chart.add_labels('x', self.xlabel)
        chart.add_labels('y', self.ylabel)

        chart.add_scales('x', self.xscale)
        chart.add_scales('y', self.yscale)

        return chart


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
        dtype = dim_ref.dtype.name

        # object data or single value
        if dtype == 'object':
            factors = values.drop_duplicates()
            factors.sort(inplace=True)
            setattr(self, dim + 'scale', 'categorical')
            return FactorRange(factors=factors.tolist())
        elif 'datetime' in dtype:
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
