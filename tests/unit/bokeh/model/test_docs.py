#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import bs4

# Module under test
import bokeh.model.docs as bmd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# very basic test of valid HTML and top level structure
def test_html_repr() -> None:
    from bokeh.models import Range1d
    html = bs4.BeautifulSoup(bmd.html_repr(Range1d()), "html.parser")
    elts = list(html.children)
    assert len(elts) == 4
    assert elts[0].name == "div"
    assert elts[1].name is None
    assert elts[2].name == "script"
    assert elts[3].name is None

def test_process_example() -> None:
    class Foo:
        """doc"""
        __example__ = "foo"
    assert bmd.process_example(Foo) is None
    assert Foo.__doc__ == """doc

    Example
    -------

    .. bokeh-plot:: ../../foo
        :source-position: below

"""
