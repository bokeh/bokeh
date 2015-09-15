from __future__ import absolute_import

from bokeh.properties import (HasProps, String, Either, Float, Color, Instance, List,
                              Any)
from ._properties import ColumnLabel, Column
from bokeh.models.sources import ColumnDataSource
from bokeh.models.renderers import GlyphRenderer


class CompositeGlyph(HasProps):
    """Represents a subset of data.

    A collection of hetero or homogeneous glyph
    renderers which represent a subset of data. The
    purpose of the composite glyph is to abstract
    away the details of constructing glyphs, based on
    the details of a subset of data, from the grouping
    operations that a generalized builder must implement.

    In general, the Builder operates at the full column
    oriented data source level, segmenting and assigning
    attributes from a large selection, while the composite glyphs
    will typically be passed an array-like structures with
    one or more singlular attributes to apply.

    Another way to explain the concept is that the Builder
    operates as the groupby, as in pandas, while the
    CompositeGlyph operates as the apply.

    What is the responsibility of the Composite Glyph?
        - Produce GlyphRenderers
        - Apply any aggregations
        - Tag the GlyphRenderers with the group label
        - Apply transforms due to chart operations
            - Operations require implementation of special methods
    """

    label = String('All', help='Identifies the subset of data.')
    values = Either(Column(Float), Column(String), help='Array-like values.')
    color = Color(default='gray')
    fill_alpha = Float(default=0.8)

    source = Instance(ColumnDataSource)
    operations = List(Any)
    renderers = List(Instance(GlyphRenderer))

    left_buffer = Float(default=0.0)
    right_buffer = Float(default=0.0)
    top_buffer = Float(default=0.0)
    bottom_buffer = Float(default=0.0)

    def __init__(self, **kwargs):
        label = kwargs.pop('label', None)

        if label is not None:
            if not isinstance(label, str):
                label = str(label)
            kwargs['label'] = label

        super(CompositeGlyph, self).__init__(**kwargs)
        self.setup()

    def setup(self):
        self.renderers = [renderer for renderer in self.build_renderers()]
        if self.renderers is not None:
            self.refresh()

    def refresh(self):
        if self.renderers is not None:
            self.source = self.build_source()
            self._set_sources()

    def build_renderers(self):
        raise NotImplementedError('You must return list of renderers.')

    def build_source(self):
        raise NotImplementedError('You must return ColumnDataSource.')

    def _set_sources(self):
        """Store reference to source in each glyph renderer."""
        for renderer in self.renderers:
            renderer.data_source = self.source

    def __stack__(self, glyphs):
        pass

    def __jitter__(self, glyphs):
        pass

    def __dodge__(self, glyphs):
        pass

    def __overlay__(self, glyphs):
        pass

    def apply_operations(self):
        pass


class CollisionModifier(HasProps):
    renderers = List(Instance(CompositeGlyph))
    name = String()
    method_name = String()
    columns = Either(ColumnLabel, List(ColumnLabel))

    def add_renderer(self, renderer):
        self.renderers.append(renderer)

    def apply(self, renderers=None):
        if len(self.renderers) == 0:
            self.renderers = renderers

        if len(self.renderers) > 0:
            # the first renderer's operation method is applied to the rest
            getattr(self.renderers[0], self.method_name)(self.renderers)
        else:
            raise AttributeError('%s must be applied to available renderers, none found.' %
                                 self.__class__.__name__)
