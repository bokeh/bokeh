#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
import bokeh.document as document
from bokeh.core.properties import Instance, Int
from bokeh.model import Model

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
    child = Instance(Model)


class TestPullDocument:
    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPullDoc()
        doc.add_root(SomeModelInTestPullDoc(child=another))
        doc.add_root(SomeModelInTestPullDoc())
        return doc

    def test_create_req(self) -> None:
        proto.create("PULL-DOC-REQ")

    def test_create_reply(self) -> None:
        sample = self._sample_doc()
        proto.create("PULL-DOC-REPLY", 'fakereqid', sample)

    def test_create_reply_then_parse(self) -> None:
        sample = self._sample_doc()
        msg = proto.create("PULL-DOC-REPLY", 'fakereqid', sample)
        copy = document.Document()
        msg.push_to_document(copy)
        assert len(sample.roots) == 2
        assert len(copy.roots) == 2

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
