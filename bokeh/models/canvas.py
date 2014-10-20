from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool, Int

class Canvas(PlotObject):
    # TODO (bev) remove default dims here, see #561
    def __init__(self, canvas_height=600, canvas_width=600, **kwargs):
        kwargs['canvas_width'] = canvas_width
        kwargs['canvas_height'] = canvas_height
        super(Canvas, self).__init__(**kwargs)
    botton_bar = Bool(True)
    canvas_height = Int(600)
    canvas_width = Int(600)
    map = Bool(False)
    use_hdpi = Bool(True)
