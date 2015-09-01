from __future__ import absolute_import

from bokeh.charts import Operation


class Stack(Operation):
    """Cumulates elements in the order of grouped values.

    Useful for area or bar glyphs.
    """
    name = 'stack'
    method_name = '__stack__'


class Dodge(Operation):
    """Non-cumulative, moves glyphs around so they don't overlap.

    Useful for bar, box, or dot glyphs.
    """
    name = 'dodge'
    method_name = '__dodge__'


def stack(renderers=None, columns=None):
    if renderers is not None:
        stacker = Stack(renderers=renderers)
        stacker.apply()
        return renderers
    elif columns is not None:
        return Stack(columns=columns)
    else:
        raise ValueError('You must stack on renderers or columns')