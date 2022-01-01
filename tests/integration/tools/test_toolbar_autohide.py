#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc. All rights reserved.
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

# External imports
from selenium.webdriver.common.action_chains import ActionChains

# Bokeh imports
from bokeh._testing.plugins.project import SinglePlotPage
from bokeh._testing.util.selenium import get_events_el, get_toolbar_el
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_Toobar_Autohide:
    def test_toolbar_is_visible_by_default_and_stays_visible(self, single_plot_page: SinglePlotPage) -> None:
        plot = figure(height=800, width=1000)
        plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)

        page = single_plot_page(plot)

        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        events_el = get_events_el(page.driver, plot)
        ActionChains(page.driver).move_to_element(events_el).perform()

        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)
        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        assert page.has_no_console_errors()

    def test_toolbar_with_autohide_becomes_visible_when_cursor_is_over_plot(self, single_plot_page: SinglePlotPage) -> None:
        plot = figure(height=800, width=1000)
        plot.toolbar.autohide = True
        plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)

        page = single_plot_page(plot)
        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'hidden'

        events_el = get_events_el(page.driver, plot)
        ActionChains(page.driver).move_to_element(events_el).perform()

        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        # Pan around with drag_canvas and check that the toolbar is still visible
        page.drag_canvas_at_position(plot, 100, 100, 20, 20)
        plot.tools
        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        # Click the reset tool and check that the toolbar is still visible
        button = page.get_toolbar_button('reset')
        button.click()
        toolbar_el = get_toolbar_el(page.driver, plot)
        assert toolbar_el.value_of_css_property('visibility') == 'visible'

        assert page.has_no_console_errors()
