#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utility classes and functions useful for testing Bokeh itself.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import importlib

# External imports
import pytest

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'verify_all',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def verify_all(module, ALL):
    '''

    '''
    class Test___all__:
        def test___all__(self):
            if isinstance(module, str):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, "__all__")
            assert mod.__all__ == ALL, "for module %s, expected: %r, actual: %r" % (mod.__name__, set(ALL)-set(mod.__all__), set(mod.__all__)-set(ALL))

        @pytest.mark.parametrize('name', ALL)
        def test_contents(self, name):
            if isinstance(module, str):
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
