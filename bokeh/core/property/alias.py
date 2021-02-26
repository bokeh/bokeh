#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the ``Alias`` class, for aliasing other properties.

.. note::
    This class should normally be imported from ``bokeh.core.properties``
    instead of directly from this module.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Optional

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Alias",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Alias:
    """
    Alias another property of a model.

    Example:

        Consider the following class definitions:

        .. code-block:: python

            from bokeh.model import Model
            from bokeh.properties import Alias, Int

            class Parent(Model):
                width = Int()

            class Child(Parent):
                plot_width = Alias("width")

    """

    name: str
    help: Optional[str]

    def __init__(self, name: str, *, help: Optional[str] = None):
        self.name = name
        self.help = help

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
