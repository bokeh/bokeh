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
import datetime
import time

# External imports

# Bokeh imports
from . import _TestHasProps, _TestModel
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.datetime as bcpd

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Date',
    'Datetime',
    'TimeDelta',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Date(object):

    def test_valid(self):
        prop = bcpd.Date()
        assert prop.is_valid(None)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)

        # TODO (bev) should check actual convertibility
        assert prop.is_valid("")

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self):
        prop = bcpd.Date()
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_transform_seconds(self):
        t = time.time()
        prop = bcpd.Date()
        assert prop.transform(t) == datetime.date.today()

    def test_transform_milliseconds(self):
        t = time.time() * 1000
        prop = bcpd.Date()
        assert prop.transform(t) == datetime.date.today()

    def test_has_ref(self):
        prop = bcpd.Date()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpd.Date()
        assert str(prop) == "Date"

# TODO (bev) class Test_Datetime(object)

# TODO (bev) class Test_TimeDelta(object)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpd, ALL)
