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

from typing import Any

from .bases import Property
from .descriptors import AliasPropertyDescriptor, DeprecatedAliasPropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Alias",
    "DeprecatedAlias",
)

type Version = tuple[int, int, int]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Alias[GetType, SetType = GetType](Property[GetType, SetType]):
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
        # Intentionally doesn't call Property.__init__(). An alias has no value,
        # default or serialization state of its own, as AliasPropertyDescriptor
        # delegates all of that to the aliased property, so Property.__init__()'s
        # setup of the default, serialization and docstring doesn't apply here.
        self.aliased_name = aliased_name
        self._help = help
        self._init_constraints()

    def make_descriptor(self, name: str) -> AliasPropertyDescriptor[GetType, SetType]:
        return AliasPropertyDescriptor(name, self)

class DeprecatedAlias[GetType, SetType = GetType](Alias[GetType, SetType]):
    """
    Alias of another property of a model showing a deprecation message when used.
    """

    def __init__(self, aliased_name: str, *, since: Version,
            extra: str | None = None, help: str | None = None) -> None:
        super().__init__(aliased_name, help=help)
        self.since = since
        self.extra = extra

    def make_descriptor(self, name: str) -> DeprecatedAliasPropertyDescriptor[GetType, SetType]:
        return DeprecatedAliasPropertyDescriptor(name, self)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
