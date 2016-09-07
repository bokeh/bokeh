""" Models for mapping values from one range or space to another.

"""
from __future__ import absolute_import

from ..model import Model
from ..core.properties import abstract
from ..core.properties import Color, Enum, Seq, Either, List, String, Int, Float, Date, Datetime
from ..core.enums import Palette
from .. import palettes


@abstract
class ColorMapper(Model):
    """ Base class for color mapper types. ``ColorMapper`` is not
    generally useful to instantiate on its own.

    """

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of
    any of the palettes shown in :ref:`bokeh.palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    nan_color = Color(default="gray", help="""
    Color to be used if data is NaN. Default: 'gray'
    """)

    def __init__(self, palette=None, **kwargs):
        if palette is not None:
            kwargs['palette'] = palette
        super(ColorMapper, self).__init__(**kwargs)


class CategoricalColorMapper(ColorMapper):
    """ Map categories to colors. Values that are passed to
    this mapper that aren't in factors will be assigned the nan_color.

    """

    factors = Either(List(String), List(Int), List(Float), List(Datetime), List(Date), help="""
    A list of string or integer factors (categories) to comprise
    this categorical range.
    """)


@abstract
class ContinuousColorMapper(ColorMapper):
    """ Base class for cotinuous color mapper types. ``ContinuousColorMapper`` is not
    generally useful to instantiate on its own.

    """

    low = Float(help="""
    The minimum value of the range to map into the palette. Values below
    this are clamped to ``low``.
    """)

    high = Float(help="""
    The maximum value of the range to map into the palette. Values above
    this are clamped to ``high``.
    """)


class LinearColorMapper(ContinuousColorMapper):
    """ Map numbers in a range [*low*, *high*] linearly into a
    sequence of colors (a palette).

    For example, if the range is [0, 99] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as
    follows::

             x < 0  : 'red'     # values < low are clamped
        0 >= x < 33 : 'red'
       33 >= x < 66 : 'green'
       66 >= x < 99 : 'blue'
       99 >= x      : 'blue'    # values > high are clamped

    """


class LogColorMapper(ContinuousColorMapper):
    """ Map numbers in a range [*low*, *high*] into a
    sequence of colors (a palette) on a natural logarithm scale.

    For example, if the range is [0, 25] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as
    follows::

                x < 0     : 'red'     # values < low are clamped
       0     >= x < 2.72  : 'red'     # math.e ** 1
       2.72  >= x < 7.39  : 'green'   # math.e ** 2
       7.39  >= x < 20.09 : 'blue'    # math.e ** 3
       20.09 >= x         : 'blue'    # values > high are clamped

    .. warning::
        The LogColorMapper only works for images with scalar values that are
        non-negative.

    """
