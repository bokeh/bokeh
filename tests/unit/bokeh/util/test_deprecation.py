#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from unittest.mock import MagicMock, patch

# Module under test
import bokeh.util.deprecation as dep # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def foo(): pass

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@patch('warnings.warn')
def test_message(mock_warn: MagicMock) -> None:
    dep.deprecated('test')
    mock_warn.assert_called_once_with("test", dep.BokehDeprecationWarning, stacklevel=3)

def test_message_no_extra_args() -> None:
    with pytest.raises(ValueError):
        dep.deprecated('test', 'foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', old='foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', new='foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', extra='foo')

def test_since_missing_extra_args() -> None:
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3))
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3), old="foo")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3), new="foo")

def test_since_bad_tuple() -> None:
    with pytest.raises(ValueError):
        dep.deprecated((1,), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3,4), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,-4), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,"3"), old="foo", new="bar")

@patch('warnings.warn')
def test_since(mock_warn: MagicMock) -> None:
    dep.deprecated((1, 2, 3), old="foo", new="bar")
    mock_warn.assert_called_once_with(
        "'foo' was deprecated in Bokeh 1.2.3 and will be removed, use 'bar' instead.",
        dep.BokehDeprecationWarning,
        stacklevel=3,
    )

@patch('warnings.warn')
def test_since_with_extra(mock_warn: MagicMock) -> None:
    dep.deprecated((1, 2, 3), old="foo", new="bar", extra="baz")
    mock_warn.assert_called_once_with(
        "'foo' was deprecated in Bokeh 1.2.3 and will be removed, use 'bar' instead. baz",
        dep.BokehDeprecationWarning,
        stacklevel=3,
    )

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
