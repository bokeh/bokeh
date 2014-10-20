from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool, String, Enum, Instance, List, Dict
from ..enums import Dimension

from .renderers import Renderer
from .ranges import Range

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

class PolySelectTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))

class HoverTool(Tool):
    names = List(String)
    renderers = List(Instance(Renderer))
    tooltips = Dict(String, String)
    always_active = Bool(True)

class ObjectExplorerTool(Tool):
    pass

class DataRangeBoxSelectTool(Tool):
    xselect = List(Instance(Range))
    yselect = List(Instance(Range))
