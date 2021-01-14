#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
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

# Standard library imports
from datetime import date, datetime, timedelta
from time import sleep

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import (
    RECORD,
    drag_slider,
    get_slider_bar_color,
    get_slider_title_text,
    get_slider_title_value,
)
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    DateSlider,
    Plot,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

start = date(2017, 8, 3)
end = date(2017, 8, 10)
value = start + timedelta(days=1)


@pytest.mark.selenium
class Test_DateSlider:
    def test_display(self, bokeh_model_page) -> None:
        slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        children = el.find_elements_by_css_selector('div.bk-input-group > div')
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_slider_title_text(page.driver, ".foo") == "04 Aug 2017"
        assert get_slider_title_value(page.driver, ".foo") == "04 Aug 2017"

        assert page.has_no_console_errors()

    def test_title_updates(self, bokeh_model_page) -> None:
        slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        assert get_slider_title_value(page.driver, ".foo") == "04 Aug 2017"

        drag_slider(page.driver, ".foo", 50)
        assert get_slider_title_value(page.driver, ".foo") > "04 Aug 2017"

        drag_slider(page.driver, ".foo", -70)
        assert get_slider_title_value(page.driver, ".foo") == "03 Aug 2017"

        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page) -> None:
        slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300, bar_color="red")

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_slider_bar_color(page.driver, ".foo") == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page) -> None:
        slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)
        slider.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(slider)

        drag_slider(page.driver, ".foo", 150)

        results = page.results
        assert datetime.fromtimestamp(results['value']/1000) > datetime(*date.fromisoformat("2017-08-04").timetuple()[:3])

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300, step=24*3600*1000)

            def cb(attr, old, new):
                source.data['val'] = [slider.value_as_date.isoformat()]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 50)

        page.click_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[0] > '2017-08-04'

        drag_slider(page.driver, ".foo", -70)

        page.click_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[0] == '2017-08-03'

        # XXX (bev) skip keypress part of test until it can be fixed
        # el = page.driver.find_element_by_css_selector('.foo')
        # handle = el.find_element_by_css_selector('.noUi-handle')
        # select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT)

        # page.click_custom_action()
        # results = page.results
        # old, new = results['data']['val']
        # assert float(new) == 1

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_callback_value_vs_value_throttled(self, bokeh_server_page) -> None:
        junk = dict(v=0, vt=0)

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)

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

    @flaky(max_runs=10)
    def test_server_bar_color_updates(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300, bar_color="red")

            def cb(attr, old, new):
                slider.bar_color = "rgba(255, 255, 0, 1)"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_slider_bar_color(page.driver, ".foo") == "rgba(255, 255, 0, 1)"

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_title_updates(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = DateSlider(start=start, end=end, value=value, css_classes=["foo"], width=300)

            def cb(attr, old, new):
                slider.title = "baz"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_slider(page.driver, ".foo", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_slider_title_text(page.driver, ".foo") > "04 Aug 2017"

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
