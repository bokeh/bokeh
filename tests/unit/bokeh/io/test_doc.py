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
import asyncio
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

def test_curdoc_initializes_default_document_lazily() -> None:
    previous = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)
    bid._DEFAULT_DOCUMENT_BY_THREAD.document = None
    try:
        doc = bid.curdoc()

        assert isinstance(doc, Document)
        assert bid.curdoc() is doc
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_set_curdoc_sets_default_document() -> None:
    d = Document()
    previous = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)
    try:
        bid.set_curdoc(d)
        assert bid.curdoc() is d
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous


def test_set_curdoc_survives_sequential_async_task_contexts() -> None:
    document = Document()
    previous = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)
    bid._DEFAULT_DOCUMENT_BY_THREAD.document = None

    async def run() -> Document:
        async def configure() -> None:
            bid.set_curdoc(document)

        async def retrieve() -> Document:
            return bid.curdoc()

        await asyncio.create_task(configure())
        return await asyncio.create_task(retrieve())

    try:
        assert asyncio.run(run()) is document
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous


def test_set_curdoc_supersedes_parent_context_in_later_async_task() -> None:
    parent_document = Document()
    document = Document()
    previous_document = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)

    async def run() -> Document:
        async def configure() -> None:
            bid.set_curdoc(document)

        async def retrieve() -> Document:
            return bid.curdoc()

        await asyncio.create_task(configure())
        return await asyncio.create_task(retrieve())

    try:
        bid.set_curdoc(parent_document)
        assert asyncio.run(run()) is document
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous_document


def test_patch_curdoc_remains_local_to_concurrent_async_tasks() -> None:
    documents = [Document(), Document()]

    async def run() -> list[Document]:
        first_configured = asyncio.Event()
        second_configured = asyncio.Event()

        async def first() -> Document:
            with bid.patch_curdoc(documents[0]):
                first_configured.set()
                await second_configured.wait()
                return bid.curdoc()

        async def second() -> Document:
            await first_configured.wait()
            with bid.patch_curdoc(documents[1]):
                second_configured.set()
                return bid.curdoc()

        first_result, second_result = await asyncio.gather(first(), second())
        return [first_result, second_result]

    assert asyncio.run(run()) == documents


def test_patch_curdoc_is_inherited_by_child_tasks() -> None:
    inherited = Document()
    competing = Document()
    previous = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)

    async def run() -> Document:
        child_started = asyncio.Event()
        default_changed = asyncio.Event()

        async def child() -> Document:
            child_started.set()
            await default_changed.wait()
            return bid.curdoc()

        async def change_default() -> None:
            await child_started.wait()
            bid.set_curdoc(competing)
            default_changed.set()

        change = asyncio.create_task(change_default())
        with bid.patch_curdoc(inherited):
            result = await asyncio.create_task(child())
        await change
        return result

    try:
        assert asyncio.run(run()) is inherited
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous

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

@pytest.mark.free_threading
def test_curdoc_default_is_thread_local() -> None:
    barrier = threading.Barrier(2)
    seen: list[tuple[Document, Document] | None] = [None, None]

    def check(index: int) -> None:
        first = bid.curdoc()
        barrier.wait()
        seen[index] = (first, bid.curdoc())

    threads = [threading.Thread(target=check, args=(index,)) for index in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert seen[0] is not None
    assert seen[1] is not None
    assert seen[0][0] is seen[0][1]
    assert seen[1][0] is seen[1][1]
    assert seen[0][0] is not seen[1][0]

@pytest.mark.free_threading
def test_set_curdoc_is_thread_local() -> None:
    original = Document()
    docs = [Document(), Document()]
    previous = getattr(bid._DEFAULT_DOCUMENT_BY_THREAD, "document", None)
    bid._DEFAULT_DOCUMENT_BY_THREAD.document = original
    barrier = threading.Barrier(2)
    seen: list[Document | None] = [None, None]

    def check(index: int) -> None:
        bid.set_curdoc(docs[index])
        barrier.wait()
        seen[index] = bid.curdoc()

    try:
        threads = [threading.Thread(target=check, args=(index,)) for index in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        assert seen == docs
        assert bid.curdoc() is original
    finally:
        bid._DEFAULT_DOCUMENT_BY_THREAD.document = previous

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
