#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import threading
import weakref

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.io.doc as bid # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_curdoc_returns_default_document() -> None:
    assert isinstance(bid.curdoc(), Document)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_set_curdoc_sets_default_document() -> None:
    d = Document()
    bid.set_curdoc(d)
    assert bid.curdoc() is d

def test_patch_curdoc() -> None:
    d1 = Document()
    d2 = Document()
    orig_doc =  bid.curdoc()

    assert bid._PATCHED_CURDOCS.get() == ()

    with bid.patch_curdoc(d1):
        assert len(bid._PATCHED_CURDOCS.get()) == 1
        assert isinstance(bid._PATCHED_CURDOCS.get()[0], weakref.ReferenceType)
        assert bid.curdoc() is d1

        with bid.patch_curdoc(d2):
            assert len(bid._PATCHED_CURDOCS.get()) == 2
            assert isinstance(bid._PATCHED_CURDOCS.get()[1], weakref.ReferenceType)
            assert bid.curdoc() is d2

        assert len(bid._PATCHED_CURDOCS.get()) == 1
        assert isinstance(bid._PATCHED_CURDOCS.get()[0], weakref.ReferenceType)
        assert bid.curdoc() is d1

    assert bid.curdoc() is orig_doc

def test_patch_curdoc_pops_after_exception() -> None:
    doc = Document()

    assert bid._PATCHED_CURDOCS.get() == ()

    with pytest.raises(RuntimeError):
        with bid.patch_curdoc(doc):
            raise RuntimeError("boom")

    assert bid._PATCHED_CURDOCS.get() == ()

def _doc():
    return Document()

def test_patch_curdoc_weakref_raises() -> None:
    with bid.patch_curdoc(_doc()):
        gc.collect()
        with pytest.raises(RuntimeError) as e:
            bid.curdoc()
        assert str(e.value) == "Patched curdoc has been previously destroyed"

@pytest.mark.free_threading
def test_patch_curdoc_is_context_local() -> None:
    docs = [Document(), Document()]
    barrier = threading.Barrier(2)
    seen: list[Document] = []

    def check(doc: Document) -> None:
        with bid.patch_curdoc(doc):
            barrier.wait()
            seen.append(bid.curdoc())

    threads = [threading.Thread(target=check, args=(doc,)) for doc in docs]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert set(seen) == set(docs)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
