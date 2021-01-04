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
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh._testing.util.selenium import RECORD
from bokeh.models import CustomAction, CustomJS
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_CustomAction:
    def test_tap_triggers_callback(self, single_plot_page) -> None:
        plot = figure(height=800, width=1000, tools='')
        plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
        plot.add_tools(CustomAction(callback=CustomJS(code=RECORD("activated", "true"))))

        page = single_plot_page(plot)

        page.click_custom_action()

        assert page.results["activated"] == True

        assert page.has_no_console_errors()
