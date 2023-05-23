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
import bokeh.util.package as bup # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_zero_version(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.0.0")
    errors = bup.validate()
    assert "Invalid version 0.0.0" in errors

    errors = bup.validate(version=None)
    assert "Invalid version 0.0.0" in errors

@pytest.mark.parametrize('v', ("1.2.3", "1.2.3.dev2", "1.4.5.rc3"))
def test_version_mismatch_dev_with_given(v: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2.dev12")
    errors = bup.validate(version=v)
    assert f"Version mismatch: given version ({v}) != package version ({bup.__version__})" in errors

@pytest.mark.parametrize('v', ("1.2.3", "1.2.3.dev2", "1.4.5.rc3"))
def test_version_mismatch_rc_with_given(v: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2.rc12")
    errors = bup.validate(version=v)
    assert f"Version mismatch: given version ({v}) != package version ({bup.__version__})" in errors

@pytest.mark.parametrize('v', ("1.2.3", "1.2.3.dev2", "1.4.5.rc3"))
@patch('bokeh.resources.verify_sri_hashes')
def test_version_mismatch_full_with_given(mock_vsrih: MagicMock, v: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2")
    errors = bup.validate(version=v)
    assert f"Version mismatch: given version ({v}) != package version ({bup.__version__})" in errors

def test_version_mismatch_dev_no_given(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2.dev12")
    bup.validate()

def test_version_mismatch_rc_no_given(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2.rc12")
    bup.validate()

@patch('bokeh.resources.verify_sri_hashes')
def test_version_mismatch_full_no_given(mock_vsrih: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2")
    bup.validate()
    assert mock_vsrih.called

def test_version_missing_build_dir(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bup, '__version__', "0.1.2.rc12")
    errors = bup.validate(build_dir="/foobuild")
    assert any("foobuild" in err for err in errors)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
