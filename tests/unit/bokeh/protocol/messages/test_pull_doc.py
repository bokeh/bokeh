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
from bokeh.protocol import Protocol # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

proto = Protocol()

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
        proto.create("PULL-DOC-REQ")

    def test_create_reply(self) -> None:
        sample = self._sample_doc()
        proto.create("PULL-DOC-REPLY", ID("fakereqid"), sample)

    def test_create_reply_then_parse(self) -> None:
        sample = self._sample_doc()
        msg = proto.create("PULL-DOC-REPLY", ID("fakereqid"), sample)

        assert len(msg.buffers) == 1
        [buf] = msg.buffers
        assert bytes(buf.data) == np.array([0.0, 1.0, 2.0]).tobytes()

        copy = document.Document()
        msg.push_to_document(copy)

        assert len(sample.roots) == 3
        assert len(copy.roots) == 3

        _, _, cds = sample.roots
        assert isinstance(cds, ColumnDataSource)
        assert isinstance(cds.data["a"], np.ndarray)

        _, _, cds = copy.roots
        assert isinstance(cds, ColumnDataSource)
        assert isinstance(cds.data["a"], np.ndarray)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
