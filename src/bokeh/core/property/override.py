#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the ``Override`` class, for overriding base class property
attributes.

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
from typing import TYPE_CHECKING, Generic, TypeVar

# Bokeh imports
from ...util.dataclasses import NotRequired, Unspecified

if TYPE_CHECKING:
    from .bases import Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Override',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

T = TypeVar("T")

class Override(Generic[T]):
    """ Override attributes of Bokeh property in derived Models.

    When subclassing a Bokeh Model, it may be desirable to change some of the
    attributes of the property itself, from those on the base class. This is
    accomplished using the ``Override`` class.

    Currently, ``Override`` can only be use to override the ``default`` value
    for the property.

    Keyword Args:
        default (obj) : a default value for this property on a subclass

    Example:

        Consider the following class definitions:

        .. code-block:: python

            from bokeh.model import Model
            from bokeh.properties import Int, Override

            class Parent(Model):
                foo = Int(default=10)

            class Child(Parent):
                foo = Override(default=20)

        The parent class has an integer property ``foo`` with default value
        10.  The child class uses the following code:

        .. code-block:: python

            foo = Override(default=20)

        to specify that the default value for the ``foo`` property should be
        20 on instances of the child class:

        .. code-block:: python

            >>> p = Parent()
            >>> p.foo
            10

            >>> c = Child()
            >>> c.foo
            20

    """

    property_overridden: bool
    property_: NotRequired[Property[T]]

    default_overridden: bool
    default: NotRequired[T]

    def __init__(self, property: NotRequired[Property[T]] = Unspecified, *, default: NotRequired[T] = Unspecified) -> None:
        self.property_overridden = property is not Unspecified
        self.property_ = property

        self.default_overridden = default is not Unspecified
        self.default = default

        if self.property_overridden and self.default_overridden:
            raise ValueError("'property' and 'default' cannot be used simultaneously")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
