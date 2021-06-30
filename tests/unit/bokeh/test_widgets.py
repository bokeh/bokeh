#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import inspect

# Module under test
 # isort:skip
#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def get_prop_set(class_object):
    # all this does is get a list of every property implemented by the object that is not present in the baseclasses of said object
    # note it wont detect overridden properties!
    base_classes = list(inspect.getmro(class_object))
    base_classes.remove(class_object)
    base_properties = []
    for base_class in base_classes:
        base_properties.extend(dir(base_class))
    class_properties = set(dir(class_object)).difference(set(base_properties))
    return class_properties


class TestPanel:
    def test_expectedprops(self) -> None:
        from bokeh.models import Panel
        expected_properties = {"title", "child"}
        actual_properties = get_prop_set(Panel)
        assert expected_properties.issubset(actual_properties)

    def test_prop_defaults(self) -> None:
        from bokeh.models import Panel, Row
        child1 = Row()
        child2 = Row()
        p1 = Panel(child=child1)
        p2 = Panel(child=child2)
        assert p1.title == ""
        assert p2.title == ""
        assert p1.child == child1
        assert p2.child == child2


class TestTabs:
    def test_expected_props(self) -> None:
        from bokeh.models import Tabs
        expected_properties = {"tabs", "active"}
        actual_properties = get_prop_set(Tabs)
        assert expected_properties.issubset(actual_properties)

    def test_props_defaults(self) -> None:
        from bokeh.models import Tabs
        tab = Tabs()
        assert tab.tabs == []
        assert tab.active == 0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
