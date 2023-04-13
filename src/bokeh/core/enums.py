#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Any,
    Iterator,
    Literal,
    get_args,
)

# Bokeh imports
from .. import colors, palettes
from ..util.strings import nice_join

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Align',
    'AlternationPolicy',
    'Anchor',
    'AngleUnits',
    'AutosizeMode',
    'ButtonType',
    'CalendarPosition',
    'ContextWhich',
    'CoordinateUnits',
    'DashPattern',
    'DateFormat',
    'DatetimeUnits',
    'Dimension',
    'Dimensions',
    'Direction',
    'Enumeration',
    'enumeration',
    'FlowMode',
    'FontStyle',
    'HAlign',
    'HatchPattern',
    'HatchPatternAbbreviation',
    'HoldPolicy',
    'HorizontalLocation',
    'ImageOrigin',
    'JitterRandomDistribution',
    'LabelOrientation',
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
    'Place',
    'RenderLevel',
    'ResetPolicy',
    'RoundingFunction',
    'ScrollbarPolicy',
    'SelectionMode',
    'SizingMode',
    'SizingPolicy',
    'SortDirection',
    'SpatialUnits',
    'StartEnd',
    'StepMode',
    'TextAlign',
    'TextBaseline',
    'TextureRepetition',
    'ToolIcon',
    'TooltipAttachment',
    'TooltipFieldFormatter',
    'TrackPolicy',
    'VAlign',
    'VerticalAlign',
    'VerticalLocation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Enumeration:
    ''' Represent an enumerated collection of values.

    .. note::
        Instances of ``Enumeration`` typically should not be constructed
        directly. Instead, use the |enumeration| function.

    '''
    __slots__ = ()

    _values: list[str]
    _default: str
    _case_sensitive: bool
    _quote: bool

    def __iter__(self) -> Iterator[str]:
        return iter(self._values)

    def __contains__(self, value: str) -> bool:
        if not self._case_sensitive:
            value = value.lower()
        return value in self._values

    def __str__(self) -> str:
        fn = repr if self._quote else str
        return f"Enumeration({', '.join(fn(x) for x in self._values)})"

    def __len__(self) -> int:
        return len(self._values)

    __repr__ = __str__

def enumeration(*values: Any, case_sensitive: bool = True, quote: bool = False) -> Enumeration:
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

        quote (bool, optional):
            Whether values should be quoted in the string representations
            (default: False)

    Raises:
        ValueError if values empty, if any value is not a string or not unique

    Returns:
        Enumeration

    '''
    if len(values) == 1 and hasattr(values[0], "__args__"):
        values = get_args(values[0])

    if not (values and all(isinstance(value, str) and value for value in values)):
        raise ValueError(f"expected a non-empty sequence of strings, got {nice_join(values)}")

    if len(values) != len(set(values)):
        raise ValueError(f"enumeration items must be unique, got {nice_join(values)}")

    attrs: dict[str, Any] = {value: value for value in values}
    attrs.update({
        "_values": list(values),
        "_default": values[0],
        "_case_sensitive": case_sensitive,
        "_quote": quote,
    })

    return type("Enumeration", (Enumeration,), attrs)()

#: Alignment (vertical or horizontal) of a child item
Align = enumeration("start", "center", "end")

#: Horizontal alignment of a child item
HAlign = enumeration("top", "center", "bottom")

#: Vertical alignment of a child item
VAlign = enumeration("left", "center", "right")

#: Specify to which items apply styling in a container (e.g. in a legend)
AlternationPolicy = enumeration("none", "even", "odd", "every")

#: Specify an anchor position on a box/frame
Anchor = enumeration(
    "top_left",    "top_center",    "top_right",
    "center_left", "center_center", "center_right",
    "bottom_left", "bottom_center", "bottom_right",
    "top", "left", "center", "right", "bottom",
)

#: Specify the units for an angle value
AngleUnits = enumeration("deg", "rad", "grad", "turn")

#: Specify autosize mode for DataTable
AutosizeMode = enumeration("fit_columns", "fit_viewport", "force_fit", "none")

#: Specify a style for button widgets
ButtonType = enumeration("default", "primary", "success", "warning", "danger", "light")

#: Specify a position for the DatePicker calendar to display
CalendarPosition = enumeration("auto", "above", "below")

#: Specify which tick to add additional context to
ContextWhich = enumeration("start", "center", "end", "all")

#: Specify units for mapping coordinates
CoordinateUnits = enumeration("canvas", "screen", "data")

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
DimensionsType = Literal["width", "height", "both"]
Dimensions = enumeration("width", "height", "both")

#: Specify a stroke direction for circles, wedges, etc.
Direction = enumeration("clock", "anticlock")

#: Specify the flow behavior in CSS layouts.
FlowMode = enumeration("block", "inline")

#: Specify the font style for rendering text
FontStyle = enumeration("normal", "italic", "bold", "bold italic")

_hatch_patterns = (
    (" ",  "blank"),
    (".",  "dot"),
    ("o",  "ring"),
    ("-",  "horizontal_line"),
    ("|",  "vertical_line"),
    ("+",  "cross"),
    ('"',  "horizontal_dash"),
    (":",  "vertical_dash"),
    ("@",  "spiral"),
    ("/",  "right_diagonal_line"),
    ("\\", "left_diagonal_line"),
    ("x",  "diagonal_cross"),
    (",",  "right_diagonal_dash"),
    ("`",  "left_diagonal_dash"),
    ("v",  "horizontal_wave"),
    (">",  "vertical_wave"),
    ("*",  "criss_cross"),
)

#: Specify one of the built-in patterns for hatching fills
HatchPattern = enumeration(*list(zip(*_hatch_patterns))[1])

#: Specify one of the built-in patterns for hatching fills with a one-letter abbreviation
#:
#: The abbreviations are mapped as follows:
#:
#: .. code-block:: none
#:
#:     " "  :  blank
#:     "."  :  dot
#:     "o"  :  ring
#:     "-"  :  horizontal_line
#:     "|"  :  vertical_line
#:     "+"  :  cross
#:     '"'  :  horizontal_dash
#:     ":"  :  vertical_dash
#:     "@"  :  spiral
#:     "/"  :  right_diagonal_line
#:     "\\" :  left_diagonal_line
#:     "x"  :  diagonal_cross
#:     ","  :  right_diagonal_dash
#:     "`"  :  left_diagonal_dash
#:     "v"  :  horizontal_wave
#:     ">"  :  vertical_wave
#:     "*"  :  criss_cross
HatchPatternAbbreviation = enumeration(*list(zip(*_hatch_patterns))[0], quote=True)

#: Specify whether events should be combined or collected as-is when a Document hold is in effect
HoldPolicyType = Literal["combine", "collect"]
HoldPolicy = enumeration(HoldPolicyType)

#: Specify a horizontal location in plot layouts
HorizontalLocation = enumeration("left", "right")

#: Defines the coordinate space within an image
ImageOrigin = enumeration("bottom_left", "top_left", "bottom_right", "top_right")

#: Specify a distribution to use for the Jitter class
JitterRandomDistributionType = Literal["uniform", "normal"]
JitterRandomDistribution = enumeration(JitterRandomDistributionType)

#: Specify how labels are oriented with respect to an axis
LabelOrientationType = Literal["horizontal", "vertical", "parallel", "normal"]
LabelOrientation = enumeration("horizontal", "vertical", "parallel", "normal")

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
LocationType = Literal["above", "below", "left", "right"]
Location = enumeration(LocationType)

#: Specify a style for a Google map
MapType = enumeration("satellite", "roadmap", "terrain", "hybrid")

#: Specify one of the built-in marker types
MarkerType = enumeration(
    "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
    "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
    "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
    "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
    "triangle", "triangle_dot", "triangle_pin", "x", "y"
)

#: Specify one of the CSS4 named colors (https://www.w3.org/TR/css-color-4/#named-colors)
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

#:
PlaceType = Literal["above", "below", "left", "right", "center"]
Place = enumeration(PlaceType)

#: Specify a position in the render order for a Bokeh renderer
RenderLevel = enumeration("image", "underlay", "glyph", "guide", "annotation", "overlay")

#: What reset actions should occur on a Plot reset
ResetPolicy = enumeration("standard", "event_only")

#: Specify a policy for  how numbers should be rounded
RoundingFunction = enumeration("round", "nearest", "floor", "rounddown", "ceil", "roundup")

#: Scrollbar policies
ScrollbarPolicy = enumeration("auto", "visible", "hidden")

#: Selection modes
SelectionMode = enumeration("replace", "append", "intersect", "subtract")

#: Sizing mode policies
SizingModeType = Literal["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit"]
SizingMode = enumeration(SizingModeType)

#: Individual sizing mode policies
SizingPolicy = enumeration("fixed", "fit", "min", "max")

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

#: Specify how textures used as canvas patterns should repeat
TextureRepetition = enumeration("repeat", "repeat_x", "repeat_y", "no_repeat")

#: Well known tool icon names
ToolIcon = enumeration(
  "append_mode",
  "box_edit",
  "box_select",
  "box_zoom",
  "clear_selection",
  "copy",
  "crosshair",
  "freehand_draw",
  "help",
  "hover",
  "intersect_mode",
  "lasso_select",
  "line_edit",
  "pan",
  "point_draw",
  "poly_draw",
  "poly_edit",
  "polygon_select",
  "range",
  "redo",
  "replace_mode",
  "reset",
  "save",
  "subtract_mode",
  "tap_select",
  "undo",
  "wheel_pan",
  "wheel_zoom",
  "xpan",
  "ypan",
  "zoom_in",
  "zoom_out",
)

#: Specify an attachment for tooltips
TooltipAttachment = enumeration("horizontal", "vertical", "left", "right", "above", "below")

#: Specify how a format string for a tooltip field should be interpreted
TooltipFieldFormatter = enumeration("numeral", "datetime", "printf")

#: Grid track (row/column) sizing policies
TrackPolicy = enumeration("auto", "min", "max", "flex", "fixed")

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
