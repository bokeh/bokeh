#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# TODO (bev) validate entire list of props

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import mock

# Bokeh imports
from bokeh.core.validation import check_integrity
from bokeh.models import LayoutDOM

# Module under test
from bokeh.models.tools import Toolbar, ToolbarBox # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Toolbar() -> None:
    tb = Toolbar()
    assert tb.active_drag == 'auto'
    assert tb.active_inspect == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'
    assert tb.autohide is False


def test_Toolbar_with_autohide() -> None:
    tb = Toolbar(autohide=True)
    assert tb.active_drag == 'auto'
    assert tb.active_inspect == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'
    assert tb.autohide is True

#
# ToolbarBox
#

def test_toolbar_box_is_instance_of_LayoutDOM() -> None:
    tb_box = ToolbarBox()
    assert isinstance(tb_box, LayoutDOM)


def test_toolbar_box_properties() -> None:
    tb_box = ToolbarBox()
    assert tb_box.toolbar_location == "right"


@mock.patch('bokeh.io.showing._show_with_state')
def test_toolbar_box_with_no_children_does_not_raise_a_bokeh_warning(mock__show_with_state) -> None:
    # This is the normal way a ToolbarBox would be instantiated for example in
    # a gridplot. So we don't want to worry people with warnings. The children
    # for the ToolbarBox are created on the JS side.

    tb_box = ToolbarBox()
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        check_integrity([tb_box])
        assert mock_logger.warning.call_count == 0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
