""" Overlay shown during model reloading, in develop mode """

from __future__ import absolute_import

from ...properties import Bool
from ...plot_object import PlotObject

class Reloading(PlotObject):
    """ Overlay showing that we are reloading

    """

    visible = Bool(False, help="""
    Whether we are showing the overlay
    """)

    def __init__(self, **kwargs):
        super(Reloading, self).__init__(**kwargs)
