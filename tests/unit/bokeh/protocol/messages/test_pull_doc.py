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

# External imports
import numpy as np

# Bokeh imports
import bokeh.document as document
from bokeh.core.properties import Instance, Int, Nullable
from bokeh.core.types import ID
from bokeh.model import Model
from bokeh.models import ColumnDataSource

# Module under test
from bokeh.protocol import pull_doc_reply, pull_doc_req, replace_document # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class AnotherModelInTestPullDoc(Model):
    bar = Int(1)

class SomeModelInTestPullDoc(Model):
    foo = Int(2)
    child = Nullable(Instance(Model))


class TestPullDocument:
    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPullDoc()
        doc.add_root(SomeModelInTestPullDoc(child=another))
        doc.add_root(SomeModelInTestPullDoc())
        doc.add_root(ColumnDataSource(data={"a": np.array([0.0, 1.0, 2.0])}))
        return doc

    def test_create_req(self) -> None:
        pull_doc_req()

    def test_create_reply(self) -> None:
        sample = self._sample_doc()
        pull_doc_reply(ID("fakereqid"), sample)

    def test_create_reply_then_parse(self) -> None:
        sample = self._sample_doc()
        msg = pull_doc_reply(ID("fakereqid"), sample)

        assert len(msg.buffers) == 1
        [buf] = msg.buffers
        assert bytes(buf.data) == np.array([0.0, 1.0, 2.0]).tobytes()

        copy = document.Document()
        replace_document(msg, copy)

        assert len(sample.roots) == 3
        assert len(copy.roots) == 3

        _, _, cds = sample.roots
        assert isinstance(cds, ColumnDataSource)
        assert isinstance(cds.data["a"], np.ndarray)

        _, _, cds = copy.roots
        assert isinstance(cds, ColumnDataSource)
        assert isinstance(cds.data["a"], np.ndarray)

    def test_prepare_freezes_buffers(self) -> None:
        sample = self._sample_doc()
        _, _, cds = sample.roots
        assert isinstance(cds, ColumnDataSource)
        array = cds.data["a"]
        assert isinstance(array, np.ndarray)

        msg = pull_doc_reply(ID("fakereqid"), sample)
        msg.prepare()
        [buffer] = msg.buffers
        expected = buffer.data

        assert isinstance(expected, bytes)
        array[0] = 10.0
        assert buffer.data == expected
        assert msg.envelope_json == msg._envelope_json

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
