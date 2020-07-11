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

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import RECORD
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    RadioGroup,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

LABELS = ["Option 1", "Option 2", "Option 3"]


@pytest.mark.selenium
class Test_RadioGroup:
    @pytest.mark.parametrize('inline', [True, False])
    def test_displays_options_list_of_string_labels_setting_inline(self, inline, bokeh_model_page) -> None:
        group = RadioGroup(labels=LABELS, css_classes=["foo"], inline=inline)

        page = bokeh_model_page(group)

        el = page.driver.find_element_by_css_selector('.foo')

        labels = el.find_elements_by_tag_name('label')
        assert len(labels) == 3
        for i, label in enumerate(labels):
            assert label.text == LABELS[i]
            input = label.find_element_by_tag_name('input')
            assert input.get_attribute('value') == str(i)
            assert input.get_attribute('type') == 'radio'

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            group = RadioGroup(labels=LABELS, css_classes=["foo"])
            def cb(active):
                source.data['val'] = [active, "b"]
            group.on_click(cb)
            doc.add_root(column(group, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input[value="2"]')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [2, "b"]

        el = page.driver.find_element_by_css_selector('.foo input[value="0"]')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [0, "b"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page) -> None:
        group = RadioGroup(labels=LABELS, css_classes=["foo"])
        group.js_on_click(CustomJS(code=RECORD("active", "cb_obj.active")))

        page = bokeh_model_page(group)

        el = page.driver.find_element_by_css_selector('.foo input[value="2"]')
        el.click()

        results = page.results
        assert results['active'] == 2

        el = page.driver.find_element_by_css_selector('.foo input[value="0"]')
        el.click()

        results = page.results
        assert results['active'] == 0

        assert page.has_no_console_errors()
