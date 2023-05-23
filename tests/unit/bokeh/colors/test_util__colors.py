#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

        assert bcu.NamedColor.find("bluey") is None

    def test_from_string(self) -> None:
        # Name
        c = bcu.NamedColor.from_string("blue")
        assert c.name == "blue"

        # '#rrggbb'
        c = bcu.NamedColor.from_string("#A3B20F")
        assert (c.r, c.g, c.b, c.a) == (163, 178, 15, 1.0)
        c = bcu.NamedColor.from_string("#a3b20f")
        assert (c.r, c.g, c.b, c.a) == (163, 178, 15, 1.0)

        # '#rrggbbaa'
        c = bcu.NamedColor.from_string("#A3B20FC0")
        assert (c.r, c.g, c.b, c.a) == (163, 178, 15, 192/255.0)
        c = bcu.NamedColor.from_string("#a3b20fc0")
        assert (c.r, c.g, c.b, c.a) == (163, 178, 15, 192/255.0)

        # '#rgb'
        c = bcu.NamedColor.from_string("#7A3")
        assert (c.r, c.g, c.b, c.a) == (119, 170, 51, 1.0)
        c = bcu.NamedColor.from_string("#7a3")
        assert (c.r, c.g, c.b, c.a) == (119, 170, 51, 1.0)

        # '#rgba'
        c = bcu.NamedColor.from_string("#7A3B")
        assert (c.r, c.g, c.b, c.a) == (119, 170, 51, 187/255.0)
        c = bcu.NamedColor.from_string("#7a3b")
        assert (c.r, c.g, c.b, c.a) == (119, 170, 51, 187/255.0)

        # Invalid name
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("bluey")

        # Invalid hex string
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#1")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#12")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#12345")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#1234567")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string("#123456789")
        with pytest.raises(ValueError):
            bcu.NamedColor.from_string(" #abc")


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
            _TestGroup[[1]]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
