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
import bokeh.command.subcommands as sc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_all() -> None:
    assert hasattr(sc, 'all')
    assert type(sc.all) is list

def test_all_types() -> None:
    from bokeh.command.subcommand import Subcommand

    assert all(issubclass(x, Subcommand) for x in sc.all)

def test_all_count() -> None:
    from os import listdir
    from os.path import dirname

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
