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
from typing import Any
from difflib import get_close_matches

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

        # Case 1: Verbose requested without a specific setting -> print all with details
        if args.verbose and not args.setting_names:
            for name, descriptor in all_settings.items():
                self._print_setting_detail(name, descriptor)
            return

        # Case 2: Specific setting requested
        if args.setting_names:
            for name in args.setting_names:
                matches = []

                if name in all_settings:
                    matches = [name]
                else:
                    # substring matches (more intuitive than only difflib)
                    substring_matches = [k for k in all_settings if name.lower() in k.lower()]
                    if len(substring_matches) == 1:
                        matches = substring_matches
                    elif len(substring_matches) > 1:
                        print()
                        print(f"Multiple matches found for '{name}':")
                        for m in sorted(substring_matches):
                            print(f"  {m}")
                        print()
                        continue
                    else:
                        # fuzzy fallback
                        close = get_close_matches(name, all_settings.keys(), n=3, cutoff=0.6)
                        if close:
                            print()
                            print(f"Setting '{name}' not found.")
                            print("Did you mean one of these?")
                            for c in close:
                                print(f"  {c}")
                            print()
                            continue

                if matches:
                    setting_name = matches[0]
                    descriptor = all_settings[setting_name]
                    if args.verbose:
                        # Verbose + setting -> detailed info
                        self._print_setting_detail(setting_name, descriptor)
                    else:
                        # Basic info
                        print()
                        print(f"Setting: {setting_name}")
                        print("=" * 60)
                        print(f"Current Value: {descriptor()}")
                        print(f"Environment Variable: {descriptor.env_var}")
                        print("\nHelp:")
                        print(f"{descriptor.help.strip()}")
                    print()
                else:
                    # no matches at all
                    print()
                    print(f"Setting '{name}' not found.")
                    print()
                    print("Available settings:")
                    for n in sorted(all_settings):
                        print(f"  {n}")
                    print()
            return

        # Case 3: No args -> print summary table
        self._print_settings_table(all_settings)

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

    def _print_setting_detail(self, setting_name: str, descriptor: PrioritizedSetting[Any]) -> None:
        ''' Print detailed help for a specific setting.
        '''
        ''' Print all settings in a table format. '''
        print()
        print(f"Setting: {setting_name}")
        print("=" * 60)
        print(f"Current Value: {descriptor()}")
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
