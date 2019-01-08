#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
import bokeh.document as document
from bokeh.model import Model
from bokeh.core.properties import Int, Instance

# Module under test
from bokeh.protocol import Protocol

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
    child = Instance(Model)

class TestPullDocument(object):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPullDoc()
        doc.add_root(SomeModelInTestPullDoc(child=another))
        doc.add_root(SomeModelInTestPullDoc())
        return doc

    def test_create_req(self):
        Protocol("1.0").create("PULL-DOC-REQ")

    def test_create_reply(self):
        sample = self._sample_doc()
        Protocol("1.0").create("PULL-DOC-REPLY", 'fakereqid', sample)

    def test_create_reply_then_parse(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PULL-DOC-REPLY", 'fakereqid', sample)
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
