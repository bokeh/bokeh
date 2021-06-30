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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
