#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.models.tiles import WMTSTileSource
from bokeh.util.testing import verify_all

# Module under test
import bokeh.tile_providers as bt

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'STAMEN_TONER',
    'STAMEN_TONER_BACKGROUND',
    'STAMEN_TONER_LABELS',
    'STAMEN_TERRAIN',
    'CARTODBPOSITRON',
    'CARTODBPOSITRON_RETINA',
)

_CARTO_URLS = {
    'CARTODBPOSITRON':        'http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'CARTODBPOSITRON_RETINA': 'http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
}

_STAMEN_URLS = {
    'STAMEN_TONER':            'http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
    'STAMEN_TONER_BACKGROUND': 'http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
    'STAMEN_TONER_LABELS':     'http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
    'STAMEN_TERRAIN':          'http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
}

_STAMEN_LIC = {
    'STAMEN_TONER':            '<a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    'STAMEN_TONER_BACKGROUND': '<a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    'STAMEN_TONER_LABELS':     '<a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    'STAMEN_TERRAIN':          '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>',
}

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bt, ALL)


@pytest.mark.parametrize('name', ['STAMEN_TONER', 'STAMEN_TONER_BACKGROUND', 'STAMEN_TONER_LABELS', 'STAMEN_TERRAIN'])
class Test_StamenProviders(object):
    def test_type(self, name):
        p = getattr(bt, name)
        assert isinstance(p, WMTSTileSource)

    def test_url(self, name):
        p = getattr(bt, name)
        assert p.url == _STAMEN_URLS[name]

    def test_attribution(self, name):
        p = getattr(bt, name)
        assert p.attribution == (
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
            'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
            'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
            'under %s.'
        ) % _STAMEN_LIC[name]

@pytest.mark.parametrize('name', ['CARTODBPOSITRON', 'CARTODBPOSITRON_RETINA'])
class Test_CartoProviders(object):
    def test_type(self, name):
        p = getattr(bt, name)
        assert isinstance(p, WMTSTileSource)

    def test_url(self, name):
        p = getattr(bt, name)
        assert p.url == _CARTO_URLS[name]

    def test_attribution(self, name):
        p = getattr(bt, name)
        assert p.attribution == (
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,'
            '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
        )

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
