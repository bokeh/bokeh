#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc. All rights reserved.
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
    Range1d,
    Select,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def modify_doc(doc):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Circle(x='x', y='y', size=20))
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
    select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"])
    def cb(attr, old, new):
        source.data['val'] = [old, new]
    select.on_change('value', cb)
    doc.add_root(column(select, plot))


@pytest.mark.selenium
class Test_Select:
    def test_displays_title(self, bokeh_model_page) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"], title="title")

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"

        assert page.has_no_console_errors()

    def test_displays_options_list_of_string_options(self, bokeh_model_page) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"])

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        opts = page.driver.find_elements_by_tag_name('option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == "Option %d" % i
            assert opt.get_attribute('value') == "Option %d" % i

        assert page.has_no_console_errors()

    def test_displays_options_list_of_string_options_with_default_value(self, bokeh_model_page) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"], value="Option 3")

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        opts = page.driver.find_elements_by_tag_name('option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == "Option %d" % i
            assert opt.get_attribute('value') == "Option %d" % i

        assert page.has_no_console_errors()


    def test_displays_list_of_tuple_options(self, bokeh_model_page) -> None:
        select = Select(options=[("1", "Option 1"), ("2", "Option 2"), ("3", "Option 3")], css_classes=["foo"])

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        opts = page.driver.find_elements_by_tag_name('option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == "Option %d" % i
            assert opt.get_attribute('value') == "%d" % i

        assert page.has_no_console_errors()

    def test_displays_list_of_tuple_options_with_default_value(self, bokeh_model_page) -> None:
        select = Select(options=[("1", "Option 1"), ("2", "Option 2"), ("3", "Option 3")], css_classes=["foo"], value="3")

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        opts = page.driver.find_elements_by_tag_name('option')
        assert len(opts) == 3

        for i, opt in enumerate(opts, 1):
            assert opt.text == "Option %d" % i
            assert opt.get_attribute('value') == "%d" % i

        assert page.has_no_console_errors()

    def test_displays_options_dict_of_list_of_string_options(self, bokeh_model_page) -> None:
        select = Select(options=dict(g1=["Option 11"], g2=["Option 21", "Option 22"]), css_classes=["foo"])

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        grps = page.driver.find_elements_by_tag_name('optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == "g%d" %i
            opts = grp.find_elements_by_tag_name('option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == "Option %d" % (i*10 + j)
                assert opt.get_attribute('value') == "Option %d" % (i*10 + j)

        assert page.has_no_console_errors()

    def test_displays_options_dict_of_list_of_string_options_with_default_value(self, bokeh_model_page) -> None:
        select = Select(options=dict(g1=["Option 11"], g2=["Option 21", "Option 22"]), css_classes=["foo"], value="Option 22")

        page = bokeh_model_page(select)

        label_el = page.driver.find_element_by_css_selector('.foo label')
        assert label_el.text == ""

        select_el = page.driver.find_element_by_css_selector('.foo select')
        assert select_el.get_attribute("value") == "Option 22"

        grps = page.driver.find_elements_by_tag_name('optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == "g%d" %i
            opts = grp.find_elements_by_tag_name('option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == "Option %d" % (i*10 + j)
                assert opt.get_attribute('value') == f"Option {i*10 + j}"

        assert page.has_no_console_errors()

    def test_displays_dict_of_list_of_tuple_options(self, bokeh_model_page) -> None:
        select = Select(options=dict(g1=[("11", "Option 11")], g2=[("21", "Option 21"), ("22", "Option 22")]), css_classes=["foo"])

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""

        el = page.driver.find_element_by_css_selector('.foo select')
        grps = page.driver.find_elements_by_tag_name('optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == "g%d" %i
            opts = grp.find_elements_by_tag_name('option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == "Option %d" % (i*10 + j)
                assert opt.get_attribute('value') == "%d" % (i*10 + j)

        assert page.has_no_console_errors()

    def test_displays_dict_of_list_of_tuple_options_with_default_value(self, bokeh_model_page) -> None:
        select = Select(options=dict(g1=[("11", "Option 11")], g2=[("21", "Option 21"), ("22", "Option 22")]), css_classes=["foo"], value="22")

        page = bokeh_model_page(select)

        label_el = page.driver.find_element_by_css_selector('.foo label')
        assert label_el.text == ""

        select_el = page.driver.find_element_by_css_selector('.foo select')
        assert select_el.get_attribute("value") == "22"

        grps = page.driver.find_elements_by_tag_name('optgroup')
        assert len(grps) == 2

        for i, grp in enumerate(grps, 1):
            assert grp.get_attribute('label') == f"g{i}"
            opts = grp.find_elements_by_tag_name('option')
            assert len(opts) == i
            for j, opt in enumerate(opts, 1):
                assert opt.text == "Option %d" % (i*10 + j)
                assert opt.get_attribute('value') == f"{i*10 + j}"

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"])
            def cb(attr, old, new):
                source.data['val'] = [old, new]
            select.on_change('value', cb)
            doc.add_root(column(select, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo select')
        el.click()

        el = page.driver.find_element_by_css_selector('.foo select option[value="Option 3"]')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["", "Option 3"]

        el = page.driver.find_element_by_css_selector('.foo select')
        el.click()

        el = page.driver.find_element_by_css_selector('.foo select option[value="Option 1"]')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["Option 3", "Option 1"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page) -> None:
        select = Select(options=["Option 1", "Option 2", "Option 3"], css_classes=["foo"])
        select.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(select)

        el = page.driver.find_element_by_css_selector('.foo select')
        el.click()

        el = page.driver.find_element_by_css_selector('.foo select option[value="Option 3"]')
        el.click()

        results = page.results
        assert results['value'] == 'Option 3'

        assert page.has_no_console_errors()
