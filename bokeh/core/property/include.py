#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

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
import re
from copy import copy

# Bokeh imports
from ..has_props import HasProps
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import BasicPropertyDescriptor

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

    def __init__(self, delegate, help="", use_prefix=True):
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError(f"expected a subclass of HasProps, got {delegate!r}")

        self.delegate = delegate
        self.help = help
        self.use_prefix = use_prefix

    def make_descriptors(self, base_name):
        descriptors = []
        delegate = self.delegate
        if self.use_prefix:
            if isinstance(self.use_prefix, bool):
                prefix = re.sub("_props$", "", base_name) + "_"
            else:
                prefix = self.use_prefix + "_"
        else:
            prefix = ""

        # it would be better if we kept the original generators from
        # the delegate and built our Include props from those, perhaps.
        for subpropname in delegate.properties(with_bases=False):
            fullpropname = prefix + subpropname
            subprop_descriptor = delegate.lookup(subpropname)
            if isinstance(subprop_descriptor, BasicPropertyDescriptor):
                prop = copy(subprop_descriptor.property)
                if "%s" in self.help:
                    doc = self.help % subpropname.replace('_', ' ')  # TODO (bev) get rid of old-style string formatting
                else:
                    doc = self.help
                prop.__doc__ = doc
                descriptors += prop.make_descriptors(fullpropname)

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
