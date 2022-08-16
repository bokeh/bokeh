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
    assert not '__new__' in dir(pal)

def test_varying_alpha_palette() -> None:
    assert pal.varying_alpha_palette("blue", 3) == ("#0000FF00", "#0000FF80", "#0000FF")
    assert pal.varying_alpha_palette("red", 3, start_alpha=255, end_alpha=128) == ("#FF0000", "#FF0000C0", "#FF000080")
    assert pal.varying_alpha_palette("#123456", 3, start_alpha=205, end_alpha=205) == ("#123456CD", "#123456CD", "#123456CD")
    assert pal.varying_alpha_palette("#abc", 3) == ("#AABBCC00", "#AABBCC80", "#AABBCC")

    palette = pal.varying_alpha_palette("blue")
    assert len(palette) == 256
    assert palette[::64] == ("#0000FF00", "#0000FF40", "#0000FF80", "#0000FFC0")

    assert pal.varying_alpha_palette("#654321", start_alpha=100, end_alpha=103) == ("#65432164", "#65432165", "#65432166", "#65432167")

    with pytest.raises(ValueError):
        pal.varying_alpha_palette("bluey")
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("#8F")
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", start_alpha=-1)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", start_alpha=256)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", end_alpha=-1)
    with pytest.raises(ValueError):
        pal.varying_alpha_palette("red", end_alpha=256)

    # Combining with alpha from color argument.
    assert pal.varying_alpha_palette("#FFAA8080", 3) == ("#FFAA8000", "#FFAA8040", "#FFAA8080")
    assert pal.varying_alpha_palette("#80FFAA80", 3, start_alpha=255, end_alpha=0) == ("#80FFAA80", "#80FFAA40", "#80FFAA00")
    assert pal.varying_alpha_palette("#AABBCC80", 3, start_alpha=128) == ("#AABBCC40", "#AABBCC60", "#AABBCC80")
    assert pal.varying_alpha_palette("#12345680", 3, start_alpha=0, end_alpha=128) == ("#12345600", "#12345620", "#12345640")

    assert len(pal.varying_alpha_palette("#FFAA8080")) == 129
    assert len(pal.varying_alpha_palette("#FFAA8080", end_alpha=128)) == 65

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
