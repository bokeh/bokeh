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
from datetime import datetime

# External imports

# Bokeh imports
from bokeh.models.widgets import DatePicker
from bokeh.models import ColumnDataSource

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_DatePicker(object):

    def test__date_from_utc_plus_timezone(self, bokeh_server_page):
        def modify_doc(doc):
            date_picker = DatePicker(title='Select date', min_date=datetime(2019, 9, 1), max_date=datetime.utcnow(), css_classes=["foo"])
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))

            def check_underlying_selected_date(attr, old, new):
                source.data['val'] = [new, "b"]

            date_picker.on_change('value', check_underlying_selected_date)

            doc.add_root(date_picker)

        page = bokeh_server_page(modify_doc)


        ## TEST 1 - MAKE SURE THAT THE UNDERLYING SELEXTED DATE IS CORRECT
        el = page.driver.find_element_by_css_selector('.foo ____________')

        # how do you get it to actually select a date??

        results = page.results
        assert results['data']['val'] == ["YYYY-MM-DD 00:00:00", "b"] # make sure that the underlying selected date is correct


        ## TEST 2 - MAKE SURE THAT THE DISPLAYED SELECTED DATE IS CORRECT
        el = page.driver.find_element_by_css_selector('.foo ____________')

        # how do you get it to actually select a date??

        results = page.results
        assert results['displayed'] == "YYYY-MM-DD 00:00:00" # make sure that the displayed selected date is correct