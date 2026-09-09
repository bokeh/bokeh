#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
from bokeh.core.properties import UnsetValueError
from bokeh.models.widgets import Slider

# Module under test
import bokeh.models.dom as bmd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_DOM:
    def test_qualified(self) -> None:
        assert bmd.DOMNode.__qualified_model__ == "bokeh.models.dom.DOMNode"

def test_HTML___init__() -> None:
    obj = Slider()
    val_of = bmd.ValueOf(obj, "value")

    html0 = bmd.HTML()
    with pytest.raises(UnsetValueError):
        html0.html
    assert html0.refs == []

    html1 = bmd.HTML("<b>HTML</b>")
    assert html1.html == ["<b>HTML</b>"]
    assert html1.refs == []

    html2 = bmd.HTML("<b>", val_of, "</b>")
    assert html2.html == ["<b>", val_of, "</b>"]
    assert html2.refs == []

    with pytest.raises(TypeError):
        bmd.HTML("<b>HTML</b>", html="<i>HTML</i>")

    with pytest.raises(TypeError):
        bmd.HTML("<b>", val_of, "</b>", html="<i>HTML</i>")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
