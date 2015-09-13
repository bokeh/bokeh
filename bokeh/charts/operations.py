from __future__ import absolute_import

from copy import copy

from bokeh.charts._models import CollisionModifier, DataOperator


class Stack(CollisionModifier):
    """Cumulates elements in the order of grouped values.

    Useful for area or bar glyphs.
    """
    name = 'stack'
    method_name = '__stack__'


class Dodge(CollisionModifier):
    """Non-cumulative, moves glyphs around so they don't overlap.

    Useful for bar, box, or dot glyphs.
    """
    name = 'dodge'
    method_name = '__dodge__'


class Blend(DataOperator):

    def __init__(self, *cols, **properties):
        properties['columns'] = list(cols)
        super(Blend, self).__init__(**properties)

    def transform(self, data):
        data_copy = copy(data)
        data_copy.stack_measures(measures=self.columns)
        return data_copy


def stack(renderers=None, columns=None):
    if renderers is not None:
        stacker = Stack(renderers=renderers)
        stacker.apply()
        return renderers
    elif columns is not None:
        return Stack(columns=columns)
    else:
        raise ValueError('You must stack on renderers or columns')


def blend(*cols, **kwargs):
    """Provides a simple function for specifying a Blend data operation."""

    return Blend(*cols, **kwargs)