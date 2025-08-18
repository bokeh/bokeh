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

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import argparse

# Bokeh imports
from bokeh.command.bootstrap import main
from bokeh.command.subcommand import Argument, Subcommand
from tests.support.util.types import Capture

# Module under test
import bokeh.command.subcommands.settings as scsettings # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_create() -> None:
    obj = scsettings.Settings(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name() -> None:
    assert scsettings.Settings.name == "settings"

def test_help() -> None:
    assert scsettings.Settings.help == "Print information about Bokeh settings and their current values"

def test_args() -> None:
    assert scsettings.Settings.args == (
        ('--filter', Argument(
            metavar="KEYWORD",
            help="Filter settings by keyword (case-insensitive search in name and help text)",
        )),
        ('--non-default', Argument(
            action="store_true",
            help="Show only settings that have been changed from their default values",
        )),
    )

def test_run(capsys: Capture) -> None:
    main(["bokeh", "settings", "--filter", "browser"])
    out, err = capsys.readouterr()
    assert err == ""
    assert "Settings for Bokeh" in out
    assert "browser" in out
    assert "Environment Variable" in out
    assert "BOKEH_BROWSER" in out

def test_run_filter(capsys: Capture) -> None:
    main(["bokeh", "settings", "--filter", "nonexistent"])
    out, err = capsys.readouterr()
    assert err == ""
    assert "No settings found matching filter: nonexistent" in out

def test_run_non_default(capsys: Capture) -> None:
    main(["bokeh", "settings", "--non-default"])
    out, err = capsys.readouterr()
    assert err == ""
    # In a clean environment, this should show no non-default settings
    assert ("No settings have been changed from their default values." in out or 
            "Settings for Bokeh" in out)

def test_format_value() -> None:
    settings_cmd = scsettings.Settings(parser=argparse.ArgumentParser())
    
    assert settings_cmd._format_value(None) == "None"
    assert settings_cmd._format_value("test") == "test"
    assert settings_cmd._format_value("") == '""'
    assert settings_cmd._format_value([]) == "[]"
    assert settings_cmd._format_value([1, 2, 3]) == "[1, 2, 3]"
    assert settings_cmd._format_value(True) == "True"
    assert settings_cmd._format_value(False) == "False"
    assert settings_cmd._format_value(42) == "42"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
