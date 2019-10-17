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
from time import sleep

# External imports

# Bokeh imports
from bokeh.models import Slider, ColumnDataSource, Plot, Circle, CustomAction, CustomJS, Range1d
from bokeh.layouts import column
from bokeh._testing.util.selenium import RECORD, ActionChains, Keys, select_element_and_press_key

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

def drag_slider(driver, css_class, distance, release=True):
    el = driver.find_element_by_css_selector(css_class)
    handle = el.find_element_by_css_selector('.bk-noUi-handle')
    actions = ActionChains(driver)
    actions.move_to_element(handle)
    actions.click_and_hold()
    actions.move_by_offset(distance, 0)
    if release:
        actions.release()
    actions.perform()

def get_title_text(driver, css_class):
    el = driver.find_element_by_css_selector(css_class)
    return el.find_element_by_css_selector('div.bk-input-group > div.bk-slider-title').text

def get_title_value(driver, css_class):
    el = driver.find_element_by_css_selector(css_class)
    return el.find_element_by_css_selector('div.bk-input-group > div > span.bk-slider-value').text

def get_bar_color(driver, css_class):
    el = driver.find_element_by_css_selector(css_class)
    bar = el.find_element_by_css_selector('.bk-noUi-connect')
    return bar.value_of_css_property('background-color')

@pytest.mark.integration
@pytest.mark.selenium
class Test_Slider(object):

    def test_display(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        children = el.find_elements_by_css_selector('div.bk-input-group > div')
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_title_text(page.driver, ".foo") == "bar: 1"
        assert float(get_title_value(page.driver, ".foo")) == 1

        assert page.has_no_console_errors()

    def test_title_updates(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        assert float(get_title_value(page.driver, ".foo")) == 1

        drag_slider(page.driver, ".foo", 150)
        value = get_title_value(page.driver, ".foo")
        assert float(value) > 1
        assert float(value) == int(value) # integral step size

        drag_slider(page.driver, ".foo", 250)
        assert float(get_title_value(page.driver, ".foo")) == 10

        drag_slider(page.driver, ".foo", -500)
        assert float(get_title_value(page.driver, ".foo")) == 0

        assert page.has_no_console_errors()

    def test_keypress_event(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)
        page = bokeh_model_page(slider)
        el = page.driver.find_element_by_css_selector('.foo')
        handle = el.find_element_by_css_selector('.bk-noUi-handle')
        select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT, press_number=1)
        assert float(get_title_value(page.driver, ".foo")) == 2
        select_element_and_press_key(page.driver, handle, Keys.ARROW_LEFT, press_number=3) # hit lower value and continue
        assert float(get_title_value(page.driver, ".foo")) == 0
        select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT, press_number=11) # hit higher value and continue
        assert float(get_title_value(page.driver, ".foo")) == 10
        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300, bar_color="red")

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_bar_color(page.driver, ".foo") == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page):
        slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)
        slider.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(slider)

        drag_slider(page.driver, ".foo", 150)

        results = page.results
        assert float(results['value']) > 1

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page):

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

            def cb(attr, old, new):
                source.data['val'] = [old, new]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 150)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(old) == 1
        assert float(new) > 1

        drag_slider(page.driver, ".foo", 450)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new) == 10

        drag_slider(page.driver, ".foo", -600)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new) == 0

        el = page.driver.find_element_by_css_selector('.foo')
        handle = el.find_element_by_css_selector('.bk-noUi-handle')
        select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new) == 1

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    def test_server_callback_policy_continuous(self, bokeh_server_page):
        junk = dict(v=0, vt=0)

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

            def cbv(attr, old, new): junk['v'] += 1
            def cbvt(attr, old, new): junk['vt'] += 1

            slider.on_change('value', cbv)
            slider.on_change('value_throttled', cbvt)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=True)
        sleep(1) # noUiSlider does a transition that takes some time

        assert junk['v'] == 4
        assert junk['vt'] == 4

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    def test_server_callback_policy_mouseup(self, bokeh_server_page):
        junk = dict(v=0, vt=0)

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300, callback_policy="mouseup")

            def cbv(attr, old, new): junk['v'] += 1

            def cbvt(attr, old, new): junk['vt'] += 1

            slider.on_change('value', cbv)
            slider.on_change('value_throttled', cbvt)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=False)
        sleep(1) # noUiSlider does a transition that takes some time

        drag_slider(page.driver, ".foo", 30, release=True)
        sleep(1) # noUiSlider does a transition that takes some time

        assert junk['v'] == 4
        assert junk['vt'] == 1

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    def test_server_bar_color_updates(self, bokeh_server_page):

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

            def cb(attr, old, new):
                slider.bar_color = "rgba(255, 255, 0, 1)"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_bar_color(page.driver, ".foo") == "rgba(255, 255, 0, 1)"

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    def test_server_title_updates(self, bokeh_server_page):

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = Slider(start=0, end=10, value=1, title="bar", css_classes=["foo"], width=300)

            def cb(attr, old, new):
                slider.title = "baz"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_title_text(page.driver, ".foo") == "baz: 6"

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
