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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .bases import Property
from .descriptors import AliasPropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Alias",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Alias(Property): # lgtm [py/missing-call-to-init]
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
    help: str | None

    # Alias is somewhat a quasi-property
    readonly = False
    serialized = False
    _default = None

    def __init__(self, aliased_name: str, *, help: str | None = None) -> None:
        self.aliased_name = aliased_name
        self.help = help

    def make_descriptors(self, base_name):
        """ Return a list of ``AliasPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            aliased_name (str) : the name of the property this alias is for

        Returns:
            list[AliasPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        """
        return [ AliasPropertyDescriptor(base_name, self.aliased_name, self) ]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
