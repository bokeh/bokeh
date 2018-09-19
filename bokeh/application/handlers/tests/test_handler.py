#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

# Module under test
import bokeh.application.handlers.handler as bahh

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_Handler(object):

    # Public methods ----------------------------------------------------------

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
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
