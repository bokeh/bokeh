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
import weakref

# Bokeh imports
from bokeh.document import Document
from bokeh.io.state import curstate

# Module under test
import bokeh.io.doc as bid # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_curdoc_from_curstate() -> None:
    assert bid.curdoc() is curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_set_curdoc_sets_curstate() -> None:
    d = Document()
    bid.set_curdoc(d)
    assert curstate().document is d

def test_patch_curdoc() -> None:
    d1 = Document()
    d2 = Document()
    orig_doc =  bid.curdoc()

    assert bid._PATCHED_CURDOCS == []

    with bid.patch_curdoc(d1):
        assert len(bid._PATCHED_CURDOCS) == 1
        assert isinstance(bid._PATCHED_CURDOCS[0], weakref.ReferenceType)
        assert bid.curdoc() is d1

        with bid.patch_curdoc(d2):
            assert len(bid._PATCHED_CURDOCS) == 2
            assert isinstance(bid._PATCHED_CURDOCS[1], weakref.ReferenceType)
            assert bid.curdoc() is d2

        assert len(bid._PATCHED_CURDOCS) == 1
        assert isinstance(bid._PATCHED_CURDOCS[0], weakref.ReferenceType)
        assert bid.curdoc() is d1

    assert bid.curdoc() is orig_doc

def _doc():
    return Document()

def test_patch_curdoc_weakref_raises() -> None:
    with bid.patch_curdoc(_doc()):
        with pytest.raises(RuntimeError) as e:
            bid.curdoc()
            assert str(e) == "Patched curdoc has been previously destroyed"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
