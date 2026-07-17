#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
from typing import TYPE_CHECKING, Any

# Bokeh imports
from .bases import Property
from .descriptor_factory import PropertyDescriptorLike
from .descriptors import AliasPropertyDescriptor, DeprecatedAliasPropertyDescriptor

if TYPE_CHECKING:
    from ...util.deprecation import Version

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Alias",
    "DeprecatedAlias",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Alias[T](Property[T]):
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
    _help: str | None

    # Alias is somewhat a quasi-property
    _default: Any = None

    @property
    def readonly(self) -> bool:
        return False

    @property
    def serialized(self) -> bool:
        return False

    def __init__(self, aliased_name: str, *, help: str | None = None) -> None:
        self.aliased_name = aliased_name
        self._help = help
        self.alternatives = []
        self.assertions = []

    def make_descriptors(self, name: str) -> list[PropertyDescriptorLike[T]]:
        return [ AliasPropertyDescriptor(name, self) ]

class DeprecatedAlias[T](Alias[T]):
    """
    Alias of another property of a model showing a deprecation message when used.
    """

    def __init__(self, aliased_name: str, *, since: Version,
            extra: str | None = None, help: str | None = None) -> None:
        super().__init__(aliased_name, help=help)
        self.since = since
        self.extra = extra

    def make_descriptors(self, name: str) -> list[PropertyDescriptorLike[T]]:
        return [ DeprecatedAliasPropertyDescriptor(name, self) ]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
