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

class AnotherModelInTestPushDoc(Model):
    bar = Int(1)

class SomeModelInTestPushDoc(Model):
    foo = Int(2)
    child = Instance(Model)


class TestPushDocument:
    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPushDoc()
        doc.add_root(SomeModelInTestPushDoc(child=another))
        doc.add_root(SomeModelInTestPushDoc())
        return doc

    def test_create(self) -> None:
        sample = self._sample_doc()
        proto.create("PUSH-DOC", sample)

    def test_create_then_parse(self) -> None:
        sample = self._sample_doc()
        msg = proto.create("PUSH-DOC", sample)
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
