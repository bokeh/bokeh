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

# External imports
from mock import MagicMock

# Module under test
import bokeh.command.subcommand as sc # isort:skip

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _Bad(sc.Subcommand): pass
class _Good(sc.Subcommand):
    def invoke(self, args): pass

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_is_abstract() -> None:
    with pytest.raises(TypeError):
        _Bad()

def test_missing_args() -> None:
    p = MagicMock()
    _Good(p)
    p.add_argument.assert_not_called()

def test_no_args() -> None:
    _Good.args = ()
    p = MagicMock()
    _Good(p)
    p.add_argument.assert_not_called()

def test_one_arg() -> None:
    _Good.args = (
        ("foo", sc.Argument(nargs=1, help="foo")),
    )
    p = MagicMock()
    _Good(p)
    assert p.add_argument.call_count == 1

def test_args() -> None:
    _Good.args = (
        ("foo", sc.Argument(nargs=1, help="foo")),
        ("bar", sc.Argument(nargs=2, help="bar")),
    )
    p = MagicMock()
    _Good(p)
    assert p.add_argument.call_count == 2

def test_base_invoke() -> None:
    with pytest.raises(NotImplementedError):
        p = MagicMock()
        obj = _Good(p)
        super(_Good, obj).invoke("foo") # note super special case

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
