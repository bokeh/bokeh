#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
    'BuiltinFormatter',
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
    'FlowMode',
    'FontStyle',
    'HAlign',
    'HatchPattern',
    'HatchPatternAbbreviation',
    'HoldPolicy',
    'HorizontalLocation',
    'ImageOrigin',
    'JitterRandomDistribution',
    'KeyModifier',
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
    'Movable',
    'NamedColor',
    'NumeralLanguage',
    'Orientation',
    'OutlineShapeName',
    'OutputBackend',
    'PaddingUnits',
    'Palette',
    'PanDirection',
    'Place',
    'RegionSelectionMode',
    'RenderLevel',
    'ResetPolicy',
    'Resizable',
    'ResolutionType',
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

        case_sensitive (bool, optional) :
            Whether validation should consider case or not (default: True)

        quote (bool, optional) :
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
AlignType = Literal["start", "center", "end"]
Align = enumeration(AlignType)

#: Horizontal alignment of a child item
HAlignType = Literal["left", "center", "right"]
HAlign = enumeration(HAlignType)

#: Vertical alignment of a child item
VAlignType = Literal["top", "center", "bottom"]
VAlign = enumeration(VAlignType)

#: Specify to which items apply styling in a container (e.g. in a legend)
AlternationPolicyType = Literal["none", "even", "odd", "every"]
AlternationPolicy = enumeration(AlternationPolicyType)

#: Specify an anchor position on a box/frame
AnchorType = Literal[
    "top_left",    "top_center",    "top_right",
    "center_left", "center_center", "center_right",
    "bottom_left", "bottom_center", "bottom_right",
    "top", "left", "center", "right", "bottom",
]
Anchor = enumeration(AnchorType)

#: Specify the units for an angle value
AngleUnitsType = Literal["deg", "rad", "grad", "turn"]
AngleUnits = enumeration(AngleUnitsType)

#: Specify autosize mode for DataTable
AutosizeModeType = Literal["fit_columns", "fit_viewport", "force_fit", "none"]
AutosizeMode = enumeration(AutosizeModeType)

#: Names of built-in value formatters
BuiltinFormatterType = Literal["raw", "basic", "numeral", "printf", "datetime"]
BuiltinFormatter = enumeration(BuiltinFormatterType)

#: Specify a style for button widgets
ButtonTypeType = Literal["default", "primary", "success", "warning", "danger", "light"]
ButtonType = enumeration(ButtonTypeType)

#: Specify a position for the DatePicker calendar to display
CalendarPositionType = Literal["auto", "above", "below"]
CalendarPosition = enumeration(CalendarPositionType)

#: Specify which tick to add additional context to
ContextWhichType = Literal["start", "center", "end", "all"]
ContextWhich = enumeration(ContextWhichType)

#: Specify units for mapping coordinates
CoordinateUnitsType = Literal["canvas", "screen", "data"]
CoordinateUnits = enumeration(CoordinateUnitsType)

#: Specify a named dashing patter for stroking lines
DashPatternType = Literal["solid", "dashed", "dotted", "dotdash", "dashdot"]
DashPattern = enumeration(DashPatternType)

#: Specify a format for printing dates
DateFormatType = Literal[
    "ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
    "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TIMESTAMP",
]
DateFormat = enumeration(DateFormatType)

#: Specify a date/time scale
DatetimeUnitsType = Literal[
    "microseconds", "milliseconds", "seconds", "minsec",
    "minutes", "hourmin", "hours", "days", "months", "years",
]
DatetimeUnits = enumeration(DatetimeUnitsType)

#: Specify a vertical/horizontal dimension
DimensionType = Literal["width", "height"]
Dimension = enumeration(DimensionType)

#: Specify a vertical/horizontal dimensions
DimensionsType = Literal["width", "height", "both"]
Dimensions = enumeration(DimensionsType)

#: Specify a stroke direction for circles, wedges, etc.
DirectionType = Literal["clock", "anticlock"]
Direction = enumeration(DirectionType)

#: Specify the flow behavior in CSS layouts.
FlowModeType = Literal["block", "inline"]
FlowMode = enumeration(FlowModeType)

#: Specify the font style for rendering text
FontStyleType = Literal["normal", "italic", "bold", "bold italic"]
FontStyle = enumeration(FontStyleType)

#: Specify one of the built-in patterns for hatching fills
HatchPatternType = Literal[
    "blank",
    "dot",
    "ring",
    "horizontal_line",
    "vertical_line",
    "cross",
    "horizontal_dash",
    "vertical_dash",
    "spiral",
    "right_diagonal_line",
    "left_diagonal_line",
    "diagonal_cross",
    "right_diagonal_dash",
    "left_diagonal_dash",
    "horizontal_wave",
    "vertical_wave",
    "criss_cross",
]
HatchPattern = enumeration(HatchPatternType)

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
HatchPatternAbbreviationType = Literal[" ", ".", "o", "-", "|", "+", '"', ":", "@", "/", "\\", "x", ",", "`", "v", ">", "*"]
HatchPatternAbbreviation = enumeration(HatchPatternAbbreviationType, quote=True)

#: Specify whether events should be combined or collected as-is when a Document hold is in effect
HoldPolicyType = Literal["combine", "collect"]
HoldPolicy = enumeration(HoldPolicyType)

#: Specify a horizontal location in plot layouts
HorizontalLocationType = Literal["left", "right"]
HorizontalLocation = enumeration(HorizontalLocationType)

#: Defines the coordinate space within an image
ImageOriginType = Literal["bottom_left", "top_left", "bottom_right", "top_right"]
ImageOrigin = enumeration(ImageOriginType)

#: Specify a distribution to use for the Jitter class
JitterRandomDistributionType = Literal["uniform", "normal"]
JitterRandomDistribution = enumeration(JitterRandomDistributionType)

#: Keyboard modifier key used to configure tools or report in UI events
KeyModifierType = Literal["shift", "ctrl", "alt"]
KeyModifier = enumeration(KeyModifierType)

#: Specify how labels are oriented with respect to an axis
LabelOrientationType = Literal["horizontal", "vertical", "parallel", "normal"]
LabelOrientation = enumeration(LabelOrientationType)

#: Specify whether a dimension or coordinate is latitude or longitude
LatLonType = Literal["lat", "lon"]
LatLon = enumeration(LatLonType)

#: Specify how a legend should respond to click events
LegendClickPolicyType = Literal["none", "hide", "mute"]
LegendClickPolicy = enumeration(LegendClickPolicyType)

#: Specify a fixed location for a legend
LegendLocationType = AnchorType
LegendLocation = Anchor

#: Specify how stroked lines should be terminated
LineCapType = Literal["butt", "round", "square"]
LineCap = enumeration(LineCapType)

#: Specify a named dash pattern for stroking lines
LineDashType = Literal["solid", "dashed", "dotted", "dotdash", "dashdot"]
LineDash = enumeration(LineDashType)

#: Specify how stroked lines should be joined together
LineJoinType = Literal["miter", "round", "bevel"]
LineJoin = enumeration(LineJoinType)

#: Specify a location in plot layouts
LocationType = Literal["above", "below", "left", "right"]
Location = enumeration(LocationType)

#: Specify a style for a Google map
MapTypeType = Literal["satellite", "roadmap", "terrain", "hybrid"]
MapType = enumeration(MapTypeType)

#: Specify one of the built-in marker types
MarkerTypeType = Literal[
    "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
    "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
    "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
    "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
    "triangle", "triangle_dot", "triangle_pin", "x", "y",
]
MarkerType = enumeration(MarkerTypeType)

#: Indicates in which dimensions an object (a renderer or an UI element) can be moved.
MovableType = Literal["none", "x", "y", "both"]
Movable = enumeration(MovableType)

#: Specify one of the CSS4 named colors (https://www.w3.org/TR/css-color-4/#named-colors)
NamedColor = enumeration(*colors.named.__all__, case_sensitive=False)

#: Specify a locale for printing numeric values
NumeralLanguageType = Literal["be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA"]
NumeralLanguage = enumeration(NumeralLanguageType)

#: Specify a vertical/horizontal orientation for something
OrientationType = Literal["horizontal", "vertical"]
Orientation = enumeration(OrientationType)

#: Names of pre-defined outline shapes (used in ``Text.outline_shape``)
OutlineShapeName = Literal["none", "box", "rectangle", "square", "circle", "ellipse", "trapezoid", "parallelogram", "diamond", "triangle"]
OutlineShapeName = enumeration(OutlineShapeName)

#: Specify an output backend to render a plot area onto
OutputBackendType = Literal["canvas", "svg", "webgl"]
OutputBackend = enumeration(OutputBackendType)

#: Whether range padding should be interpreted a percentage or and absolute quantity
PaddingUnitsType = Literal["percent", "absolute"]
PaddingUnits = enumeration(PaddingUnitsType)

#: Which direction click pan tool acts on.
PanDirection = Literal["left", "right", "up", "down", "west", "east", "north", "south"]
PanDirection = enumeration(PanDirection)

#: Specify the name of a palette from :ref:`bokeh.palettes`
Palette = enumeration(*palettes.__palettes__)

#: Placement of a layout element, in particular in border-style layouts
PlaceType = Literal["above", "below", "left", "right", "center"]
Place = enumeration(PlaceType)

#: Specify a position in the render order for a renderer
RenderLevelType = Literal["image", "underlay", "glyph", "guide", "annotation", "overlay"]
RenderLevel = enumeration(RenderLevelType)

#: What reset actions should occur on a Plot reset
ResetPolicyType = Literal["standard", "event_only"]
ResetPolicy = enumeration(ResetPolicyType)

#: Indicates in which dimensions an object (a renderer or an UI element) can be resized.
ResizableType = Literal["none", "left", "right", "top", "bottom", "x", "y", "all"]
Resizable = enumeration(ResizableType)

#: Specify which resolutions should be used for stripping of leading zeros
ResolutionTypeType = Literal["microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years"]
ResolutionType = enumeration(ResolutionTypeType)

#: Specify a policy for  how numbers should be rounded
RoundingFunctionType = Literal["round", "nearest", "floor", "rounddown", "ceil", "roundup"]
RoundingFunction = enumeration(RoundingFunctionType)

#: Scrollbar policies
ScrollbarPolicyType = Literal["auto", "visible", "hidden"]
ScrollbarPolicy = enumeration(ScrollbarPolicyType)

#: Region selection modes
RegionSelectionModeType = Literal["replace", "append", "intersect", "subtract", "xor"]
RegionSelectionMode = enumeration(RegionSelectionModeType)

#: Selection modes
SelectionModeType = Literal[RegionSelectionModeType, "toggle"]
SelectionMode = enumeration(SelectionModeType)

#: Sizing mode policies
SizingModeType = Literal["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit"]
SizingMode = enumeration(SizingModeType)

#: Individual sizing mode policies
SizingPolicyType = Literal["fixed", "fit", "min", "max"]
SizingPolicy = enumeration(SizingPolicyType)

#: Specify sorting directions
SortDirectionType = Literal["ascending", "descending"]
SortDirection = enumeration(SortDirectionType)

#: Specify units for mapping values
SpatialUnitsType = Literal["screen", "data"]
SpatialUnits = enumeration(SpatialUnitsType)

#: Specify a start/end value
StartEndType = Literal["start", "end"]
StartEnd = enumeration(StartEndType)

#: Specify a mode for stepwise interpolation
StepModeType = Literal["before", "after", "center"]
StepMode = enumeration(StepModeType)

#: Specify the horizontal alignment for rendering text
TextAlignType = Literal["left", "right", "center"]
TextAlign = enumeration(TextAlignType)

#: Specify the baseline location for rendering text
TextBaselineType = Literal["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"]
TextBaseline = enumeration(TextBaselineType)

#: Specify how textures used as canvas patterns should repeat
TextureRepetitionType = Literal["repeat", "repeat_x", "repeat_y", "no_repeat"]
TextureRepetition = enumeration(TextureRepetitionType)

#: Well known tool icon names
ToolIconType = Literal[
  "append_mode",
  "arrow_down_to_bar",
  "arrow_up_from_bar",
  "auto_box_zoom",
  "bold",
  "box_edit",
  "box_select",
  "box_zoom",
  "caret_down",
  "caret_left",
  "caret_right",
  "caret_up",
  "check",
  "chevron_down",
  "chevron_left",
  "chevron_right",
  "chevron_up",
  "clear_selection",
  "copy",
  "crosshair",
  "delete",
  "freehand_draw",
  "fullscreen",
  "help",
  "hover",
  "intersect_mode",
  "invert_selection",
  "italic",
  "lasso_select",
  "line_edit",
  "maximize",
  "minimize",
  "pan",
  "pin",
  "point_draw",
  "pointer",
  "poly_draw",
  "poly_edit",
  "polygon_select",
  "range",
  "redo",
  "replace_mode",
  "reset",
  "save",
  "see_off",
  "see_on",
  "settings",
  "square",
  "square_check",
  "subtract_mode",
  "tap_select",
  "text_align_center",
  "text_align_left",
  "text_align_right",
  "undo",
  "unknown",
  "unpin",
  "wheel_pan",
  "wheel_zoom",
  "x_box_select",
  "x_box_zoom",
  "x_grip",
  "x_pan",
  "xor_mode",
  "y_box_select",
  "y_box_zoom",
  "y_grip",
  "y_pan",
  "zoom_in",
  "zoom_out",
]
ToolIcon = enumeration(ToolIconType)

#: Specify an attachment for tooltips
TooltipAttachmentType = Literal["horizontal", "vertical", "left", "right", "above", "below"]
TooltipAttachment = enumeration(TooltipAttachmentType)

#: Specify how a format string for a tooltip field should be interpreted
TooltipFieldFormatterType = Literal["numeral", "datetime", "printf"]
TooltipFieldFormatter = enumeration(TooltipFieldFormatterType)

#: Grid track (row/column) sizing policies
TrackPolicyType = Literal["auto", "min", "max", "flex", "fixed"]
TrackPolicy = enumeration(TrackPolicyType)

#: Specify the vertical alignment for rendering text
VerticalAlignType = Literal["top", "middle", "bottom"]
VerticalAlign = enumeration(VerticalAlignType)

#: Specify a vertical location in plot layouts
VerticalLocationType = Literal["above", "below"]
VerticalLocation = enumeration(VerticalLocationType)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
