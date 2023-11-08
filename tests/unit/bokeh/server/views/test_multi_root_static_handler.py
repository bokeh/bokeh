#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from pathlib import Path
from typing import Any

# External imports
from tornado.httputil import HTTPConnection, HTTPServerRequest

# Bokeh imports
from bokeh.application import Application
from bokeh.util.paths import server_path
from tests.support.plugins.managed_server_loop import MSL

# Module under test
import bokeh.server.views.multi_root_static_handler as bsvm # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_multi_root_static_handler(ManagedServerLoop: MSL) -> None:
    application = Application()

    static_path = server_path() / "static"
    js_path = static_path / "js"
    lib_path = static_path / "lib"

    assert isinstance(js_path, Path)
    assert isinstance(lib_path, Path)

    url_patterns = [
        (r"/custom/static/(.*)", bsvm.MultiRootStaticHandler, dict(root=dict(js=js_path, lib=lib_path))),
    ]

    class MyHTTPConnection(HTTPConnection):
        def set_close_callback(*args: Any, **kwargs: Any) -> Any:
            pass

    with ManagedServerLoop(application, extra_patterns=url_patterns) as server:
        request = HTTPServerRequest(method="GET", uri="/custom/static/js/bokeh.min.js", connection=MyHTTPConnection())
        dispatcher = server._tornado.find_handler(request)

        cls = dispatcher.handler_class
        assert issubclass(cls, bsvm.MultiRootStaticHandler)

        handler = cls(dispatcher.application, dispatcher.request, **dispatcher.handler_kwargs)
        absolute_path = handler.get_absolute_path(handler.root, str(Path("js") / "bokeh.min.js"))
        absolute_path = handler.validate_absolute_path(handler.root, absolute_path)

        assert absolute_path is not None
        assert (static_path / "js" / "bokeh.min.js").samefile(absolute_path)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
