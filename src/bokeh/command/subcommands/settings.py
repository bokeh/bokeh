#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
To display all available Bokeh settings and their current values,
type ``bokeh settings`` on the command line.

.. code-block:: sh

    bokeh settings

This will print all settings to standard output in a table format, such as:

.. code-block:: none

    Bokeh Settings:
    ==========================================================================
    Setting                      Environment Variable              Value
    --------------------------------------------------------------------------
    log_level                    BOKEH_LOG_LEVEL                   info
    minified                     BOKEH_MINIFIED                    True
    browser                      BOKEH_BROWSER                     None
    ...

To get detailed help for one or more specific settings, provide their names:

.. code-block:: sh

    bokeh settings log_level minified

This will show the current value, environment variable, and help text for
each requested setting.

Use the ``-v`` option for verbose output with additional details:

.. code-block:: sh

    bokeh settings -v log_level
    bokeh settings -v log_level browser

If a setting name is not an exact match, substring and fuzzy matching
will be used to suggest possible candidates:

.. code-block:: sh

    bokeh settings logg

    Did you mean one of these?
      log_level
      py_log_level
'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from argparse import Namespace
from dataclasses import dataclass, field
from difflib import get_close_matches
from typing import Any

# Bokeh imports
from bokeh.settings import PrioritizedSetting, _Unset
from bokeh.util.settings import get_all_settings

# Bokeh imports
from ..subcommand import Argument, Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Settings',
)

#-----------------------------------------------------------------------------
# Helpers
#-----------------------------------------------------------------------------

@dataclass
class ResolutionResult:
    exact_matches: list[str] = field(default_factory=list)
    fuzzy_matches: dict[str, list[str]] = field(default_factory=dict)
    not_found: list[str] = field(default_factory=list)


def resolve_setting_names(input_names: list[str], all_settings: dict[str, Any]) -> ResolutionResult:
    """Resolve user-supplied setting names into matches against all_settings."""
    result = ResolutionResult()

    for name in input_names:
        if name in all_settings:
            result.exact_matches.append(name)
            continue

        substring_matches = [k for k in all_settings if name.lower() in k.lower()]
        if substring_matches:
            result.exact_matches.extend(substring_matches)
        else:
            close = get_close_matches(name, all_settings.keys(), n=3, cutoff=0.6)
            if close:
                result.fuzzy_matches[name] = close
            else:
                result.not_found.append(name)

    return result

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Settings(Subcommand):
    ''' Subcommand to print information about Bokeh settings.

    '''

    name = "settings"

    help = "Print information about Bokeh settings and their current values"

    args = (

        (('-v', '--verbose'), Argument(
            action="store_true",
            help="Show detailed help for a specific setting",
        )),

        ('setting_names', Argument(
            nargs='*',
            help="One or more specific settings to show info for (use with -v for details)",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        ''' Handle the "bokeh settings" command behavior.
        '''
        all_settings = get_all_settings()

        if args.verbose and not args.setting_names:
            for name, descriptor in all_settings.items():
                self._print_setting_detail(name, descriptor)

        elif args.setting_names:
            resolved = resolve_setting_names(args.setting_names, all_settings)
            self._print_resolved_settings(resolved, all_settings, args.verbose)

        else:
            self._print_settings_table(all_settings)


    def _print_resolved_settings(
        self, resolved: ResolutionResult, all_settings: dict[str, PrioritizedSetting[Any]], verbose: bool,
    ) -> None:
        """Print results from resolve_setting_names()."""


        # Fuzzy matches
        for name, close in resolved.fuzzy_matches.items():
            print()
            print(f"Setting '{name}' not found.")
            print("Did you mean one of these?")
            for c in close:
                print(f"  {c}")
            print()

        # Not found
        for name in resolved.not_found:
            print()
            print(f"Setting '{name}' not found.")
            print()
            print("Available settings:")
            for n in sorted(all_settings):
                print(f"  {n}")
            print()

        to_print = sorted(set(resolved.exact_matches))
        for setting_name in to_print:
            descriptor = all_settings[setting_name]
            if verbose:
                self._print_setting_detail(setting_name, descriptor)
            else:
                self._print_setting_basic(setting_name, descriptor)

    def _print_settings_table(self, all_settings: dict[str, PrioritizedSetting[Any]]) -> None:
        ''' Print all settings in a table format.
        '''
        print()
        print("Bokeh Settings:")
        print("=" * 80)
        print(f"{'Setting':<30} {'Environment Variable':<35} {'Value':<25}")
        print("-" * 80)

        for name, descriptor in all_settings.items():
            print(f"{name:<30} {descriptor.env_var:<35} {descriptor()!s:<25}")

        print("-" * 80)
        print()

    def _print_setting_basic(self, setting_name: str, descriptor: PrioritizedSetting[Any]) -> None:
        ''' Print basic info for a specific setting. '''
        print()
        print(f"Setting: {setting_name}")
        print("=" * 60)
        print(f"Current Value: {descriptor()}")
        print(f"Environment Variable: {descriptor.env_var}")
        print("\nHelp:")
        print(f"{descriptor.help.strip()}")
        print()

    def _print_setting_detail(self, setting_name: str, descriptor: PrioritizedSetting[Any]) -> None:
        ''' Print detailed help for a specific setting.
        '''
        print()
        print(f"Setting: {setting_name}")
        print("=" * 60)
        print(f"Current Value: {descriptor()}")
        print(f"Source: {descriptor.provenance_display}")
        print(f"Default Value: {descriptor.default}")
        if descriptor.dev_default is not _Unset:
            print(f"Dev Default: {descriptor.dev_default}")
        print(f"Environment Variable: {descriptor.env_var}")
        print("\nHelp:")
        print(f"{descriptor.help.strip()}")
        print()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
