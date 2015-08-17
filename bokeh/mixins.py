""" Classes that can be mixed-in to Bokeh model classes to add sets of
related properties in bulk. """

from __future__ import absolute_import

from .properties import (
    HasProps, ColorSpec, Enum, DashPattern, Int, NumberSpec, String, FontSizeSpec)
from .enums import LineJoin, LineCap, FontStyle, TextAlign, TextBaseline

class FillProps(HasProps):
    """ Properties to use when performing fill operations while rendering.

    Mirrors the BokehJS ``properties.Fill`` class.

    """

    fill_color = ColorSpec(default="gray", help="""
    A color to use to fill paths with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    fill_alpha = NumberSpec(default=1.0, help="""
    An alpha value to use to fill paths with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

class LineProps(HasProps):
    """ Properties to use when performing stroke operations while rendering.

    Mirrors the BokehJS ``properties.Line`` class.

    """

    line_color = ColorSpec(default="black", help="""
    A color to use to stroke paths with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    line_width = NumberSpec(default=1, help="""
    Stroke width in units of pixels.
    """)

    line_alpha = NumberSpec(default=1.0, help="""
    An alpha value to use to stroke paths with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

    line_join = Enum(LineJoin, help="""
    How path segments should be joined together.

    Acceptable values are:

    - ``'miter'`` |miter_join|
    - ``'round'`` |round_join|
    - ``'bevel'`` |bevel_join|

    .. |miter_join| image:: /_images/miter_join.png
       :height: 20
    .. |round_join| image:: /_images/round_join.png
       :height: 20
    .. |bevel_join| image:: /_images/bevel_join.png
       :height: 20

    """)

    line_cap = Enum(LineCap, help="""
    How path segments should be terminated.

    Acceptable values are:

    - ``'butt'`` |butt_cap|
    - ``'round'`` |round_cap|
    - ``'square'`` |square_cap|

    .. |butt_cap| image:: /_images/butt_cap.png
       :height: 20
    .. |round_cap| image:: /_images/round_cap.png
       :height: 20
    .. |square_cap| image:: /_images/square_cap.png
       :height: 20

    """)

    line_dash = DashPattern(help="""
    How should the line be dashed.
    """)

    line_dash_offset = Int(0, help="""
    The distance into the ``line_dash`` (in pixels) that the pattern should
    start from.
    """)

class TextProps(HasProps):
    """ Properties to use when performing text drawing operations while
    rendering.

    Mirrors the BokehJS ``properties.Text`` class.

    .. note::
        There is currently only support for filling text. An interface
        to stroke the outlines of text has not yet been exposed.

    """

    text_font = String("Helvetica", help="""
    Name of a font to use for rendering text, e.g., ``'times'``,
    ``'helvetica'``.

    """)

    text_font_size = FontSizeSpec("12pt")

    text_font_style = Enum(FontStyle, help="""
    A style to use for rendering text.

    Acceptable values are:

    - ``'normal'`` normal text
    - ``'italic'`` *italic text*
    - ``'bold'`` **bold text**

    """)

    text_color = ColorSpec(default="#444444", help="""
    A color to use to fill text with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    text_alpha = NumberSpec(default=1.0, help="""
    An alpha value to use to fill text with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

    text_align = Enum(TextAlign, help="""
    Horizontal anchor point to use when rendering text.

    Acceptable values are:

    - ``'left'``
    - ``'right'``
    - ``'center'``

    """)

    text_baseline = Enum(TextBaseline, default="bottom", help="""
    Vertical anchor point to use when rendering text.

    Acceptable values are:

    - ``'top'``
    - ``'middle'``
    - ``'bottom'``
    - ``'alphabetic'``
    - ``'hanging'``

    """)
