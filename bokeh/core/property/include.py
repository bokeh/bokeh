#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from ..has_props import HasProps
from .descriptor_factory import PropertyDescriptorFactory

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Include',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Include(PropertyDescriptorFactory):
    """ Include "mix-in" property collection in a Bokeh model.

    See :ref:`bokeh.core.property_mixins` for more details.

    """

    def __init__(self, delegate, help="", prefix=None) -> None:
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError(f"expected a subclass of HasProps, got {delegate!r}")

        self.delegate = delegate
        self.help = help
        self.prefix = prefix + "_" if prefix else ""

    def make_descriptors(self, _base_name):
        descriptors = []

        for prop_name in self.delegate.properties():
            prop_descriptor = self.delegate.lookup(prop_name)
            prop = copy(prop_descriptor.property)
            prop.__doc__ = self.help.format(prop=prop_name.replace('_', ' '))
            descriptors += prop.make_descriptors(self.prefix + prop_name)

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
