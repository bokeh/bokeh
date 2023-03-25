#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
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
from selenium.webdriver.common.by import By

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomJS,
    Plot,
    RadioGroup,
    Range1d,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for, find_elements_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

LABELS = ["Option 1", "Option 2", "Option 3"]


@pytest.mark.selenium
class Test_RadioGroup:
    @pytest.mark.parametrize('inline', [True, False])
    def test_displays_options_list_of_string_labels_setting_inline(self, inline, bokeh_model_page: BokehModelPage) -> None:
        group = RadioGroup(labels=LABELS, inline=inline)
        page = bokeh_model_page(group)

        labels = find_elements_for(page.driver, group, "label")
        assert len(labels) == 3

        for i, label in enumerate(labels):
            assert label.text == LABELS[i]
            input = label.find_element(By.TAG_NAME, 'input')
            assert input.get_attribute('value') == str(i)
            assert input.get_attribute('type') == 'radio'

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        group = RadioGroup(labels=LABELS)
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            def cb(attr, old, new):
                source.data['val'] = [new, "b"]
            group.on_change('active', cb)
            doc.add_root(column(group, plot))

        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, group, 'input[value="2"]')
        el.click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [2, "b"]

        el = find_element_for(page.driver, group, 'input[value="0"]')
        el.click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [0, "b"]

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        group = RadioGroup(labels=LABELS)
        group.js_on_change('active', CustomJS(code=RECORD("active", "cb_obj.active")))

        page = bokeh_model_page(group)

        el = find_element_for(page.driver, group, 'input[value="2"]')
        el.click()

        results = page.results
        assert results['active'] == 2

        el = find_element_for(page.driver, group, 'input[value="0"]')
        el.click()

        results = page.results
        assert results['active'] == 0

        assert page.has_no_console_errors()
