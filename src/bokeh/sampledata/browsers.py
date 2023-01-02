#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Browser market share by version from November 2013.

License: `CC BY-SA 3.0`_

Sourced from http://gs.statcounter.com/#browser_version-ww-monthly-201311-201311-bar

Icon images sourced from https://github.com/alrra/browser-logos

This module contains one pandas Dataframe: ``browsers_nov_2013``.

.. rubric:: ``browsers_nov_2013``

:bokeh-dataframe:`bokeh.sampledata.browsers.browsers_nov_2013`

The module also contains a dictionary ``icons`` with base64-encoded PNGs of the
logos for Chrome, Firefox, Safari, Opera, and IE.

.. bokeh-sampledata-xref:: browsers
'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import join
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pandas import DataFrame

# Bokeh imports
from ..util.sampledata import package_csv, package_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'browsers_nov_2013',
    'icons',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _read_data() -> tuple[DataFrame, dict[str, bytes]]:
    '''

    '''
    df = package_csv('browsers', 'browsers_nov_2013.csv', names=["Version", "Share"], skiprows=1)
    _versions = df.Version.map(lambda x: x.rsplit(" ", 1))
    df["Browser"] = _versions.map(lambda x: x[0])
    df["VersionNumber"] = _versions.map(lambda x: x[1] if len(x) == 2 else "0")

    icons = {}
    for browser in ["Chrome", "Firefox", "Safari", "Opera", "IE"]:
        with open(package_path(join("icons", browser.lower() + "_32x32.png")), "rb") as icon:
            icons[browser] = icon.read()

    return df, icons

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

browsers_nov_2013, icons = _read_data()
