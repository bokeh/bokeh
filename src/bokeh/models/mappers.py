#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from .. import palettes
from ..core.enums import Palette
from ..core.has_props import abstract
from ..core.properties import (
    Bool,
    Color,
    Either,
    Enum,
    FactorSeq,
    Float,
    HatchPatternType,
    Instance,
    Int,
    List,
    MarkerType,
    Nullable,
    Seq,
    String,
    Tuple,
)
from ..core.validation import error, warning
from ..core.validation.errors import WEIGHTED_STACK_COLOR_MAPPER_LABEL_LENGTH_MISMATCH
from ..core.validation.warnings import PALETTE_LENGTH_FACTORS_MISMATCH
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
    'EqHistColorMapper',
    'StackColorMapper',
    'WeightedStackColorMapper',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Mapper(Transform):
    ''' Base class for mappers.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


@abstract
class ColorMapper(Mapper):
    ''' Base class for color mapper types.

    '''

    def __init__(self, *args, **kwargs) -> None:
        if len(args) == 1:
            kwargs['palette'] = args[0]
        super().__init__(**kwargs)

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of any of the
    palettes shown in :ref:`bokeh.palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    nan_color = Color(default="gray", help="""
    Color to be used if data is NaN or otherwise not mappable.
    """)


@abstract
class CategoricalMapper(Mapper):
    ''' Base class for mappers that map categorical factors to other values.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    factors = FactorSeq(help="""
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

    end = Nullable(Int, help="""
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

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    @warning(PALETTE_LENGTH_FACTORS_MISMATCH)
    def _check_palette_length(self):
        palette = self.palette
        factors = self.factors
        if len(palette) < len(factors):
            extra_factors = factors[len(palette):]
            return f"{extra_factors} will be assigned to `nan_color` {self.nan_color}"

class CategoricalMarkerMapper(CategoricalMapper):
    ''' Map categorical factors to marker types.

    Values that are passed to this mapper that are not in the factors list
    will be mapped to ``default_value``.

    .. note::
        This mappers is primarily only useful with the ``Scatter`` marker
        glyph that be parameterized by marker type.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

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

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

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

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    domain = List(Tuple(Instance("bokeh.models.renderers.GlyphRenderer"), Either(String, List(String))), default=[], help="""
    A collection of glyph renderers to pool data from for establishing data metrics.
    If empty, mapped data will be used instead.
    """)

    low = Nullable(Float, help="""
    The minimum value of the range to map into the palette. Values below
    this are clamped to ``low``. If ``None``, the value is inferred from data.
    """)

    high = Nullable(Float, help="""
    The maximum value of the range to map into the palette. Values above
    this are clamped to ``high``. If ``None``, the value is inferred from data.
    """)

    low_color = Nullable(Color, help="""
    Color to be used if data is lower than ``low`` value. If None,
    values lower than ``low`` are mapped to the first color in the palette.
    """)

    high_color = Nullable(Color, help="""
    Color to be used if data is higher than ``high`` value. If None,
    values higher than ``high`` are mapped to the last color in the palette.
    """)

class LinearColorMapper(ContinuousColorMapper):
    ''' Map numbers in a range [*low*, *high*] linearly into a sequence of
    colors (a palette).

    For example, if the range is [0, 99] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as follows::

             x < 0  : 'red'     # values < low are clamped
        0 <= x < 33 : 'red'
       33 <= x < 66 : 'green'
       66 <= x < 99 : 'blue'
       99 <= x      : 'blue'    # values > high are clamped

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

class LogColorMapper(ContinuousColorMapper):
    ''' Map numbers in a range [*low*, *high*] into a sequence of colors
    (a palette) on a natural logarithm scale.

    For example, if the range is [0, 25] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as follows::

                x < 0     : 'red'     # values < low are clamped
       0     <= x < 2.72  : 'red'     # math.e ** 1
       2.72  <= x < 7.39  : 'green'   # math.e ** 2
       7.39  <= x < 20.09 : 'blue'    # math.e ** 3
       20.09 <= x         : 'blue'    # values > high are clamped

    .. warning::
        The ``LogColorMapper`` only works for images with scalar values that are
        non-negative.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class ScanningColorMapper(ContinuousColorMapper):

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class EqHistColorMapper(ScanningColorMapper):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    bins = Int(default=256*256, help="Number of histogram bins")

    rescale_discrete_levels = Bool(default=False, help="""
    If there are only a few discrete levels in the values that are color
    mapped then ``rescale_discrete_levels=True`` decreases the lower limit of
    the span so that the values are rendered towards the top end of the
    palette.
    """)

@abstract
class StackColorMapper(ColorMapper):
    ''' Abstract base class for color mappers that operate on ``ImageStack``
    glyphs.

    These map 3D data arrays of shape ``(ny, nx, nstack)`` to 2D RGBA images
    of shape ``(ny, nx)``.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

class WeightedStackColorMapper(StackColorMapper):
    ''' Maps 3D data arrays of shape ``(ny, nx, nstack)`` to 2D RGBA images
    of shape ``(ny, nx)`` using a palette of length ``nstack``.

    The mapping occurs in two stages. Firstly the RGB values are calculated
    using a weighted sum of the palette colors in the ``nstack`` direction.
    Then the alpha values are calculated using the ``alpha_mapper`` applied to
    the sum of the array in the ``nstack`` direction.

    The RGB values calculated by the ``alpha_mapper`` are ignored by the color
    mapping but are used in any ``ColorBar`` that is displayed.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    alpha_mapper = Instance(ContinuousColorMapper, help="""
    Color mapper used to calculate the alpha values of the mapped data.
    """)

    color_baseline = Nullable(Float, help="""
    Baseline value used for the weights when calculating the weighted sum of
    palette colors. If ``None`` then the minimum of the supplied data is used
    meaning that values at this minimum have a weight of zero and do not
    contribute to the weighted sum. As a special case, if all data for a
    particular output pixel are at the color baseline then the color is an
    evenly weighted average of the colors corresponding to all such values,
    to avoid the color being undefined.
    """)

    stack_labels = Nullable(Seq(String), help="""
    An optional sequence of strings to use as labels for the ``nstack`` stacks.
    If set, the number of labels should match the number of stacks and hence
    also the number of palette colors.

    The labels are used in hover tooltips for ``ImageStack`` glyphs that use a
    ``WeightedStackColorMapper`` as their color mapper.
    """)

    @error(WEIGHTED_STACK_COLOR_MAPPER_LABEL_LENGTH_MISMATCH)
    def _check_label_length(self):
        if self.stack_labels is not None:
            nlabel = len(self.stack_labels)
            npalette = len(self.palette)
            if nlabel > npalette:
                self.stack_labels = self.stack_labels[:npalette]
                return f"{nlabel} != {npalette}, removing unwanted stack_labels"
            elif nlabel < npalette:
                self.stack_labels = list(self.stack_labels) + [""]*(npalette - nlabel)
                return f"{nlabel} != {npalette}, padding with empty strings"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
