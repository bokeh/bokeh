""" Bokeh can present many kinds of UI widgets alongside plots.
When used in conjunction with the Bokeh server, it is possible to
trigger events, updates, etc. based on a user's interaction with
these widgets.

"""
from __future__ import absolute_import

from ...core.properties import abstract
from ...core.properties import String, List
from ..component import Component

@abstract
class Widget(Component):
    """ A base class for all interactive widget types. """

    css_classes = List(String)
