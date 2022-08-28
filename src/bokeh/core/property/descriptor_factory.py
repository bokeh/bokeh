#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide a Base class for all Bokeh properties.

Bokeh properties work by contributing Python descriptor objects to
``HasProps`` classes. These descriptors then delegate attribute access back
to the Bokeh property class, which handles validation, serialization, and
documentation needs.

The ``PropertyDescriptorFactory`` class provides the ``make_descriptors``
method that is used by the metaclass ``MetaHasProps`` during class creation
to install the descriptors corresponding to the declared properties.

This machinery helps to make Bokeh much more user friendly. For example,
the DataSpec properties mediate between fixed values and references to column
data source columns. A user can use a very simple syntax, and the property
will correctly serialize and validate automatically:

.. code-block:: python

    from bokeh.models import Circle

    c = Circle()

    c.x = 10      # serializes to {'value': 10}

    c.x = 'foo'   # serializes to {'field': 'foo'}

    c.x = [1,2,3] # raises a ValueError validation exception

There are many other examples like this throughout Bokeh. In this way users
may operate simply and naturally, and not be concerned with the low-level
details around validation, serialization, and documentation.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

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

if TYPE_CHECKING:
    from .descriptors import PropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'PropertyDescriptorFactory',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

T = TypeVar("T")

class PropertyDescriptorFactory(Generic[T]):
    """ Base class for all Bokeh properties.

    A Bokeh property really consist of two parts: the familiar "property"
    portion, such as ``Int``, ``String``, etc., as well as an associated
    Python descriptor that delegates attribute access (e.g. ``range.start``)
    to the property instance.

    Consider the following class definition:

    .. code-block:: python

        from bokeh.model import Model
        from bokeh.core.properties import Int

        class SomeModel(Model):
            foo = Int(default=10)

    Then we can observe the following:

    .. code-block:: python

        >>> m = SomeModel()

        # The class itself has had a descriptor for 'foo' installed
        >>> getattr(SomeModel, 'foo')
        <bokeh.core.property.descriptors.PropertyDescriptor at 0x1065ffb38>

        # which is used when 'foo' is accessed on instances
        >>> m.foo
        10

    """

    def make_descriptors(self, name: str) -> list[PropertyDescriptor[T]]:
        """ Return a list of ``PropertyDescriptor`` instances to install on a
        class, in order to delegate attribute access to this property.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[PropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.

        Subclasses of ``PropertyDescriptorFactory`` are responsible for
        implementing this function to return descriptors specific to their
        needs.

        """
        raise NotImplementedError("make_descriptors not implemented")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
