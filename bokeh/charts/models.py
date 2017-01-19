'''

'''
from __future__ import absolute_import

import pandas as pd
from six import iteritems

from bokeh.core.has_props import HasProps
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.sources import ColumnDataSource
from bokeh.core.properties import Any, Color, Dict, Either, Float, Instance, List, String

from .properties import Column, ColumnLabel

class CompositeGlyph(HasProps):
    """Represents a subset of data.

    A collection of hetero or homogeneous glyph
    renderers which represent a subset of data. The
    purpose of the composite glyph is to abstract
    away the details of constructing glyphs, based on
    the details of a subset of data, from the grouping
    operations that a generalized builders must implement.

    In general, the Builder operates at the full column
    oriented data source level, segmenting and assigning
    attributes from a large selection, while the composite glyphs
    will typically be passed an array-like structures with
    one or more singular attributes to apply.

    Another way to explain the concept is that the Builder
    operates as the groupby, as in pandas, while the
    CompositeGlyph operates as the function used in the apply.

    What is the responsibility of the Composite Glyph?
        - Produce GlyphRenderers
        - Apply any aggregations
        - Tag the GlyphRenderers with the group label
        - Apply transforms due to chart operations
            - Note: Operations require implementation of special methods
    """

    # composite glyph inputs
    label = Either(String, Dict(String, Any), default='None',
                   help='Identifies the subset of data.')

    values = Either(Column(Float), Column(String), help="""
        Array-like values, which are used as the input to the composite glyph.

        Most composite glyphs add their own representation of one or more values-like
        columns/arrays that they receive as inputs. These are compiled together for
        generating `source`, `data`, and `df` by the individual composite glyphs.
        """)

    # derived from inputs
    source = Instance(ColumnDataSource, help="""The data source used for the contained
        glyph renderers. Simple glyphs part of the composite glyph might not use the
        column data source.""")
    renderers = List(Instance(GlyphRenderer))
    glyphs = Dict(String, Any) # where we expect a Glyph class as Value

    operations = List(Any, help="""A list of chart operations that can be applied to
        manipulate their visual depiction.""")

    color = Color(default='gray', help="""A high level color. Some glyphs will
        implement more specific color attributes for parts or specific glyphs.""")
    fill_color = Color(default="gray")
    line_color = Color(default='black', help="""A default outline color for contained
        glyphs.""")
    fill_alpha = Float(default=0.8)
    line_alpha = Float(default=1.0)

    left_buffer = Float(default=0.0)
    right_buffer = Float(default=0.0)
    top_buffer = Float(default=0.0)
    bottom_buffer = Float(default=0.0)

    def __init__(self, **properties):
        vals = properties.get('values')
        if String().is_valid(vals) or Float().is_valid(vals):
            properties['values'] = [vals]
        super(CompositeGlyph, self).__init__(**properties)
        self.setup()

    def setup(self):
        """Build renderers and data source and set sources on renderers."""
        self.renderers = [renderer for renderer in self.build_renderers()]
        if self.renderers is not None:
            self.refresh()

    def refresh(self):
        """Update the GlyphRenderers.

        .. note:
            this method would be called after data is added.
        """
        if self.renderers is not None:
            data = self.build_source()

            if data is not None:

                if isinstance(data, dict):
                    source = ColumnDataSource(data)

                if not isinstance(source, ColumnDataSource) and source is not None:
                    raise TypeError('build_source must return dict or ColumnDataSource.')
                else:
                    self.source = self.add_chart_index(source)

                self._set_sources()

    @property
    def data(self):
        if self.source is not None:
            return self.source.data
        else:
            return {}

    @property
    def df(self):
        if self.data:
            return pd.DataFrame(self.data)
        else:
            return pd.DataFrame()

    def add_chart_index(self, data):
        """Add identifier of the data group as a column for each row.

        Args:
            data (dict or `ColumnDataSource`): can be the type of data used internally
                to ColumnDataSource, or a ColumnDataSource.

        Returns:
            dict or `ColumnDataSource`: returns the same type of data provided
        """

        if isinstance(data, ColumnDataSource):
            source = data
            data = source.data
        else:
            source = None

        # add chart index to data
        if 'chart_index' not in data and len(list(data.keys())) > 0:
            n_rows = len(list(data.values())[0])

            # add composite chart index as column
            data['chart_index'] = [self.label] * n_rows

            # add constant value for each column in chart index
            if isinstance(self.label, dict):
                for col, val in iteritems(self.label):
                    data[col] = [val] * n_rows

        if source is not None:
            source.data = data
            return source
        else:
            return data

    def build_renderers(self):
        yield GlyphRenderer()

    def build_source(self):
        data = {}

        if self.values is not None:
            data = {'values': self.values}

        return data

    def _set_sources(self):
        """Store reference to source in each GlyphRenderer.

        .. note::
            if the glyphs that are part of the composite glyph differ, you may have to
            override this method and handle the sources manually.
        """
        for renderer in self.renderers:
            renderer.data_source = self.source

    def __stack__(self, glyphs):
        """A special method the `stack` function applies to composite glyphs."""
        pass

    def __jitter__(self, glyphs):
        """A special method the `jitter` function applies to composite glyphs."""
        pass

    def __dodge__(self, glyphs):
        """A special method the `dodge` function applies to composite glyphs."""
        pass

    def __overlay__(self, glyphs):
        """A special method the `overlay` function applies to composite glyphs."""
        pass

    def apply_operations(self):
        pass

    @classmethod
    def glyph_properties(cls):
        props = {}
        for name, glyph in iteritems(cls.glyphs):
            props[name] = glyph.class_properties(withbases=True)

        return props


class CollisionModifier(HasProps):
    """Models an special type of operation that alters how glyphs interact.

    Used to handle the manipulation of glyphs for operations, such as stacking. The
    list of `CompositeGlyph`s can either be input into the `CollisionModifier` as
    keyword args, or added individually with the `add_glyph` method.
    """
    comp_glyphs = List(Instance(CompositeGlyph), help="""A list of composite glyphs,
        to apply the modification to.""")
    name = String(help="""The name of the collision modifier.""")
    method_name = String(help="""The name of the method that will be utilized on
        the composite glyphs. This method must exist on all `comp_glyphs`.""")
    columns = Either(ColumnLabel, List(ColumnLabel), help="""Some collision modifiers
        might require column labels to apply the operation in relation to.""")

    def add_glyph(self, comp_glyph):
        self.comp_glyphs.append(comp_glyph)

    def apply(self, renderers=None):
        if len(self.comp_glyphs) == 0:
            self.comp_glyphs = renderers

        if len(self.comp_glyphs) > 0:
            # the first renderer's operation method is applied to the rest
            getattr(self.comp_glyphs[0], self.method_name)(self.comp_glyphs)
        else:
            raise AttributeError('%s must be applied to available renderers, none found.' %
                                 self.__class__.__name__)
