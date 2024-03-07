#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Mix-in classes that bulk add groups of properties to Bokeh models.

Some groups of properties often show up in Bokeh models together. For
instance, any model that exposes a fill color property for use when
rendering will almost always want to expose a fill alpha as well. To
reduce boilerplate code and simplify defining models with these sets
of properties, use the mix-in classes in this module:

* |FillProps| --- properties for fill color and alpha

* |HatchProps| --- properties for hatching pattern, color, alpha, etc.

* |ImageProps| --- properties for global alpha on images

* |LineProps| --- properties for line color, dashing, width, etc.

* |TextProps| --- properties for text color, font, etc.

To include these properties in a Bokeh model, use the |Include| property
as shown here:

.. code-block:: python

    class SomeGlyph(Glyph):

        fill_props = Include(FillProps, help="""
        The {prop} values for the annular wedges.
        """)

This adds all the fill properties ``fill_color`` and ``fill_alpha`` to this
model. The help string contains a placeholder `{prop}`. When docs for this class
are rendered by the ``bokeh-model`` directive, the placeholder will be replaced with more information
specific to each property.

.. |Include| replace:: :class:`~bokeh.core.properties.Include`

.. |FillProps| replace:: :class:`~bokeh.core.property_mixins.FillProps`
.. |HatchProps| replace:: :class:`~bokeh.core.property_mixins.HatchProps`
.. |ImageProps| replace:: :class:`~bokeh.core.property_mixins.ImageProps`
.. |LineProps| replace:: :class:`~bokeh.core.property_mixins.LineProps`
.. |TextProps| replace:: :class:`~bokeh.core.property_mixins.TextProps`

.. |miter_join| image:: /_images/miter_join.png
    :height: 15
    :alt: Two line segments joined with a miter (sharp-angle) join style.
.. |round_join| image:: /_images/round_join.png
    :height: 15
    :alt: Two line segments joined with a round join style.
.. |bevel_join| image:: /_images/bevel_join.png
    :height: 15
    :alt: Two line segments joined with a bevel (truncated) join style.

.. |butt_cap| image:: /_images/butt_cap.png
    :height: 12
    :alt: A  line segment with no end cap extending beyond the explicit end coordinate.
.. |round_cap| image:: /_images/round_cap.png
    :height: 12
    :alt: A  line segment with a rounded end cap extending beyond the explicit end coordinate.
.. |square_cap| image:: /_images/square_cap.png
    :height: 12
    :alt: A  line segment with a squared end cap extending beyond the explicit end coordinate.

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

# Bokeh imports
from .enums import (
    FontStyle,
    HatchPattern,
    HatchPatternAbbreviation,
    LineCap,
    LineJoin,
    TextAlign,
    TextBaseline,
)
from .has_props import HasProps
from .properties import (
    Alpha,
    AlphaSpec,
    Color,
    ColorSpec,
    DashPattern,
    DashPatternSpec,
    Dict,
    Enum,
    Float,
    FontSize,
    FontSizeSpec,
    FontStyleSpec,
    HatchPatternSpec,
    Instance,
    Int,
    IntSpec,
    LineCapSpec,
    LineJoinSpec,
    Nullable,
    NumberSpec,
    Size,
    String,
    StringSpec,
    TextAlignSpec,
    TextBaselineSpec,
    value,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'FillProps',
    'HatchProps',
    'ImageProps',
    'LineProps',
    'TextProps',
    'ScalarFillProps',
    'ScalarHatchProps',
    'ScalarImageProps',
    'ScalarLineProps',
    'ScalarTextProps',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_color_help = """
A color to use to %s with.
"""

_alpha_help = """
An alpha value to use to %s with.
"""

_line_width_help = """
Stroke width in units of pixels.
"""

_line_join_help = """
How path segments should be joined together.

Acceptable values are:

- ``'miter'`` |miter_join|
- ``'round'`` |round_join|
- ``'bevel'`` |bevel_join|

"""

_line_cap_help = """
How path segments should be terminated.

Acceptable values are:

- ``'butt'`` |butt_cap|
- ``'round'`` |round_cap|
- ``'square'`` |square_cap|

"""

_text_font_help = """
Name of a font to use for rendering text, e.g., ``'times'``, ``'helvetica'``.

"""

_text_font_style_help = """
A style to use for rendering text.

Acceptable values are:

- ``'normal'`` normal text
- ``'italic'`` *italic text*
- ``'bold'`` **bold text**
- ``"bold italic"`` ***bold italic text***

"""

_text_align_help = """
Horizontal anchor point to use when rendering text.

Acceptable values are:

- ``'left'``
- ``'right'``
- ``'center'``

"""

_text_baseline_help = """
Vertical anchor point to use when rendering text.

Acceptable values are:

- ``'top'``
- ``'middle'``
- ``'bottom'``
- ``'alphabetic'``
- ``'hanging'``
- ``'ideographic'``

"""

_text_line_height_help = """
In multi-line text, how much additional space should be allocated for
each line. The value is provided as a number, but should be treated as
a percentage of font size. The default is 120%. Setting it to 1.0, so
100%, means no additional space will be used.
"""

_hatch_scale_help = """
A rough measure of the 'size' of the hatching pattern. Generally speaking, the
higher the number, the more spread out the pattern will be.
"""

_hatch_pattern_help = f"""
Built-in patterns are can either be specified as long names:

{', '. join(HatchPattern)}

or as one-letter abbreviations:

{', '. join(repr(x) for x in HatchPatternAbbreviation)}
"""

_hatch_weight_help = """
A width value for line-strokes used in hatching.
"""

#----------------------------------------------------------------------------
# General API
#----------------------------------------------------------------------------

class FillProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.FillVector`` class.

    '''

    fill_color = ColorSpec(default="gray", help=_color_help % "fill paths")
    fill_alpha = AlphaSpec(help=_alpha_help % "fill paths")

class ScalarFillProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.Fill`` class.

    '''

    fill_color = Nullable(Color, default="gray", help=_color_help  % "fill paths")
    fill_alpha = Alpha(help=_alpha_help % "fill paths")

class HatchProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.HatchVector`` class.

    '''

    hatch_color = ColorSpec(default="black", help=_color_help % "hatching")
    hatch_alpha = AlphaSpec(help=_alpha_help % "hatching")
    hatch_scale = NumberSpec(default=12.0, accept_datetime=False, accept_timedelta=False, help=_hatch_scale_help)
    hatch_pattern = HatchPatternSpec(default=None, help=_hatch_pattern_help)
    hatch_weight = NumberSpec(default=1.0, accept_datetime=False, accept_timedelta=False, help=_hatch_weight_help)
    hatch_extra = Dict(String, Instance("bokeh.models.textures.Texture"))

class ScalarHatchProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.Hatch`` class.

    '''

    hatch_color = Nullable(Color, default="black", help=_color_help % "hatching")
    hatch_alpha = Alpha(help=_alpha_help % "hatching")
    hatch_scale = Size(default=12.0, help=_hatch_scale_help)
    hatch_pattern = Nullable(String, help=_hatch_pattern_help)  # String to accommodate user custom values
    hatch_weight = Size(default=1.0, help=_hatch_weight_help)
    hatch_extra = Dict(String, Instance("bokeh.models.textures.Texture"))

class ImageProps(HasProps):
    ''' Properties relevant to rendering images.

    Mirrors the BokehJS ``properties.ImageVector`` class.

    '''

    global_alpha = AlphaSpec(help=_alpha_help % "images")

class ScalarImageProps(HasProps):
    ''' Properties relevant to rendering images.

    Mirrors the BokehJS ``properties.Image`` class.

    '''

    global_alpha = Alpha(help=_alpha_help % "images")


class LineProps(HasProps):
    ''' Properties relevant to rendering path operations.

    Mirrors the BokehJS ``properties.LineVector`` class.

    '''

    line_color = ColorSpec(default="black", help=_color_help % "stroke paths")
    line_alpha = AlphaSpec(help=_alpha_help % "stroke paths")
    line_width = NumberSpec(default=1, accept_datetime=False, accept_timedelta=False, help=_line_width_help)
    line_join = LineJoinSpec(default="bevel", help=_line_join_help)
    line_cap = LineCapSpec(default="butt", help=_line_cap_help)
    line_dash = DashPatternSpec(default=[], help="""How should the line be dashed.""")
    line_dash_offset = IntSpec(default=0, help="""The distance into the ``line_dash`` (in pixels) that the pattern should start from.""")


class ScalarLineProps(HasProps):
    ''' Properties relevant to rendering path operations.

    Mirrors the BokehJS ``properties.Line`` class.

    '''

    line_color = Nullable(Color, default="black", help=_color_help % "stroke paths")
    line_alpha = Alpha(help=_alpha_help % "stroke paths")
    line_width = Float(default=1, help=_line_width_help)
    line_join = Enum(LineJoin, default="bevel", help=_line_join_help)
    line_cap = Enum(LineCap, default="butt", help=_line_cap_help)
    line_dash = DashPattern(default=[], help="""How should the line be dashed.""")
    line_dash_offset = Int(default=0, help="""The distance into the ``line_dash`` (in pixels) that the pattern should start from.""")


class TextProps(HasProps):
    ''' Properties relevant to rendering text.

    Mirrors the BokehJS ``properties.TextVector`` class.
    '''

    text_color = ColorSpec(default="#444444", help=_color_help % "fill text")
    text_outline_color = ColorSpec(default=None, help=_color_help % "outline text")
    text_alpha = AlphaSpec(help=_alpha_help % "fill text")
    text_font = StringSpec(default=value("helvetica"), help=_text_font_help)
    text_font_size = FontSizeSpec(default=value("16px"))
    text_font_style = FontStyleSpec(default="normal", help=_text_font_style_help)
    text_align = TextAlignSpec(default="left", help=_text_align_help)
    text_baseline = TextBaselineSpec(default="bottom", help=_text_baseline_help)
    text_line_height = NumberSpec(default=1.2, help=_text_line_height_help)

class ScalarTextProps(HasProps):
    ''' Properties relevant to rendering text.

    Mirrors the BokehJS ``properties.Text`` class.
    '''

    text_color = Nullable(Color, default="#444444", help=_color_help % "fill text")
    text_outline_color = Nullable(Color, default=None, help=_color_help % "outline text")
    text_alpha = Alpha(help=_alpha_help % "fill text")
    text_font = String(default="helvetica", help=_text_font_help)
    text_font_size = FontSize("16px") # XXX not great XXX why?
    text_font_style = Enum(FontStyle, default="normal", help=_text_font_style_help)
    text_align = Enum(TextAlign, default="left", help=_text_align_help)
    text_baseline = Enum(TextBaseline, default="bottom", help=_text_baseline_help)
    text_line_height = Float(default=1.2, help=_text_line_height_help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
