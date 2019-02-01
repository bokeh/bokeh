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
from bokeh.models import Div
from bokeh.util.string import escape

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

text = """
Your <a href="https://en.wikipedia.org/wiki/HTML">HTML</a>-supported text is initialized with the <b>text</b> argument.  The
remaining div arguments are <b>width</b> and <b>height</b>. For this example, those values
are <i>200</i> and <i>100</i> respectively."""

@pytest.mark.integration
@pytest.mark.selenium
class Test_Div(object):

    def test_displays_div_as_html(self, bokeh_model_page):
        div = Div(text=text, css_classes=["foo"])

        page = bokeh_model_page(div)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert el.get_attribute("innerHTML") == text

        assert page.has_no_console_errors()

    def test_displays_div_as_text(self, bokeh_model_page):
        div = Div(text=text, css_classes=["foo"], render_as_text=True)

        page = bokeh_model_page(div)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert el.get_attribute("innerHTML") == escape(text, quote=None)

        assert page.has_no_console_errors()

    def test_set_style(self, bokeh_model_page):
        para = Div(text=text, css_classes=["foo"], style={'font-size': '20pt'})

        page = bokeh_model_page(para)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert 'font-size: 20pt;' in el.get_attribute('style')

        assert page.has_no_console_errors()
