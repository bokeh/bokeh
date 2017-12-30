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
import bokeh.application.handlers.code_runner as bahc

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

    ), DEV: (

        ( 'CodeRunner',                   (1,0,0) ),

        ( 'CodeRunner.error.fget',        (1,0,0) ),
        ( 'CodeRunner.error_detail.fget', (1,0,0) ),
        ( 'CodeRunner.failed.fget',       (1,0,0) ),
        ( 'CodeRunner.path.fget',         (1,0,0) ),
        ( 'CodeRunner.source.fget',       (1,0,0) ),

        ( 'CodeRunner.new_module',        (1,0,0) ),
        ( 'CodeRunner.run',               (1,0,0) ),

    )

}

Test_api = verify_api(bahc, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
