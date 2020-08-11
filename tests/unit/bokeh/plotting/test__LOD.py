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

# Standard library imports
import time

# External imports
from flaky import flaky

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import Range1d
from bokeh.plotting import figure
from bokeh.events import LODStart, LODEnd

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_Plot:
    @flaky(max_runs=10)
    def test_lod_event_triggering(self, bokeh_server_page) -> None:
        goodEvents = []
        badEvents = []
        def modify_doc(doc):
            x_range = Range1d(0, 4)
            y_range = Range1d(0, 4)
            p1 = figure(plot_height=400, plot_width=400, x_range=x_range, y_range=y_range, lod_interval=200, lod_timeout=300)
            p1.line([1, 2, 3], [1, 2, 3])
            p2 = figure(plot_height=400, plot_width=400, x_range=x_range, y_range=y_range, lod_interval=200, lod_timeout=300)
            p2.line([1, 2, 3], [1, 2, 3])
            p1.on_event(LODStart, lambda: goodEvents.append("LODStart"))
            p1.on_event(LODEnd, lambda: goodEvents.append("LODEnd"))
            # These 2 should not fire, pan is on p1
            p2.on_event(LODStart, lambda: badEvents.append("LODStart"))
            p2.on_event(LODEnd, lambda: badEvents.append("LODEnd"))

            layout = column(p1, p2)
            doc.add_root(layout)

        page = bokeh_server_page(modify_doc)
        
        # This can only be called once - calling it multiple times appears to have no effect
        page.drag_canvas_at_position(100, 100, 200, 200)
        
        # Wait for drag to happen
        time.sleep(0.1)
        assert goodEvents == ["LODStart"]
        assert badEvents == []

        # Wait for lod_timeout to hit
        time.sleep(0.3)
        assert goodEvents == ["LODStart", "LODEnd"]
        assert badEvents == []
