from __future__ import  absolute_import

import bokeh.models.tools as tools

def test_Toolbar():
    tb = tools.Toolbar()
    assert tb.active_drag == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'

    # TODO (bev) validate entire list of props
