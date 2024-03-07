#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.models import CustomAction, CustomJS
from bokeh.plotting import figure
from tests.support.plugins.project import SinglePlotPage
from tests.support.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)


@pytest.mark.selenium
class Test_CustomAction:
    def test_tap_triggers_callback(self, single_plot_page: SinglePlotPage) -> None:
        plot = figure(height=800, width=1000, tools='')
        plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
        plot.add_tools(CustomAction(icon=".bk-tool-icon-custom-action", callback=CustomJS(code=RECORD("activated", "true"))))

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        button.click()
        assert page.results["activated"] is True

        assert page.has_no_console_errors()
