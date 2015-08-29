from __future__ import absolute_import

from bokeh.charts import Operation


class Stack(Operation):
    name = 'stack'
    method_name = '__stack__'


def stack(renderers=None, columns=None):
    if renderers is not None:
        stacker = Stack(renderers=renderers)
        stacker.apply()
        return renderers
    elif columns is not None:
        return Stack(columns=columns)
    else:
        raise ValueError('You must stack on renderers or columns')