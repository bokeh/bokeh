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

# Bokeh imports

# Module under test
import bokeh.application.handlers.handler as bahh

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'Handler',                      (1,0,0) ),

        ( 'Handler.error.fget',           (1,0,0) ),
        ( 'Handler.error_detail.fget',    (1,0,0) ),
        ( 'Handler.failed.fget',          (1,0,0) ),

        ( 'Handler.modify_document',      (1,0,0) ),
        ( 'Handler.on_server_loaded',     (1,0,0) ),
        ( 'Handler.on_server_unloaded',   (1,0,0) ),
        ( 'Handler.on_session_created',   (1,0,0) ),
        ( 'Handler.on_session_destroyed', (1,0,0) ),
        ( 'Handler.static_path',          (1,0,0) ),
        ( 'Handler.url_path',             (1,0,0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bahh, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Handler(object):

    def test_create(self):
        h = bahh.Handler()
        assert h.failed == False
        assert h.url_path() is None
        assert h.static_path() is None
        assert h.error is None
        assert h.error_detail is None

    def test_modify_document_abstract(self):
        h = bahh.Handler()
        with pytest.raises(NotImplementedError):
            h.modify_document("doc")

    def test_default_hooks_return_none(self):
        h = bahh.Handler()
        assert h.on_server_loaded("context") is None
        assert h.on_server_unloaded("context") is None
        assert h.on_session_created("context") is None
        assert h.on_session_destroyed("context") is None

    def test_static_path(self):
        h = bahh.Handler()
        assert h.static_path() is None
        h._static = "path"
        assert h.static_path() == "path"
        h._failed = True
        assert h.static_path() is None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
