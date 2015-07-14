""" Overlay shown during model reloading, in develop mode """

from __future__ import absolute_import

from ...properties import Bool, String
from ...plot_object import PlotObject

class ErrorPanel(PlotObject):
    """ Panel used to display errors on plot load.

    """

    visible = Bool(False, help="""
    Whether we are showing the overlay
    """)

    error = String("", help="""
    The error message to display
    """)

    error_detail = String("", help="""
    More details on the error, such as logs or stack trace
    """)

    def __init__(self, **kwargs):
        super(ErrorPanel, self).__init__(**kwargs)
