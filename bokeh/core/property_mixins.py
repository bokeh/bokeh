#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

* |LineProps| --- properties for line color, dashing, width, etc.

* |TextProps| --- properties for text color, font, etc.

To include these properties in a Bokeh model, use the |Include| property
as shown here:

.. code-block:: python

    class SomeGlyph(Glyph):

        fill_props = Include(FillProps, use_prefix=False, help="""
        The %s values for the annular wedges.
        """)

This adds all the fill properties ``fill_color`` and ``fill_alpha`` to this
model with one simple statement. Note that the help string contains a
placeholder format `%s`. When docs for this class are rendered by the
:ref:`bokeh.sphinxext.bokeh_model` Sphinx extension, the placeholder will
be replaced with more information specific to each property. The setting
``use_prefix`` means that the names of the properties added to ``SomeGlyph``
are exactly ``fill_alpha`` and ``fill_color``. Some situations require a
different usage, for more information see the docs for |Include|.

.. |Include| replace:: :class:`~bokeh.core.properties.Include`

.. |FillProps| replace:: :class:`~bokeh.core.property_mixins.FillProps`
.. |LineProps| replace:: :class:`~bokeh.core.property_mixins.LineProps`
.. |TextProps| replace:: :class:`~bokeh.core.property_mixins.TextProps`

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from .enums import LineJoin, LineCap, FontStyle, TextAlign, TextBaseline
from .has_props import HasProps
from .properties import Color, ColorSpec, DashPattern, Enum, FontSize, FontSizeSpec, Include, Int, Float, NumberSpec, Percent, String, value

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'FillProps',
    'LineProps',
    'TextProps',
    'ScalarFillProps',
    'ScalarLineProps',
    'ScalarTextProps',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_color_help = """
A color to use to %s with.

Acceptable values are:

- any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
- an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
- a 3-tuple of integers (r,g,b) between 0 and 255
- a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

.. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

"""

_alpha_help = """
An alpha value to use to %s with.

Acceptable values are floating point numbers between 0 (transparent)
and 1 (opaque).

"""

class _BaseLineProps(HasProps):
    line_join = Enum(LineJoin, default='bevel', help="""
    How path segments should be joined together.

    Acceptable values are:

    - ``'miter'`` |miter_join|
    - ``'round'`` |round_join|
    - ``'bevel'`` |bevel_join|

    .. |miter_join| image:: /_images/miter_join.png
       :height: 15
    .. |round_join| image:: /_images/round_join.png
       :height: 15
    .. |bevel_join| image:: /_images/bevel_join.png
       :height: 15

    """)

    line_cap = Enum(LineCap, help="""
    How path segments should be terminated.

    Acceptable values are:

    - ``'butt'`` |butt_cap|
    - ``'round'`` |round_cap|
    - ``'square'`` |square_cap|

    .. |butt_cap| image:: /_images/butt_cap.png
       :height: 12
    .. |round_cap| image:: /_images/round_cap.png
       :height: 12
    .. |square_cap| image:: /_images/square_cap.png
       :height: 12

    """)

    line_dash = DashPattern(help="""
    How should the line be dashed.
    """)

    line_dash_offset = Int(0, help="""
    The distance into the ``line_dash`` (in pixels) that the pattern should
    start from.
    """)

class _BaseTextProps(HasProps):

    text_font = String("helvetica", help="""
    Name of a font to use for rendering text, e.g., ``'times'``,
    ``'helvetica'``.

    """)

    text_font_style = Enum(FontStyle, help="""
    A style to use for rendering text.

    Acceptable values are:

    - ``'normal'`` normal text
    - ``'italic'`` *italic text*
    - ``'bold'`` **bold text**
    - ``"bold italic"`` ***bold italic text***

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
    - ``'ideographic'``

    """)

    text_line_height = Float(default=1.2, help="""
    In multi-line text, how much additional space should be allocated for
    each line. The value is provided as a number, but should be treated as
    a percentage of font size. The default is 120%. Setting it to 1.0, so
    100%, means no additional space will be used.
    """)

#----------------------------------------------------------------------------
# General API
#----------------------------------------------------------------------------

class FillProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.Fill`` class.

    '''

    fill_color = ColorSpec(default="gray", help=_color_help % "fill paths")
    fill_alpha = NumberSpec(default=1.0, accept_datetime=False, accept_timedelta=False, help=_alpha_help % "fill paths")

class ScalarFillProps(HasProps):
    ''' Properties relevant to rendering fill regions.

    Mirrors the BokehJS ``properties.Fill`` class.

    '''

    fill_color = Color(default="gray", help=_color_help)
    fill_alpha = Percent(default=1.0, help=_alpha_help)


_line_width_help = """
Stroke width in units of pixels.
"""

class LineProps(HasProps):
    ''' Properties relevant to rendering path operations.

    Mirrors the BokehJS ``properties.Line`` class.

    '''

    base_line_props = Include(_BaseLineProps, use_prefix=False)

    line_color = ColorSpec(default="black", help=_color_help % "stroke paths")
    line_width = NumberSpec(default=1, accept_datetime=False, accept_timedelta=False, help=_line_width_help)
    line_alpha = NumberSpec(default=1.0, accept_datetime=False, accept_timedelta=False, help=_alpha_help % "stroke paths")


class ScalarLineProps(HasProps):
    ''' Properties relevant to rendering path operations.

    Mirrors the BokehJS ``properties.Line`` class.

    '''
    base_line_props = Include(_BaseLineProps, use_prefix=False)

    line_color = Color(default="black", help=_color_help % "stroke paths")
    line_width = Float(default=1, help=_line_width_help)
    line_alpha = Percent(default=1.0, help=_alpha_help % "stroke paths")


class TextProps(HasProps):
    ''' Properties relevant to rendering text.

    Mirrors the BokehJS ``properties.Text`` class.

    .. note::
        There is currently only support for filling text. An interface
        to stroke the outlines of text has not yet been exposed.

    '''
    base_text_props = Include(_BaseTextProps, use_prefix=False)

    text_font_size = FontSizeSpec(value("12pt"))

    text_color = ColorSpec(default="#444444", help=_color_help % "fill text")

    text_alpha = NumberSpec(default=1.0, accept_datetime=False, accept_timedelta=False, help=_alpha_help % "fill text")

class ScalarTextProps(HasProps):
    ''' Properties relevant to rendering text.

    Mirrors the BokehJS ``properties.Text`` class.

    .. note::
        There is currently only support for filling text. An interface
        to stroke the outlines of text has not yet been exposed.

    '''

    base_text_props = Include(_BaseTextProps, use_prefix=False)

    # XXX not great
    text_font_size = FontSize("12pt")

    text_color = Color(default="#444444", help=_color_help % "fill text")

    text_alpha = Percent(default=1.0, help=_alpha_help % "fill text")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
