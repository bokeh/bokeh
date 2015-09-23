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

from ..models.sources import ColumnDataSource
from ..models.ranges import Range, Range1d, FactorRange
from ..properties import (Color, HasProps, Instance, Seq, List, String, Property,
                          Either, Dict)

from bokeh.charts import DEFAULT_PALETTE
from .utils import collect_attribute_columns
from ._chart import Chart
from ._data_source import ChartDataSource
from ._properties import Dimension, ColumnLabel
from ._attributes import AttrSpec, ColorAttr, GroupAttr
from ._models import CompositeGlyph

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def create_and_build(builder_class, *data, **kws):

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
    inherited builders just need to provide:

     - the following methods:
        * _yield_renderers: yields the glyphs to be rendered into the plot (and
            eventually create the self._legends attribute to be used to
            create the proper legends when builder is called to build
            the glyphs on a Chart object
        * _process_data(optional): Get the input data and calculates the 'data'
            attribute to be used to calculate the source data
        * _set_sources(optional): Push data into the self.source attribute
            (of type ColumnDataSource) and build the proper ranges
            (self.x_range and self.y_range).

    - the following attributes:
        x_range:
        y_range:
        _legends:


    so Builder can use it all to _yield_renderers on a chart when called with the
    create method.

    """

    x_range = Instance(Range)
    y_range = Instance(Range)

    xlabel = String()
    ylabel = String()

    xscale = String()
    yscale = String()

    # Dimensional Modeling
    dimensions = List(String, help="""The dimension
        labels that drive the position of the glyphs.""")
    req_dimensions = Either(List(String), List(List(String)), List(Dict(String, String)), help="""The dimension
        labels that must exist to produce the glyphs. This specifies what are the valid configurations
        for the chart, with the option of specifying the type of the columns.""")

    attributes = Dict(String, Instance(AttrSpec), help="""The attribute specs used to group data.""")
    default_attributes = Dict(String, Instance(AttrSpec), help="""The attribute specs used to group data.""")

    attribute_columns = List(ColumnLabel)

    palette = Seq(Color, default=DEFAULT_PALETTE)

    comp_glyphs = List(Instance(CompositeGlyph))
    labels = List(String, help="""Represents the unique labels to be used for legends.""")
    label_attributes = List(String, help="""List of attributes to use for legends.""")

    def __init__(self, *args, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            data (iterable): iterable 2d representing the data series
                values matrix.
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
            palette(list, optional): a list containing the colormap as hex values.


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
            attr (list(AttrSpec)): to be filled with the new attributes created after
                loading the data dict.
        """

        if len(args) == 0:
            data = None
        else:

            # pop the dimension inputs from kwargs
            data_args = {}
            for dim in self.dimensions:
                if dim in kws.keys():
                    data_args[dim] = kws.pop(dim)

            # build chart data source from inputs, given the dimension configuration
            data_args['dims'] = tuple(self.dimensions)
            data_args['required_dims'] = tuple(self.req_dimensions)
            data = ChartDataSource.from_data(*args, **data_args)

            # make sure that the builder dimensions have access to the chart data source
            for dim in self.dimensions:
                getattr(getattr(self, dim), 'set_data')(data)

            # handle input attrs and ensure attrs have access to data
            self._setup_attrs(data, kws)

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
        """

        source = ColumnDataSource(data.df)
        attr_names = self.default_attributes.keys()
        for attr_name in attr_names:

            attr = kws.pop(attr_name, None)

            # if given an attribute use it
            if isinstance(attr, AttrSpec):
                self.attributes[attr_name] = attr

            # if we are given columns, use those
            elif isinstance(attr, str) or isinstance(attr, list):
                self.attributes[attr_name] = self.default_attributes[attr_name].clone()
                self.attributes[attr_name].setup(data=source, columns=attr)

            else:
                self.attributes[attr_name] = self.default_attributes[attr_name].clone()

        # make sure all have access to data source
        for attr_name in attr_names:
            self.attributes[attr_name].data = source

    def _setup(self):
        """Perform any initial pre-processing, attribute config."""
        pass

    def _process_data(self):
        """Make any global data manipulations before grouping.

        It has to be implemented by any of the inherited class
        representing each different chart type. It is the place
        where we make specific calculations for each chart.
        """
        pass

    def _set_ranges(self):
        """Calculate and set the x and y ranges.

        It has to be implemented by any of the subclasses of builder
        representing each different chart type.
        """
        raise NotImplementedError('Subclasses of %s must implement _set_ranges.' % self.__class__.__name__)

    def _yield_renderers(self):
        """ Generator that yields the glyphs to be draw on the plot

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        raise NotImplementedError('Subclasses of %s must implement _yield_renderers.' % self.__class__.__name__)

    def _get_dim_extents(self):
        return {'x_max': max([renderer.x_max for renderer in self.comp_glyphs]),
                'y_max': max([renderer.y_max for renderer in self.comp_glyphs]),
                'x_min': min([renderer.x_min for renderer in self.comp_glyphs]),
                'y_min': min([renderer.y_min for renderer in self.comp_glyphs])
                }

    def add_glyph(self, group, glyph):
        """Add a composite glyph"""
        if isinstance(glyph, list):
            for sub_glyph in glyph:
                self.comp_glyphs.append(sub_glyph)
        else:
            self.comp_glyphs.append(glyph)

        label = None
        if len(self.label_attributes) > 0:
            for attr in self.label_attributes:
                # this will get the last attribute group label for now
                if self.attributes[attr].columns is not None:
                    label = self.get_group_label(group, attr=attr)

        if label is None:
            label = self.get_group_label(group, attr='label')

        # add to legend if new and unique label
        if str(label) not in self.labels and label is not None:
            self._legends.append((label, glyph.renderers))
            self.labels.append(label)

    def get_group_label(self, group, attr='label'):
        if attr is 'label':
            label = group.label
        else:
            label = group[attr]

        return self.get_label(label)

    @staticmethod
    def get_label(raw_label):

        # don't convert None type to string so we can test for it later
        if raw_label is None:
            return None

        if (isinstance(raw_label, tuple) or isinstance(raw_label, list)) and \
                        len(raw_label) == 1:
            raw_label = raw_label[0]

        return str(raw_label)

    def create(self, chart=None):
        self._setup()
        self._process_data()

        renderers = self._yield_renderers()
        if chart is None:
            chart = Chart()
        chart.add_renderers(self, renderers)

        # handle ranges after renders, since ranges depend on aggregations
        # ToDo: should reconsider where this occurs
        self._set_ranges()
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

    def _set_ranges(self):
        """Calculate and set the x and y ranges."""
        # ToDo: handle when only single dimension is provided

        extents = self._get_dim_extents()

        endx = extents['x_max']
        startx = extents['x_min']
        self.x_range = self._get_range('x', startx, endx)

        endy = extents['y_max']
        starty = extents['y_min']
        self.y_range = self._get_range('y', starty, endy)

        if self.xlabel is None:
            select = self.x.selection
            if not isinstance(select, list):
                select = [select]
            self.xlabel = ', '.join(select)

        if self.ylabel is None:
            select = self.y.selection
            if not isinstance(select, list):
                select = [select]
            self.ylabel = ', '.join(select)

    def _get_range(self, dim, start, end):

        dim_ref = getattr(self, dim)
        values = dim_ref.data
        dtype = dim_ref.dtype.name
        if dtype == 'object':
            factors = values.drop_duplicates()
            factors.sort(inplace=True)
            setattr(self, dim + 'scale', 'categorical')
            return FactorRange(factors=factors.tolist())
        elif 'datetime' in dtype:
            setattr(self, dim + 'scale', 'datetime')
            return Range1d(start=start, end=end)
        else:

            diff = end - start
            if diff == 0:
                setattr(self, dim + 'scale', 'categorical')
                return FactorRange(factors=['None'])
            else:
                setattr(self, dim + 'scale', 'linear')
                return Range1d(start=start - 0.1 * diff, end=end + 0.1 * diff)


class AggregateBuilder(Builder):

    values = Dimension('values')

    default_attributes = {'label': GroupAttr(),
                          'color': ColorAttr()}
