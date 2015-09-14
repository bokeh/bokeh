from __future__ import absolute_import

from copy import copy

from bokeh.properties import String

from ._models import CollisionModifier
from ._data_source import DataOperator


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
    """Creates combined variables, increasing the number of distinct items.

    The primary action that blend is taking is combining and collapsing
    multiple columns together, using set algebra. You can think of this
    like taking two columns with similar or different data and stacking
    them on top of each other. The new categories are the union of the two sets. The
    operation is like an OR because a category in either variable is included
    in the blended variable

    Note: The variables not being blended must be duplicated (consider a
    sample time). For example, two variables, 'sensor_a' and
    'sensor_b' only contain two values, either 'on' or 'off', with one
    more column of 'datetime'. Blending 'sensor_a' and 'sensor_b' results
    in two columns, 'datetime' and 'sensors_state'.

    Example cases are shown below:
        - cat1 + cat2 = [cat1, cat2]
        - cat1 + num1 = [cat1, cat(num1)]
        - num1 + num2 = [num1, num2]

    Can be used to stack column oriented measures, so they can be colored. In
    this case, a new categorical column will be created that identifies each
    measure by name of the previous column.

    Can be used to combine categorical columns.

    ToDo: address booleans. Consider two columns, 'was_successful', 'was_effective'.
        It seems like blending of booleans would be performing an *or*.

    See Grammar of Graphics pgs. 67, 320
    """

    name = String(default='value', help="""The name of the column to
                          contain the values of the blended columns.""")
    labels_name = String(default='variable', help="""The name of the column
                            to contain the names of the columns that were blended.""")

    def __init__(self, *cols, **properties):
        properties['columns'] = list(cols)
        super(Blend, self).__init__(**properties)

    def apply(self, data):
        data_copy = copy(data)

        labels_name = self.labels_name + '_' + '_'.join(self.columns)
        data_copy.stack_measures(measures=self.columns, value_name=self.name,
                                 var_name=labels_name)
        return data_copy._data


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
