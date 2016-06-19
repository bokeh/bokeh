from __future__ import  absolute_import

from bokeh.models.layouts import Box
from bokeh.models.tools import Toolbar, ToolbarBox


# TODO (bev) validate entire list of props

def test_Toolbar():
    tb = Toolbar()
    assert tb.active_drag == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'


#
# ToolbarBox
#

def test_toolbar_box_is_instance_of_box():
    tb_box = ToolbarBox()
    assert isinstance(tb_box, Box)


def test_toolbar_box_properties():
    tb_box = ToolbarBox()
    assert tb_box.logo == "normal"
    assert tb_box.toolbar_location == "right"
    assert tb_box.tools == []
    assert tb_box.merge_tools is True
