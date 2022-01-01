#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import gc
import logging
import sys

# Bokeh imports
from bokeh.document import Document
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.document.modules as bdm # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

extra = []

class FakeMod:
    __name__ = 'FakeMod'

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestDocumentModuleManager:

    def test_basic(self) -> None:
        d = Document()
        dm = bdm.DocumentModuleManager(d)
        assert len(dm) == 0

        # module manager should only hold a weak ref
        assert len(gc.get_referrers(d)) == 0

    def test_add(self) -> None:
        d = Document()
        dm = bdm.DocumentModuleManager(d)

        mod = FakeMod()
        assert 'FakeMod' not in sys.modules

        dm.add(mod)

        assert 'FakeMod' in sys.modules
        assert len(dm) == 1

        del sys.modules["FakeMod"]

    def test_add_twice_error(self) -> None:
        d = Document()
        dm = bdm.DocumentModuleManager(d)

        mod = FakeMod()
        assert 'FakeMod' not in sys.modules

        dm.add(mod)

        with pytest.raises(RuntimeError):
            dm.add(mod)

        del sys.modules["FakeMod"]

    def test_destroy(self) -> None:
        d = Document()
        dm = bdm.DocumentModuleManager(d)

        mod = FakeMod()
        assert 'FakeMod' not in sys.modules

        dm.add(mod)

        assert 'FakeMod' in sys.modules
        assert len(dm) == 1

        dm.destroy()

        assert len(dm) == 0
        assert 'FakeMod' not in sys.modules

    def test_extra_referrer_error(self, caplog: pytest.LogCaptureFixture) -> None:
        d = Document()
        dm = bdm.DocumentModuleManager(d)

        mod = FakeMod()
        assert 'FakeMod' not in sys.modules

        dm.add(mod)

        assert 'FakeMod' in sys.modules
        assert len(dm) == 1

        # add an extra referrer for Document.destroy to complain about
        extra.append(mod)

        import gc

        # get_referrers behavior changed in Python 3.7, see https://github.com/bokeh/bokeh/issues/8221
        assert len(gc.get_referrers(mod)) in (3,4)

        with caplog.at_level(logging.ERROR):
            dm.destroy()
            assert "Module %r has extra unexpected referrers! This could indicate a serious memory leak. Extra referrers:" % mod in caplog.text
            assert len(caplog.records) == 1

        assert 'FakeMod' not in sys.modules
        assert len(dm) ==0



#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()
