from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool

class Widget(PlotObject):
    disabled = Bool(False)
