""" Client-side interactivity. """

from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import String

class Action(PlotObject):
    """ Base class for interactive actions. """

class OpenURL(Action):
    """ Open a URL in a new tab or window (browser dependent). """

    url = String("http://", help="""
    The URL to direct the web browser to. This can be a template string,
    which will be formatted with data from the data source.
    """)
