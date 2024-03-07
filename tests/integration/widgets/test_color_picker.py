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
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColorPicker,
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def mk_modify_doc(colorpicker: ColorPicker):
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)

        plot.add_glyph(source, Circle(x='x', y='y'))
        plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

        def cb(attr, old, new):
            source.data['val'] = [old.lower(), new.lower()]  # ensure lowercase of hexa strings

        colorpicker.on_change('color', cb)
        doc.add_root(column(colorpicker, plot))
        return doc
    return modify_doc

def enter_value_in_color_picker(driver, el, color):
    driver.execute_script("arguments[0].value = '%s'" % color, el)
    driver.execute_script("arguments[0].dispatchEvent(new Event('change'))", el)


@pytest.mark.selenium
class Test_ColorPicker:
    def test_display_color_input(self, bokeh_model_page: BokehModelPage) -> None:
        colorpicker = ColorPicker()
        page = bokeh_model_page(colorpicker)

        el = find_element_for(page.driver, colorpicker, "input")
        assert el.get_attribute('type') == "color"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        colorpicker = ColorPicker(title="title")
        page = bokeh_model_page(colorpicker)

        el = find_element_for(page.driver, colorpicker, "label")
        assert el.text == "title"

        el = find_element_for(page.driver, colorpicker, "input")
        assert el.get_attribute('type') == "color"

        assert page.has_no_console_errors()

    def test_input_value(self, bokeh_model_page: BokehModelPage) -> None:
        colorpicker = ColorPicker(color="red")
        page = bokeh_model_page(colorpicker)

        el = find_element_for(page.driver, colorpicker, "input")

        assert el.get_attribute('value') == '#ff0000'

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        colorpicker = ColorPicker(color="red")
        page = bokeh_server_page(mk_modify_doc(colorpicker))

        el = find_element_for(page.driver, colorpicker, "input")

        # new value
        enter_value_in_color_picker(page.driver, el, '#0000ff')
        page.eval_custom_action()
        results = page.results
        assert results['data']['val'] == ['#ff0000', '#0000ff']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
