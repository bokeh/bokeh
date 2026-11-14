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

from typing import TYPE_CHECKING, Any, overload

from .descriptors import PropertyDescriptor

if TYPE_CHECKING:
    from .bases import Init, Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Override',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Override[G = Any, S = G]:
    """ Override attributes of Bokeh property in derived Models.

    When subclassing a Bokeh Model, it may be desirable to change some of the
    attributes of the property itself, from those on the base class. This is
    accomplished using the ``Override`` class.

    Currently, ``Override`` can only be use to override the ``default`` value
    for the property.

    The name of an override should be the name of the overridden property
    prefixed with an underscore, e.g. ``_foo`` to override ``foo``. This way
    the property isn't redefined in the derived model, so type checkers retain
    its type. Overrides named exactly like properties are supported as well.

    Optionally, the overridden property can be given, e.g.
    ``_foo = Override(Parent.foo, default=20)``, to allow type checkers to
    verify the type of the default value. Such overrides must be named after
    the property, prefixed with an underscore.

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
                _foo = Override(Parent.foo, default=20)

        The parent class has an integer property ``foo`` with default value
        10.  The child class uses the following code:

        .. code-block:: python

            _foo = Override(Parent.foo, default=20)

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

    default_overridden: bool
    default: Any

    @overload
    def __init__(self, prop: PropertyDescriptor[G, S], /, *, default: Init[S]) -> None: ...
    @overload
    def __init__(self, /, *, default: Any) -> None: ...

    def __init__(self, prop: Any = None, /, *, default: Any) -> None:
        # declared here, because class-level declarations of Property[...]
        # type would be treated as descriptors by type checkers
        self.overridden_property: Property[Any] | None
        self.overridden_name: str | None

        if prop is None:
            self.overridden_property = None
            self.overridden_name = None
        elif isinstance(prop, PropertyDescriptor):
            self.overridden_property = prop.property
            self.overridden_name = prop.name
        else:
            raise TypeError(f"expected a property of a model, e.g. Model.prop, got {prop!r}")

        self.default_overridden = True
        self.default = default

    def __set_name__(self, owner: type[Any], name: str) -> None:
        own_overridden_defaults = owner.__dict__.get("__overridden_defaults__")
        if not isinstance(own_overridden_defaults, dict):
            own_overridden_defaults = {}
            setattr(owner, "__overridden_defaults__", own_overridden_defaults)

        if self.overridden_property is not None:
            if name != f"_{self.overridden_name}":
                raise TypeError(f"{owner.__name__}.{name} overrides {self.overridden_name!r}, so it must be named '_{self.overridden_name}'")

            own_overridden_properties = owner.__dict__.get("__overridden_properties__")
            if not isinstance(own_overridden_properties, dict):
                own_overridden_properties = {}
                setattr(owner, "__overridden_properties__", own_overridden_properties)
            own_overridden_properties[name] = self.overridden_property

        if self.default_overridden:
            own_overridden_defaults[name] = self.default
        if owner.__dict__.get(name) is self:
            delattr(owner, name)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
