#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utility classes and functions useful for testing Bokeh itself.

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
import importlib

# External imports
import pytest
from six import string_types

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def verify_all(module, ALL):
    '''

    '''
    class Test___all__(object):
        def test___all__(self):
            if isinstance(module, string_types):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, "__all__")
            assert mod.__all__ == ALL, "for module %s, expected: %r, actual: %r" % (mod.__name__, set(ALL)-set(mod.__all__), set(mod.__all__)-set(ALL))

        @pytest.mark.parametrize('name', ALL)
        @pytest.mark.unit
        def test_contents(self, name):
            if isinstance(module, string_types):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, name)
    return Test___all__

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
