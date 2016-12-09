""" Various kinds of icon widgets.

"""
from __future__ import absolute_import

from ...core.properties import abstract
from ...core.properties import Bool, Float, Enum
from .widget import Widget

@abstract
class AbstractIcon(Widget):
    """ An abstract base class for icon widgets. ``AbstractIcon``
    is not generally useful to instantiate on its own.

    """
