#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest # isort:skip

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from typing import Any, cast
from unittest.mock import MagicMock, patch

# Bokeh imports
from bokeh.core.properties import Int
from bokeh.core.validation.check import ValidationIssue, ValidationIssues
from bokeh.core.validation.issue import Error, Warning
from bokeh.core.validation.warnings import EMPTY_LAYOUT, MISSING_RENDERERS
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
        def _check_good():
            return None
        assert _check_good() == []

        @v.error(error)
        def _check_bad():
            return "bad"
        assert _check_bad() == [ValidationIssue(error.code, error.name, error.description, "bad")]

def test_warning_decorator_code() -> None:
    for warning in Warning.all():
        @v.warning(warning)
        def _check_good():
            return None
        assert _check_good() == []

        @v.warning(warning)
        def _check_bad():
            return "bad"
        assert _check_bad() == [ValidationIssue(warning.code, warning.name, warning.description, "bad")]

def test_error_decorator_custom() -> None:
    @v.error("E1")
    def _check_good():
        return None
    assert _check_good() == []

    @v.error("E2")
    def _check_bad():
        return "bad"
    assert _check_bad() == [ValidationIssue(9999, "EXT:E2", "Custom extension reports error", "bad")]

def test_warning_decorator_custom() -> None:
    @v.warning("W1")
    def _check_good():
        return None
    assert _check_good() == []

    @v.warning("W2")
    def _check_bad():
        return "bad"
    assert _check_bad() == [ValidationIssue(9999, "EXT:W2", "Custom extension reports warning", "bad")]

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

class TestSilenced:
    def test_no_scoped_suppression(self) -> None:
        assert v.is_silenced(EMPTY_LAYOUT) is False
        try:
            v.silence(EMPTY_LAYOUT)
            assert v.is_silenced(EMPTY_LAYOUT) is True
            assert v.is_silenced(MISSING_RENDERERS) is False
        finally:
            v.silence(EMPTY_LAYOUT, False)
        assert v.is_silenced(EMPTY_LAYOUT) is False

    def test_nested_same_warning(self) -> None:
        assert not v.is_silenced(EMPTY_LAYOUT)
        with v.silenced(EMPTY_LAYOUT):
            with v.silenced(EMPTY_LAYOUT):
                assert v.is_silenced(EMPTY_LAYOUT)
            assert v.is_silenced(EMPTY_LAYOUT)
        assert not v.is_silenced(EMPTY_LAYOUT)

    def test_nested_different_warnings(self) -> None:
        with v.silenced(EMPTY_LAYOUT):
            with v.silenced(MISSING_RENDERERS):
                assert v.is_silenced(EMPTY_LAYOUT)
                assert v.is_silenced(MISSING_RENDERERS)
            assert v.is_silenced(EMPTY_LAYOUT)
            assert not v.is_silenced(MISSING_RENDERERS)
        assert not v.is_silenced(EMPTY_LAYOUT)

    def test_preserves_global_silence(self) -> None:
        try:
            v.silence(EMPTY_LAYOUT)
            with v.silenced(EMPTY_LAYOUT):
                assert v.is_silenced(EMPTY_LAYOUT)
            assert v.is_silenced(EMPTY_LAYOUT)
        finally:
            v.silence(EMPTY_LAYOUT, False)

    @pytest.mark.parametrize("initially_silenced", [False, True])
    def test_global_changes_survive_scope(self, initially_silenced: bool) -> None:
        try:
            v.silence(EMPTY_LAYOUT, initially_silenced)
            with v.silenced(EMPTY_LAYOUT):
                global_silencers = v.silence(EMPTY_LAYOUT, not initially_silenced)
                assert (EMPTY_LAYOUT in global_silencers) == (not initially_silenced)
                assert v.is_silenced(EMPTY_LAYOUT)
            assert v.is_silenced(EMPTY_LAYOUT) == (not initially_silenced)
        finally:
            v.silence(EMPTY_LAYOUT, False)

    def test_exception_restores_suppression(self) -> None:
        with pytest.raises(RuntimeError):
            with v.silenced(EMPTY_LAYOUT):
                raise RuntimeError()
        assert not v.is_silenced(EMPTY_LAYOUT)

    def test_bad_input(self) -> None:
        with pytest.raises(ValueError, match="should be a warning object"):
            with v.silenced(cast(Any, "EMPTY_LAYOUT")):
                pass
        assert not v.is_silenced(EMPTY_LAYOUT)

    @pytest.mark.parametrize("check_isolation", [False, True])
    def test_interleaved_threads(self, check_isolation: bool) -> None:
        a_in, b_in, a_out = Event(), Event(), Event()

        def a():
            try:
                with v.silenced(EMPTY_LAYOUT):
                    a_in.set()
                    assert b_in.wait(5)
                    assert v.is_silenced(EMPTY_LAYOUT)
            finally:
                a_out.set()
            assert not v.is_silenced(EMPTY_LAYOUT)

        def b():
            assert a_in.wait(5)
            try:
                if check_isolation:
                    assert not v.is_silenced(EMPTY_LAYOUT)
            except BaseException:
                b_in.set()
                raise
            with v.silenced(EMPTY_LAYOUT):
                b_in.set()
                assert a_out.wait(5)
                assert v.is_silenced(EMPTY_LAYOUT)
            assert not v.is_silenced(EMPTY_LAYOUT)

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(f) for f in (a, b)]
            for future in futures:
                future.result(timeout=15)
        assert not v.is_silenced(EMPTY_LAYOUT)

    def test_async_task_isolation(self) -> None:
        async def run():
            entered, finish = asyncio.Event(), asyncio.Event()

            async def suppressed():
                with v.silenced(EMPTY_LAYOUT):
                    entered.set()
                    await finish.wait()
                    assert v.is_silenced(EMPTY_LAYOUT)
                assert not v.is_silenced(EMPTY_LAYOUT)

            task = asyncio.create_task(suppressed())
            try:
                await entered.wait()
                assert not v.is_silenced(EMPTY_LAYOUT)
            finally:
                finish.set()
                await task

        async def bounded_run():
            await asyncio.wait_for(run(), timeout=5)

        asyncio.run(bounded_run())

    def test_to_thread_inherits_suppression(self) -> None:
        def worker():
            assert v.is_silenced(EMPTY_LAYOUT)
            with v.silenced(MISSING_RENDERERS):
                assert v.is_silenced(EMPTY_LAYOUT)
                assert v.is_silenced(MISSING_RENDERERS)
            assert not v.is_silenced(MISSING_RENDERERS)

        async def run():
            with v.silenced(EMPTY_LAYOUT):
                await asyncio.to_thread(worker)
                assert v.is_silenced(EMPTY_LAYOUT)
                assert not v.is_silenced(MISSING_RENDERERS)
            assert not v.is_silenced(EMPTY_LAYOUT)

        asyncio.run(run())

    @patch('bokeh.core.validation.check.log.warning')
    def test_suppresses_warning_processing(self, mock_warn: MagicMock) -> None:
        issues = ValidationIssues(warning=[ValidationIssue(EMPTY_LAYOUT.code, EMPTY_LAYOUT.name, EMPTY_LAYOUT.description)])
        with v.silenced(EMPTY_LAYOUT):
            with v.silenced(EMPTY_LAYOUT):
                v.process_validation_issues(issues)
            v.process_validation_issues(issues)
            mock_warn.assert_not_called()
        v.process_validation_issues(issues)
        mock_warn.assert_called_once()

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
