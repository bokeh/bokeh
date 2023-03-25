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

# Standard library imports
import time
from dataclasses import dataclass
from typing import Any

# Bokeh imports
from bokeh.core.property.singletons import Undefined
from bokeh.document import Document
from bokeh.events import LODEnd, LODStart, RangesUpdate
from bokeh.layouts import column
from bokeh.models import Button, Plot, Range1d
from bokeh.plotting import figure
from bokeh.plotting.glyph_api import GlyphAPI
from tests.support.plugins.project import BokehServerPage
from tests.support.util.selenium import find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

# TODO: generalize this
class Fig(Plot, GlyphAPI):
    """ A plot with glyph API methods, e.g. ``fig.circle(x, y, size=10)``. """
    __data_model__ = True

    @property
    def plot(self):
        return self

    @property
    def coordinates(self):
        return None

@pytest.mark.selenium
class Test_Plot:
    def test_inner_dims_trigger_on_dynamic_add(self, bokeh_server_page: BokehServerPage) -> None:
        button = Button()

        @dataclass
        class Data:
            iw: tuple[int, Any] | None = None
            ih: tuple[int, Any] | None = None

        data = Data()

        def modify_doc(doc: Document):
            p1 = Fig(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=10)
            p1.circle([1, 2, 3], [1, 2, 3])
            p2 = Fig(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=10)
            p1.circle([1, 2, 3], [1, 2, 3])

            layout = column(p1, button)
            def cb():
                if p2 not in layout.children:
                    layout.children = [p1, button, p2]
            button.on_event('button_click', cb)
            def iw(attr: str, old: int, new: int): data.iw = (old, new)
            def ih(attr: str, old: int, new: int): data.ih = (old, new)
            p2.on_change('inner_width', iw)
            p2.on_change('inner_height', ih)
            doc.add_root(layout)

        page = bokeh_server_page(modify_doc)

        find_element_for(page.driver, button, ".bk-btn").click()

        # updates can take some time
        time.sleep(0.5)

        assert data.iw is not None, "inner_width was not updated"
        assert data.iw[0] is Undefined
        assert isinstance(data.iw[1], int)
        assert 0 < data.iw[1] < 400

        assert data.ih is not None, "inner_height was not updated"
        assert data.ih[0] is Undefined
        assert isinstance(data.ih[1], int)
        assert 0 < data.ih[1] < 400

        assert page.has_no_console_errors()

    def test_lod_event_triggering(self, bokeh_server_page: BokehServerPage) -> None:
        good_events: list[str] = []
        bad_events: list[str] = []

        x_range = Range1d(0, 4)
        y_range = Range1d(0, 4)
        p1 = figure(height=400, width=400, x_range=x_range, y_range=y_range, lod_interval=200, lod_timeout=300)
        p1.line([1, 2, 3], [1, 2, 3])
        p2 = figure(height=400, width=400, x_range=x_range, y_range=y_range, lod_interval=200, lod_timeout=300)
        p2.line([1, 2, 3], [1, 2, 3])

        def modify_doc(doc: Document):
            p1.on_event(LODStart, lambda: good_events.append("LODStart"))
            p1.on_event(LODEnd, lambda: good_events.append("LODEnd"))
            # These 2 should not fire, pan is on p1
            p2.on_event(LODStart, lambda: bad_events.append("LODStart"))
            p2.on_event(LODEnd, lambda: bad_events.append("LODEnd"))

            layout = column(p1, p2)
            doc.add_root(layout)

        page = bokeh_server_page(modify_doc)

        # This can only be called once - calling it multiple times appears to have no effect
        page.drag_canvas_at_position(p1, 100, 100, 200, 200)

        # Wait for drag to happen
        time.sleep(0.1)
        assert good_events == ["LODStart"]
        assert bad_events == []

        # Wait for lod_timeout to hit
        time.sleep(0.3)
        assert good_events == ["LODStart", "LODEnd"]
        assert bad_events == []

    def test_ranges_update_event_trigger_on_pan(self, bokeh_server_page: BokehServerPage) -> None:
        events = []

        x_range = Range1d(0, 4)
        y_range = Range1d(0, 4)
        p = figure(height=400, width=400, x_range=x_range, y_range=y_range)
        p.line([1, 2, 3], [1, 2, 3])

        def modify_doc(doc: Document):
            p.on_event(RangesUpdate, lambda evt: events.append(("RangesUpdate", evt.x0, evt.x1, evt.y0, evt.y1)))
            doc.add_root(p)

        page = bokeh_server_page(modify_doc)

        # This can only be called once - calling it multiple times appears to have no effect
        page.drag_canvas_at_position(p, 100, 100, 200, 200)

        # Wait for drag to happen
        time.sleep(0.2)
        assert events[0][0] == "RangesUpdate"
        assert events[0][1] < -2.3
        assert events[0][2] < 1.7
        assert events[0][3] > 2.1
        assert events[0][4] > 6.1
