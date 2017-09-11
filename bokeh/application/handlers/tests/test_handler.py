from __future__ import absolute_import, print_function

from bokeh.application.handlers.handler import Handler

import pytest

def test_create():
    h = Handler()
    assert h.failed == False
    assert h.url_path() is None
    assert h.static_path() is None
    assert h.error is None
    assert h.error_detail is None

def test_modify_document_abstract():
    h = Handler()
    with pytest.raises(NotImplementedError):
        h.modify_document("doc")

def test_default_hooks_return_none():
    h = Handler()
    assert h.on_server_loaded("context") is None
    assert h.on_server_unloaded("context") is None
    assert h.on_session_created("context") is None
    assert h.on_session_destroyed("context") is None

def test_static_path():
    h = Handler()
    assert h.static_path() is None
    h._static = "path"
    assert h.static_path() == "path"
    h._failed = True
    assert h.static_path() is None
