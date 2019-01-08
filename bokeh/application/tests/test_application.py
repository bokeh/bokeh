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
import logging

# External imports
import mock

# Bokeh imports
from bokeh.application.handlers import CodeHandler, FunctionHandler
from bokeh.core.properties import Int, Instance
from bokeh.document import Document
from bokeh.model import Model
from bokeh.plotting import figure
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.application.application as baa

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

class AnotherModelInTestApplication(Model):
    baar = Int(1)

class SomeModelInTestApplication(Model):
    foo = Int(2)
    child = Instance(Model)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Application(object):

    # Public methods ----------------------------------------------------------

    def test_empty(self):
        a = baa.Application()
        doc = a.create_document()
        assert not doc.roots

    def test_invalid_kwarg(self):
        with pytest.raises(TypeError):
            baa.Application(junk="foo")

    def test_one_handler(self):
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        doc = a.create_document()
        assert len(doc.roots) == 2

    def test_two_handlers(self):
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        doc = a.create_document()
        assert len(doc.roots) == 3

    def test_failed_handler(self, caplog):
        a = baa.Application()
        handler = CodeHandler(filename="junk", source="bad(")
        a.add(handler)
        d = Document()
        with caplog.at_level(logging.ERROR):
            assert len(caplog.records) == 0
            a.initialize_document(d)
            assert len(caplog.records) == 1

    def test_no_static_path(self):
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        assert a.static_path == None

    def test_static_path(self):
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler._static = "foo"
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        assert a.static_path == "foo"

    def test_excess_static_path(self):
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler._static = "foo"
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        handler2._static = "bar"
        with pytest.raises(RuntimeError) as e:
            a.add(handler2)
        assert "More than one static path" in str(e)

    @mock.patch('bokeh.document.document.check_integrity')
    def test_application_validates_document_by_default(self, check_integrity):
        a = baa.Application()
        d = Document()
        d.add_root(figure())
        a.initialize_document(d)
        assert check_integrity.called

    @mock.patch('bokeh.document.document.check_integrity')
    def test_application_doesnt_validate_document_due_to_env_var(self, check_integrity, monkeypatch):
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        a = baa.Application()
        d = Document()
        d.add_root(figure())
        a.initialize_document(d)
        assert not check_integrity.called

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_ServerContext(object):

    # Public methods ----------------------------------------------------------

    def test_abstract(self):
        with pytest.raises(TypeError):
            baa.ServerContext()

class Test_SessionContext(object):

    def test_abstract(self):
        with pytest.raises(TypeError):
            baa.SessionContext()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
