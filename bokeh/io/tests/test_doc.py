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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.document import Document
from bokeh.io.state import curstate

# Module under test
import bokeh.io.doc as bid

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_curdoc_from_curstate():
    assert bid.curdoc() is curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_set_curdoc_sets_curstate():
    d = Document()
    bid.set_curdoc(d)
    assert curstate().document is d

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
