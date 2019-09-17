# -*- coding: utf-8 -*-
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

# External imports
import selenium.webdriver.phantomjs.webdriver
import six

# Bokeh imports

# Module under test
import bokeh.io.webdriver as biw

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_create_phantomjs_webdriver():
    d = biw.create_phantomjs_webdriver()
    assert isinstance(d, selenium.webdriver.phantomjs.webdriver.WebDriver)

@pytest.mark.skipif(six.PY2, reason="checking service not a reliable indicator on Py2")
def test_terminate_webdriver():
    d = biw.create_phantomjs_webdriver()
    assert d.service.process is not None
    biw.terminate_webdriver(d)
    assert d.service.process is None

_driver_map = {
    'phantomjs': selenium.webdriver.phantomjs.webdriver.WebDriver,
}

class Test_webdriver_control(object):
    def test_default(self):
        # other tests may have interacted with the global biw.webdriver_control,
        # so create a new instance only to check default values
        wc = biw._WebdriverState()
        assert wc.reuse == True
        assert wc.kind == "phantomjs"
        assert wc.current is None

    def test_get_with_reuse(self):
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse == True
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is d2
        biw.webdriver_control.reset()

    def test_get_with_reuse_and_reset(self):
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse == True
        d1 = biw.webdriver_control.get()
        biw.webdriver_control.reset()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        d3 = biw.webdriver_control.get()
        assert d2 is d3
        biw.webdriver_control.reset()

    def test_get_without_reuse(self):
        biw.webdriver_control.reuse = False
        assert biw.webdriver_control.reuse == False
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        biw.webdriver_control.reuse = True
        biw.webdriver_control.reset()

    @pytest.mark.parametrize('kind', ['phantomjs'])
    def test_create(self, kind):
        biw.webdriver_control.kind = kind
        assert biw.webdriver_control.kind == kind
        d = biw.webdriver_control.create()
        assert isinstance(d, _driver_map[kind])
        biw.webdriver_control.reset()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
