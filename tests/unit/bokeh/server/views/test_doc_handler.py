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

# Standard library imports
from typing import Any, cast

# External imports
import pytest
from tornado.web import HTTPError

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------



# Module under test
from bokeh.server.views.doc_handler import DocHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_get_raises_for_missing_session() -> None:
    class MissingSessionDocHandler(DocHandler):
        async def get_session(self) -> None:
            return None

    handler = object.__new__(MissingSessionDocHandler)
    get = cast(Any, MissingSessionDocHandler.get).__wrapped__

    with pytest.raises(HTTPError) as exc:
        await get(handler)

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
