#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
from typing_extensions import Literal

# Bokeh imports
from ..core.enums import (
    Anchor,
    Dimension,
    Dimensions,
    Location,
    SelectionMode,
    TooltipAttachment,
    TooltipFieldFormatter,
)
from ..core.has_props import abstract
from ..core.properties import (
    Alpha,
    Auto,
    Bool,
    Color,
    Date,
    Datetime,
    Dict,
    Either,
    Enum,
    Float,
    Image,
    Instance,
    Int,
    List,
    NonNullable,
    Null,
    Nullable,
    Override,
    Percent,
    Seq,
    String,
    Tuple,
)
from ..core.validation import error
from ..core.validation.errors import (
    INCOMPATIBLE_BOX_EDIT_RENDERER,
    INCOMPATIBLE_LINE_EDIT_INTERSECTION_RENDERER,
    INCOMPATIBLE_LINE_EDIT_RENDERER,
    INCOMPATIBLE_POINT_DRAW_RENDERER,
    INCOMPATIBLE_POLY_DRAW_RENDERER,
    INCOMPATIBLE_POLY_EDIT_RENDERER,
    INCOMPATIBLE_POLY_EDIT_VERTEX_RENDERER,
    NO_RANGE_TOOL_RANGES,
)
from ..model import Model
from ..util.deprecation import deprecated
from ..util.string import nice_join
from .annotations import BoxAnnotation, PolyAnnotation
from .callbacks import Callback
from .dom import Template
from .glyphs import (
    Line,
    LineGlyph,
    MultiLine,
    Patches,
    Rect,
    XYGlyph,
)
from .layouts import LayoutDOM
from .ranges import Range1d
from .renderers import DataRenderer, GlyphRenderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Action',
    'ActionTool',
    'BoxEditTool',
    'BoxSelectTool',
    'BoxZoomTool',
    'CrosshairTool',
    'CustomAction',
    'CustomJSHover',
    'Drag',
    'EditTool',
    'FreehandDrawTool',
    'HelpTool',
    'HoverTool',
    'Inspection',
    'InspectTool',
    'Gesture',
    'GestureTool',
    'LassoSelectTool',
    'LineEditTool',
    'PanTool',
    'PointDrawTool',
    'PolyDrawTool',
    'PolyEditTool',
    'PolySelectTool',
    'ProxyToolbar',
    'RangeTool',
    'RedoTool',
    'ResetTool',
    'SaveTool',
    'Scroll',
    'Tap',
    'TapTool',
    'Tool',
    'Toolbar',
    'ToolbarBase',
    'ToolbarBox',
    'UndoTool',
    'WheelPanTool',
    'WheelZoomTool',
    'ZoomInTool',
    'ZoomOutTool',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Tool(Model):
    ''' A base class for all interactive tool types.

    '''

    description = Nullable(String, help="""
    A string describing the purpose of this tool. If not defined, an auto-generated
    description will be used. This description will be typically presented in the
    user interface as a tooltip.
    """)

    _known_aliases: tp.ClassVar[tp.Dict[str, tp.Callable[[], "Tool"]]] = {}

    @classmethod
    def from_string(cls, name: str) -> "Tool":
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
    def register_alias(cls, name: str, constructor: tp.Callable[[], "Tool"]) -> None:
        cls._known_aliases[name] = constructor

@abstract
class ActionTool(Tool):
    ''' A base class for tools that are buttons in the toolbar.

    '''
    pass

# TODO: deprecated, remove at bokeh 3.0
Action = ActionTool

@abstract
class GestureTool(Tool):
    ''' A base class for tools that respond to drag events.

    '''
    pass

# TODO: deprecated, remove at bokeh 3.0
Gesture = GestureTool

@abstract
class Drag(GestureTool):
    ''' A base class for tools that respond to drag events.

    '''
    pass

@abstract
class Scroll(GestureTool):
    ''' A base class for tools that respond to scroll events.

    '''
    pass

@abstract
class Tap(GestureTool):
    ''' A base class for tools that respond to tap/click events.

    '''
    pass

@abstract
class SelectTool(GestureTool):
    ''' A base class for tools that perfrom "selections", e.g. ``BoxSelectTool``.

    '''

    names = List(String, help="""
    A list of names to query for. If set, only renderers that have a matching
    value for their ``name`` attribute will be used.

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    """)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    An explicit list of renderers to hit test against. If unset, defaults to
    all renderers on a plot.
    """)

    mode = Enum(SelectionMode, default="replace", help="""
    Defines what should happen when a new selection is made. The default
    is to replace the existing selection. Other options are to append to
    the selection, intersect with it or subtract from it.
    """)

@abstract
class InspectTool(GestureTool):
    ''' A base class for tools that perform "inspections", e.g. ``HoverTool``.

    '''
    toggleable = Bool(True, help="""
    Whether an on/off toggle button should appear in the toolbar for this
    inspection tool. If ``False``, the viewers of a plot will not be able to
    toggle the inspector on or off using the toolbar.
    """)

# TODO: deprecated, remove at bokeh 3.0
Inspection = InspectTool

@abstract
class ToolbarBase(Model):
    ''' A base class for different toolbars.

    '''

    logo = Nullable(Enum("normal", "grey"), default="normal", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)

    autohide = Bool(default=False, help="""
    Whether the toolbar will be hidden by default. Default: False.
    If True, hides toolbar when cursor is not in canvas.
    """)

    tools = List(Instance(Tool), help="""
    A list of tools to add to the plot.
    """)

class Toolbar(ToolbarBase):
    ''' Collect tools to display for a single plot.

    '''

    active_drag: tp.Union[Literal["auto"], Drag, None] = Either(Null, Auto, Instance(Drag), default="auto", help="""
    Specify a drag tool to be active when the plot is displayed.
    """)

    active_inspect: tp.Union[Literal["auto"], InspectTool, tp.Sequence[InspectTool], None] = \
        Either(Null, Auto, Instance(InspectTool), Seq(Instance(InspectTool)), default="auto", help="""
    Specify an inspection tool or sequence of inspection tools to be active when
    the plot is displayed.
    """)

    active_scroll: tp.Union[Literal["auto"], Scroll, None] = Either(Null, Auto, Instance(Scroll), default="auto", help="""
    Specify a scroll/pinch tool to be active when the plot is displayed.
    """)

    active_tap: tp.Union[Literal["auto"], Tap, None] = Either(Null, Auto, Instance(Tap), default="auto", help="""
    Specify a tap/click tool to be active when the plot is displayed.
    """)

    active_multi: tp.Union[Literal["auto"], GestureTool, None] = Either(Null, Auto, Instance(GestureTool), default="auto", help="""
    Specify an active multi-gesture tool, for instance an edit tool or a range
    tool.

    Note that activating a multi-gesture tool will deactivate any other gesture
    tools as appropriate. For example, if a pan tool is set as the active drag,
    and this property is set to a ``BoxEditTool`` instance, the pan tool will
    be deactivated (i.e. the multi-gesture tool will take precedence).
    """)

class ProxyToolbar(ToolbarBase):
    ''' A toolbar that allow to merge and proxy tools of toolbars in multiple
    plots.

    '''

    toolbars = List(Instance(Toolbar), help="""
    """)

class ToolbarBox(LayoutDOM):
    ''' A layoutable toolbar that can accept the tools of multiple plots, and
    can merge the tools into a single button for convenience.

    '''

    toolbar = Instance(ToolbarBase, help="""
    A toolbar associated with a plot which holds all its tools.
    """)

    toolbar_location = Enum(Location, default="right")

class PanTool(Drag):
    ''' *toolbar icon*: |pan_icon|

    The pan tool allows the user to pan a Plot by left-dragging a mouse, or on
    touch devices by dragging a finger or stylus, across the plot region.

    The pan tool also activates the border regions of a Plot for "single axis"
    panning. For instance, dragging in the vertical border or axis will effect
    a pan in the vertical direction only, with horizontal dimension kept fixed.

    .. |pan_icon| image:: /_images/icons/Pan.png
        :height: 24px

    '''

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the pan tool is constrained to act in. By default
    the pan tool will pan in any dimension, but can be configured to only
    pan horizontally across the width of the plot, or vertically across the
    height of the plot.
    """)

DEFAULT_RANGE_OVERLAY = lambda: BoxAnnotation(
    syncable=False,
    level="overlay",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=0.5,
    line_dash=[2,2],
)

class RangeTool(Drag):
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

    x_range = Nullable(Instance(Range1d), help="""
    A range synchronized to the x-dimension of the overlay. If None, the overlay
    will span the entire x-dimension.
    """)

    x_interaction = Bool(default=True, help="""
    Whether to respond to horizontal pan motions when an ``x_range`` is present.

    By default, when an ``x_range`` is specified, it is possible to adjust the
    horizontal position of the range box by panning horizontally inside the
    box, or along the top or bottom edge of the box. To disable this, and fix
    the  range box in place horizontally, set to False. (The box will still
    update if the ``x_range`` is updated programmatically.)
    """)

    y_range = Nullable(Instance(Range1d), help="""
    A range synchronized to the y-dimension of the overlay. If None, the overlay
    will span the entire y-dimension.
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

    '''

    dimension = Enum(Dimension, default="width", help="""
    Which dimension the wheel pan tool is constrained to act in. By default the
    wheel pan tool will pan the plot along the x-axis.
    """)

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

    '''

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the wheel zoom tool is constrained to act in. By default
    the wheel zoom tool will zoom in any dimension, but can be configured to
    only zoom horizontally across the width of the plot, or vertically across
    the height of the plot.
    """)

    maintain_focus = Bool(default=True, help="""
    If True, then hitting a range bound in any one dimension will prevent all
    further zooming all dimensions. If False, zooming can continue
    independently in any dimension that has not yet reached its bounds, even if
    that causes overall focus or aspect ratio to change.
    """)

    zoom_on_axis = Bool(default=True, help="""
    Whether scrolling on an axis (outside the central plot area) should zoom
    that dimension.
    """)

    speed = Float(default=1/600, help="""
    Speed at which the wheel zooms. Default is 1/600. Optimal range is between
    0.001 and 0.09. High values will be clipped. Speed may very between browsers.
    """)

class CustomAction(ActionTool):
    ''' Execute a custom action, e.g. ``CustomJS`` callback when a toolbar
    icon is activated.

    Example:

        .. code-block:: python

            tool = CustomAction(icon="icon.png",
                                callback=CustomJS(code='alert("foo")'))

            plot.add_tools(tool)

    '''

    def __init__(self, *args, **kwargs) -> None:
        action_tooltip = kwargs.pop("action_tooltip", None)
        if action_tooltip is not None:
            deprecated((2, 3, 0), "CustomAction.action_tooltip", "CustomAction.description")
            kwargs["description"] = action_tooltip
        super().__init__(*args, **kwargs)

    @property
    def action_tooltip(self):
        deprecated((2, 3, 0), "CustomAction.action_tooltip", "CustomAction.description")
        return self.description
    @action_tooltip.setter
    def action_tooltip(self, description):
        deprecated((2, 3, 0), "CustomAction.action_tooltip", "CustomAction.description")
        self.description = description

    description = Override(default="Perform a Custom Action")

    callback = Nullable(Instance(Callback), help="""
    A Bokeh callback to execute when the custom action icon is activated.
    """)

    icon = Image(help="""
    An icon to display in the toolbar.

    The icon can provided as a string filename for an image, a PIL ``Image``
    object, or an RGB(A) NumPy array.
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

    '''

class ResetTool(ActionTool):
    ''' *toolbar icon*: |reset_icon|

    The reset tool is an action. When activated in the toolbar, the tool resets
    the data bounds of the plot to their values when the plot was initially
    created.

    .. |reset_icon| image:: /_images/icons/Reset.png
        :height: 24px

    '''

    pass

class TapTool(Tap, SelectTool):
    ''' *toolbar icon*: |tap_icon|

    The tap selection tool allows the user to select at single points by
    left-clicking a mouse, or tapping with a finger.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. |tap_icon| image:: /_images/icons/Tap.png
        :height: 24px

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the <<shift>> key
        while making a selection to append the new selection to any
        previous selection that might exist.

    '''

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
        please see :ref:`userguide_interaction_jscallbacks_customjs_interactions`.

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

    '''

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

DEFAULT_BOX_OVERLAY = lambda: BoxAnnotation(
    syncable=False,
    level="overlay",
    top_units="screen",
    left_units="screen",
    bottom_units="screen",
    right_units="screen",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4],
)

class BoxZoomTool(Drag):
    ''' *toolbar icon*: |box_zoom_icon|

    The box zoom tool allows users to define a rectangular egion of a Plot to
    zoom to by dragging he mouse or a finger over the plot region. The end of
    the drag event indicates the selection region is ready.

    .. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
        :height: 24px

    .. note::
        ``BoxZoomTool`` is incompatible with ``GMapPlot`` due to the manner in
        which Google Maps exert explicit control over aspect ratios. Adding
        this tool to a ``GMapPlot`` will have no effect.

    '''

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom box is to be free in. By default, users may
    freely draw zoom boxes with any dimensions. If only "width" is supplied,
    the box will be constrained to span the entire vertical space of the plot,
    only the horizontal dimension can be controlled. If only "height" is
    supplied, the box will be constrained to span the entire horizontal space
    of the plot, and the vertical dimension can be controlled.
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help="""
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

class ZoomInTool(ActionTool):
    ''' *toolbar icon*: |zoom_in_icon|

    The zoom-in tool allows users to click a button to zoom in
    by a fixed amount.

    .. |zoom_in_icon| image:: /_images/icons/ZoomIn.png
        :height: 24px

    '''
    # TODO ZoomInTool dimensions should probably be constrained to be the same as ZoomOutTool
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom-in tool is constrained to act in. By default the
    zoom-in zoom tool will zoom in any dimension, but can be configured to only
    zoom horizontally across the width of the plot, or vertically across the
    height of the plot.
    """)

    factor = Percent(default=0.1, help="""
    Percentage to zoom for each click of the zoom-in tool.
    """)

class ZoomOutTool(ActionTool):
    ''' *toolbar icon*: |zoom_out_icon|

    The zoom-out tool allows users to click a button to zoom out
    by a fixed amount.

    .. |zoom_out_icon| image:: /_images/icons/ZoomOut.png
        :height: 24px

    '''
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom-out tool is constrained to act in. By default the
    zoom-out tool will zoom in any dimension, but can be configured to only
    zoom horizontally across the width of the plot, or vertically across the
    height of the plot.
    """)

    factor = Percent(default=0.1, help="""
    Percentage to zoom for each click of the zoom-in tool.
    """)

    maintain_focus = Bool(default=True, help="""
    If True, then hitting a range bound in any one dimension will prevent all
    further zooming all dimensions. If False, zooming can continue
    independently in any dimension that has not yet reached its bounds, even if
    that causes overall focus or aspect ratio to change.
    """)

class BoxSelectTool(Drag, SelectTool):
    ''' *toolbar icon*: |box_select_icon|

    The box selection tool allows users to make selections on a Plot by showing
    a rectangular region by dragging the mouse or a finger over the plot area.
    The end of the drag event indicates the selection region is ready.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.


    .. |box_select_icon| image:: /_images/icons/BoxSelect.png
        :height: 24px

    '''

    select_every_mousemove = Bool(False, help="""
    Whether a selection computation should happen on every mouse event, or only
    once, when the selection region is completed. Default: False
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the box selection is to be free in. By default, users may
    freely draw selections boxes with any dimensions. If only "width" is set,
    the box will be constrained to span the entire vertical space of the plot,
    only the horizontal dimension can be controlled. If only "height" is set,
    the box will be constrained to span the entire horizontal space of the
    plot, and the vertical dimension can be controlled.
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

    origin = Enum("corner", "center", default="corner", help="""
    Indicates whether the rectangular selection area should originate from a corner
    (top-left or bottom-right depending on direction) or the center of the box.
    """)

DEFAULT_POLY_OVERLAY = lambda: PolyAnnotation(
    syncable=False,
    level="overlay",
    xs_units="screen",
    ys_units="screen",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4]
)

class LassoSelectTool(Drag, SelectTool):
    ''' *toolbar icon*: |lasso_select_icon|

    The lasso selection tool allows users to make selections on a Plot by
    indicating a free-drawn "lasso" region by dragging the mouse or a finger
    over the plot region. The end of the drag event indicates the selection
    region is ready.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. note::
        Selections can be comprised of multiple regions, even those made by
        different selection tools. Hold down the <<shift>> key while making a
        selection to append the new selection to any previous selection that
        might exist.

    .. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
        :height: 24px

    '''

    select_every_mousemove = Bool(True, help="""
    Whether a selection computation should happen on every mouse event, or only
    once, when the selection region is completed.
    """)

    overlay = Instance(PolyAnnotation, default=DEFAULT_POLY_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

class PolySelectTool(Tap, SelectTool):
    ''' *toolbar icon*: |poly_select_icon|

    The polygon selection tool allows users to make selections on a
    Plot by indicating a polygonal region with mouse clicks. single
    clicks (or taps) add successive points to the definition of the
    polygon, and a double click (or tap) indicates the selection
    region is ready.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the <<shift>> key
        while making a selection to append the new selection to any
        previous selection that might exist.

    .. |poly_select_icon| image:: /_images/icons/PolygonSelect.png
        :height: 24px

    '''

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

    args = Dict(String, Instance(Model), help="""
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

    Example:

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
            ("total", "@total{$0,0.00}"
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

    '''

    names = List(String, help="""
    A list of names to query for. If set, only renderers that have a matching
    value for their ``name`` attribute will be used.

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    """)

    renderers = Either(Auto, List(Instance(DataRenderer)), default="auto", help="""
    An explicit list of renderers to hit test against. If unset, defaults to
    all renderers on a plot.
    """)

    callback = Nullable(Instance(Callback), help="""
    A callback to run in the browser whenever the input's value changes. The
    ``cb_data`` parameter that is available to the Callback code will contain two
    ``HoverTool`` specific fields:

    :index: object containing the indices of the hovered points in the data source
    :geometry: object containing the coordinates of the hover cursor
    """)

    tooltips = Either(Null, Instance(Template), String, List(Tuple(String, String)),
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
        e.g. ``dict`` or ``OrderedDict``. However, if a ``dict`` is used,
        the visual presentation order is unspecified.

    """).accepts(Dict(String, String), lambda d: list(d.items()))

    formatters = Dict(String, Either(Enum(TooltipFieldFormatter), Instance(CustomJSHover)), default=lambda: dict(), help="""
    Specify the formatting scheme for data source columns, e.g.

    .. code-block:: python

        tool.formatters = {"@date": "datetime"}

    will cause format specifications for the "date" column to be interpreted
    according to the "datetime" formatting scheme. The following schemes are
    available:

    :``"numeral"``:
        Provides a wide variety of formats for numbers, currency, bytes, times,
        and percentages. The full set of formats can be found in the
        |NumeralTickFormatter| reference documentation.

    :``"datetime"``:
        Provides formats for date and time values. The full set of formats is
        listed in the |DatetimeTickFormatter| reference documentation.

    :``"printf"``:
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
    When showing tooltips for lines, designates whether the tooltip position
    should be the "previous" or "next" points on the line, the "nearest" point
    to the current mouse position, or "interpolate" along the line to the
    current mouse position.
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
DEFAULT_HELP_URL = "https://docs.bokeh.org/en/latest/docs/user_guide/tools.html"

class HelpTool(ActionTool):
    ''' A button tool to provide a "help" link to users.

    The hover text can be customized through the ``help_tooltip`` attribute
    and the redirect site overridden as well.

    '''

    def __init__(self, *args, **kwargs) -> None:
        help_tooltip = kwargs.pop("help_tooltip", None)
        if help_tooltip is not None:
            deprecated((2, 3, 0), "HelpTool.help_tooltip", "HelpTool.description")
            kwargs["description"] = help_tooltip
        super().__init__(*args, **kwargs)

    @property
    def help_tooltip(self):
        deprecated((2, 3, 0), "HelpTool.help_tooltip", "HelpTool.description")
        return self.description
    @help_tooltip.setter
    def help_tooltip(self, description):
        deprecated((2, 3, 0), "HelpTool.help_tooltip", "HelpTool.description")
        self.description = description

    description = Override(default=DEFAULT_HELP_TIP)

    redirect = String(default=DEFAULT_HELP_URL, help="""
    Site to be redirected through upon click.
    """)

class UndoTool(ActionTool):
    ''' *toolbar icon*: |undo_icon|

    Undo tool allows to restore previous state of the plot.

    .. |undo_icon| image:: /_images/icons/Undo.png
        :height: 24px

    '''

class RedoTool(ActionTool):
    ''' *toolbar icon*: |redo_icon|

    Redo tool reverses the last action performed by undo tool.

    .. |redo_icon| image:: /_images/icons/Redo.png
        :height: 24px

    '''

@abstract
class EditTool(GestureTool):
    ''' A base class for all interactive draw tool types.

    '''

    def __init__(self, *args, **kwargs) -> None:
        custom_tooltip = kwargs.pop("custom_tooltip", None)
        if custom_tooltip is not None:
            deprecated((2, 3, 0), "EditTool.custom_tooltip", "EditTool.description")
            kwargs["description"] = custom_tooltip
        super().__init__(*args, **kwargs)

    @property
    def custom_tooltip(self):
        deprecated((2, 3, 0), "EditTool.custom_tooltip", "EditTool.description")
        return self.description
    @custom_tooltip.setter
    def custom_tooltip(self, description):
        deprecated((2, 3, 0), "EditTool.custom_tooltip", "EditTool.description")
        self.description = description

    empty_value = NonNullable(Either(Bool, Int, Float, Date, Datetime, Color, String), help="""
    Defines the value to insert on non-coordinate columns when a new
    glyph is inserted into the ``ColumnDataSource`` columns, e.g. when a
    circle glyph defines 'x', 'y' and 'color' columns, adding a new
    point will add the x and y-coordinates to 'x' and 'y' columns and
    the color column will be filled with the defined empty value.
    """)

    custom_icon = Nullable(Image, help="""
    An icon to display in the toolbar.

    The icon can provided as a string filename for an image, a PIL ``Image``
    object, or an RGB(A) NumPy array.
    """)

    renderers = List(Instance(GlyphRenderer), help="""
    An explicit list of renderers corresponding to scatter glyphs that may
    be edited.
    """)

@abstract
class PolyTool(EditTool):
    ''' A base class for polygon draw/edit tools. '''

    vertex_renderer = Nullable(Instance(GlyphRenderer), help="""
    The renderer used to render the vertices of a selected line or polygon.
    """)

    @error(INCOMPATIBLE_POLY_EDIT_VERTEX_RENDERER)
    def _check_compatible_vertex_renderer(self):
        if self.vertex_renderer is None:
            return
        glyph = self.vertex_renderer.glyph
        if not isinstance(glyph, XYGlyph):
            return "glyph type %s found." % type(glyph).__name__

class BoxEditTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |box_edit_icon|

    Allows drawing, dragging and deleting ``Rect`` glyphs on one or more
    renderers by editing the underlying ``ColumnDataSource`` data. Like other
    drawing tools, the renderers that are to be edited must be supplied
    explicitly as a list. When drawing a new box the data will always be added
    to the ``ColumnDataSource`` on the first supplied renderer.

    The tool will modify the columns on the data source corresponding to the
    ``x``, ``y``, ``width`` and ``height`` values of the glyph. Any additional
    columns in the data source will be padded with ``empty_value``, when adding
    a new box.

    The supported actions include:

    * Add box: Hold shift then click and drag anywhere on the plot or double
      tap once to start drawing, move the mouse and double tap again to finish
      drawing.

    * Move box: Click and drag an existing box, the box will be dropped once
      you let go of the mouse button.

    * Delete box: Tap a box to select it then press <<backspace>> key while the
      mouse is within the plot area.

    To **Move** or **Delete** multiple boxes at once:

    * Move selection: Select box(es) with <<shift>>+tap (or another selection
      tool) then drag anywhere on the plot. Selecting and then dragging on a
      specific box will move both.

    * Delete selection: Select box(es) with <<shift>>+tap (or another selection
      tool) then press <<backspace>> while the mouse is within the plot area.

    .. |box_edit_icon| image:: /_images/icons/BoxEdit.png
        :height: 24px
    '''

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

    @error(INCOMPATIBLE_BOX_EDIT_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, Rect):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__ for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types

class PointDrawTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |point_draw_icon|

    The PointDrawTool allows adding, dragging and deleting point-like glyphs
    (i.e subclasses of``XYGlyph``) on one or more renderers by editing the
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

    * Delete point: Tap a point to select it then press <<backspace>>
      key while the mouse is within the plot area.

    .. |point_draw_icon| image:: /_images/icons/PointDraw.png
        :height: 24px
    '''

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

    @error(INCOMPATIBLE_POINT_DRAW_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, XYGlyph):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__ for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types

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

    * Add patch or multi-line: Double tap to add the first vertex, then use tap
      to add each subsequent vertex, to finalize the draw action double tap to
      insert the final vertex or press the <<esc> key.

    * Move patch or ulti-line: Tap and drag an existing patch/multi-line, the
      point will be dropped once you let go of the mouse button.

    * Delete patch or multi-line: Tap a patch/multi-line to select it then
      press <<backspace>> key while the mouse is within the plot area.

    .. |poly_draw_icon| image:: /_images/icons/PolyDraw.png
        :height: 24px
    '''

    drag = Bool(default=True, help="""
    Enables dragging of existing patches and multi-lines on pan events.
    """)

    num_objects = Int(default=0, help="""
    Defines a limit on the number of patches or multi-lines that can be drawn.
    By default there is no limit on the number of objects, but if enabled the
    oldest drawn patch or multi-line will be dropped to make space for the new
    patch or multi-line.
    """)

    @error(INCOMPATIBLE_POLY_DRAW_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, (MultiLine, Patches)):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__ for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types

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
      <<backspace>> key while the mouse is within the plot area.

    .. |freehand_draw_icon| image:: /_images/icons/FreehandDraw.png
        :height: 24px
    '''

    num_objects = Int(default=0, help="""
    Defines a limit on the number of patches or multi-lines that can be drawn.
    By default there is no limit on the number of objects, but if enabled the
    oldest drawn patch or multi-line will be overwritten when the limit is
    reached.
    """)

    @error(INCOMPATIBLE_POLY_DRAW_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, (MultiLine, Patches)):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__ for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types

class PolyEditTool(PolyTool, Drag, Tap):
    ''' *toolbar icon*: |poly_edit_icon|

    The PolyEditTool allows editing the vertices of one or more ``Patches`` or
    ``MultiLine`` glyphs. Glyphs to be edited are defined via the ``renderers``
    property and a renderer for the vertices is set via the ``vertex_renderer``
    property (must render a point-like Glyph (a subclass of ``XYGlyph``).

    The tool will modify the columns on the data source corresponding to the
    ``xs`` and ``ys`` values of the glyph. Any additional columns in the data
    source will be padded with the declared``empty_value``, when adding a new
    point.

    The supported actions include:

    * Show vertices: Double tap an existing patch or multi-line

    * Add vertex: Double tap an existing vertex to select it, the tool will
      draw the next point, to add it tap in a new location. To finish editing
      and add a point double tap otherwise press the <<esc> key to cancel.

    * Move vertex: Drag an existing vertex and let go of the mouse button to
      release it.

    * Delete vertex: After selecting one or more vertices press <<backspace>>
      while the mouse cursor is within the plot area.

    .. |poly_edit_icon| image:: /_images/icons/PolyEdit.png
        :height: 24px
    '''

    @error(INCOMPATIBLE_POLY_EDIT_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, (MultiLine, Patches)):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__
                                    for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types


class LineEditTool(EditTool, Drag, Tap):
    ''' *toolbar icon*: |line_edit_icon|

    The LineEditTool allows editing the intersection points of one or more ``Line`` glyphs.
    Glyphs to be edited are defined via the ``renderers``
    property and a renderer for the intersections is set via the ``intersection_renderer``
    property (must render a point-like Glyph (a subclass of ``XYGlyph``).

    The tool will modify the columns on the data source corresponding to the
    ``x`` and ``y`` values of the glyph. Any additional columns in the data
    source will be padded with the declared``empty_value``, when adding a new
    point.

    The supported actions include:

    * Show intersections: Double tap an existing line

    * Move point: Drag an existing point and let go of the mouse button to
      release it.

    .. |line_edit_icon| image:: /_images/icons/LineEdit.png
        :height: 24px
     '''

    intersection_renderer = Instance(GlyphRenderer, help="""
    The renderer used to render the intersections of a selected line
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions this edit tool is constrained to act in. By default
    the line edit tool allows moving points in any dimension, but can be
    configured to only allow horizontal movement across the width of the
    plot, or vertical across the height of the plot.
    """)

    @error(INCOMPATIBLE_LINE_EDIT_INTERSECTION_RENDERER)
    def _check_compatible_intersection_renderer(self):
        glyph = self.intersection_renderer.glyph
        if not isinstance(glyph, LineGlyph):
            return "glyph type %s found." % type(glyph).__name__

    @error(INCOMPATIBLE_LINE_EDIT_RENDERER)
    def _check_compatible_renderers(self):
        incompatible_renderers = []
        for renderer in self.renderers:
            if not isinstance(renderer.glyph, (Line,)):
                incompatible_renderers.append(renderer)
        if incompatible_renderers:
            glyph_types = ', '.join(type(renderer.glyph).__name__
                                    for renderer in incompatible_renderers)
            return "%s glyph type(s) found." % glyph_types

#
#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
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
Tool.register_alias("box_select", lambda: BoxSelectTool())
Tool.register_alias("xbox_select", lambda: BoxSelectTool(dimensions="width"))
Tool.register_alias("ybox_select", lambda: BoxSelectTool(dimensions="height"))
Tool.register_alias("poly_select", lambda: PolySelectTool())
Tool.register_alias("lasso_select", lambda: LassoSelectTool())
Tool.register_alias("box_zoom", lambda: BoxZoomTool(dimensions="both"))
Tool.register_alias("xbox_zoom", lambda: BoxZoomTool(dimensions="width"))
Tool.register_alias("ybox_zoom", lambda: BoxZoomTool(dimensions="height"))
Tool.register_alias("save", lambda: SaveTool())
Tool.register_alias("undo", lambda: UndoTool())
Tool.register_alias("redo", lambda: RedoTool())
Tool.register_alias("reset", lambda: ResetTool())
Tool.register_alias("help", lambda: HelpTool())
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
