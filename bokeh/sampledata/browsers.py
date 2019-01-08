#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

http://gs.statcounter.com/#browser_version-ww-monthly-201311-201311-bar

https://github.com/alrra/browser-logos

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import join

# External imports

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

def _read_data():
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
