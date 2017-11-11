''' Models for mapping values from one range or space to another.

'''
from __future__ import absolute_import

import warnings

from .. import palettes
from ..core.has_props import abstract
from ..core.properties import Color, Either, Enum, Float, Int, Seq, String, Tuple
from ..core.enums import Palette
from .transforms import Transform

@abstract
class ColorMapper(Transform):
    ''' Base class for color mapper types.

    '''

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of any of the
    palettes shown in :ref:`bokeh.palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    nan_color = Color(default="gray", help="""
    Color to be used if data is NaN. Default: 'gray'
    """)

    def __init__(self, palette=None, **kwargs):
        if palette is not None:
            kwargs['palette'] = palette
        super(ColorMapper, self).__init__(**kwargs)


class CategoricalColorMapper(ColorMapper):
    ''' Map categories to colors. Values that are passed to
    this mapper that aren't in factors will be assigned the nan_color.

    '''

    factors = Either(Seq(String), Seq(Tuple(String, String)), Seq(Tuple(String, String, String)), default=None, help="""
    A sequence of factors / categories that map to the color palette. For
    example the following color mapper:

    .. code-block:: python

        mapper = CategoricalColorMapper(palette=["red", "blue"], factors=["foo", "bar"])

    will map the factor ``"foo"`` to red and the factor ``"bar"`` to blue.
    """)

    start = Int(default=0, help="""
    A start index to "slice" data factors with before color mapping.

    For example, if the data to color map consists of 2-level factors such
    as ``["2016", "sales"]`` and ``["2016", "marketing"]``, then setting
    ``start=1`` will perform color mapping only based on the second sub-factor
    (i.e. in this case based on the department ``"sales"`` or ``"marketing"``)
    """)

    end = Int(help="""
    A start index to "slice" data factors with before color mapping.

    For example, if the data to color map consists of 2-level factors such
    as ``["2016", "sales"]`` and ``["2017", "marketing"]``, then setting
    ``end=1`` will perform color mapping only based on the first sub-factor
    (i.e. in this case based on the year ``"2016"`` or ``"2017"``)

    If ``None`` then all sub-factors from ``start`` to the end of the
    factor will be used for color mapping.
    """)

    def __init__(self, **kwargs):
        super(ColorMapper, self).__init__(**kwargs)
        palette = self.palette
        factors = self.factors
        if palette is not None and factors is not None:
            if len(palette) < len(factors):
                extra_factors = factors[len(palette):]
                warnings.warn("Palette length does not match number of factors. %s will be assigned to `nan_color` %s" % (extra_factors, self.nan_color))


@abstract
class ContinuousColorMapper(ColorMapper):
    ''' Base class for continuous color mapper types.

    '''

    low = Float(help="""
    The minimum value of the range to map into the palette. Values below
    this are clamped to ``low``.
    """)

    high = Float(help="""
    The maximum value of the range to map into the palette. Values above
    this are clamped to ``high``.
    """)

    low_color = Color(default=None, help="""
    Color to be used if data is lower than ``low`` value. If None,
    values lower than ``low`` are mapped to the first color in the palette.
    """)

    high_color = Color(default=None, help="""
    Color to be used if data is higher than ``high`` value. If None,
    values higher than ``high`` are mapped to the last color in the palette.
    """)

class LinearColorMapper(ContinuousColorMapper):
    ''' Map numbers in a range [*low*, *high*] linearly into a sequence of
    colors (a palette).

    For example, if the range is [0, 99] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as follows::

             x < 0  : 'red'     # values < low are clamped
        0 >= x < 33 : 'red'
       33 >= x < 66 : 'green'
       66 >= x < 99 : 'blue'
       99 >= x      : 'blue'    # values > high are clamped

    '''

class LogColorMapper(ContinuousColorMapper):
    ''' Map numbers in a range [*low*, *high*] into a sequence of colors
    (a palette) on a natural logarithm scale.

    For example, if the range is [0, 25] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as follows::

                x < 0     : 'red'     # values < low are clamped
       0     >= x < 2.72  : 'red'     # math.e ** 1
       2.72  >= x < 7.39  : 'green'   # math.e ** 2
       7.39  >= x < 20.09 : 'blue'    # math.e ** 3
       20.09 >= x         : 'blue'    # values > high are clamped

    .. warning::
        The LogColorMapper only works for images with scalar values that are
        non-negative.

    '''
