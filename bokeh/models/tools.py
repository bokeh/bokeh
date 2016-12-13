""" Bokeh comes with a number of interactive tools.

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
tool is indicated on the toolbar by a highlight next to to the tool.
Actions are immediate or modal operations that are only activated when
their button in the toolbar is pressed. Inspectors are passive tools that
merely report information or annotate the plot in some way, and may
always be active regardless of what other tools are currently active.

"""
from __future__ import absolute_import

from ..model import Model
from ..core.properties import (
    abstract, Float, Color, Percent,
    Any, Auto, Bool, String, Enum, Instance, Either, List, Dict, Tuple, Override
)
from ..core.enums import (Dimension, Dimensions, Location, Anchor,
    DeprecatedAnchor, accept_left_right_center,
)
from ..util.deprecation import deprecated

from .annotations import BoxAnnotation, PolyAnnotation
from .callbacks import Callback
from .renderers import Renderer
from .layouts import LayoutDOM, Box

def _deprecated_dimensions(tool):
    def transformer(value):
        deprecated((0, 12, 3), "List(Enum(Dimension)) in %s.dimensions" % tool, "Enum(Dimensions)")

        if "width" in value and "height" in value:
            return "both"
        elif "width" in value or "height" in value:
            return value
        else:
            raise ValueError("empty dimensions' list doesn't make sense")

    return transformer

class ToolEvents(Model):
    """

    """

    geometries = List(Dict(String, Any))


@abstract
class Tool(Model):
    """ A base class for all interactive tool types. ``Tool`` is
    not generally useful to instantiate on its own.

    """

    plot = Instance(".models.plots.Plot", help="""
    The Plot that this tool will act on.
    """)


@abstract
class Action(Tool):
    pass


@abstract
class Drag(Tool):
    pass


@abstract
class Scroll(Tool):
    pass


@abstract
class Tap(Tool):
    pass


@abstract
class Inspection(Tool):
    pass


@abstract
class ToolbarBase(LayoutDOM):
    """ A base class for different toolbars. ``ToolbarBase`` is
    not generally useful to instantiate on its own.

    """

    logo = Enum("normal", "grey", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)

    tools = List(Instance(Tool), help="""
    A list of tools to add to the plot.
    """)

    # This is an odd case. The sizing is custom handled. In the future we will
    # probably set it as `stretch_width` or `stretch_height` depending on its
    # orientation.
    sizing_mode = Override(default=None)


class Toolbar(ToolbarBase):
    """ Hold tools to display for a single plot.

    """

    active_drag = Either(Auto, Instance(Drag), help="""
    Specify a drag tool to be active when the plot is displayed.
    """)

    active_scroll = Either(Auto, Instance(Scroll), help="""
    Specify a scroll/pinch tool to be active when the plot is displayed.
    """)

    active_tap = Either(Auto, Instance(Tap), help="""
    Specify a tap/click tool to be active when the plot is displayed.
    """)


class ToolbarBox(Box):
    """ A layoutable toolbar that can accept the tools of multiple plots, and
    can merge the tools into a single button for convenience.

    """
    def _check_empty_layout(self):
        # Overriding the children check from Box. As toolbarbox's children
        # are normally set JS side.
        return None

    toolbar_location = Enum(Location, default='right', help="""
        Should the toolbar be presented as if it was stuck to the `above`, `right`, `left`, `below`
        edge of a plot. Default is `right`.
    """)

    tools = List(Instance(Tool), help="""
    A list of tools to add to the plot.
    """)

    merge_tools = Bool(default=True, help="""
        Merge all the tools together so there is one tool to control all the plots.
    """)

    logo = Enum("normal", "grey", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)


class PanTool(Drag):
    """ *toolbar icon*: |pan_icon|

    The pan tool allows the user to pan a Plot by left-dragging
    a mouse, or on touch devices by dragging a finger or stylus, across
    the plot region.

    The pan tool also activates the border regions of a Plot for "single
    axis" panning. For instance, dragging in the vertical border or axis
    will effect a pan in the vertical direction only, with the horizontal
    dimension kept fixed.

    .. |pan_icon| image:: /_images/icons/Pan.png
        :height: 18pt

    """

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the pan tool is constrained to act in. By default
    the pan tool will pan in any dimension, but can be configured to only
    pan horizontally across the width of the plot, or vertically across the
    height of the plot.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("PanTool"))

class WheelPanTool(Scroll):
    """ *toolbar icon*: |wheel_pan_icon|

    The wheel pan tool allows the user to pan the plot along the configured
    dimension using the scroll wheel.

    .. |wheel_pan_icon| image:: /_images/icons/WheelPan.png
        :height: 18pt

    """

    dimension = Enum(Dimension, default="width", help="""
    Which dimension the wheel pan tool is constrained to act in. By
    default the wheel pan tool will pan the plot along the x-axis.
    """)


class WheelZoomTool(Scroll):
    """ *toolbar icon*: |wheel_zoom_icon|

    The wheel zoom tool will zoom the plot in and out, centered on the
    current mouse location.

    The wheel zoom tool also activates the border regions of a Plot for
    "single axis" zooming. For instance, zooming in the vertical border or
    axis will effect a zoom in the vertical direction only, with the
    horizontal dimension kept fixed.

    .. |wheel_zoom_icon| image:: /_images/icons/WheelZoom.png
        :height: 18pt

    """

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the wheel zoom tool is constrained to act in. By
    default the wheel zoom tool will zoom in any dimension, but can be
    configured to only zoom horizontally across the width of the plot, or
    vertically across the height of the plot.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("WheelZoomTool"))


class SaveTool(Action):
    """ *toolbar icon*: |save_icon|

    The save tool is an action. When activated, the tool opens a download dialog
    which allows to save an image reproduction of the plot in PNG format. If
    automatic download is not support by a web browser, the tool falls back to
    opening the generated image in a new tab or window. User then can manually
    save it by right clicking on the image and choosing "Save As" (or similar)
    menu item.

    .. |save_icon| image:: /_images/icons/Save.png
        :height: 18pt

    """


class ResetTool(Action):
    """ *toolbar icon*: |reset_icon|

    The reset tool is an action. When activated in the toolbar, the tool
    resets the data bounds of the plot to their values when the plot was
    initially created.

    Optionally, the reset tool also resets the plat canvas dimensions to
    their original size

    .. |reset_icon| image:: /_images/icons/Reset.png
        :height: 18pt
    """
    reset_size = Bool(default=True, help="""
    Whether activating the Reset tool should also reset the plot's canvas
    dimensions to their original size.
    """)


class ResizeTool(Drag):
    """ *toolbar icon*: |resize_icon|

    The resize tool allows the user to left-drag a mouse or drag a finger
    to resize the entire plot area on the screen.

    .. |resize_icon| image:: /_images/icons/Resize.png
        :height: 18pt

    """


class TapTool(Tap):
    """ *toolbar icon*: |tap_select_icon|

    The tap selection tool allows the user to select at single points by
    left-clicking a mouse, or tapping with a finger.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. |tap_select_icon| image:: /_images/icons/TapSelect.png
        :height: 18pt

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the <<shift>> key
        while making a selection to append the new selection to any
        previous selection that might exist.
    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to hit test again. If unset,
    defaults to all renderers on a plot.
    """)

    behavior = Enum("select", "inspect", default="select", help="""
    This tool can be configured to either make selections or inspections
    on associated data sources. The difference is that selection changes
    propagate across bokeh and other components (e.g. selection glyph)
    will be notified. Inspecions don't act like this, so it's useful to
    configure `callback` when setting `behavior='inspect'`.
    """)

    callback = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)




class CrosshairTool(Inspection):
    """ *toolbar icon*: |crosshair_icon|

    The crosshair tool is a passive inspector tool. It is generally on
    at all times, but can be configured in the inspector's menu
    associated with the *toolbar icon* shown above.

    The crosshair tool draws a crosshair annotation over the plot,
    centered on the current mouse position. The crosshair tool may be
    configured to draw across only one dimension by setting the
    ``dimension`` property to only ``width`` or ``height``.

    .. |crosshair_icon| image:: /_images/icons/Crosshair.png
        :height: 18pt

    """

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the crosshair tool is to track. By default, both a
    vertical and horizontal line will be drawn. If only "width" is supplied,
    only a horizontal line will be drawn. If only "height" is supplied,
    only a vertical line will be drawn.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("CrosshairTool"))

    line_color = Color(default="black", help="""
    A color to use to stroke paths with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    line_width = Float(default=1, help="""
    Stroke width in units of pixels.
    """)

    line_alpha = Float(default=1.0, help="""
    An alpha value to use to stroke paths with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

DEFAULT_BOX_OVERLAY = lambda: BoxAnnotation(
    level="overlay",
    render_mode="css",
    top_units="screen",
    left_units="screen",
    bottom_units="screen",
    right_units="screen",
    fill_color="lightgrey",
    fill_alpha=0.5,
    line_color="black",
    line_alpha=1.0,
    line_width=2,
    line_dash=[4, 4]
)

class BoxZoomTool(Drag):
    """ *toolbar icon*: |box_zoom_icon|

    The box zoom tool allows users to define a rectangular
    region of a Plot to zoom to by dragging he mouse or a
    finger over the plot region. The end of the drag
    event indicates the selection region is ready.

    .. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
        :height: 18pt

    """

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom box is to be free in. By default,
    users may freely draw zoom boxes with any dimensions. If only
    "width" is supplied, the box will be constrained to span the entire
    vertical space of the plot, only the horizontal dimension can be
    controlled. If only "height" is supplied, the box will be constrained
    to span the entire horizontal space of the plot, and the vertical
    dimension can be controlled.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("BoxZoomTool"))

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

class ZoomInTool(Action):
    """ *toolbar icon*: |zoom_in_icon|

    The zoom-in tool allows users to click a button to zoom in
    by a fixed amount.

    .. |zoom_in_icon| image:: /_images/icons/ZoomIn.png
        :height: 18pt

    """
    # TODO ZoomInTool dimensions should probably be constrained to be the same as ZoomOutTool
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom-in tool is constrained to act in. By
    default the zoom-in zoom tool will zoom in any dimension, but can be
    configured to only zoom horizontally across the width of the plot, or
    vertically across the height of the plot.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("ZoomInTool"))

    factor = Percent(default=0.1, help="""
    Percentage to zoom for each click of the zoom-in tool.
    """)

class ZoomOutTool(Action):
    """ *toolbar icon*: |zoom_out_icon|

    The zoom-out tool allows users to click a button to zoom out
    by a fixed amount.

    .. |zoom_out_icon| image:: /_images/icons/ZoomOut.png
        :height: 18pt

    """
    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the zoom-out tool is constrained to act in. By
    default the zoom-out tool will zoom in any dimension, but can be
    configured to only zoom horizontally across the width of the plot, or
    vertically across the height of the plot.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("ZoomOutTool"))

    factor = Percent(default=0.1, help="""
    Percentage to zoom for each click of the zoom-in tool.
    """)


class BoxSelectTool(Drag):
    """ *toolbar icon*: |box_select_icon|

    The box selection tool allows users to make selections on a
    Plot by indicating a rectangular region by dragging the
    mouse or a finger over the plot region. The end of the drag
    event indicates the selection region is ready.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.


    .. |box_select_icon| image:: /_images/icons/BoxSelect.png
        :height: 18pt

    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to hit test again. If unset,
    defaults to all renderers on a plot.
    """)

    select_every_mousemove = Bool(False, help="""
    Whether a selection computation should happen on every mouse
    event, or only once, when the selection region is completed. Default: False
    """)

    dimensions = Enum(Dimensions, default="both", help="""
    Which dimensions the box selection is to be free in. By default,
    users may freely draw selections boxes with any dimensions. If only
    "width" is supplied, the box will be constrained to span the entire
    vertical space of the plot, only the horizontal dimension can be
    controlled. If only "height" is supplied, the box will be constrained
    to span the entire horizontal space of the plot, and the vertical
    dimension can be controlled.
    """).accepts(List(Enum(Dimension)), _deprecated_dimensions("BoxSelectTool"))

    callback = Instance(Callback, help="""
    A callback to run in the browser on completion of drawing a selection box.
    The cb_data parameter that is available to the Callback code will contain
    one BoxSelectTool-specific field:

    :geometry: object containing the coordinates of the selection box
    """)

    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

DEFAULT_POLY_OVERLAY = lambda: PolyAnnotation(
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

class LassoSelectTool(Drag):
    """ *toolbar icon*: |lasso_select_icon|

    The lasso selection tool allows users to make selections on a
    Plot by indicating a free-drawn "lasso" region by dragging the
    mouse or a finger over the plot region. The end of the drag
    event indicates the selection region is ready.

    See :ref:`userguide_styling_selected_unselected_glyphs` for information
    on styling selected and unselected glyphs.

    .. note::
        Selections can be comprised of multiple regions, even those
        made by different selection tools. Hold down the <<shift>> key
        while making a selection to append the new selection to any
        previous selection that might exist.

    .. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
        :height: 18pt
    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to hit test again. If unset,
    defaults to all renderers on a plot.
    """)

    select_every_mousemove = Bool(True, help="""
    Whether a selection computation should happen on every mouse
    event, or only once, when the selection region is completed. Default: True
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser on every selection of a lasso area.
    The cb_data parameter that is available to the Callback code will contain
    one LassoSelectTool-specific field:

    :geometry: object containing the coordinates of the lasso area
    """)

    overlay = Instance(PolyAnnotation, default=DEFAULT_POLY_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)


class PolySelectTool(Tap):
    """ *toolbar icon*: |poly_select_icon|

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
        :height: 18pt
    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to hit test again. If unset,
    defaults to all renderers on a plot.
    """)

    overlay = Instance(PolyAnnotation, default=DEFAULT_POLY_OVERLAY, help="""
    A shaded annotation drawn to indicate the selection region.
    """)

class HoverTool(Inspection):
    """ *toolbar icon*: |crosshair_icon|

    The hover tool is a passive inspector tool. It is generally on at
    all times, but can be configured in the inspector's menu associated
    with the *toolbar icon* shown above.

    By default, the hover tool displays informational tooltips whenever
    the cursor is directly over a glyph. The data to show comes from the
    glyph's data source, and what is to be displayed is configurable with
    the ``tooltips`` attribute that maps display names to columns in the
    data source, or to special known variables.

    Here is an example of how to configure and use the hover tool::

        # Add tooltip (name, field) pairs to the tool. See below for a
        # description of possible field values.
        hover.tooltips = [
            ("index", "$index"),
            ("(x,y)", "($x, $y)"),
            ("radius", "@radius"),
            ("fill color", "$color[hex, swatch]:fill_color"),
            ("foo", "@foo"),
            ("bar", "@bar"),
            ("baz", "@baz{safe}"),
            ("total", "@total{$0,0.00}"
        ]

    You can also supply a ``Callback`` to the HoverTool, to build custom
    interactions on hover. In this case you may want to turn the tooltips
    off by setting ``tooltips=None``.

    .. warning::

        Hover tool does not currently work with the following glyphs:

        .. hlist::
            :columns: 3

            * annulus
            * arc
            * bezier
            * image
            * image_rgba
            * image_url
            * multi_line
            * oval
            * patch
            * quadratic
            * ray
            * segment
            * text

    .. |hover_icon| image:: /_images/icons/Hover.png
        :height: 18pt
    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to hit test again. If unset,
    defaults to all renderers on a plot.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the input's value changes. The
    cb_data parameter that is available to the Callback code will contain two
    HoverTool specific fields:

    :index: object containing the indices of the hovered points in the data source
    :geometry: object containing the coordinates of the hover cursor
    """)

    tooltips = Either(String, List(Tuple(String, String)),
            default=[
                ("index","$index"),
                ("data (x, y)","($x, $y)"),
                ("canvas (x, y)","($sx, $sy)"),
            ], help="""
    The (name, field) pairs describing what the hover tool should
    display when there is a hit.

    Field names starting with "@" are interpreted as columns on the
    data source. For instance, "@temp" would look up values to display
    from the "temp" column of the data source.

    Field names starting with "$" are special, known fields:

    :$index: index of selected point in the data source
    :$x: x-coordinate under the cursor in data space
    :$y: y-coordinate under the cursor in data space
    :$sx: x-coordinate under the cursor in screen (canvas) space
    :$sy: y-coordinate under the cursor in screen (canvas) space
    :$color: color data from data source, with the syntax:
        ``$color[options]:field_name``. The available options
        are: 'hex' (to display the color as a hex value), and
        'swatch' to also display a small color swatch.

    Additional format options ``safe`` and `Numbro format codes <http://numbrojs.com/format.html>`_
    can be included in a post-fix brace block on field names. ::

        [("total", "@total{$0,0.00}"),
         ("data", "@data{safe}")]

    Including ``{safe}`` after a field name will override automatic escaping
    of the tooltip data source. Any HTML tags in the data tags will be rendered
    as HTML in the resulting HoverTool output. See :ref:`custom_hover_tooltip` for a
    more detailed example.

    ``None`` is also a valid value for tooltips. This turns off the
    rendering of tooltips. This is mostly useful when supplying other
    actions on hover via the callback property.

    .. note::
        The tooltips attribute can also be configured with a mapping type,
        e.g. ``dict`` or ``OrderedDict``. However, if a ``dict`` is used,
        the visual presentation order is unspecified.

    """).accepts(Dict(String, String), lambda d: list(d.items()))

    mode = Enum("mouse", "hline", "vline", help="""
    Whether to consider hover pointer as a point (x/y values), or a
    span on h or v directions.
    """)

    point_policy = Enum("snap_to_data", "follow_mouse", "none", help="""
    Whether the tooltip position should snap to the "center" (or other anchor)
    position of the associated glyph, or always follow the current mouse cursor
    position.
    """)

    line_policy = Enum("prev", "next", "nearest", "interp", "none", help="""
    When showing tooltips for lines, whether the tooltip position should be
    the "previous" or "next" points on the line, the nearest point to the
    current mouse position, or interpolate along the line to the current
    mouse position.
    """)

    anchor = Enum(Anchor, default="center", help="""
    If point policy is set to `"snap_to_data"`, `anchor` defines the attachment
    point of a tooltip. The default is to attach to the center of a glyph.
    """).accepts(Enum(DeprecatedAnchor), accept_left_right_center)

    attachment = Enum("horizontal", "vertical", help="""
    Whether tooltip's arrow should appear in the horizontal or vertical dimension.
    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be showed.
    """)

DEFAULT_HELP_TIP = "Click the question mark to learn more about Bokeh plot tools."
DEFAULT_HELP_URL = "http://bokeh.pydata.org/en/latest/docs/user_guide/tools.html"

class HelpTool(Action):
    """
    The help tool is a widget designed to replace the hardcoded 'Help' link.
    The hover text can be customized through the ``help_tooltip`` attribute
    and the redirect site overridden as well.
    """

    help_tooltip = String(default=DEFAULT_HELP_TIP, help="""
    Tooltip displayed when hovering over the help icon.
    """)

    redirect = String(default=DEFAULT_HELP_URL, help="""
    Site to be redirected through upon click.
    """)

class UndoTool(Action):
    """ *toolbar icon*: |undo_icon|

    Undo tool allows to restore previous state of the plot.

    .. |undo_icon| image:: /_images/icons/Undo.png
        :height: 18pt
    """

class RedoTool(Action):
    """ *toolbar icon*: |redo_icon|

    Redo tool reverses the last action performed by undo tool.

    .. |redo_icon| image:: /_images/icons/Redo.png
        :height: 18pt
    """
