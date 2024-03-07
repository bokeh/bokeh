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
from bokeh.models import Plot
from tests.support.plugins.project import SinglePlotPage

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

@pytest.mark.selenium
class Test_regressions:
    def test_issue_11694(self, single_plot_page: SinglePlotPage) -> None:
        plot = Plot(height=400, width=400, tags=[dict(id="1000")])
        page = single_plot_page(plot)

        assert page.has_no_console_errors()
