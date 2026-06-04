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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Align',
    'AlternationPolicy',
    'Anchor',
    'AngleUnits',
    'Auto',
    'AutosizeMode',
    'AxisLabelStandoffMode',
    'AxisType',
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
    'HexTileOrientation',
    'HoldPolicy',
    'HorizontalLocation',
    'ImageOrigin',
    'ImplicitTarget',
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
    'RadiusDimension',
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
    'TeXDisplay',
    'TextAlign',
    'TextBaseline',
    'TextureRepetition',
    'TimedeltaResolutionType',
    'ToolIcon',
    'ToolName',
    'TooltipAttachment',
    'TooltipFieldFormatter',
    'TrackPolicy',
    'VAlign',
    'VerticalAlign',
    'VerticalLocation',
    'WindowAxis',
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

    _values: list[str | int]
    _default: str | int
    _case_sensitive: bool
    _quote: bool

    def __iter__(self) -> Iterator[str | int]:
        return iter(self._values)

    def __contains__(self, value: str | int) -> bool:
        if not self._case_sensitive and isinstance(value, str):
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

        #: Specify either ascending or descending item order
        AscDesc = enumeration(1, -1)

    Args:
        values (str | int) : string or integer enumeration values, passed as
            positional arguments

            The order of arguments is the order of the enumeration, and the
            first element will be considered the default value when used
            to create |Enum| properties.

        case_sensitive (bool, optional) :
            Whether validation should consider case or not (default: True)

        quote (bool, optional) :
            Whether values should be quoted in the string representations
            (default: False)

    Raises:
        ValueError: if ``values`` is empty or if any value is not a string or not unique

    Returns:
        Enumeration

    '''
    if len(values) == 1 and hasattr(values[0], "__args__"):
        values = get_args(values[0])

    if not (values and
            (all(isinstance(value, str) and value for value in values) or
             all(isinstance(value, int) for value in values))):
        from ..util.strings import nice_join

        raise ValueError(f"expected a non-empty heterogenous sequence of strings or integers, got {nice_join(values)}")

    if len(values) != len(set(values)):
        from ..util.strings import nice_join

        raise ValueError(f"enumeration items must be unique, got {nice_join(values)}")

    attrs: dict[str, Any] = {value: value for value in values if isinstance(value, str)}
    attrs.update({
        "_values": list(values),
        "_default": values[0],
        "_case_sensitive": case_sensitive,
        "_quote": quote,
    })

    return type("Enumeration", (Enumeration,), attrs)()

AlignType = Literal["start", "center", "end"]
#: Alignment (vertical or horizontal) of a child item.
Align = enumeration(AlignType)

HAlignType = Literal["left", "center", "right"]
#: Horizontal alignment of a child item.
HAlign = enumeration(HAlignType)

VAlignType = Literal["top", "center", "bottom"]
#: Vertical alignment of a child item.
VAlign = enumeration(VAlignType)

AlternationPolicyType = Literal["none", "even", "odd", "every"]
#: Specify to which items apply styling in a container (e.g. in a legend).
AlternationPolicy = enumeration(AlternationPolicyType)

AnchorType = Literal[
    "top_left",    "top_center",    "top_right",
    "center_left", "center_center", "center_right",
    "bottom_left", "bottom_center", "bottom_right",
    "top", "left", "center", "right", "bottom",
]
#: Specify an anchor position on a box/frame.
Anchor = enumeration(AnchorType)

AngleUnitsType = Literal["deg", "rad", "grad", "turn"]
#: Specify the units for an angle value.
AngleUnits = enumeration(AngleUnitsType)

AutoType = Literal["auto"]
#: Context dependent keyword that specifies the automated, default, computed, etc. behavior.
Auto = enumeration(AutoType)

AutosizeModeType = Literal["fit_columns", "fit_viewport", "force_fit", "none"]
#: Specify autosize mode for DataTable.
AutosizeMode = enumeration(AutosizeModeType)

AxisLabelStandoffModeType = Literal["tick_labels", "axis"]
#: Specify the reference point of the ``axis_label_standoff``.
AxisLabelStandoffMode = enumeration(AxisLabelStandoffModeType)

AxisTypeType = Literal["linear", "log", "datetime", "timedelta", "mercator"]
#: Specify the type of the axis.
AxisType = enumeration(AxisTypeType)

BuiltinFormatterType = Literal["raw", "basic", "numeral", "printf", "datetime"]
#: Names of built-in value formatters.
BuiltinFormatter = enumeration(BuiltinFormatterType)

ButtonTypeType = Literal["default", "primary", "success", "warning", "danger", "light"]
#: Specify a style for button widgets.
ButtonType = enumeration(ButtonTypeType)

CalendarPositionType = Literal["auto", "above", "below"]
#: Specify a position for the DatePicker calendar to display.
CalendarPosition = enumeration(CalendarPositionType)

ContextWhichType = Literal["start", "center", "end", "all"]
#: Specify which tick to add additional context to.
ContextWhich = enumeration(ContextWhichType)

CoordinateUnitsType = Literal["canvas", "screen", "data"]
#: Specify units for mapping coordinates.
CoordinateUnits = enumeration(CoordinateUnitsType)

DashPatternType = Literal["solid", "dashed", "dotted", "dotdash", "dashdot"]
#: Specify a named dashing pattern for stroking lines.
DashPattern = enumeration(DashPatternType)

DateFormatType = Literal[
    "ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
    "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TIMESTAMP",
]
#: Specify a format for printing dates.
DateFormat = enumeration(DateFormatType)

DatetimeUnitsType = Literal[
    "microseconds", "milliseconds", "seconds", "minsec",
    "minutes", "hourmin", "hours", "days", "months", "years",
]
#: Specify a date/time scale.
DatetimeUnits = enumeration(DatetimeUnitsType)

DimensionType = Literal["width", "height"]
#: Specify a vertical/horizontal dimension.
Dimension = enumeration(DimensionType)

DimensionsType = Literal["width", "height", "both"]
#: Specify a vertical/horizontal dimensions.
Dimensions = enumeration(DimensionsType)

DirectionType = Literal["clock", "anticlock"]
#: Specify a stroke direction for circles, wedges, etc.
Direction = enumeration(DirectionType)

FlowModeType = Literal["block", "inline"]
#: Specify the flow behavior in CSS layouts.
FlowMode = enumeration(FlowModeType)

FontStyleType = Literal["normal", "italic", "bold", "bold italic"]
#: Specify the font style for rendering text.
FontStyle = enumeration(FontStyleType)

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
#: Specify one of the built-in patterns for hatching fills.
HatchPattern = enumeration(HatchPatternType)

HatchPatternAbbreviationType = Literal[" ", ".", "o", "-", "|", "+", '"', ":", "@", "/", "\\", "x", ",", "`", "v", ">", "*"]
#: Specify one of the built-in patterns for hatching fills with a one-letter abbreviation.
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
HatchPatternAbbreviation = enumeration(HatchPatternAbbreviationType, quote=True)

HexTileOrientationType = Literal["pointytop", "flattop"]
#: The orientation of the hex tiles.
HexTileOrientation = enumeration(HexTileOrientationType)

HoldPolicyType = Literal["combine", "collect"]
#: Specify whether events should be combined or collected as-is when a Document hold is in effect.
HoldPolicy = enumeration(HoldPolicyType)

HorizontalLocationType = Literal["left", "right"]
#: Specify a horizontal location in plot layouts.
HorizontalLocation = enumeration(HorizontalLocationType)

ImageOriginType = Literal["bottom_left", "top_left", "bottom_right", "top_right"]
#: Defines the coordinate space within an image.
ImageOrigin = enumeration(ImageOriginType)

ImplicitTargetType = Literal["viewport", "canvas", "plot", "frame", "parent"]
#: Implicitly defined target of a node.
ImplicitTarget = enumeration(ImplicitTargetType)

JitterRandomDistributionType = Literal["uniform", "normal"]
#: Specify a distribution to use for the Jitter class.
JitterRandomDistribution = enumeration(JitterRandomDistributionType)

KeyModifierType = Literal["shift", "ctrl", "alt"]
#: Keyboard modifier key used to configure tools or report in UI events.
KeyModifier = enumeration(KeyModifierType)

LabelOrientationType = Literal["horizontal", "vertical", "parallel", "normal"]
#: Specify how labels are oriented with respect to an axis.
LabelOrientation = enumeration(LabelOrientationType)

LatLonType = Literal["lat", "lon"]
#: Specify whether a dimension or coordinate is latitude or longitude.
LatLon = enumeration(LatLonType)

LegendClickPolicyType = Literal["none", "hide", "mute"]
#: Specify how a legend should respond to click events.
LegendClickPolicy = enumeration(LegendClickPolicyType)

LegendLocationType = AnchorType
#: Specify a fixed location for a legend.
LegendLocation = Anchor

LineCapType = Literal["butt", "round", "square"]
#: Specify how stroked lines should be terminated.
LineCap = enumeration(LineCapType)

LineDashType = Literal["solid", "dashed", "dotted", "dotdash", "dashdot"]
#: Specify a named dash pattern for stroking lines.
LineDash = enumeration(LineDashType)

LineJoinType = Literal["miter", "round", "bevel"]
#: Specify how stroked lines should be joined together.
LineJoin = enumeration(LineJoinType)

LocationType = Literal["above", "below", "left", "right"]
#: Specify a location in plot layouts.
Location = enumeration(LocationType)

MapTypeType = Literal["satellite", "roadmap", "terrain", "hybrid"]
#: Specify a style for a Google map.
MapType = enumeration(MapTypeType)

MarkerTypeType = Literal[
    "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
    "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
    "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
    "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
    "triangle", "triangle_dot", "triangle_pin", "x", "y",
]
#: Specify one of the built-in marker types.
MarkerType = enumeration(MarkerTypeType)

MovableType = Literal["none", "x", "y", "both"]
#: Indicates in which dimensions an object (a renderer or an UI element) can be moved.
Movable = enumeration(MovableType)

#: Specify one of the |named CSS colors|.
NamedColor = enumeration(*colors.named.__all__, case_sensitive=False)

NumeralLanguageType = Literal["be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA"]
#: Specify a locale for printing numeric values.
NumeralLanguage = enumeration(NumeralLanguageType)

OrientationType = Literal["horizontal", "vertical"]
#: Specify a vertical/horizontal orientation for something.
Orientation = enumeration(OrientationType)

OutlineShapeNameType = Literal["none", "box", "rectangle", "square", "circle", "ellipse", "trapezoid", "parallelogram", "diamond", "triangle"]
#: Names of pre-defined outline shapes (used in ``Text.outline_shape``).
OutlineShapeName = enumeration(OutlineShapeNameType)

OutputBackendType = Literal["canvas", "svg", "webgl"]
#: Specify an output backend to render a plot area onto.
OutputBackend = enumeration(OutputBackendType)

PaddingUnitsType = Literal["percent", "absolute"]
#: Whether range padding should be interpreted a percentage or and absolute quantity.
PaddingUnits = enumeration(PaddingUnitsType)

PanDirectionType = Literal["left", "right", "up", "down", "west", "east", "north", "south"]
#: Which direction click pan tool acts on.
PanDirection = enumeration(PanDirectionType)

PaletteType = str # TODO
#: Specify the name of a palette from :ref:`bokeh.palettes`.
Palette = enumeration(*palettes.__palettes__)

PlaceType = Literal["above", "below", "left", "right", "center"]
#: Placement of a layout element, in particular in border-style layouts.
Place = enumeration(PlaceType)

RadiusDimensionType = Literal["x", "y", "max", "min"]
#: Specify which dimension or dimensions to use when measuring circle radius.
RadiusDimension = enumeration(RadiusDimensionType)

RenderLevelType = Literal["image", "underlay", "glyph", "guide", "annotation", "overlay"]
#: Specify a position in the render order for a renderer.
RenderLevel = enumeration(RenderLevelType)

ResetPolicyType = Literal["standard", "event_only"]
#: What reset actions should occur on a Plot reset.
ResetPolicy = enumeration(ResetPolicyType)

ResizableType = Literal["none", "left", "right", "top", "bottom", "x", "y", "all"]
#: Indicates in which dimensions an object (a renderer or an UI element) can be resized.
Resizable = enumeration(ResizableType)

ResolutionTypeType = Literal["microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years"]
#: Specify which resolutions should be used for stripping of leading zeros.
ResolutionType = enumeration(ResolutionTypeType)

RoundingFunctionType = Literal["round", "nearest", "floor", "rounddown", "ceil", "roundup"]
#: Specify a policy for  how numbers should be rounded.
RoundingFunction = enumeration(RoundingFunctionType)

ScrollbarPolicyType = Literal["auto", "visible", "hidden"]
#: Scrollbar policies.
ScrollbarPolicy = enumeration(ScrollbarPolicyType)

RegionSelectionModeType = Literal["replace", "append", "intersect", "subtract", "xor"]
#: Region selection modes.
RegionSelectionMode = enumeration(RegionSelectionModeType)

SelectionModeType = Literal[RegionSelectionModeType, "toggle"]
#: Selection modes.
SelectionMode = enumeration(SelectionModeType)

SizingModeType = Literal["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit"]
#: Sizing mode policies.
SizingMode = enumeration(SizingModeType)

SizingPolicyType = Literal["fixed", "fit", "min", "max"]
#: Individual sizing mode policies.
SizingPolicy = enumeration(SizingPolicyType)

SortDirectionType = Literal["ascending", "descending"]
#: Specify sorting directions.
SortDirection = enumeration(SortDirectionType)

SpatialUnitsType = Literal["screen", "data"]
#: Specify units for mapping values.
SpatialUnits = enumeration(SpatialUnitsType)

StartEndType = Literal["start", "end"]
#: Specify a start/end value.
StartEnd = enumeration(StartEndType)

StepModeType = Literal["before", "after", "center"]
#: Specify a mode for stepwise interpolation.
StepMode = enumeration(*["before", "after", "center"])

TeXDisplayType = Literal["inline", "block", "auto"]
#: Display mode in TeX.
TeXDisplay = enumeration(TeXDisplayType)

TextAlignType = Literal["left", "right", "center"]
#: Specify the horizontal alignment for rendering text.
TextAlign = enumeration(TextAlignType)

TextBaselineType = Literal["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"]
#: Specify the baseline location for rendering text.
TextBaseline = enumeration(TextBaselineType)

TextureRepetitionType = Literal["repeat", "repeat_x", "repeat_y", "no_repeat"]
#: Specify how textures used as canvas patterns should repeat.
TextureRepetition = enumeration(TextureRepetitionType)

TimedeltaResolutionTypeType = Literal["nanoseconds", "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days"]
#: Specify which resolutions should be used for stripping of leading zeros.
TimedeltaResolutionType = enumeration(TimedeltaResolutionTypeType)

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
    "dark_theme",
    "delete",
    "freehand_draw",
    "fullscreen",
    "help",
    "hover",
    "intersect_mode",
    "invert_selection",
    "italic",
    "lasso_select",
    "light_theme",
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
#: Well known tool icon names.
ToolIcon = enumeration(ToolIconType)

ToolNameType = Literal[
  "auto_box_zoom",
  "box_select",
  "box_zoom",
  "click",
  "copy",
  "crosshair",
  "doubletap",
  "examine",
  "freehand_draw",
  "fullscreen",
  "help",
  "hover",
  "lasso_select",
  "pan",
  "pan_down",
  "pan_east",
  "pan_left",
  "pan_north",
  "pan_right",
  "pan_south",
  "pan_up",
  "pan_west",
  "poly_select",
  "redo",
  "reset",
  "save",
  "tap",
  "undo",
  "wheel_zoom",
  "xbox_select",
  "xbox_zoom",
  "xcrosshair",
  "xpan",
  "xwheel_pan",
  "xwheel_zoom",
  "xzoom_in",
  "xzoom_out",
  "ybox_select",
  "ybox_zoom",
  "ycrosshair",
  "ypan",
  "ywheel_pan",
  "ywheel_zoom",
  "yzoom_in",
  "yzoom_out",
  "zoom_in",
  "zoom_out",
]
#: Known tool names/aliases.
ToolName = enumeration(ToolNameType)

TooltipAttachmentType = Literal["horizontal", "vertical", "left", "right", "above", "below"]
#: Specify an attachment for tooltips.
TooltipAttachment = enumeration(TooltipAttachmentType)

TooltipFieldFormatterType = Literal["numeral", "datetime", "printf"]
#: Specify how a format string for a tooltip field should be interpreted.
TooltipFieldFormatter = enumeration(TooltipFieldFormatterType)

TrackPolicyType = Literal["auto", "min", "max", "flex", "fixed"]
#: Grid track (row/column) sizing policies.
TrackPolicy = enumeration(TrackPolicyType)

VerticalAlignType = Literal["top", "middle", "bottom"]
#: Specify the vertical alignment for rendering text.
VerticalAlign = enumeration(VerticalAlignType)

VerticalLocationType = Literal["above", "below"]
#: Specify a vertical location in plot layouts.
VerticalLocation = enumeration(VerticalLocationType)

WindowAxisType = Literal["none", "x", "y"]
#: Specify a which axis to use for windowed auto-ranging.
WindowAxis = enumeration(WindowAxisType)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
