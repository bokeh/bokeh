#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for mapping values from one range or space to another in the client.

Mappers (as opposed to scales) are not presumed to be invertible.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import warnings

# Bokeh imports
from .. import palettes
from ..core.enums import Palette
from ..core.has_props import abstract
from ..core.properties import (
    Color,
    Either,
    Enum,
    Float,
    HatchPatternType,
    Int,
    MarkerType,
    Seq,
    String,
    Tuple,
)
from .transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Mapper',
    'ColorMapper',
    'CategoricalMapper',
    'CategoricalColorMapper',
    'CategoricalMarkerMapper',
    'CategoricalPatternMapper',
    'ContinuousColorMapper',
    'LinearColorMapper',
    'LogColorMapper',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Mapper(Transform):
    ''' Base class for mappers.

    '''
    pass

@abstract
class ColorMapper(Mapper):
    ''' Base class for color mapper types.

    '''

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of any of the
    palettes shown in :ref:`bokeh.palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    nan_color = Color(default="gray", help="""
    Color to be used if data is NaN or otherwise not mappable. (Default: 'gray')
    """)

    def __init__(self, palette=None, **kwargs):
        if palette is not None:
            kwargs['palette'] = palette
        super().__init__(**kwargs)

@abstract
class CategoricalMapper(Mapper):
    ''' Base class for mappers that map categorical factors to other values.

    '''

    factors = Either(Seq(String), Seq(Tuple(String, String)), Seq(Tuple(String, String, String)), default=None, help="""
    A sequence of factors / categories that map to the some target range. For
    example the following color mapper:

    .. code-block:: python

        mapper = CategoricalColorMapper(palette=["red", "blue"], factors=["foo", "bar"])

    will map the factor ``"foo"`` to red and the factor ``"bar"`` to blue.
    """)

    start = Int(default=0, help="""
    A start index to "slice" data factors with before mapping.

    For example, if the data to color map consists of 2-level factors such
    as ``["2016", "sales"]`` and ``["2016", "marketing"]``, then setting
    ``start=1`` will perform color mapping only based on the second sub-factor
    (i.e. in this case based on the department ``"sales"`` or ``"marketing"``)
    """)

    end = Int(help="""
    A start index to "slice" data factors with before mapping.

    For example, if the data to color map consists of 2-level factors such
    as ``["2016", "sales"]`` and ``["2017", "marketing"]``, then setting
    ``end=1`` will perform color mapping only based on the first sub-factor
    (i.e. in this case based on the year ``"2016"`` or ``"2017"``)

    If ``None`` then all sub-factors from ``start`` to the end of the
    factor will be used for color mapping.
    """)


class CategoricalColorMapper(CategoricalMapper, ColorMapper):
    ''' Map categorical factors to colors.

    Values that are passed to this mapper that are not in the factors list
    will be mapped to ``nan_color``.

    '''

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        palette = self.palette
        factors = self.factors
        if palette is not None and factors is not None:
            if len(palette) < len(factors):
                extra_factors = factors[len(palette):]
                warnings.warn("Palette length does not match number of factors. %s will be assigned to `nan_color` %s" % (extra_factors, self.nan_color))

class CategoricalMarkerMapper(CategoricalMapper):
    ''' Map categorical factors to marker types.

    Values that are passed to this mapper that are not in the factors list
    will be mapped to ``default_value``.

    .. note::
        This mappers is primarily only useful with the ``Scatter`` marker
        glyph that be parameterized by marker type.

    '''

    markers = Seq(MarkerType, help="""
    A sequence of marker types to use as the target for mapping.
    """)

    default_value = MarkerType(default="circle", help="""
    A marker type to use in case an unrecognized factor is passed in to be
    mapped.
    """)

class CategoricalPatternMapper(CategoricalMapper):
    ''' Map categorical factors to hatch fill patterns.

    Values that are passed to this mapper that are not in the factors list
    will be mapped to ``default_value``.

    Added in version 1.1.1

    '''

    patterns = Seq(HatchPatternType, help="""
    A sequence of marker types to use as the target for mapping.
    """)

    default_value = HatchPatternType(default=" ", help="""
    A hatch pattern to use in case an unrecognized factor is passed in to be
    mapped.
    """)

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
        The ``LogColorMapper`` only works for images with scalar values that are
        non-negative.

    '''

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
