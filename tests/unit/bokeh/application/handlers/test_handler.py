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


# Module under test
import bokeh.application.handlers.handler as bahh # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_Handler:
    # Public methods ----------------------------------------------------------

    def test_create(self) -> None:
        h = bahh.Handler()
        assert h.failed == False
        assert h.url_path() is None
        assert h.static_path() is None
        assert h.error is None
        assert h.error_detail is None

    def test_modify_document_abstract(self) -> None:
        h = bahh.Handler()
        with pytest.raises(NotImplementedError):
            h.modify_document("doc")

    def test_default_server_hooks_return_none(self) -> None:
        h = bahh.Handler()
        assert h.on_server_loaded("context") is None
        assert h.on_server_unloaded("context") is None

    async def test_default_sesssion_hooks_return_none(self) -> None:
        h = bahh.Handler()
        assert await h.on_session_created("context") is None
        assert await h.on_session_destroyed("context") is None

    def test_static_path(self) -> None:
        h = bahh.Handler()
        assert h.static_path() is None
        h._static = "path"
        assert h.static_path() == "path"
        h._failed = True
        assert h.static_path() is None

    def test_process_request(self) -> None:
        h = bahh.Handler()
        assert h.process_request("request") == {}

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
