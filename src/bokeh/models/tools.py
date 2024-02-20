#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh comes with a number of interactive tools.

There are five types of tool interactions:

.. hlist::
    :columns: 5

    * Pan/Drag
    * Click/Tap
    * Scroll/Pinch
    * Actions
    * Inspectors

For the first three comprise the category of gesture tools, and only
one tool for each gesture can be active at any given time. The active
tool is indicated on the toolbar by a highlight next to the tool.
Actions are immediate or modal operations that are only activated when
their button in the toolbar is pressed. Inspectors are passive tools that
merely report information or annotate the plot in some way, and may
always be active regardless of what other tools are currently active.

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
import difflib
import typing as tp
from math import nan
from typing import Literal

# Bokeh imports
from ..core.enums import (
    Anchor,
    Dimension,
    Dimensions,
    KeyModifierType,
    RegionSelectionMode,
    SelectionMode,
    ToolIcon,
    TooltipAttachment,
    TooltipFieldFormatter,
)
from ..core.has_props import abstract
from ..core.properties import (
    Alpha,
    Any,
    AnyRef,
    Auto,
    Bool,
    Color,
    Date,
    Datetime,
    DeprecatedAlias,
    Dict,
    Either,
    Enum,
    Float,
    Image,
    Instance,
    InstanceDefault,
    Int,
    List,
    NonNegative,
    Null,
    Nullable,
    Override,
    Percent,
    Regex,
    Seq,
    String,
    Struct,
    Tuple,
    TypeOfAttr,
)
from ..core.property.struct import Optional
from ..core.validation import error
from ..core.validation.errors import NO_RANGE_TOOL_RANGES
from ..model import Model
from ..util.strings import nice_join
from .annotations import BoxAnnotation, PolyAnnotation, Span
from .callbacks import Callback
from .dom import DOMElement
from .glyphs import (
    HStrip,
    Line,
    LineGlyph,
    LRTBGlyph,
    MultiLine,
    Patches,
    Rect,
    VStrip,
    XYGlyph,
)
from .misc.group_by import GroupBy, GroupByModels, GroupByName
from .nodes import Node
from .ranges import Range
from .renderers import DataRenderer, GlyphRenderer
from .ui import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ActionTool',
    'BoxEditTool',
    'BoxSelectTool',
    'BoxZoomTool',
    'CopyTool',
    'CrosshairTool',
    'CustomAction',
    'CustomJSHover',
    'Drag',
    'EditTool',
    'FreehandDrawTool',
    'FullscreenTool',
    'HelpTool',
    'HoverTool',
    'InspectTool',
    'GestureTool',
    'LassoSelectTool',
    'LineEditTool',
    'PanTool',
    'PointDrawTool',
    'PolyDrawTool',
    'PolyEditTool',
    'PolySelectTool',
    'RangeTool',
    'RedoTool',
    'ResetTool',
    'SaveTool',
    'Scroll',
    'ExamineTool',
    'Tap',
    'TapTool',
    'Tool',
    'ToolProxy',
    'Toolbar',
    'UndoTool',
    'WheelPanTool',
    'WheelZoomTool',
    'ZoomInTool',
    'ZoomOutTool',
)

# TODO can't clone Struct(), so use a lambda for now
Modifiers = lambda **kwargs: Struct(shift=Optional(Bool), ctrl=Optional(Bool), alt=Optional(Bool), **kwargs)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _parse_modifiers(value: str) -> dict[KeyModifierType, bool]:
    keys = [key.strip() for key in value.split("+")]
    modifiers: dict[KeyModifierType, bool] = {}
    for key in keys:
        match key:
            case "alt":   modifiers["alt"]   = True
            case "ctrl":  modifiers["ctrl"]  = True
            case "shift": modifiers["shift"] = True
            case _:
                raise ValueError(f"can't parse '{value}' key modifiers; unknown '{key}' key")
    return modifiers

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def GlyphRendererOf(*types: type[Model]):
    """ Constraints ``GlyphRenderer.glyph`` to the given type or types. """
    return TypeOfAttr(Instance(GlyphRenderer), "glyph", Either(*(Instance(tp) for tp in types)))

@abstract
class Tool(Model):
    ''' A base class for all interactive tool types.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    #Image has to be first! see #12775, temporary fix
    icon = Nullable(Either(Image, Enum(ToolIcon), Regex(r"^\.")), help="""
    An icon to display in the toolbar.

    The icon can provided as well known tool icon name, a CSS class selector,
    a data URI with an ``image/*`` MIME, a path to an image, a PIL ``Image``
    object, or an RGB(A) NumPy array. If ``None``, then the intrinsic icon
    will be used (may depend on tool's configuration).
    """)

    description = Nullable(String, help="""
    A string describing the purpose of this tool. If not defined, an auto-generated
    description will be used. This description will be typically presented in the
    user interface as a tooltip.
    """)

    visible = Bool(default=True, help="""
    Whether a tool button associated with this tool should appear in the toolbar.
    """)

    _known_aliases: tp.ClassVar[dict[str, tp.Callable[[], Tool]]] = {}

    @classmethod
    def from_string(cls, name: str) -> Tool:
        """ Takes a string and returns a corresponding `Tool` instance. """
        constructor = cls._known_aliases.get(name)
        if constructor is not None:
            return constructor()
        else:
            known_names = cls._known_aliases.keys()
            matches, text = difflib.get_close_matches(name.lower(), known_names), "similar"
            if not matches:
                matches, text = known_names, "possible"
            raise ValueError(f"unexpected tool name '{name}', {text} tools are {nice_join(matches)}")

    @classmethod
    def register_alias(cls, name: str, constructor: tp.Callable[[], Tool]) -> None:
        cls._known_aliases[name] = constructor

class ToolProxy(Model):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    tools = List(Instance(Tool))
    active = Bool(default=False)
    disabled = Bool(default=False)

@abstract
class ActionTool(Tool):
    ''' A base class for tools that are buttons in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class PlotActionTool(ActionTool):
    ''' A base class action tools acting on plots.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class GestureTool(Tool):
    ''' A base class for tools that respond to drag events.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class Drag(GestureTool):
    ''' A base class for tools that respond to drag events.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class Scroll(GestureTool):
    ''' A base class for tools that respond to scroll events.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class Tap(GestureTool):
    ''' A base class for tools that respond to tap/click events.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class SelectTool(GestureTool):
    ''' A base class for tools that perform "selections", e.g. ``BoxSelectTool``.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    A list of renderers to hit test against. If unset, defaults to
    all renderers on a plot.
    """)

@abstract
class RegionSelectTool(SelectTool):
    ''' Base class for region selection tools (e.g. box, polygon, lasso).

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    mode = Enum(RegionSelectionMode, default="replace", help="""
    Defines what should happen when a new selection is made. The default
    is to replace the existing selection. Other options are to append to
    the selection, intersect with it or subtract from it.

    Defines what should happen when a new selection is made.

    The default is to replace the existing selection. Other options are to
    append to the selection, intersect with it, subtract from it or compute
    a symmetric difference with it.
    """)

    continuous = Bool(False, help="""
    Whether a selection computation should happen continuously during selection
    gestures, or only once when the selection region is completed.
    """)

    select_every_mousemove = DeprecatedAlias("continuous", since=(3, 1, 0))

    persistent = Bool(default=False, help="""
    Whether the selection overlay should persist after selection gesture
    is completed. This can be paired with setting ``editable = True`` on
    the annotation, to allow to modify the selection.
    """)

    greedy = Bool(default=False, help="""
    Defines whether a hit against a glyph requires full enclosure within
    the selection region (non-greedy) or only an intersection (greedy)
    (i.e. at least one point within the region).
    """)

@abstract
class InspectTool(GestureTool):
    ''' A base class for tools that perform "inspections", e.g. ``HoverTool``.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    toggleable = DeprecatedAlias("visible", since=(3, 4, 0))

class Toolbar(UIElement):
    ''' Collect tools to display for a single plot.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    logo = Nullable(Enum("normal", "grey"), default="normal", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)

    autohide = Bool(default=False, help="""
    Whether the toolbar will be hidden by default. Default: False.
    If True, hides toolbar when cursor is not in canvas.
    """)

    tools = List(Either(Instance(Tool), Instance(ToolProxy)), help="""
    A list of tools to add to the plot.
    """)

    active_drag: Literal["auto"] | Drag | ToolProxy | None = Either(Null, Auto, Instance(Drag), Instance(ToolProxy), default="auto", help="""
    Specify a drag tool to be active when the plot is displayed.
    """)

    active_inspect: Literal["auto"] | InspectTool | ToolProxy | tp.Sequence[InspectTool] | None = \
        Either(Null, Auto, Instance(InspectTool), Instance(ToolProxy), Seq(Instance(InspectTool)), default="auto", help="""
    Specify an inspection tool or sequence of inspection tools to be active when
    the plot is displayed.
    """)

    active_scroll: Literal["auto"] | Scroll | ToolProxy | None = Either(Null, Auto, Instance(Scroll), Instance(ToolProxy), default="auto", help="""
    Specify a scroll/pinch tool to be active when the plot is displayed.
    """)

    active_tap: Literal["auto"] | Tap | ToolProxy | None = Either(Null, Auto, Instance(Tap), Instance(ToolProxy), default="auto", help="""
    Specify a tap/click tool to be active when the plot is displayed.
    """)

    active_multi: Literal["auto"] | GestureTool | ToolProxy | None = Either(Null, Auto, Instance(GestureTool), Instance(ToolProxy), default="auto", help="""
    Specify an active multi-gesture tool, for instance an edit tool or a range
    tool.

    Note that activating a multi-gesture tool will deactivate any other gesture
    tools as appropriate. For example, if a pan tool is set as the active drag,
    and this property is set to a ``BoxEditTool`` instance, the pan tool will
    be deactivated (i.e. the multi-gesture tool will take precedence).
    """)

class PanTool(Drag):
    ''' *toolbar icon*: |pan_icon|

    The pan tool allows the user to pan a Plot by left-dragging a mouse, or on
    touch devices by dragging a finger or stylus, across the plot region.

    The pan tool also activates the border regions of a Plot for "single axis"
    panning. For instance, dragging in the vertical border or axis will effect
    a pan in the vertical direction only, with horizontal dimension kept fixed.

    .. |pan_icon| image:: /_images/icons/Pan.png
        :height: 24px
        :alt: Icon of four arrows meeting in a plus shape representing the pan tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the pan tool is constrained to act in. By default
    the pan tool will pan in any dimension, but can be configured to only
    pan horizontally across the width of the plot, or vertically across the
    height of the plot.
    """)

# TODO InstanceDefault() doesn't allow for lazy argument evaluation
# DEFAULT_RANGE_OVERLAY = InstanceDefault(BoxAnnotation,
DEFAULT_RANGE_OVERLAY = lambda: BoxAnnotation(
    syncable=False,
    level="overlay",
    visible=True,
    editable=True,
    propagate_hover=True,
    left=nan,
    right=nan,
    top=nan,
    bottom=nan,
    left_limit=Node.frame.left,
    right_limit=Node.frame.right,
    top_limit=Node.frame.top,
    bottom_limit=Node.frame.bottom,
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=0.5,
    line_dash=[2, 2],
)

class RangeTool(Tool):
    ''' *toolbar icon*: |range_icon|

    The range tool allows the user to update range objects for either or both
    of the x- or y-dimensions by dragging a corresponding shaded annotation to
    move it or change its boundaries.

    A common use case is to add this tool to a plot with a large fixed range,
    but to configure the tool range from a different plot. When the user
    manipulates the overlay, the range of the second plot will be updated
    automatically.

    .. |range_icon| image:: /_images/icons/Range.png
        :height: 24px


    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_range = Nullable(Instance(Range), help="""
    A range synchronized to the x-dimension of the overlay. If None, the overlay
    will span the entire x-dimension.
    """)

    y_range = Nullable(Instance(Range), help="""
    A range synchronized to the y-dimension of the overlay. If None, the overlay
    will span the entire y-dimension.
    """)

    x_interaction = Bool(default=True, help="""
    Whether to respond to horizontal pan motions when an ``x_range`` is present.

    By default, when an ``x_range`` is specified, it is possible to adjust the
    horizontal position of the range box by panning horizontally inside the
    box, or along the top or bottom edge of the box. To disable this, and fix
    the  range box in place horizontally, set to False. (The box will still
    update if the ``x_range`` is updated programmatically.)
    """)

    y_interaction = Bool(default=True, help="""
    Whether to respond to vertical pan motions when a ``y_range`` is present.

    By default, when a ``y_range`` is specified, it is possible to adjust the
    vertical position of the range box by panning vertically inside the box, or
    along the top or bottom edge of the box. To disable this, and fix the range
    box in place vertically, set to False. (The box will still update if the
    ``y_range`` is updated programmatically.)
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_RANGE_OVERLAY, help="""
    A shaded annotation drawn to indicate the configured ranges.
    """)

    start_gesture = Enum("pan", "tap", "none", default="none", help="""
    Which gesture will start a range update interaction in a new location.

    When the value is ``"pan"``, a new range starts at the location where
    a pointer drag operation begins. The range is updated continuously while
    the drag operation continues. Ending the drag operation sets the final
    value of the range.

    When the value is ``"tap"``, a new range starts at the location where
    a single tap is made. The range is updated continuously while the pointer
    moves. Tapping at another location sets the final value of the range.

    When the value is ``"none"``, only existing range definitions may be
    updated, by dragging their edges or interiors.

    Configuring this property allows to make this tool simultaneously co-exist
    with another tool that would otherwise share a gesture.
    """)

    @error(NO_RANGE_TOOL_RANGES)
    def _check_no_range_tool_ranges(self):
        if self.x_range is None and self.y_range is None:
            return "At least one of RangeTool.x_range or RangeTool.y_range must be configured"

class WheelPanTool(Scroll):
    ''' *toolbar icon*: |wheel_pan_icon|

    The wheel pan tool allows the user to pan the plot along the configured
    dimension using the scroll wheel.

    .. |wheel_pan_icon| image:: /_images/icons/WheelPan.png
        :height: 24px
        :alt: Icon of a mouse shape next to crossed arrows representing the wheel-pan tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    dimension = Enum(Dimension, default="width", help="""
    Which dimension the wheel pan tool is constrained to act in. By default the
    wheel pan tool will pan the plot along the x-axis.
    """)

    modifiers = Modifiers(default={}, help="""
    Allows to configure a combination of modifier keys, which need to
    be pressed during the selected gesture for this tool to trigger.

    For example, to pan only when ``Ctrl`` and ``Shift`` keys are
    pressed, use:

    .. code-block:: python

        tool = WheelPanTool(modifiers=dict(ctrl=True, shift=True))
        plot.add_tools(tool)

    or alternatively using a concise syntax:

    .. code-block:: python

        tool = WheelPanTool(modifiers="ctrl+shift")
        plot.add_tools(tool)

    .. note::
        Setting modifiers allows this tool to be automatically activated,
        if ``Toolbar.active_scroll`` is set to ``"auto"``.

    .. warning::
        Configuring modifiers is a platform dependent feature and
        can make this tool unusable for example on mobile devices.

    """).accepts(String, _parse_modifiers)

class WheelZoomTool(Scroll):
    ''' *toolbar icon*: |wheel_zoom_icon|

    The wheel zoom tool will zoom the plot in and out, centered on the
    current mouse location.

    The wheel zoom tool also activates the border regions of a Plot for
    "single axis" zooming. For instance, zooming in the vertical border or
    axis will effect a zoom in the vertical direction only, with the
    horizontal dimension kept fixed.

    .. |wheel_zoom_icon| image:: /_images/icons/WheelZoom.png
        :height: 24px
        :alt: Icon of a mouse shape next to an hourglass representing the wheel-zoom tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    # ZoomBaseTool common {
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the wheel zoom tool is constrained to act in. By default
    the wheel zoom tool will zoom in any dimension, but can be configured to
    only zoom horizontally across the width of the plot, or vertically across
    the height of the plot.
    """)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    Restrict zoom to ranges used by the provided data renderers. If ``"auto"``
    then all ranges provided by the cartesian frame will be used.
    """)

    level = NonNegative(Int, default=0, help="""
    When working with composite scales (sub-coordinates), this property
    allows to configure which set of ranges to scale. The default is to
    scale top-level (frame) ranges.
    """)
    # }

    hit_test = Bool(default=False, help="""
    Whether to zoom only those renderer that are being pointed at.

    This setting only applies when zooming renderers that were configured with
    sub-coordinates, otherwise it has no effect.

    If ``True``, then ``hit_test_mode`` property defines how hit testing
    is performed and ``hit_test_behavior`` allows to configure other aspects
    of this setup. See respective properties for details.

    .. note::
        This property is experimental and may change at any point
    """)

    hit_test_mode = Enum("point", "hline", "vline", default="point", help="""
    Allows to configure what geometry to use when ``hit_test`` is enabled.

    Supported modes are ``"point"`` for single point hit testing, and ``hline``
    and ``vline`` for either horizontal or vertical span hit testing.

    .. note::
        This property is experimental and may change at any point
    """)

    hit_test_behavior = Either(Instance(GroupBy), Enum("only_hit"), default="only_hit", help="""
    Allows to configure which renderers will be zoomed when ``hit_test`` is enabled.

    By default (``hit_only``) only actually hit renderers will be zoomed. An
    instance of ``GroupBy`` model can be used to tell what other renderers
    should be zoomed when a given one is hit.

    .. note::
        This property is experimental and may change at any point
    """).accepts(Enum("group_by_name"), lambda _: GroupByName()) \
        .accepts(List(List(Instance(DataRenderer))), lambda groups: GroupByModels(groups=groups))

    maintain_focus = Bool(default=True, help="""
    If True, then hitting a range bound in any one dimension will prevent all
    further zooming all dimensions. If False, zooming can continue
    independently in any dimension that has not yet reached its bounds, even if
    that causes overall focus or aspect ratio to change.
    """)

    zoom_on_axis = Bool(default=True, help="""
    Whether scrolling on an axis (outside the central plot area) should zoom
    that dimension. If enabled, the behavior of this feature can be configured
    with ``zoom_together`` property.
    """)

    zoom_together = Enum("none", "cross", "all", default="all", help="""
    Defines the behavior of the tool when zooming on an axis:

    - ``"none"``
        zoom only the axis that's being interacted with. Any cross
        axes nor any other axes in the dimension of this axis will be affected.
    - ``"cross"``
        zoom the axis that's being interacted with and its cross
        axis, if configured. No other axes in this or cross dimension will be
        affected.
    - ``"all"``
        zoom all axes in the dimension of the axis that's being
        interacted with. All cross axes will be unaffected.
    """)

    speed = Float(default=1/600, help="""
    Speed at which the wheel zooms. Default is 1/600. Optimal range is between
    0.001 and 0.09. High values will be clipped. Speed may very between browsers.
    """)

    modifiers = Modifiers(default={}, help="""
    Allows to configure a combination of modifier keys, which need to
    be pressed during the selected gesture for this tool to trigger.

    For example, to zoom only when ``Ctrl`` and ``Shift`` keys are
    pressed, use:

    .. code-block:: python

        tool = WheelZoomTool(modifiers=dict(ctrl=True, shift=True))
        plot.add_tools(tool)

    or alternatively using a concise syntax:

    .. code-block:: python

        tool = WheelZoomTool(modifiers="ctrl+shift")
        plot.add_tools(tool)

    .. note::
        Setting modifiers allows this tool to be automatically activated,
        if ``Toolbar.active_scroll`` is set to ``"auto"``.

    .. warning::
        Configuring modifiers is a platform dependent feature and
        can make this tool unusable for example on mobile devices.

    """).accepts(String, _parse_modifiers)

class CustomAction(ActionTool):
    ''' Execute a custom action, e.g. ``CustomJS`` callback when a toolbar
    icon is activated.

    Example:

        .. code-block:: python

            tool = CustomAction(icon="icon.png",
                                callback=CustomJS(code='alert("foo")'))

            plot.add_tools(tool)

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    description = Override(default="Perform a Custom Action")

    callback = Nullable(Instance(Callback), help="""
    A Bokeh callback to execute when the custom action icon is activated.
    """)

class SaveTool(ActionTool):
    ''' *toolbar icon*: |save_icon|

    The save tool is an action. When activated, the tool opens a download dialog
    which allows to save an image reproduction of the plot in PNG format. If
    automatic download is not support by a web browser, the tool falls back to
    opening the generated image in a new tab or window. User then can manually
    save it by right clicking on the image and choosing "Save As" (or similar)
    menu item.

    .. |save_icon| image:: /_images/icons/Save.png
        :height: 24px
        :alt: Icon of a floppy disk representing the save tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    filename = Nullable(String, help="""
    Optional string specifying the filename of the saved image (extension not
    needed). If a filename is not provided or set to None, the user is prompted
    for a filename at save time.
    """)

class CopyTool(ActionTool):
    ''' *toolbar icon*: |copy_icon|

    The copy tool is an action tool, that allows copying the rendererd contents of
    a plot or a collection of plots to system's clipboard. This tools is browser
    dependent and may not function in certain browsers, or require additional
    permissions to be granted to the web page.

    .. |copy_icon| image:: /_images/icons/Copy.png
        :height: 24px

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ResetTool(PlotActionTool):
    ''' *toolbar icon*: |reset_icon|

    The reset tool is an action. When activated in the toolbar, the tool resets
    the data bounds of the plot to their values when the plot was initially
    created.

    .. |reset_icon| image:: /_images/icons/Reset.png
        :height: 24px
        :alt: Icon of two arrows on a circular arc forming a circle representing the reset tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class TapTool(Tap, SelectTool):
    ''' *toolbar icon*: |tap_icon|

    The tap selection tool allows the user to select at single points by
    left-clicking a mouse, or tapping with a finger.

    See :ref:`ug_styling_plots_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. |tap_icon| image:: /_images/icons/Tap.png
        :height: 24px
        :alt:  Icon of two concentric circles with a + in the lower right representing the tap tool in the toolbar.

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the SHIFT key
        while making a selection to append the new selection to any
        previous selection that might exist.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    mode = Enum(SelectionMode, default="toggle", help="""
    Defines what should happen when a new selection is made.

    The default is to toggle the existing selection. Other options are to
    replace the selection, append to it, intersect with it, subtract from
    it or compute a symmetric difference with it.
    """)

    behavior = Enum("select", "inspect", default="select", help="""
    This tool can be configured to either make selections or inspections
    on associated data sources. The difference is that selection changes
    propagate across bokeh and other components (e.g. selection glyph)
    will be notified. Inspections don't act like this, so it's useful to
    configure `callback` when setting `behavior='inspect'`.
    """)

    gesture = Enum("tap", "doubletap", default="tap", help="""
    Specifies which kind of gesture will be used to trigger the tool,
    either a single or double tap.
    """)

    modifiers = Modifiers(default={}, help="""
    Allows to configure a combination of modifier keys, which need to
    be pressed during the selected gesture for this tool to trigger.

    For example, to accept tap events only when ``Ctrl`` and ``Shift``
    keys are pressed, use:

    .. code-block:: python

        tool = TapTool(modifiers=dict(ctrl=True, shift=True))
        plot.add_tools(tool)

    or alternatively using a concise syntax:

    .. code-block:: python

        tool = TapTool(modifiers="ctrl+shift")
        plot.add_tools(tool)

    .. warning::
        Configuring modifiers is a platform dependent feature and
        can make this tool unusable for example on mobile devices.

    """).accepts(String, _parse_modifiers)

    callback = Nullable(Instance(Callback), help="""
    A callback to execute *whenever a glyph is "hit"* by a mouse click
    or tap.

    This is often useful with the  :class:`~bokeh.models.callbacks.OpenURL`
    model to open URLs based on a user clicking or tapping a specific glyph.

    However, it may also be a :class:`~bokeh.models.callbacks.CustomJS`
    which can execute arbitrary JavaScript code in response to clicking or
    tapping glyphs. The callback will be executed for each individual glyph
    that is it hit by a click or tap, and will receive the ``TapTool`` model
    as  ``cb_obj``. The optional ``cb_data`` will have the data source as
    its ``.source`` attribute and the selection geometry as its
    ``.geometries`` attribute.

    The ``.geometries`` attribute has 5 members.
    ``.type`` is the geometry type, which always a ``.point`` for a tap event.
    ``.sx`` and ``.sy`` are the screen X and Y coordinates where the tap occurred.
    ``.x`` and ``.y`` are the converted data coordinates for the item that has
    been selected. The ``.x`` and ``.y`` values are based on the axis assigned
    to that glyph.

    .. note::
        This callback does *not* execute on every tap, only when a glyph is
        "hit". If you would like to execute a callback on every mouse tap,
        please see :ref:`ug_interaction_js_callbacks_customjs_js_on_event`.

    """)

class CrosshairTool(InspectTool):
    ''' *toolbar icon*: |crosshair_icon|

    The crosshair tool is a passive inspector tool. It is generally on at all
    times, but can be configured in the inspector's menu associated with the
    *toolbar icon* shown above.

    The crosshair tool draws a crosshair annotation over the plot, centered on
    the current mouse position. The crosshair tool may be configured to draw
    across only one dimension by setting the ``dimension`` property to only
    ``width`` or ``height``.

    .. |crosshair_icon| image:: /_images/icons/Crosshair.png
        :height: 24px
        :alt: Icon of circle with aiming reticle marks representing the crosshair tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    overlay = Either(
        Auto,
        Instance(Span),
        Tuple(Instance(Span), Instance(Span)), default="auto", help="""
    An annotation drawn to indicate the crosshair.

    If ``"auto"``, this will create spans depending on the ``dimensions``
    property, which based on its value, will result in either one span
    (horizontal or vertical) or two spans (horizontal and vertical).

    Alternatively the user can provide one ``Span`` instance, where the
    dimension is indicated by the ``dimension`` property of the ``Span``.
    Also two ``Span`` instances can be provided. Providing explicit
    ``Span`` instances allows for constructing linked crosshair, when
    those instances are shared between crosshair tools of different plots.

    .. note::
        This property is experimental and may change at any point. In
        particular in future this will allow using other annotations
        than ``Span`` and annotation groups.
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the crosshair tool is to track. By default, both vertical
    and horizontal lines will be drawn. If only "width" is supplied, only a
    horizontal line will be drawn. If only "height" is supplied, only a
    vertical line will be drawn.
    """)

    line_color = Color(default="black", help="""
    A color to use to stroke paths with.
    """)

    line_alpha = Alpha(help="""
    An alpha value to use to stroke paths with.
    """)

    line_width = Float(default=1, help="""
    Stroke width in units of pixels.
    """)

DEFAULT_BOX_ZOOM_OVERLAY = InstanceDefault(BoxAnnotation,
    syncable=False,
    level="overlay",
    visible=False,
    editable=False,
    left=nan,
    right=nan,
    top=nan,
    bottom=nan,
    top_units="canvas",
    left_units="canvas",
    bottom_units="canvas",
    right_units="canvas",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4],
)

DEFAULT_BOX_SELECT_OVERLAY = InstanceDefault(BoxAnnotation,
    syncable=False,
    level="overlay",
    visible=False,
    editable=True,
    left=nan,
    right=nan,
    top=nan,
    bottom=nan,
    top_units="data",
    left_units="data",
    bottom_units="data",
    right_units="data",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4],
)

class BoxZoomTool(Drag):
    ''' *toolbar icon*: |box_zoom_icon|

    The box zoom tool allows users to define a rectangular region of a Plot to
    zoom to by dragging he mouse or a finger over the plot region. The end of
    the drag event indicates the selection region is ready.

    .. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
        :height: 24px
        :alt: Icon of a dashed box with a magnifying glass in the upper right representing the box-zoom tool in the toolbar.

    .. note::
        ``BoxZoomTool`` is incompatible with ``GMapPlot`` due to the manner in
        which Google Maps exert explicit control over aspect ratios. Adding
        this tool to a ``GMapPlot`` will have no effect.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    dimensions = Either(Enum(Dimensions), Auto, default="both", help="""
    Which dimensions the zoom box is to be free in. By default, users may
    freely draw zoom boxes with any dimensions. If only "width" is supplied,
    the box will be constrained to span the entire vertical space of the plot,
    only the horizontal dimension can be controlled. If only "height" is
    supplied, the box will be constrained to span the entire horizontal space
    of the plot, and the vertical dimension can be controlled.
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_ZOOM_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

    match_aspect = Bool(default=False, help="""
    Whether the box zoom region should be restricted to have the same
    aspect ratio as the plot region.

    .. note::
        If the tool is restricted to one dimension, this value has
        no effect.

    """)

    origin = Enum("corner", "center", default="corner", help="""
    Indicates whether the rectangular zoom area should originate from a corner
    (top-left or bottom-right depending on direction) or the center of the box.
    """)

@abstract
class ZoomBaseTool(PlotActionTool):
    """ Abstract base class for zoom action tools. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    Restrict zoom to ranges used by the provided data renderers. If ``"auto"``
    then all ranges provided by the cartesian frame will be used.
    """)

    # TODO ZoomInTool dimensions should probably be constrained to be the same as ZoomOutTool
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom tool is constrained to act in. By default
    the tool will zoom in any dimension, but can be configured to only
    zoom horizontally across the width of the plot, or vertically across
    the height of the plot.
    """)

    factor = Percent(default=0.1, help="""
    Percentage of the range to zoom for each usage of the tool.
    """)

    level = NonNegative(Int, default=0, help="""
    When working with composite scales (sub-coordinates), this property
    allows to configure which set of ranges to scale. The default is to
    scale top-level (frame) ranges.
    """)

class ZoomInTool(ZoomBaseTool):
    ''' *toolbar icon*: |zoom_in_icon|

    The zoom-in tool allows users to click a button to zoom in
    by a fixed amount.

    .. |zoom_in_icon| image:: /_images/icons/ZoomIn.png
        :height: 24px
        :alt: Icon of a plus sign next to a magnifying glass representing the zoom-in tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ZoomOutTool(ZoomBaseTool):
    ''' *toolbar icon*: |zoom_out_icon|

    The zoom-out tool allows users to click a button to zoom out
    by a fixed amount.

    .. |zoom_out_icon| image:: /_images/icons/ZoomOut.png
        :height: 24px
        :alt: Icon of a minus sign next to a magnifying glass representing the zoom-out tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    maintain_focus = Bool(default=True, help="""
    If ``True``, then hitting a range bound in any one dimension will prevent
    all further zooming in all dimensions. If ``False``, zooming can continue
    independently in any dimension that has not yet reached its bounds, even
    if that causes overall focus or aspect ratio to change.
    """)

class BoxSelectTool(Drag, RegionSelectTool):
    ''' *toolbar icon*: |box_select_icon|

    The box selection tool allows users to make selections on a Plot by showing
    a rectangular region by dragging the mouse or a finger over the plot area.
    The end of the drag event indicates the selection region is ready.

    See :ref:`ug_styling_plots_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.


    .. |box_select_icon| image:: /_images/icons/BoxSelect.png
        :height: 24px
        :alt: Icon of a dashed box with a + in the lower right representing the box-selection tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the box selection is to be free in. By default, users may
    freely draw selections boxes with any dimensions. If only "width" is set,
    the box will be constrained to span the entire vertical space of the plot,
    only the horizontal dimension can be controlled. If only "height" is set,
    the box will be constrained to span the entire horizontal space of the
    plot, and the vertical dimension can be controlled.
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_SELECT_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

    origin = Enum("corner", "center", default="corner", help="""
    Indicates whether the rectangular selection area should originate from a corner
    (top-left or bottom-right depending on direction) or the center of the box.
    """)

DEFAULT_POLY_OVERLAY = InstanceDefault(PolyAnnotation,
    syncable=False,
    level="overlay",
    visible=False,
    editable=True,
    xs_units="data",
    ys_units="data",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4],
)

class LassoSelectTool(Drag, RegionSelectTool):
    ''' *toolbar icon*: |lasso_select_icon|

    The lasso selection tool allows users to make selections on a Plot by
    indicating a free-drawn "lasso" region by dragging the mouse or a finger
    over the plot region. The end of the drag event indicates the selection
    region is ready.

    See :ref:`ug_styling_plots_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. note::
        Selections can be comprised of multiple regions, even those made by
        different selection tools. Hold down the SHIFT key while making a
        selection to append the new selection to any previous selection that
        might exist.

    .. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
        :height: 24px
        :alt:  Icon of a looped lasso shape representing the lasso-selection tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    overlay = Instance(PolyAnnotation, default=DEFAULT_POLY_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

    continuous = Override(default=True)

class PolySelectTool(Tap, RegionSelectTool):
    ''' *toolbar icon*: |poly_select_icon|

    The polygon selection tool allows users to make selections on a
    Plot by indicating a polygonal region with mouse clicks. single
    clicks (or taps) add successive points to the definition of the
    polygon, and a press click (or tap) indicates the selection
    region is ready.

    See :ref:`ug_styling_plots_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the SHIFT key
        while making a selection to append the new selection to any
        previous selection that might exist.

    .. |poly_select_icon| image:: /_images/icons/PolygonSelect.png
        :height: 24px
        :alt: Icon of a dashed trapezoid with an arrow pointing at the lower right representing the polygon-selection tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    overlay = Instance(PolyAnnotation, default=DEFAULT_POLY_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

class CustomJSHover(Model):
    ''' Define a custom formatter to apply to a hover tool field.

    This model can be configured with JavaScript code to format hover tooltips.
    The JavaScript code has access to the current value to format, some special
    variables, and any format configured on the tooltip. The variable ``value``
    will contain the untransformed value. The variable ``special_vars`` will
    provide a dict with the following contents:

    * ``x`` data-space x-coordinate of the mouse
    * ``y`` data-space y-coordinate of the mouse
    * ``sx`` screen-space x-coordinate of the mouse
    * ``sy`` screen-space y-coordinate of the mouse
    * ``data_x`` data-space x-coordinate of the hovered glyph
    * ``data_y`` data-space y-coordinate of the hovered glyph
    * ``indices`` column indices of all currently hovered glyphs
    * ``name`` value of the ``name`` property of the hovered glyph renderer

    If the hover is over a "multi" glyph such as ``Patches`` or ``MultiLine``
    then a ``segment_index`` key will also be present.

    Finally, the value of the format passed in the tooltip specification is
    available as the ``format`` variable.

    Example:

        As an example, the following code adds a custom formatter to format
        WebMercator northing coordinates (in meters) as a latitude:

        .. code-block:: python

            lat_custom = CustomJSHover(code="""
                const projections = Bokeh.require("core/util/projections");
                const x = special_vars.x
                const y = special_vars.y
                const coords = projections.wgs84_mercator.invert(x, y)
                return "" + coords[1]
            """)

            p.add_tools(HoverTool(
                tooltips=[( 'lat','@y{custom}' )],
                formatters={'@y':lat_custom}
            ))

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    args = Dict(String, AnyRef, help="""
    A mapping of names to Bokeh plot objects. These objects are made available
    to the callback code snippet as the values of named parameters to the
    callback.
    """)

    code = String(default="", help="""
    A snippet of JavaScript code to transform a single value. The variable
    ``value`` will contain the untransformed value and can be expected to be
    present in the function namespace at render time. Additionally, the
    variable ``special_vars`` will be available, and will provide a dict
    with the following contents:

    * ``x`` data-space x-coordinate of the mouse
    * ``y`` data-space y-coordinate of the mouse
    * ``sx`` screen-space x-coordinate of the mouse
    * ``sy`` screen-space y-coordinate of the mouse
    * ``data_x`` data-space x-coordinate of the hovered glyph
    * ``data_y`` data-space y-coordinate of the hovered glyph
    * ``indices`` column indices of all currently hovered glyphs

    If the hover is over a "multi" glyph such as ``Patches`` or ``MultiLine``
    then a ``segment_index`` key will also be present.

    Finally, the value of the format passed in the tooltip specification is
    available as the ``format`` variable.

    The snippet will be made into the body of a function and therefore requires
    a return statement.

    **Example**

    .. code-block:: javascript

        code = '''
        return value + " total"
        '''
    """)

class HoverTool(InspectTool):
    ''' *toolbar icon*: |hover_icon|

    The hover tool is a passive inspector tool. It is generally on at all
    times, but can be configured in the inspector's menu associated with the
    *toolbar icon* shown above.

    By default, the hover tool displays informational tooltips whenever the
    cursor is directly over a glyph. The data to show comes from the glyph's
    data source, and what to display is configurable with the ``tooltips``
    property that maps display names to columns in the data source, or to
    special known variables.

    Here is an example of how to configure and use the hover tool::

        # Add tooltip (name, field) pairs to the tool. See below for a
        # description of possible field values.
        hover.tooltips = [
            ("index", "$index"),
            ("(x,y)", "($x, $y)"),
            ("radius", "@radius"),
            ("fill color", "$color[hex, swatch]:fill_color"),
            ("fill color", "$color[hex]:fill_color"),
            ("fill color", "$color:fill_color"),
            ("fill color", "$swatch:fill_color"),
            ("foo", "@foo"),
            ("bar", "@bar"),
            ("baz", "@baz{safe}"),
            ("total", "@total{$0,0.00}"),
        ]

    You can also supply a ``Callback`` to the ``HoverTool``, to build custom
    interactions on hover. In this case you may want to turn the tooltips
    off by setting ``tooltips=None``.

    .. warning::
        When supplying a callback or custom template, the explicit intent
        of this Bokeh Model is to embed *raw HTML and  JavaScript code* for
        a browser to execute. If any part of the code is derived from untrusted
        user inputs, then you must take appropriate care to sanitize the user
        input prior to passing to Bokeh.

    Hover tool does not currently work with the following glyphs:

    .. hlist::
        :columns: 3

        * annulus
        * arc
        * bezier
        * image_url
        * oval
        * patch
        * quadratic
        * ray
        * step
        * text

    .. |hover_icon| image:: /_images/icons/Hover.png
        :height: 24px
        :alt: Icon of a popup tooltip with abstract lines of text representing the hover tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    A list of renderers to hit test against. If unset, defaults to
    all renderers on a plot.
    """)

    callback = Nullable(Instance(Callback), help="""
    A callback to run in the browser whenever the input's value changes. The
    ``cb_data`` parameter that is available to the Callback code will contain two
    ``HoverTool`` specific fields:

    :index: object containing the indices of the hovered points in the data source
    :geometry: object containing the coordinates of the hover cursor
    """)

    tooltips = Either(Null, Instance(DOMElement), String, List(Tuple(String, String)),
        default=[
            ("index","$index"),
            ("data (x, y)","($x, $y)"),
            ("screen (x, y)","($sx, $sy)"),
        ], help="""
    The (name, field) pairs describing what the hover tool should
    display when there is a hit.

    Field names starting with "@" are interpreted as columns on the
    data source. For instance, "@temp" would look up values to display
    from the "temp" column of the data source.

    Field names starting with "$" are special, known fields:

    :$index: index of hovered point in the data source
    :$name: value of the ``name`` property of the hovered glyph renderer
    :$x: x-coordinate under the cursor in data space
    :$y: y-coordinate under the cursor in data space
    :$sx: x-coordinate under the cursor in screen (canvas) space
    :$sy: y-coordinate under the cursor in screen (canvas) space
    :$color: color data from data source, with the syntax:
        ``$color[options]:field_name``. The available options
        are: ``hex`` (to display the color as a hex value), ``swatch``
        (color data from data source displayed as a small color box)
    :$swatch: color data from data source displayed as a small color box

    Field names that begin with ``@`` are associated with columns in a
    ``ColumnDataSource``. For instance the field name ``"@price"`` will
    display values from the ``"price"`` column whenever a hover is triggered.
    If the hover is for the 17th glyph, then the hover tooltip will
    correspondingly display the 17th price value.

    Note that if a column name contains spaces, the it must be supplied by
    surrounding it in curly braces, e.g. ``@{adjusted close}`` will display
    values from a column named ``"adjusted close"``.

    Sometimes (especially with stacked charts) it is desirable to allow the
    name of the column be specified indirectly. The field name ``@$name`` is
    distinguished in that it will look up the ``name`` field on the hovered
    glyph renderer, and use that value as the column name. For instance, if
    a user hovers with the name ``"US East"``, then ``@$name`` is equivalent to
    ``@{US East}``.

    By default, values for fields (e.g. ``@foo``) are displayed in a basic
    numeric format. However it is possible to control the formatting of values
    more precisely. Fields can be modified by appending a format specified to
    the end in curly braces. Some examples are below.

    .. code-block:: python

        "@foo{0,0.000}"    # formats 10000.1234 as: 10,000.123

        "@foo{(.00)}"      # formats -10000.1234 as: (10000.123)

        "@foo{($ 0.00 a)}" # formats 1230974 as: $ 1.23 m

    Specifying a format ``{safe}`` after a field name will override automatic
    escaping of the tooltip data source. Any HTML tags in the data tags will
    be rendered as HTML in the resulting HoverTool output. See
    :ref:`custom_hover_tooltip` for a more detailed example.

    ``None`` is also a valid value for tooltips. This turns off the
    rendering of tooltips. This is mostly useful when supplying other
    actions on hover via the callback property.

    .. note::
        The tooltips attribute can also be configured with a mapping type,
        e.g. ``dict`` or ``OrderedDict``.

    """).accepts(Dict(String, String), lambda d: list(d.items()))

    formatters = Dict(String, Either(Enum(TooltipFieldFormatter), Instance(CustomJSHover)), default=lambda: dict(), help="""
    Specify the formatting scheme for data source columns, e.g.

    .. code-block:: python

        tool.formatters = {"@date": "datetime"}

    will cause format specifications for the "date" column to be interpreted
    according to the "datetime" formatting scheme. The following schemes are
    available:

    :"numeral":
        Provides a wide variety of formats for numbers, currency, bytes, times,
        and percentages. The full set of formats can be found in the
        |NumeralTickFormatter| reference documentation.

    :"datetime":
        Provides formats for date and time values. The full set of formats is
        listed in the |DatetimeTickFormatter| reference documentation.

    :"printf":
        Provides formats similar to C-style "printf" type specifiers. See the
        |PrintfTickFormatter| reference documentation for complete details.

    If no formatter is specified for a column name, the default ``"numeral"``
    formatter is assumed.

    .. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
    .. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
    .. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

    """)

    mode = Enum("mouse", "hline", "vline", help="""
    Whether to consider hover pointer as a point (x/y values), or a
    span on h or v directions.
    """)

    muted_policy = Enum("show", "ignore",
                        default="show", help="""
    Whether to avoid showing tooltips on muted glyphs.
    """)

    point_policy = Enum("snap_to_data", "follow_mouse", "none", help="""
    Whether the tooltip position should snap to the "center" (or other anchor)
    position of the associated glyph, or always follow the current mouse cursor
    position.
    """)

    line_policy = Enum("prev", "next", "nearest", "interp", "none",
                       default="nearest", help="""
    Specifies where the tooltip will be positioned when hovering over line
    glyphs:

    :"prev": between the nearest two adjacent line points, positions the
        tooltip at the point with the lower ("previous") index
    :"next": between the nearest two adjacent line points, positions the
        tooltip at the point with the higher ("next") index
    :"nearest": between the nearest two adjacent line points, positions the
        tooltip on the point that is nearest to the mouse cursor location
    :"interp": positions the tooltip at an interpolated point on the segment
        joining the two nearest adjacent line points.
    :"none": positions the tooltip directly under the mouse cursor location

    """)

    anchor = Enum(Anchor, default="center", help="""
    If point policy is set to `"snap_to_data"`, `anchor` defines the attachment
    point of a tooltip. The default is to attach to the center of a glyph.
    """)

    attachment = Enum(TooltipAttachment, help="""
    Whether the tooltip should be displayed to the left or right of the cursor
    position or above or below it, or if it should be automatically placed
    in the horizontal or vertical dimension.
    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be shown.
    """)

DEFAULT_HELP_TIP = "Click the question mark to learn more about Bokeh plot tools."
DEFAULT_HELP_URL = "https://docs.bokeh.org/en/latest/docs/user_guide/interaction/tools.html"

class HelpTool(ActionTool):
    ''' A button tool to provide a "help" link to users.

    The hover text can be customized through the ``help_tooltip`` attribute
    and the redirect site overridden as well.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    description = Override(default=DEFAULT_HELP_TIP)

    redirect = String(default=DEFAULT_HELP_URL, help="""
    Site to be redirected through upon click.
    """)

class ExamineTool(ActionTool):
    ''' A tool that allows to inspect and configure a model. '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class FullscreenTool(ActionTool):
    ''' A tool that allows to enlarge a UI element to fullscreen. '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class UndoTool(PlotActionTool):
    ''' *toolbar icon*: |undo_icon|

    Undo tool allows to restore previous state of the plot.

    .. |undo_icon| image:: /_images/icons/Undo.png
        :height: 24px
        :alt: Icon of an arrow on a circular arc pointing to the left representing the undo tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class RedoTool(PlotActionTool):
    ''' *toolbar icon*: |redo_icon|

    Redo tool reverses the last action performed by undo tool.

    .. |redo_icon| image:: /_images/icons/Redo.png
        :height: 24px
        :alt: Icon of an arrow on a circular arc pointing to the right representing the redo tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class EditTool(GestureTool):
    ''' A base class for all interactive draw tool types.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    default_overrides = Dict(String, Any, default={}, help="""
    Padding values overriding ``ColumnarDataSource.default_values``.

    Defines values to insert into non-coordinate columns when a new glyph is
    inserted into the ``ColumnDataSource`` columns, e.g. when a circle glyph
    defines ``"x"``, ``"y"`` and ``"color"`` columns, adding a new point will
    add the x and y-coordinates to ``"x"`` and ``"y"`` columns and the color
    column will be filled with the defined default value.
    """)

    empty_value = Either(Bool, Int, Float, Date, Datetime, Color, String, default=0, help="""
    The "last resort" padding value.

    This is used the same as ``default_values``, when the tool was unable
    to figure out a default value otherwise. The tool will try the following
    alternatives in order:

    1. ``EditTool.default_overrides``
    2. ``ColumnarDataSource.default_values``
    3. ``ColumnarDataSource``'s inferred default values
    4. ``EditTool.empty_value``
    """)

    # TODO abstract renderers = List(Instance(GlyphRenderer & ...))

@abstract
class PolyTool(EditTool):
    ''' A base class for polygon draw/edit tools. '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    vertex_renderer = Nullable(GlyphRendererOf(XYGlyph), help="""
    The renderer used to render the vertices of a selected line or polygon.
    """)

class BoxEditTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |box_edit_icon|

    Allows drawing, dragging and deleting box-like glyphs (e.g. ``Block``,
    ``Rect``, ``HStrip``) on one or more renderers by editing the underlying
    ``ColumnDataSource`` data. Like other drawing tools, the renderers that
    are to be edited must be supplied explicitly as a list. When drawing a
    new box the data will always be added to the ``ColumnDataSource`` on
    the first supplied renderer.

    The tool will modify the columns on the data source corresponding to the
    ``x``, ``y``, ``width`` and ``height`` values of the glyph. Any additional
    columns in the data source will be padded with ``empty_value``, when adding
    a new box.

    The supported actions include:

    * Add box: Hold shift then click and drag anywhere on the plot or press
      once to start drawing, move the mouse and press again to finish drawing.

    * Move box: Click and drag an existing box, the box will be dropped once
      you let go of the mouse button.

    * Delete box: Tap a box to select it then press BACKSPACE key while the
      mouse is within the plot area.

    To **Move** or **Delete** multiple boxes at once:

    * Move selection: Select box(es) with SHIFT+tap (or another selection
      tool) then drag anywhere on the plot. Selecting and then dragging on a
      specific box will move both.

    * Delete selection: Select box(es) with SHIFT+tap (or another selection
      tool) then press BACKSPACE while the mouse is within the plot area.

    .. |box_edit_icon| image:: /_images/icons/BoxEdit.png
        :height: 24px
        :alt: Icon of a solid line box with a plus sign in the lower right representing the box-edit tool in the toolbar.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(LRTBGlyph, Rect, HStrip, VStrip), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the box drawing is to be free in. By default, users may
    freely draw boxes with any dimensions. If only "width" is set, the box will
    be constrained to span the entire vertical space of the plot, only the
    horizontal dimension can be controlled. If only "height" is set, the box
    will be constrained to span the entire horizontal space of the plot, and the
    vertical dimension can be controlled.
    """)

    num_objects = Int(default=0, help="""
    Defines a limit on the number of boxes that can be drawn. By default there
    is no limit on the number of objects, but if enabled the oldest drawn box
    will be dropped to make space for the new box being added.
    """)

class PointDrawTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |point_draw_icon|

    The PointDrawTool allows adding, dragging and deleting point-like glyphs
    (i.e subclasses of ``XYGlyph``) on one or more renderers by editing the
    underlying ``ColumnDataSource`` data. Like other drawing tools, the
    renderers that are to be edited must be supplied explicitly as a list. Any
    newly added points will be inserted on the ``ColumnDataSource`` of the
    first supplied renderer.

    The tool will modify the columns on the data source corresponding to the
    ``x`` and ``y`` values of the glyph. Any additional columns in the data
    source will be padded with the given ``empty_value`` when adding a new
    point.

    .. note::
        The data source updates will trigger data change events continuously
        throughout the edit operations on the BokehJS side. In Bokeh server
        apps, the data source will only be synced once, when the edit operation
        finishes.

    The supported actions include:

    * Add point: Tap anywhere on the plot

    * Move point: Tap and drag an existing point, the point will be
      dropped once you let go of the mouse button.

    * Delete point: Tap a point to select it then press BACKSPACE
      key while the mouse is within the plot area.

    .. |point_draw_icon| image:: /_images/icons/PointDraw.png
        :height: 24px
        :alt: Icon of three points with an arrow pointing to one representing the point-edit tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(XYGlyph), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

    add = Bool(default=True, help="""
    Enables adding of new points on tap events.
    """)

    drag = Bool(default=True, help="""
    Enables dragging of existing points on pan events.
    """)

    num_objects = Int(default=0, help="""
    Defines a limit on the number of points that can be drawn. By default there
    is no limit on the number of objects, but if enabled the oldest drawn point
    will be dropped to make space for the new point.
    """)

class PolyDrawTool(PolyTool, Drag, Tap):
    ''' *toolbar icon*: |poly_draw_icon|

    The PolyDrawTool allows drawing, selecting and deleting ``Patches`` and
    ``MultiLine`` glyphs on one or more renderers by editing the underlying
    ``ColumnDataSource`` data. Like other drawing tools, the renderers that
    are to be edited must be supplied explicitly.

    The tool will modify the columns on the data source corresponding to the
    ``xs`` and ``ys`` values of the glyph. Any additional columns in the data
    source will be padded with the declared ``empty_value``, when adding a new
    point.

    If a ``vertex_renderer`` with an point-like glyph is supplied then the
    ``PolyDrawTool`` will use it to display the vertices of the multi-lines or
    patches on all supplied renderers. This also enables the ability to snap
    to existing vertices while drawing.

    The supported actions include:

    * Add patch or multi-line: press to add the first vertex, then use tap
      to add each subsequent vertex, to finalize the draw action press to
      insert the final vertex or press the ESC key.

    * Move patch or multi-line: Tap and drag an existing patch/multi-line, the
      point will be dropped once you let go of the mouse button.

    * Delete patch or multi-line: Tap a patch/multi-line to select it then
      press BACKSPACE key while the mouse is within the plot area.

    .. |poly_draw_icon| image:: /_images/icons/PolyDraw.png
        :height: 24px
        :alt: Icon of a solid line trapezoid with an arrow pointing at the lower right representing the polygon-draw tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(MultiLine, Patches), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

    drag = Bool(default=True, help="""
    Enables dragging of existing patches and multi-lines on pan events.
    """)

    num_objects = Int(default=0, help="""
    Defines a limit on the number of patches or multi-lines that can be drawn.
    By default there is no limit on the number of objects, but if enabled the
    oldest drawn patch or multi-line will be dropped to make space for the new
    patch or multi-line.
    """)

class FreehandDrawTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |freehand_draw_icon|

    Allows freehand drawing of ``Patches`` and ``MultiLine`` glyphs. The glyph
    to draw may be defined via the ``renderers`` property.

    The tool will modify the columns on the data source corresponding to the
    ``xs`` and ``ys`` values of the glyph. Any additional columns in the data
    source will be padded with the declared ``empty_value``, when adding a new
    point.

    The supported actions include:

    * Draw vertices: Click and drag to draw a line

    * Delete patch/multi-line: Tap a patch/multi-line to select it then press
      BACKSPACE key while the mouse is within the plot area.

    .. |freehand_draw_icon| image:: /_images/icons/FreehandDraw.png
        :height: 24px
        :alt: Icon of a pen drawing a wavy line representing the freehand-draw tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(MultiLine, Patches), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

    num_objects = Int(default=0, help="""
    Defines a limit on the number of patches or multi-lines that can be drawn.
    By default there is no limit on the number of objects, but if enabled the
    oldest drawn patch or multi-line will be overwritten when the limit is
    reached.
    """)

class PolyEditTool(PolyTool, Drag, Tap):
    ''' *toolbar icon*: |poly_edit_icon|

    The PolyEditTool allows editing the vertices of one or more ``Patches`` or
    ``MultiLine`` glyphs. Glyphs to be edited are defined via the ``renderers``
    property and a renderer for the vertices is set via the ``vertex_renderer``
    property (must render a point-like Glyph (a subclass of ``XYGlyph``).

    The tool will modify the columns on the data source corresponding to the
    ``xs`` and ``ys`` values of the glyph. Any additional columns in the data
    source will be padded with the declared ``empty_value``, when adding a new
    point.

    The supported actions include:

    * Show vertices: press an existing patch or multi-line

    * Add vertex: press an existing vertex to select it, the tool will
      draw the next point, to add it tap in a new location. To finish editing
      and add a point press otherwise press the ESC key to cancel.

    * Move vertex: Drag an existing vertex and let go of the mouse button to
      release it.

    * Delete vertex: After selecting one or more vertices press BACKSPACE
      while the mouse cursor is within the plot area.

    .. |poly_edit_icon| image:: /_images/icons/PolyEdit.png
        :height: 24px
        :alt: Icon of two lines meeting in a vertex with an arrow pointing at it representing the polygon-edit tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(MultiLine, Patches), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

class LineEditTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |line_edit_icon|

    The LineEditTool allows editing the intersection points of one or more ``Line`` glyphs.
    Glyphs to be edited are defined via the ``renderers``
    property and a renderer for the intersections is set via the ``intersection_renderer``
    property (must render a point-like Glyph (a subclass of ``XYGlyph``).

    The tool will modify the columns on the data source corresponding to the
    ``x`` and ``y`` values of the glyph. Any additional columns in the data
    source will be padded with the declared ``empty_value``, when adding a new
    point.

    The supported actions include:

    * Show intersections: press an existing line

    * Move point: Drag an existing point and let go of the mouse button to
      release it.

    .. |line_edit_icon| image:: /_images/icons/LineEdit.png
        :height: 24px
        :alt: Icon of a line with a point on it with an arrow pointing at it representing the line-edit tool in the toolbar.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(GlyphRendererOf(Line), help="""
    A list of renderers corresponding to glyphs that may be edited.
    """)

    intersection_renderer = GlyphRendererOf(LineGlyph)(help="""
    The renderer used to render the intersections of a selected line
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions this edit tool is constrained to act in. By default
    the line edit tool allows moving points in any dimension, but can be
    configured to only allow horizontal movement across the width of the
    plot, or vertical across the height of the plot.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Tool.register_alias("pan", lambda: PanTool(dimensions="both"))
Tool.register_alias("xpan", lambda: PanTool(dimensions="width"))
Tool.register_alias("ypan", lambda: PanTool(dimensions="height"))
Tool.register_alias("xwheel_pan", lambda: WheelPanTool(dimension="width"))
Tool.register_alias("ywheel_pan", lambda: WheelPanTool(dimension="height"))
Tool.register_alias("wheel_zoom", lambda: WheelZoomTool(dimensions="both"))
Tool.register_alias("xwheel_zoom", lambda: WheelZoomTool(dimensions="width"))
Tool.register_alias("ywheel_zoom", lambda: WheelZoomTool(dimensions="height"))
Tool.register_alias("zoom_in", lambda: ZoomInTool(dimensions="both"))
Tool.register_alias("xzoom_in", lambda: ZoomInTool(dimensions="width"))
Tool.register_alias("yzoom_in", lambda: ZoomInTool(dimensions="height"))
Tool.register_alias("zoom_out", lambda: ZoomOutTool(dimensions="both"))
Tool.register_alias("xzoom_out", lambda: ZoomOutTool(dimensions="width"))
Tool.register_alias("yzoom_out", lambda: ZoomOutTool(dimensions="height"))
Tool.register_alias("click", lambda: TapTool(behavior="inspect"))
Tool.register_alias("tap", lambda: TapTool())
Tool.register_alias("doubletap", lambda: TapTool(gesture="doubletap"))
Tool.register_alias("crosshair", lambda: CrosshairTool())
Tool.register_alias("xcrosshair", lambda: CrosshairTool(dimensions="width"))
Tool.register_alias("ycrosshair", lambda: CrosshairTool(dimensions="height"))
Tool.register_alias("box_select", lambda: BoxSelectTool())
Tool.register_alias("xbox_select", lambda: BoxSelectTool(dimensions="width"))
Tool.register_alias("ybox_select", lambda: BoxSelectTool(dimensions="height"))
Tool.register_alias("poly_select", lambda: PolySelectTool())
Tool.register_alias("lasso_select", lambda: LassoSelectTool())
Tool.register_alias("box_zoom", lambda: BoxZoomTool(dimensions="both"))
Tool.register_alias("xbox_zoom", lambda: BoxZoomTool(dimensions="width"))
Tool.register_alias("ybox_zoom", lambda: BoxZoomTool(dimensions="height"))
Tool.register_alias("auto_box_zoom", lambda: BoxZoomTool(dimensions="auto"))
Tool.register_alias("save", lambda: SaveTool())
Tool.register_alias("copy", lambda: CopyTool())
Tool.register_alias("undo", lambda: UndoTool())
Tool.register_alias("redo", lambda: RedoTool())
Tool.register_alias("reset", lambda: ResetTool())
Tool.register_alias("help", lambda: HelpTool())
Tool.register_alias("examine", lambda: ExamineTool())
Tool.register_alias("fullscreen", lambda: FullscreenTool())
Tool.register_alias("box_edit", lambda: BoxEditTool())
Tool.register_alias("line_edit", lambda: LineEditTool())
Tool.register_alias("point_draw", lambda: PointDrawTool())
Tool.register_alias("poly_draw", lambda: PolyDrawTool())
Tool.register_alias("poly_edit", lambda: PolyEditTool())
Tool.register_alias("freehand_draw", lambda: FreehandDrawTool())
Tool.register_alias("hover", lambda: HoverTool(tooltips=[
    ("index", "$index"),
    ("data (x, y)", "($x, $y)"),
    ("screen (x, y)", "($sx, $sy)"),
]))
