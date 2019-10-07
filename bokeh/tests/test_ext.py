#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import os

# External imports

# Bokeh imports

# Module under test
import bokeh.ext as ext

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_ext_commands(tmpdir):
    tmp = str(tmpdir.mkdir("bk_ext_01"))

    assert _names(tmp) == []

    assert ext.init(tmp, bokehjs_version="1.3.4") is True
    assert _names(tmp) == [
        "bokeh.ext.json",
        "index.ts",
        "package.json",
        "tsconfig.json",
    ]

    assert ext.build(tmp) is True
    assert _names(tmp) == [
        ".bokeh",
        "bokeh.ext.json",
        "dist",
        "index.ts",
        "node_modules",
        "package-lock.json",
        "package.json",
        "tsconfig.json",
    ]

    assert ext.init(tmp) is False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# TODO: restore when support for Python 2.x is removed
#def _entries(path):
#    return sorted(os.scandir(path), key=lambda entry: entry.name)

def _names(path):
    #return [ entry.name for entry in _entries(path) ]
    return sorted(os.listdir(path))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
