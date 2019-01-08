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

# External imports

# Bokeh imports

# Module under test
import bokeh.command.subcommands as sc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_all():
    assert hasattr(sc, 'all')
    assert type(sc.all) is list

def test_all_types():
    from bokeh.command.subcommand import Subcommand

    assert all(issubclass(x, Subcommand) for x in sc.all)

def test_all_count():
    from os.path import dirname
    from os import listdir

    files = listdir(dirname(sc.__file__))
    pyfiles = [x for x in files if x.endswith(".py")]

    # the -2 accounts for __init__.py and file_output.py
    assert len(sc.all) == len(pyfiles) - 2

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
