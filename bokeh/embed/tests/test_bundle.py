#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

# Module under test
import bokeh.embed.bundle as beb

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    PUBLIC: (

    ), INTERNAL: (

        ( 'bundle_for_objs_and_resources', (1,0,0) ),

    )

}

test_public_api, test_internal_api, test_all_declared, test_all_tested = verify_api(beb, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

class Test_bundle_for_objs_and_resources(object):
    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__any(object):
    pass

class Test__use_gl(object):
    pass

class Test__use_tables(object):
    pass

class Test__use_widgets(object):
    pass
