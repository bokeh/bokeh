#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
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

# External imports

# Bokeh imports
from bokeh.colors import named

# Module under test
import bokeh.colors.util as bcu

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class _TestGroup(bcu.ColorGroup):
    _colors = ("Red", "Green", "Blue")


#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_NamedColor(object):

    def test_init(self):
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert c.name == "aliceblue"

    def test_repr(self):
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert repr(c) == c.to_css()

    def test_to_css(self):
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert c.to_css() == "aliceblue"

# _ColorGroupMeta is exercised here by testing ColorGroup, rather than a separate test
class Test_ColorGroup(object):

    def test_len(self):
        assert len(_TestGroup) == 3

    def test_iter(self):
        it = iter(_TestGroup)
        assert next(it) == named.red
        assert next(it) == named.green
        assert next(it) == named.blue

    def test_getitem_string(self):
        assert _TestGroup['Red'] == named.red
        assert _TestGroup['Green'] == named.green
        assert _TestGroup['Blue'] == named.blue
        with pytest.raises(KeyError):
            _TestGroup['Junk']

    def test_getitem_int(self):
        assert _TestGroup[0] == named.red
        assert _TestGroup[1] == named.green
        assert _TestGroup[2] == named.blue
        with pytest.raises(IndexError):
            _TestGroup[-1]
        with pytest.raises(IndexError):
            _TestGroup[3]

    def test_getitem_bad(self):
        with pytest.raises(ValueError):
            _TestGroup[10.2]
        with pytest.raises(ValueError):
            _TestGroup[(1,)]
        with pytest.raises(ValueError):
            _TestGroup[[1,]]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
