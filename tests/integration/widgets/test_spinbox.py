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
from bokeh.models import Spinner

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_Select(object):

    def test_displays_title(self, bokeh_model_page):
        spinner = Spinner(css_classes=["foo"], title="title")

        page = bokeh_model_page(spinner)

        input_div = page.driver.find_element_by_class_name('foo')
        el = input_div.find_element_by_tag_name("label")
        assert el.text == "title"

        assert page.has_no_console_errors()

    def test_input_value_min_max_step(self, bokeh_model_page):
        spinner = Spinner(value=1, low=0, high=10, step=1, css_classes=["foo"])

        page = bokeh_model_page(spinner)

        input_div = page.driver.find_element_by_class_name('foo')
        el = input_div.find_element_by_tag_name("input")

        assert el.get_attribute('value') == '1'
        assert el.get_attribute('step') == '1'
        assert el.get_attribute('max') == '10'
        assert el.get_attribute('min') == '0'

        assert page.has_no_console_errors()
