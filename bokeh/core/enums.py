#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Common enumerations to be used together with |Enum| property.

This module provides many pre-defined enumerations, as well as functions
for creating new enumerations.

New enumerations can be created using the |enumeration| function:

.. code-block:: python

    #: Specify a nautically named side, port or starboard
    MyEnum = enumeration("port", "starboard")

Typically, enumerations are used to define |Enum| properties:

.. code-block:: python

    from bokeh.model import Model
    from bokeh.core.properties import Enum

    class MyModel(Model):

        location = Enum(MyEnum, help="""
        Whether the thing should be a port or starboard.
        """)

Enumerations have a defined order and support iteration:

.. code-block:: python

    >>> for loc in MyEnum:
    ...     print(loc)
    ...
    port
    starboard

as well as containment tests:

.. code-block:: python

    >>> "port" in MyEnum
    True

Enumerations can be easily documented in Sphinx documentation with the
:ref:`bokeh.sphinxext.bokeh_enum` Sphinx extension.

----

.. autofunction:: bokeh.core.enums.enumeration

----

.. |Enum| replace:: :class:`~bokeh.core.properties.Enum`
.. |enumeration| replace:: :func:`~bokeh.core.enums.enumeration`

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
from six import string_types

# Bokeh imports
from .. import colors, palettes

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Anchor',
    'AngleUnits',
    'ButtonType',
    'DashPattern',
    'DateFormat',
    'DatetimeUnits',
    'Dimension',
    'Dimensions',
    'Direction',
    'Enumeration',
    'enumeration',
    'FontStyle',
    'HoldPolicy',
    'HorizontalLocation',
    'JitterRandomDistribution',
    'LatLon',
    'LegendClickPolicy',
    'LegendLocation',
    'LineCap',
    'LineDash',
    'LineJoin',
    'Location',
    'MapType',
    'MarkerType',
    'NamedColor',
    'NumeralLanguage',
    'Orientation',
    'OutputBackend',
    'PaddingUnits',
    'Palette',
    'RenderLevel',
    'RenderMode',
    'RoundingFunction',
    'SizingMode',
    'SliderCallbackPolicy',
    'SortDirection',
    'SpatialUnits',
    'StartEnd',
    'StepMode',
    'TextAlign',
    'TextBaseline',
    'TickLabelOrientation',
    'TooltipAttachment',
    'TooltipFieldFormatter',
    'VerticalAlign',
    'VerticalLocation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Enumeration(object):
    ''' Represent an enumerated collection of values.

    .. note::
        Instances of ``Enumeration`` typically should not be constructed
        directly. Instead, use the |enumeration| function.

    '''
    __slots__ = ()

    def __iter__(self):
        return iter(self._values)

    def __contains__(self, value):
        if not self._case_sensitive:
            value = value.lower()
        return value in self._values

    def __str__(self):
        return "Enumeration(%s)" % ", ".join(self._values)

    def __len__(self):
        return len(self._values)

    __repr__ = __str__

def enumeration(*values, **kwargs):
    ''' Create an |Enumeration| object from a sequence of values.

    Call ``enumeration`` with a sequence of (unique) strings to create an
    Enumeration object:

    .. code-block:: python

        #: Specify the horizontal alignment for rendering text
        TextAlign = enumeration("left", "right", "center")

    Args:
        values (str) : string enumeration values, passed as positional arguments

            The order of arguments is the order of the enumeration, and the
            first element will be considered the default value when used
            to create |Enum| properties.

    Keyword Args:
        case_sensitive (bool, optional) :
            Whether validation should consider case or not (default: True)

    Raises:
        ValueError if values empty, if any value is not a string or not unique

    Returns:
        Enumeration

    '''
    if not (values and all(isinstance(value, string_types) and value for value in values)):
        raise ValueError("expected a non-empty sequence of strings, got %s" % values)

    if len(values) != len(set(values)):
        raise ValueError("enumeration items must be unique, got %s" % values)

    attrs = {value: value for value in values}
    attrs.update({
        "_values": list(values),
        "_default": values[0],
        "_case_sensitive": kwargs.get("case_sensitive", True),
    })

    return type(str("Enumeration"), (Enumeration,), attrs)()

#: Specify an achor position on a box/frame
Anchor = enumeration(
    "top_left",    "top_center",    "top_right",
    "center_left", "center",        "center_right",
    "bottom_left", "bottom_center", "bottom_right")

#: Specify the units for an angle value
AngleUnits = enumeration("deg", "rad")

#: Specify a style for button widgets
ButtonType = enumeration("default", "primary", "success", "warning", "danger", "link")

#: Specify a named dashing patter for stroking lines
DashPattern = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")

#: Specify a format for printing dates
DateFormat = enumeration("ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
                         "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TIMESTAMP")

#: Specify a date/time scale
DatetimeUnits = enumeration("microseconds", "milliseconds", "seconds", "minsec",
                            "minutes", "hourmin", "hours", "days", "months", "years")

#: Specify a vertical/horizontal dimension
Dimension = enumeration("width", "height")

#: Specify a vertical/horizontal dimensions
Dimensions = enumeration("width", "height", "both")

#: Specify a stroke direction for circles, wedges, etc.
Direction = enumeration("clock", "anticlock")

#: Specify the font style for rendering text
FontStyle = enumeration("normal", "italic", "bold", "bold italic")

#: Specify whether events should be combined or collected as-is when a Document hold is in effect
HoldPolicy = enumeration("combine", "collect")

#: Specify a horizontal location in plot layouts
HorizontalLocation = enumeration("left", "right")

#: Specify a distribution to use for the Jitter class
JitterRandomDistribution = enumeration("uniform", "normal")

#: Specify whether a dimension or coordinate is latitude or longitude
LatLon = enumeration("lat", "lon")

#: Specify how a legend should respond to click events
LegendClickPolicy = enumeration("none", "hide", "mute")

#: Specify a fixed location for a Bokeh legend
LegendLocation = Anchor

#: Specify how stroked lines should be terminated
LineCap = enumeration("butt", "round", "square")

#: Specify a named dash pattern for stroking lines
LineDash = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")

#: Specify how stroked lines should be joined together
LineJoin = enumeration("miter", "round", "bevel")

#: Specify a location in plot layouts
Location = enumeration("above", "below", "left", "right")

#: Specify a style for a Google map
MapType = enumeration("satellite", "roadmap", "terrain", "hybrid")

#: Specify one of the built-in marker types
MarkerType = enumeration("asterisk", "circle", "circle_cross", "circle_x", "cross",
                         "dash", "diamond", "diamond_cross", "hex", "inverted_triangle",
                         "square", "square_cross", "square_x", "triangle", "x")

#: Specify one of the 137 named CSS colors
NamedColor = enumeration(*colors.named.__all__, case_sensitive=False)

#: Specify a locale for printing numeric values
NumeralLanguage = enumeration("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")

#: Specify a vertical/horizontal orientation for something
Orientation = enumeration("horizontal", "vertical")

#: Specify an output backend to render a plot area onto
OutputBackend = enumeration("canvas", "svg", "webgl")

#: Whether range padding should be interpreted a percentage or and absolute quantity
PaddingUnits = enumeration("percent", "absolute")

#: Specify the name of a palette from :ref:`bokeh.palettes`
Palette = enumeration(*palettes.__palettes__)

#: Specify a position in the render order for a Bokeh renderer
RenderLevel = enumeration("image", "underlay", "glyph", "annotation", "overlay")

#: Specify a render mode for renderers that support both Canvas or CSS rendering
RenderMode = enumeration("canvas", "css")

#: Specify a policy for  how numbers should be rounded
RoundingFunction = enumeration("round", "nearest", "floor", "rounddown", "ceil", "roundup")

#: Sizing mode policies
SizingMode = enumeration("stretch_both", "scale_width", "scale_height", "scale_both", "fixed")

#: Specify different callback policies for the slider widget
SliderCallbackPolicy = enumeration("continuous", "throttle", "mouseup")

#: Specify sorting directions
SortDirection = enumeration("ascending", "descending")

#: Specify units for mapping values
SpatialUnits = enumeration("screen", "data")

#: Specify a start/end value
StartEnd = enumeration("start", "end")

#: Specify a mode for stepwise interpolation
StepMode = enumeration("before", "after", "center")

#: Specify the horizontal alignment for rendering text
TextAlign = enumeration("left", "right", "center")

#: Specify the baseline location for rendering text
TextBaseline = enumeration("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")

#: Specify how axis tick labels are oriented with respect to the axis
TickLabelOrientation = enumeration("horizontal", "vertical", "parallel", "normal")

#: Specify an attachment for tooltips
TooltipAttachment = enumeration("horizontal", "vertical", "left", "right", "above", "below")

#: Specify how a format string for a tooltip field should be interpreted
TooltipFieldFormatter = enumeration("numeral", "datetime", "printf")

#: Specify the vertical alignment for rendering text
VerticalAlign = enumeration("top", "middle", "bottom")

#: Specify a vertical location in plot layouts
VerticalLocation = enumeration("above", "below")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
