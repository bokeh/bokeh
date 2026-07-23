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

# External imports
import pytest
from tornado.web import HTTPError

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


# Module under test
from bokeh.server.views.autoload_js_handler import AutoloadJsHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_get_raises_for_missing_session() -> None:
    class MissingSessionAutoloadJsHandler(AutoloadJsHandler):
        def _allow_websocket_origin(self) -> None:
            pass

        async def get_session(self) -> None:
            return None

    handler = object.__new__(MissingSessionAutoloadJsHandler)

    with pytest.raises(HTTPError) as exc:
        await MissingSessionAutoloadJsHandler.get(handler)

    assert exc.value.status_code == 403
    assert exc.value.reason == "Invalid token or session ID"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
