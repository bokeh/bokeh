from __future__ import absolute_import

import mock

from bokeh.core.validation import check_integrity
from bokeh.models.layouts import LayoutDOM
from bokeh.models.tools import Toolbar, ToolbarBox


# TODO (bev) validate entire list of props

def test_Toolbar():
    tb = Toolbar()
    assert tb.active_drag == 'auto'
    assert tb.active_inspect == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'


#
# ToolbarBox
#

def test_toolbar_box_is_instance_of_LayoutDOM():
    tb_box = ToolbarBox()
    assert isinstance(tb_box, LayoutDOM)


def test_toolbar_box_properties():
    tb_box = ToolbarBox()
    assert tb_box.toolbar_location == "right"


@mock.patch('bokeh.io.showing._show_with_state')
def test_toolbar_box_with_no_children_does_not_raise_a_bokeh_warning(mock__show_with_state):
    # This is the normal way a ToolbarBox would be instantiated for example in
    # a gridplot. So we don't want to worry people with warnings. The children
    # for the ToolbarBox are created on the JS side.

    tb_box = ToolbarBox()
    with mock.patch('bokeh.core.validation.check.logger') as mock_logger:
        check_integrity([tb_box])
        assert mock_logger.warning.call_count == 0
