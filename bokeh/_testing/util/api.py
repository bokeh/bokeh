#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utility classes and functions useful for testing Bokeh itself.

'''

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
import importlib
from types import ModuleType
from typing import Sequence

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

def verify_all(module: str | ModuleType, ALL: Sequence[str]) -> type:
    '''

    '''
    class Test___all__:
        _module: ModuleType | None = None

        @property
        def module(self) -> ModuleType:
            if self._module is None:
                if isinstance(module, str):
                    self._module = importlib.import_module(module)
                else:
                    self._module = module
            return self._module

        def test___all__(self) -> None:
            __all__: Sequence[str] | None = getattr(self.module, "__all__", None)

            assert __all__ is not None, f"module {self.module.__name__} doesn't define __all__"
            assert __all__ == ALL, f"for module {self.module.__name__}, expected: {set(ALL) - set(__all__)!r}, actual: {set(__all__) - set(ALL)!r}"

        @pytest.mark.parametrize('name', ALL)
        def test_contents(self, name: str) -> None:
            assert hasattr(self.module, name)

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
