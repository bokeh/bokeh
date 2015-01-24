from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Any, Bool, String, Enum, Instance, List, Dict, Tuple
from ..enums import Dimension

from .renderers import Renderer
from .ranges import Range

class ToolEvents(PlotObject):
    geometries = List(Dict(String, Any))

class Tool(PlotObject):
    plot = Instance(".models.plots.Plot")

class PanTool(Tool):
    dimensions = List(Enum(Dimension), default=["width", "height"])

class WheelZoomTool(Tool):
    dimensions = List(Enum(Dimension), default=["width", "height"])

class PreviewSaveTool(Tool):
    pass

class ResetTool(Tool):
    pass

class ResizeTool(Tool):
    pass

class TapTool(Tool):
    names = List(String)
    always_active = Bool(True)

class CrosshairTool(Tool):
    pass

class BoxZoomTool(Tool):
    pass

class BoxSelectTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))
    select_every_mousemove = Bool(True)
    dimensions = List(Enum(Dimension), default=["width", "height"])

class BoxSelectionOverlay(Renderer):
    __view_model__ = 'BoxSelection'
    tool = Instance(Tool)

class LassoSelectTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))
    select_every_mousemove = Bool(True)

class PolySelectTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))

class HoverTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))
    tooltips = List(Tuple(String, String)) \
        .accepts(Dict(String, String), lambda d: list(d.items()))
    always_active = Bool(True)
    snap_to_data = Bool(True)
