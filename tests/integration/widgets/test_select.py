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
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    Scatter,
    Select,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

@pytest.mark.selenium
class Test_Select:
    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], title="title")

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == "title"

        assert page.has_no_console_errors()

    def test_displays_options_list_of_string_options(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"])

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        opts = el.find_elements(By.TAG_NAME, 'option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == f"Option {i}"
            assert opt.get_attribute('value') == f"Option {i}"

        assert page.has_no_console_errors()

    def test_displays_options_list_of_string_options_with_default_value(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], value="Option 3")

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        opts = el.find_elements(By.TAG_NAME, 'option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == f"Option {i}"
            assert opt.get_attribute('value') == f"Option {i}"

        assert page.has_no_console_errors()


    def test_displays_list_of_tuple_options(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=[("1", "Option 1"), ("2", "Option 2"), ("3", "Option 3")])

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        opts = el.find_elements(By.TAG_NAME, 'option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == f"Option {i}"
            assert opt.get_attribute('value') == str(i)

        assert page.has_no_console_errors()

    def test_displays_list_of_tuple_options_with_default_value(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=[("1", "Option 1"), ("2", "Option 2"), ("3", "Option 3")], value="3")

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        opts = el.find_elements(By.TAG_NAME, 'option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == f"Option {i}"
            assert opt.get_attribute('value') == str(i)

        assert page.has_no_console_errors()

    def test_displays_options_dict_of_list_of_string_options(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=dict(g1=["Option 11"], g2=["Option 21", "Option 22"]))

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        grps = el.find_elements(By.TAG_NAME, 'optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == f"g{i}"
            opts = grp.find_elements(By.TAG_NAME, 'option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == f"Option {i*10 + j}"
                assert opt.get_attribute('value') == f"Option {i*10 + j}"

        assert page.has_no_console_errors()

    def test_displays_options_dict_of_list_of_string_options_with_default_value(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=dict(g1=["Option 11"], g2=["Option 21", "Option 22"]), value="Option 22")

        page = bokeh_model_page(select)

        label_el = find_element_for(page.driver, select, "label")
        assert label_el.text == ""

        select_el = find_element_for(page.driver, select, "select")
        assert select_el.get_attribute("value") == "Option 22"

        grps = select_el.find_elements(By.TAG_NAME, 'optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == f"g{i}"
            opts = grp.find_elements(By.TAG_NAME, 'option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == f"Option {i*10 + j}"
                assert opt.get_attribute('value') == f"Option {i*10 + j}"

        assert page.has_no_console_errors()

    def test_displays_dict_of_list_of_tuple_options(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=dict(g1=[("11", "Option 11")], g2=[("21", "Option 21"), ("22", "Option 22")]))

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "label")
        assert el.text == ""

        el = find_element_for(page.driver, select, "select")
        grps = el.find_elements(By.TAG_NAME, 'optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == f"g{i}"
            opts = grp.find_elements(By.TAG_NAME, 'option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == f"Option {i*10 + j}"
                assert opt.get_attribute('value') == f"{i*10 + j}"

        assert page.has_no_console_errors()

    def test_displays_dict_of_list_of_tuple_options_with_default_value(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=dict(g1=[("11", "Option 11")], g2=[("21", "Option 21"), ("22", "Option 22")]), value="22")

        page = bokeh_model_page(select)

        label_el = find_element_for(page.driver, select, "label")
        assert label_el.text == ""

        select_el = find_element_for(page.driver, select, "select")
        assert select_el.get_attribute("value") == "22"

        grps = select_el.find_elements(By.TAG_NAME, 'optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == f"g{i}"
            opts = grp.find_elements(By.TAG_NAME, 'option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == f"Option {i*10 + j}"
                assert opt.get_attribute('value') == f"{i*10 + j}"

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"])
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            def cb(attr, old, new):
                source.data['val'] = [old, new]
            select.on_change('value', cb)
            doc.add_root(column(select, plot))

        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, select, "select")
        el.click()

        el = find_element_for(page.driver, select, 'select option[value="Option 3"]')
        el.click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["", "Option 3"]

        el = find_element_for(page.driver, select, "select")
        el.click()

        el = find_element_for(page.driver, select, 'select option[value="Option 1"]')
        el.click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["Option 3", "Option 1"]

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"])
        select.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(select)

        el = find_element_for(page.driver, select, "select")
        el.click()

        el = find_element_for(page.driver, select, 'select option[value="Option 3"]')
        el.click()

        results = page.results
        assert results['value'] == 'Option 3'

        assert page.has_no_console_errors()
