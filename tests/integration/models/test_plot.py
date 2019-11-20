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

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import Button, Plot, Range1d

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_Plot(object):

    def test_inner_dims_trigger_on_dynamic_add(self, bokeh_server_page):

        data = {}
        def modify_doc(doc):
            p1 = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=10)
            p2 = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=10)
            button = Button(css_classes=['foo'])
            layout = column(p1, button)
            def cb(event):
                if p2 not in layout.children:
                    layout.children = [p1, button, p2]
            button.on_event('button_click', cb)
            def iw(attr, old, new): data['iw'] = (old, new)
            def ih(attr, old, new): data['ih'] = (old, new)
            p2.on_change('inner_width', iw)
            p2.on_change('inner_height', ih)
            doc.add_root(layout)

        page = bokeh_server_page(modify_doc)

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        # updates can take some time
        time.sleep(0.5)

        assert data['iw'][0] is None
        assert isinstance(data['iw'][1], int)
        assert data['iw'][1]< 400

        assert data['ih'][0] is None
        assert isinstance(data['ih'][1], int)
        assert data['ih'][1] < 400

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()
