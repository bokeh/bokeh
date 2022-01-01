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

# Standard library imports
import os

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh._testing.util.env as _tue # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'envset',
)

UNLIKELY_KEY1 = "_bk__foo__zzz123___"
UNLIKELY_KEY2 = "_bk__bar__zzz123___"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(_tue, ALL)

def test_envset_preserves_id() -> None:
    env = os.environ
    with _tue.envset(foo="10"):
        assert os.environ is env
    assert os.environ is env

def test_envset_restores() -> None:
    if "foo" in os.environ:
        old_foo = os.environ["foo"]
        os.environ["foo"] = "123"
        with _tue.envset(foo="10"):
            pass
        assert os.environ["foo"] == "123"
        os.environ["foo"] = old_foo
    else:
        os.environ["foo"] = "123"
        with _tue.envset(foo="10"):
            pass
        assert os.environ["foo"] == "123"
        del os.environ["foo"]

def test_envset_accepts_items() -> None:
    with _tue.envset([(UNLIKELY_KEY1, "10"), (UNLIKELY_KEY2, "20")]):
        assert os.environ[UNLIKELY_KEY1] == "10"
        assert os.environ[UNLIKELY_KEY2] == "20"
    assert UNLIKELY_KEY1 not in os.environ
    assert UNLIKELY_KEY2 not in os.environ

def test_envset_accepts_dict() -> None:
    with _tue.envset({UNLIKELY_KEY1: "10", UNLIKELY_KEY2: "20"}):
        assert os.environ[UNLIKELY_KEY1] == "10"
        assert os.environ[UNLIKELY_KEY2] == "20"
    assert UNLIKELY_KEY1 not in os.environ
    assert UNLIKELY_KEY2 not in os.environ

def test_envset_accepts_kwargs() -> None:
    with _tue.envset(**{UNLIKELY_KEY1: "10", UNLIKELY_KEY2: "20"}):
        assert os.environ[UNLIKELY_KEY1] == "10"
        assert os.environ[UNLIKELY_KEY2] == "20"
    assert UNLIKELY_KEY1 not in os.environ
    assert UNLIKELY_KEY2 not in os.environ

def test_envset_accepts_mix() -> None:
    with _tue.envset([(UNLIKELY_KEY1, "10")], **{UNLIKELY_KEY2: "20"}):
        assert os.environ[UNLIKELY_KEY1] == "10"
        assert os.environ[UNLIKELY_KEY2] == "20"
    assert UNLIKELY_KEY1 not in os.environ
    assert UNLIKELY_KEY2 not in os.environ

def test_envset_applies_kwargs_last() -> None:
    with _tue.envset([(UNLIKELY_KEY1, "10")], **{UNLIKELY_KEY1: "30", UNLIKELY_KEY2: "20"}):
        assert os.environ[UNLIKELY_KEY1] == "30"
        assert os.environ[UNLIKELY_KEY2] == "20"
    assert UNLIKELY_KEY1 not in os.environ
    assert UNLIKELY_KEY2 not in os.environ

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
