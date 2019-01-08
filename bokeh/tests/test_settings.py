#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import logging
import os

# External imports

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.settings as bs

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'settings',
)

logging.basicConfig(level=logging.DEBUG)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bs, ALL)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__get_list(object):
    def test_single(self):
        os.environ["BOKEH_FOO"] = "foo"
        result = bs.settings._get_list("FOO", None)
        assert result == ["foo"]
        del os.environ["BOKEH_FOO"]

    def test_multiple(self):
        os.environ["BOKEH_FOO"] = "foo,bar,foobar"
        result = bs.settings._get_list("FOO", None)
        assert result == ["foo", "bar", "foobar"]
        del os.environ["BOKEH_FOO"]

    def test_default(self):
        result = bs.settings._get_list("FOO", None)
        assert result is None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
