#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

# Standard library imports
from html import escape

# Bokeh imports
from bokeh.models import Div

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

text = """
Your <a href="https://en.wikipedia.org/wiki/HTML">HTML</a>-supported text is initialized with the <b>text</b> argument.  The
remaining div arguments are <b>width</b> and <b>height</b>. For this example, those values
are <i>200</i> and <i>100</i> respectively."""


@pytest.mark.selenium
class Test_Div:
    def test_displays_div_as_html(self, bokeh_model_page) -> None:
        div = Div(text=text, css_classes=["foo"])

        page = bokeh_model_page(div)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert el.get_attribute("innerHTML") == text

        assert page.has_no_console_errors()

    def test_displays_div_as_text(self, bokeh_model_page) -> None:
        div = Div(text=text, css_classes=["foo"], render_as_text=True)

        page = bokeh_model_page(div)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert el.get_attribute("innerHTML") == escape(text, quote=None)

        assert page.has_no_console_errors()

    def test_set_style(self, bokeh_model_page) -> None:
        para = Div(text=text, css_classes=["foo"], style={'font-size': '26px'})

        page = bokeh_model_page(para)

        el = page.driver.find_element_by_css_selector('.foo div')
        assert 'font-size: 26px;' in el.get_attribute('style')

        assert page.has_no_console_errors()
