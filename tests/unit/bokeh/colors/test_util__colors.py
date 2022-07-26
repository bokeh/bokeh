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

# Bokeh imports
from bokeh.colors import named

# Module under test
import bokeh.colors.util as bcu # isort:skip

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


class Test_NamedColor:
    def test_init(self) -> None:
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert c.name == "aliceblue"

    def test_repr(self) -> None:
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert repr(c) == c.to_css()

    def test_to_css(self) -> None:
        c = bcu.NamedColor("aliceblue", 240,  248,  255)
        assert c.to_css() == "aliceblue"

    def test_find(self) -> None:
        c = bcu.NamedColor.find("cornflowerblue")
        assert c.name == "cornflowerblue"

        with pytest.raises(ValueError):
            bcu.NamedColor.find("bluey")

class Test_ColorGroup:
    def test_len(self) -> None:
        assert len(_TestGroup) == 3

    def test_iter(self) -> None:
        it = iter(_TestGroup)
        assert next(it) == named.red
        assert next(it) == named.green
        assert next(it) == named.blue

    def test_getitem_string(self) -> None:
        assert _TestGroup['Red'] == named.red
        assert _TestGroup['Green'] == named.green
        assert _TestGroup['Blue'] == named.blue
        with pytest.raises(KeyError):
            _TestGroup['Junk']

    def test_getitem_int(self) -> None:
        assert _TestGroup[0] == named.red
        assert _TestGroup[1] == named.green
        assert _TestGroup[2] == named.blue
        with pytest.raises(IndexError):
            _TestGroup[-1]
        with pytest.raises(IndexError):
            _TestGroup[3]

    def test_getitem_bad(self) -> None:
        with pytest.raises(ValueError):
            _TestGroup[10.2]
        with pytest.raises(ValueError):
            _TestGroup[(1,)]
        with pytest.raises(ValueError):
            _TestGroup[[1,]]

class Test_color_as_rgb_hex:
    def test_name(self) -> None:
        assert bcu._color_as_rgb_hex("blue") == "#0000FF"
        assert bcu._color_as_rgb_hex("blueviolet") == "#8A2BE2"

    def test_hex_rgb(self) -> None:
        assert bcu._color_as_rgb_hex("#A3B20F") == "#A3B20F"
        assert bcu._color_as_rgb_hex("#a3b20f") == "#A3B20F"
        assert bcu._color_as_rgb_hex("#8A3") == "#88AA33"
        assert bcu._color_as_rgb_hex("#8a3") == "#88AA33"

    def test_hex_rgba(self) -> None:
        assert bcu._color_as_rgb_hex("#A3B20FC0") == "#A3B20F"
        assert bcu._color_as_rgb_hex("#a3b20fc0") == "#A3B20F"
        assert bcu._color_as_rgb_hex("#8A3B") == "#88AA33"
        assert bcu._color_as_rgb_hex("#8a3b") == "#88AA33"

    def test_invalid_name(self) -> None:
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("bluey")

    def test_hex_wrong_length(self) -> None:
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#")
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#1")
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#12")
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#12345")
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#1234567")
        with pytest.raises(ValueError):
            bcu._color_as_rgb_hex("#123456789")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
