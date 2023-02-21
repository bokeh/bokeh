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

# Module under test
import bokeh.palettes as pal # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_cmap_generator_function() -> None:
    assert pal.viridis(256) == pal.Viridis256
    assert pal.magma(256) == pal.Magma256
    assert pal.plasma(256) == pal.Plasma256
    assert pal.inferno(256) == pal.Inferno256
    assert pal.gray(256) == pal.Greys256
    assert pal.grey(256) == pal.Greys256
    assert pal.turbo(256) == pal.Turbo256
    assert pal.diverging_palette(pal.Reds9, pal.Greys9, n=18, midpoint=0.5) == pal.Reds9 + pal.Greys9[::-1]

def test_all_palettes___palettes__() -> None:
    assert sum(len(p) for p in pal.all_palettes.values()) == len(pal.__palettes__)

def test_palettes_dir() -> None:
    assert 'viridis' in dir(pal)
    assert 'cividis' in dir(pal)
    assert 'magma' in dir(pal)
    assert 'inferno' in dir(pal)
    assert 'turbo' in dir(pal)
    assert '__new__' not in dir(pal)

def test_interp_palette() -> None:
    # Constant alpha
    assert pal.interp_palette(("black", "red"), 0) == ()
    assert pal.interp_palette(("black", "red"), 1) == ("#000000",)
    assert pal.interp_palette(("black", "red"), 2) == ("#000000", "#ff0000")
    assert pal.interp_palette(("black", "red"), 3) == ("#000000", "#7f0000", "#ff0000")
    assert pal.interp_palette(("black", "red"), 4) == ("#000000", "#550000", "#aa0000", "#ff0000")

    # Varying alpha
    assert pal.interp_palette(("#00ff0080", "#00ffff40"), 1) == ("#00ff0080",)
    assert pal.interp_palette(("#00ff0080", "#00ffff40"), 2) == ("#00ff0080", "#00ffff40")
    assert pal.interp_palette(("#00ff0080", "#00ffff40"), 3) == ("#00ff0080", "#00ff7f60", "#00ffff40")
    assert pal.interp_palette(("#00ff0080", "#00ffff40"), 4) == ("#00ff0080", "#00ff556b", "#00ffaa55", "#00ffff40")

    # Passing single color palette
    assert pal.interp_palette(("red",), 0) == ()
    assert pal.interp_palette(("red",), 1) == ("#ff0000",)
    assert pal.interp_palette(("red",), 2) == ("#ff0000", "#ff0000")

    with pytest.raises(ValueError):
        pal.interp_palette((), 1)

    with pytest.raises(ValueError):
        pal.interp_palette(("black", "red"), -1)

def test_varying_alpha_palette() -> None:
    assert pal.varying_alpha_palette("blue", 3) == ("#0000ff00", "#0000ff80", "#0000ff")
    assert pal.varying_alpha_palette("red", 3, start_alpha=255, end_alpha=128) == ("#ff0000", "#ff0000c0", "#ff000080")
    assert pal.varying_alpha_palette("#123456", 3, start_alpha=205, end_alpha=205) == ("#123456cd", "#123456cd", "#123456cd")
    assert pal.varying_alpha_palette("#abc", 3) == ("#aabbcc00", "#aabbcc80", "#aabbcc")

    palette = pal.varying_alpha_palette("blue")
    assert len(palette) == 256
    assert palette[::64] == ("#0000ff00", "#0000ff40", "#0000ff80", "#0000ffc0")

    assert pal.varying_alpha_palette("#654321", start_alpha=100, end_alpha=103) == ("#65432164", "#65432165", "#65432166", "#65432167")

    with pytest.raises(ValueError):
        pal.varying_alpha_palette("bluey")
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("#8f")
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", start_alpha=-1)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", start_alpha=256)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", end_alpha=-1)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", end_alpha=256)

    # Combining with alpha from color argument.
    assert pal.varying_alpha_palette("#ffaa8080", 3) == ("#ffaa8000", "#ffaa8040", "#ffaa8080")
    assert pal.varying_alpha_palette("#80ffaa80", 3, start_alpha=255, end_alpha=0) == ("#80ffaa80", "#80ffaa40", "#80ffaa00")
    assert pal.varying_alpha_palette("#aabbcc80", 3, start_alpha=128) == ("#aabbcc40", "#aabbcc60", "#aabbcc80")
    assert pal.varying_alpha_palette("#12345680", 3, start_alpha=0, end_alpha=128) == ("#12345600", "#12345620", "#12345640")

    assert len(pal.varying_alpha_palette("#ffaa8080")) == 129
    assert len(pal.varying_alpha_palette("#ffaa8080", end_alpha=128)) == 65

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
