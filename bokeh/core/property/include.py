#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from copy import copy
import re

# External imports

# Bokeh imports
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import BasicPropertyDescriptor
from ..has_props import HasProps

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
    ''' Include "mix-in" property collection in a Bokeh model.

    See :ref:`bokeh.core.property_mixins` for more details.

    '''

    def __init__(self, delegate, help="", use_prefix=True):
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError("expected a subclass of HasProps, got %r" % delegate)

        self.delegate = delegate
        self.help = help
        self.use_prefix = use_prefix

    def make_descriptors(self, base_name):
        descriptors = []
        delegate = self.delegate
        if self.use_prefix:
            prefix = re.sub("_props$", "", base_name) + "_"
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
                    doc = self.help % subpropname.replace('_', ' ')
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
