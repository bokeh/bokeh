#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import difflib
import itertools
import re
import warnings

# Bokeh imports
from ..models import (
    BoxEditTool,
    BoxSelectTool,
    BoxZoomTool,
    CrosshairTool,
    HelpTool,
    HoverTool,
    LassoSelectTool,
    PanTool,
    PointDrawTool,
    PolyDrawTool,
    PolyEditTool,
    PolySelectTool,
    RedoTool,
    ResetTool,
    SaveTool,
    TapTool,
    Tool,
    UndoTool,
    WheelPanTool,
    WheelZoomTool,
    ZoomInTool,
    ZoomOutTool,
)
from ..util.string import nice_join

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'process_active_tools',
    'process_tools_arg',
)

TOOLS_MAP = {
    "pan": lambda: PanTool(dimensions='both'),
    "xpan": lambda: PanTool(dimensions='width'),
    "ypan": lambda: PanTool(dimensions='height'),
    "xwheel_pan": lambda: WheelPanTool(dimension="width"),
    "ywheel_pan": lambda: WheelPanTool(dimension="height"),
    "wheel_zoom": lambda: WheelZoomTool(dimensions='both'),
    "xwheel_zoom": lambda: WheelZoomTool(dimensions='width'),
    "ywheel_zoom": lambda: WheelZoomTool(dimensions='height'),
    "zoom_in": lambda: ZoomInTool(dimensions='both'),
    "xzoom_in": lambda: ZoomInTool(dimensions='width'),
    "yzoom_in": lambda: ZoomInTool(dimensions='height'),
    "zoom_out": lambda: ZoomOutTool(dimensions='both'),
    "xzoom_out": lambda: ZoomOutTool(dimensions='width'),
    "yzoom_out": lambda: ZoomOutTool(dimensions='height'),
    "click": lambda: TapTool(behavior="inspect"),
    "tap": lambda: TapTool(),
    "crosshair": lambda: CrosshairTool(),
    "box_select": lambda: BoxSelectTool(),
    "xbox_select": lambda: BoxSelectTool(dimensions='width'),
    "ybox_select": lambda: BoxSelectTool(dimensions='height'),
    "poly_select": lambda: PolySelectTool(),
    "lasso_select": lambda: LassoSelectTool(),
    "box_zoom": lambda: BoxZoomTool(dimensions='both'),
    "xbox_zoom": lambda: BoxZoomTool(dimensions='width'),
    "ybox_zoom": lambda: BoxZoomTool(dimensions='height'),
    "hover": lambda: HoverTool(tooltips=[
        ("index", "$index"),
        ("data (x, y)", "($x, $y)"),
        ("screen (x, y)", "($sx, $sy)"),
    ]),
    "save": lambda: SaveTool(),
    "previewsave": "save",
    "undo": lambda: UndoTool(),
    "redo": lambda: RedoTool(),
    "reset": lambda: ResetTool(),
    "help": lambda: HelpTool(),
    "box_edit": lambda: BoxEditTool(),
    "point_draw": lambda: PointDrawTool(),
    "poly_draw": lambda: PolyDrawTool(),
    "poly_edit": lambda: PolyEditTool()
}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def process_active_tools(toolbar, tool_map, active_drag, active_inspect, active_scroll, active_tap):
    """ Adds tools to the plot object

    Args:
        toolbar (Toolbar): instance of a Toolbar object
        tools_map (dict[str]|Tool): tool_map from _process_tools_arg
        active_drag (str or Tool): the tool to set active for drag
        active_inspect (str or Tool): the tool to set active for inspect
        active_scroll (str or Tool): the tool to set active for scroll
        active_tap (str or Tool): the tool to set active for tap

    Returns:
        None

    Note:
        This function sets properties on Toolbar
    """
    if active_drag in ['auto', None] or isinstance(active_drag, Tool):
        toolbar.active_drag = active_drag
    elif active_drag in tool_map:
        toolbar.active_drag = tool_map[active_drag]
    else:
        raise ValueError("Got unknown %r for 'active_drag', which was not a string supplied in 'tools' argument" % active_drag)

    if active_inspect in ['auto', None] or isinstance(active_inspect, Tool) or all(isinstance(t, Tool) for t in active_inspect):
        toolbar.active_inspect = active_inspect
    elif active_inspect in tool_map:
        toolbar.active_inspect = tool_map[active_inspect]
    else:
        raise ValueError("Got unknown %r for 'active_inspect', which was not a string supplied in 'tools' argument" % active_scroll)

    if active_scroll in ['auto', None] or isinstance(active_scroll, Tool):
        toolbar.active_scroll = active_scroll
    elif active_scroll in tool_map:
        toolbar.active_scroll = tool_map[active_scroll]
    else:
        raise ValueError("Got unknown %r for 'active_scroll', which was not a string supplied in 'tools' argument" % active_scroll)

    if active_tap in ['auto', None] or isinstance(active_tap, Tool):
        toolbar.active_tap = active_tap
    elif active_tap in tool_map:
        toolbar.active_tap = tool_map[active_tap]
    else:
        raise ValueError("Got unknown %r for 'active_tap', which was not a string supplied in 'tools' argument" % active_tap)

def process_tools_arg(plot, tools, tooltips=None):
    """ Adds tools to the plot object

    Args:
        plot (Plot): instance of a plot object

        tools (seq[Tool or str]|str): list of tool types or string listing the
            tool names. Those are converted using the to actual Tool instances.

        tooltips (string or seq[tuple[str, str]], optional):
            tooltips to use to configure a HoverTool

    Returns:
        list of Tools objects added to plot, map of supplied string names to tools
    """
    tool_objs = []
    tool_map = {}
    temp_tool_str = ""
    repeated_tools = []

    if isinstance(tools, (list, tuple)):
        for tool in tools:
            if isinstance(tool, Tool):
                tool_objs.append(tool)
            elif isinstance(tool, str):
                temp_tool_str += tool + ','
            else:
                raise ValueError("tool should be a string or an instance of Tool class")
        tools = temp_tool_str

    for tool in re.split(r"\s*,\s*", tools.strip()):
        # re.split will return empty strings; ignore them.
        if tool == "":
            continue

        tool_obj = _tool_from_string(tool)
        tool_objs.append(tool_obj)
        tool_map[tool] = tool_obj

    for typename, group in itertools.groupby(
            sorted(tool.__class__.__name__ for tool in tool_objs)):
        if len(list(group)) > 1:
            repeated_tools.append(typename)

    if repeated_tools:
        warnings.warn("%s are being repeated" % ",".join(repeated_tools))

    if tooltips is not None:
        for tool_obj in tool_objs:
            if isinstance(tool_obj, HoverTool):
                tool_obj.tooltips = tooltips
                break
        else:
            tool_objs.append(HoverTool(tooltips=tooltips))

    return tool_objs, tool_map

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


def _tool_from_string(name):
    """ Takes a string and returns a corresponding `Tool` instance. """
    known_tools = sorted(TOOLS_MAP.keys())

    if name in known_tools:
        tool_fn = TOOLS_MAP[name]

        if isinstance(tool_fn, str):
            tool_fn = TOOLS_MAP[tool_fn]

        return tool_fn()
    else:
        matches, text = difflib.get_close_matches(name.lower(), known_tools), "similar"

        if not matches:
            matches, text = known_tools, "possible"

        raise ValueError("unexpected tool name '%s', %s tools are %s" % (name, text, nice_join(matches)))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
