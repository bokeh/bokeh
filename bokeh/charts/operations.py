''' CollisionModifiers and DataOperators used to specify Chart manipulations.

The general approach for these operations is to use a class for modeling the
operation, which is lazy evaluated, and doesn't require the data on initialization.

An associated, user-facing function is provided for a more friendly interface.
'''
from __future__ import absolute_import

from copy import copy

from bokeh.core.properties import Instance, List, Override, String

from .data_source import DataOperator
from .models import CollisionModifier
from .properties import ColumnLabel
from .stats import Count, Stat, stats

class Stack(CollisionModifier):
    """Cumulates elements in the order of grouped values.

    Useful for area or bar glyphs.
    """
    name = Override(default='stack')
    method_name = Override(default='__stack__')


class Dodge(CollisionModifier):
    """Non-cumulative, moves glyphs around so they don't overlap.

    Useful for bar, box, or dot glyphs.
    """
    name = Override(default='dodge')
    method_name = Override(default='__dodge__')


class Blend(DataOperator):
    """Creates combined variables, increasing the number of distinct items.

    The primary action that blend is taking is combining and collapsing
    multiple columns together, using set algebra. You can think of this
    like taking two columns with similar or different data and stacking
    them on top of each other. The new categories are the union of the two sets. The
    operation is like an OR because a category in either variable is included
    in the blended variable

    .. note::
        The variables not being blended must be duplicated (consider a sample time).
        For example, two variables, 'sensor_a' and 'sensor_b' only contain two values,
        either 'on' or 'off', with one more column of 'datetime'. Blending 'sensor_a'
        and 'sensor_b' results in two columns, 'datetime' and 'sensors_state'.

    Example:

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

        data_copy.stack_measures(measures=self.columns, value_name=self.name,
                                 var_name=self.labels_name)
        return data_copy._data


class Aggregate(DataOperator):

    dimensions = List(ColumnLabel)
    stat = Instance(Stat, default=Count())
    agg_column = String()

    def __init__(self, **properties):
        stat = properties.pop('stat')
        if stat is not None and isinstance(stat, str):
            properties['stat'] = stats[stat]()
        col = properties.pop('columns')
        if col is not None:
            properties['columns'] = [col]
        super(Aggregate, self).__init__(**properties)

    def apply(self, data):
        data_copy = copy(data)
        if self.columns is None:
            self.stat = stats['count']()

        stat = self.stat

        agg_name = ''
        if self.columns is not None:
            agg_name += self.columns[0] + '_'
        agg_name += self.stat.__class__.__name__
        self.agg_column = agg_name

        if self.columns is None:
            col = data_copy.columns[0]
        else:
            col = self.columns[0]

        # Add agg value to each row of group
        def stat_func(group):
            stat.set_data(group[col])
            group[agg_name] = stat.value
            return group

        # create groupby
        gb = data_copy.groupby(self.dimensions)

        # apply stat function to groups
        agg = gb.apply(stat_func)

        return agg


def stack(*comp_glyphs, **kwargs):
    """Stacks the :class:`CompositeGlyph`s.

    Stacks the glyphs which results in the glyphs having transformed data,
    which represents the stacked glyphs.

    Args:
        *comp_glyphs (:class:`CompositeGlyph`): a sequence of glyphs to stack

    Returns:
        comp_glyphs: a list of composite glyphs

    """

    columns = kwargs.get('columns')

    if comp_glyphs is not None:
        stacker = Stack(comp_glyphs=list(comp_glyphs))
        stacker.apply()
        return comp_glyphs
    elif columns is not None:
        return Stack(columns=columns)
    else:
        raise ValueError('You must stack on renderers or columns')


def blend(*cols, **kwargs):
    """Provides a simple function for specifying a Blend data operation.

    Args:
        cols (str): each column to use for blending by name
        **kwargs: the keyword args supported by :class:`Blend`

            * name (str): name of the column to contain the blended values
            * labels_name (str): name of the column to contain the name of the columns
              used for blending


    See :class:`Blend`

    """

    return Blend(*cols, **kwargs)
