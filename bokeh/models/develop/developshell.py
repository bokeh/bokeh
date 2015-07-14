""" Overlay shown during model reloading, in develop mode """

from __future__ import absolute_import

from ...properties import Instance
from ...plot_object import PlotObject
from .errorpanel import ErrorPanel
from .reloading import Reloading

class DevelopShell(PlotObject):
    """DevelopShell isn't useful to manipulate directly; it's the UI for develop mode.
    """

    error_panel = Instance(ErrorPanel, help="""
    Panel to display errors.
    """)

    reloading = Instance(Reloading, help="""
    Reloading indicator.
    """)

    def __init__(self, **kwargs):
        if "error_panel" not in kwargs:
            kwargs["error_panel"] = ErrorPanel(visible=False)
        if "reloading" not in kwargs:
            kwargs["reloading"] = Reloading(visible=False)
        super(DevelopShell, self).__init__(**kwargs)
