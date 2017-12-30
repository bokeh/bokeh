#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
import mock

# Bokeh imports
from bokeh.application.handlers import FunctionHandler
from bokeh.core.properties import Int, Instance
from bokeh.document import Document
from bokeh.model import Model
from bokeh.plotting import figure

# Module under test
import bokeh.application.application as baa

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'Application',                      (1,0,0) ),
        ( 'Application.handlers.fget',        (1,0,0) ),
        ( 'Application.metadata.fget',        (1,0,0) ),
        ( 'Application.safe_to_fork.fget',    (1,0,0) ),
        ( 'Application.static_path.fget',     (1,0,0) ),
        ( 'Application.add',                  (1,0,0) ),
        ( 'Application.create_document',      (1,0,0) ),
        ( 'Application.initialize_document',  (1,0,0) ),

    ), DEV: (

        ( 'Application.on_server_loaded',     (1,0,0) ),
        ( 'Application.on_server_unloaded',   (1,0,0) ),
        ( 'Application.on_session_created',   (1,0,0) ),
        ( 'Application.on_session_destroyed', (1,0,0) ),

        ( 'ServerContext',                           (1,0,0) ),
        ( 'ServerContext.sessions.fget',             (1,0,0) ),
        ( 'ServerContext.add_next_tick_callback',    (1,0,0) ),
        ( 'ServerContext.add_periodic_callback',     (1,0,0) ),
        ( 'ServerContext.add_timeout_callback',      (1,0,0) ),
        ( 'ServerContext.remove_next_tick_callback', (1,0,0) ),
        ( 'ServerContext.remove_periodic_callback',  (1,0,0) ),
        ( 'ServerContext.remove_timeout_callback',   (1,0,0) ),

        ( 'SessionContext',                      (1,0,0) ),
        ( 'SessionContext.destroyed.fget',       (1,0,0) ),
        ( 'SessionContext.id.fget',              (1,0,0) ),
        ( 'SessionContext.server_context.fget',  (1,0,0) ),
        ( 'SessionContext.with_locked_document', (1,0,0) ),

    )

}

Test_api = verify_api(baa, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class AnotherModelInTestApplication(Model):
    baar = Int(1)

class SomeModelInTestApplication(Model):
    foo = Int(2)
    child = Instance(Model)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Application(object):

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

    # TODO (bev) something about our logging setup is causing this to fail
    # def test_failed_handler(self, caplog):
    #     a = baa.Application()
    #     handler = CodeHandler(filename="junk", source="bad(")
    #     a.add(handler)
    #     d = Document()
    #     with caplog.at_level(logging.ERROR):
    #         assert len(caplog.records) == 0
    #         a.initialize_document(d)
    #         assert len(caplog.records) == 1

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
