#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations  # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.command.bootstrap import main
from bokeh.command.subcommand import Argument
from bokeh.settings import settings
from bokeh.util.settings import get_all_settings
from tests.support.util.types import Capture

# Module under test
import bokeh.command.subcommands.settings as scsettings  # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_create() -> None:
    import argparse

    from bokeh.command.subcommand import Subcommand

    obj = scsettings.Settings(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)


def test_name() -> None:
    assert scsettings.Settings.name == "settings"


def test_help() -> None:
    assert scsettings.Settings.help == "Print information about Bokeh settings and their current values"


def test_args() -> None:
    assert scsettings.Settings.args == (
        (('-v', '--verbose'), Argument(
            action="store_true",
            help="Show detailed help for a specific setting",
        )),
        ('setting_name', Argument(
            nargs='?',
            help="Name of a specific setting to show detailed help for (use with -v)",
        )),
    )


def parse_settings_table(output: str) -> dict[str, tuple[str, str]]:
    """
    Parse the settings table output into a dict mapping
    setting name -> (env_var, value)
    """
    data_lines = output.strip().splitlines()[4:-1]

    parsed = {}
    for line in data_lines:
        if not line.strip():
            continue
        setting_name = line[0:30].strip()
        env_var = line[30:65].strip()
        value = line[65:].strip()
        parsed[setting_name] = (env_var, value)

    return parsed


def test_run_shows_table(capsys: Capture) -> None:
    all_settings = get_all_settings()
    main(["bokeh", "settings"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.startswith("Bokeh Settings:\n")
    assert "Setting" in out and "Environment Variable" in out and "Value" in out

    output_settings = parse_settings_table(out)

    missing = set(all_settings.keys()) - output_settings.keys()
    extra = set(output_settings.keys()) - set(all_settings.keys())
    assert not missing, f"Missing settings in output: {missing}"
    assert not extra, f"Unexpected settings in output: {extra}"

    for name, (env_var, _) in output_settings.items():
        assert name in all_settings, f"Unexpected setting {name} found in output"
        expected_env_var = all_settings[name].env_var
        assert env_var == expected_env_var, f"Env var mismatch for {name}"

    for name, (_, printed_value) in output_settings.items():
        current_value = str(getattr(settings, name)())
        assert printed_value.strip() == current_value.strip(), f"Value mismatch for {name}"


def test_run_guidance_when_name_without_detail(capsys: Capture) -> None:
    main(["bokeh", "settings", "log_level"])
    out, err = capsys.readouterr()
    assert err == ""
    assert "To get detailed help for a specific setting, use:" in out
    assert "  bokeh settings [-v | --verbose] <setting_name>" in out
    assert "For a list of all settings, use:" in out
    assert "bokeh settings" in out


def test_run_detail_specific_setting(capsys: Capture) -> None:
    main(["bokeh", "settings", "-v", "log_level"])
    out, err = capsys.readouterr()
    assert err == ""

    assert "Setting: log_level" in out
    assert "Environment Variable: BOKEH_LOG_LEVEL" in out
    assert "Default Value: info" in out
    assert "Dev Default: debug" in out
    assert "Help:" in out


def test_run_detail_invalid_setting(capsys: Capture) -> None:
    main(["bokeh", "settings", "-v", "__does_not_exist__"])
    out, err = capsys.readouterr()
    assert err == ""

    assert "Setting '__does_not_exist__' not found." in out
    assert "Available settings:" in out
    assert "log_level" in out

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
