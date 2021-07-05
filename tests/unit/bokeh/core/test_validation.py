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

# Standard library imports
from typing import Any, cast

# External imports
from mock import MagicMock, patch

# Bokeh imports
from bokeh.core.properties import Int
from bokeh.core.validation.check import ValidationIssue, ValidationIssues
from bokeh.core.validation.issue import Error, Warning
from bokeh.model import Model

# Module under test
import bokeh.core.validation as v # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_error_decorator_code() -> None:
    for error in Error.all():
        @v.error(error)
        def good():
            return None
        assert good() == []

        @v.error(error)
        def bad():
            return "bad"
        assert bad() == [ValidationIssue(error.code, error.name, error.description, "bad")]

def test_warning_decorator_code() -> None:
    for warning in Warning.all():
        @v.warning(warning)
        def good():
            return None
        assert good() == []

        @v.warning(warning)
        def bad():
            return "bad"
        assert bad() == [ValidationIssue(warning.code, warning.name, warning.description, "bad")]

def test_error_decorator_custom() -> None:
    @v.error("E1")
    def good():
        return None
    assert good() == []

    @v.error("E2")
    def bad():
        return "bad"
    assert bad() == [ValidationIssue(9999, "EXT:E2", "Custom extension reports error", "bad")]

def test_warning_decorator_custom() -> None:
    @v.warning("W1")
    def good():
        return None
    assert good() == []

    @v.warning("W2")
    def bad():
        return "bad"
    assert bad() == [ValidationIssue(9999, "EXT:W2", "Custom extension reports warning", "bad")]

class Mod(Model):

    foo = Int(default=0)

    @v.error("E")
    def _check_error(self):
        if self.foo > 5: return "err"

    @v.warning("W")
    def _check_warning(self):
        if self.foo < -5: return "wrn"

def test_check_integrity_pass() -> None:
    m = Mod()
    issues = ValidationIssues(error=[], warning=[])
    assert v.check_integrity([m]) == issues

def test_check_integrity_error() -> None:
    m = Mod(foo = 10)
    issues = ValidationIssues(
        error=[ValidationIssue(9999, "EXT:E", "Custom extension reports error", "err")],
        warning=[],
    )
    assert v.check_integrity([m]) == issues

def test_check_integrity_warning() -> None:
    m = Mod(foo = -10)
    issues = ValidationIssues(
        error=[],
        warning=[ValidationIssue(9999, "EXT:W", "Custom extension reports warning", "wrn")],
    )
    assert v.check_integrity([m]) == issues

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_pass(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    m = Mod()

    issues = v.check_integrity([m])
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_error(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    m = Mod(foo=10)
    issues = v.check_integrity([m])
    v.process_validation_issues(issues)
    assert mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_warn(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    m = Mod(foo=-10)
    issues = v.check_integrity([m])
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_and_check_warn(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)
    try:
        v.silence(EXT)  # turn the warning off
        issues = v.check_integrity([m])
        v.process_validation_issues(issues)
        assert not mock_error.called
        assert not mock_warn.called
    finally:
        v.silence(EXT, False)  # turn the warning back on
        issues = v.check_integrity([m])
        v.process_validation_issues(issues)
        assert not mock_error.called
        assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_with_bad_input_and_check_warn(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    m = Mod(foo=-10)
    with pytest.raises(ValueError, match="Input to silence should be a warning object"):
        v.silence(cast(Any, "EXT:W"))
    issues = v.check_integrity([m])
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_warning_already_in_silencers_is_ok(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)
    try:
        silencers0 = v.silence(EXT)  # turn the warning off
        silencers1 = v.silence(EXT)  # do it a second time - no-op
        assert len(silencers0) == 1
        assert silencers0 == silencers1  # silencers is same as before

        issues = v.check_integrity([m])
        v.process_validation_issues(issues)
        assert not mock_error.called
        assert not mock_warn.called
    finally:
        v.silence(EXT, False)  # turn the warning back on
        issues = v.check_integrity([m])
        v.process_validation_issues(issues)
        assert not mock_error.called
        assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_remove_warning_that_is_not_in_silencers_is_ok(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)

    silencers0 = v.silence(EXT)  # turn the warning off
    assert len(silencers0) == 1

    silencers1 = v.silence(EXT, False)  # turn the warning back on
    silencers2 = v.silence(EXT, False)  # do it a second time - no-op
    assert len(silencers1) == 0
    assert silencers1 == silencers2

    issues = v.check_integrity([m])
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_process_validation_issues_pass(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    issues = ValidationIssues(error=[], warning=[])
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_process_validation_issues_warn(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    issues = ValidationIssues(
        error=[ValidationIssue(9999, "EXT:E", "Custom extension reports error", "err")],
        warning=[],
    )
    v.process_validation_issues(issues)
    assert mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_process_validation_issues_error(mock_warn: MagicMock, mock_error: MagicMock) -> None:
    issues = ValidationIssues(
        error=[],
        warning=[ValidationIssue(9999, "EXT:W", "Custom extension reports warning", "wrn")],
    )
    v.process_validation_issues(issues)
    assert not mock_error.called
    assert mock_warn.called

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
