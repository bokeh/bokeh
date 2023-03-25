#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

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
from copy import copy
from typing import TypeVar

# Bokeh imports
from ..has_props import HasProps
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import PropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Include',
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Include(PropertyDescriptorFactory[T]):
    """ Include "mix-in" property collection in a Bokeh model.

    See :ref:`bokeh.core.property_mixins` for more details.

    """

    def __init__(self, delegate: type[HasProps], *, help: str = "", prefix: str | None = None) -> None:
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError(f"expected a subclass of HasProps, got {delegate!r}")

        self.delegate = delegate
        self.help = help
        self.prefix = prefix + "_" if prefix else ""

    def make_descriptors(self, _base_name: str) -> list[PropertyDescriptor[T]]:
        descriptors = []

        for descriptor in self.delegate.descriptors():
            prop = copy(descriptor.property)
            prop.__doc__ = self.help.format(prop=descriptor.name.replace("_", " "))
            descriptors += prop.make_descriptors(self.prefix + descriptor.name)

        return descriptors

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
