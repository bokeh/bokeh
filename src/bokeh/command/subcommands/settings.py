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

# External imports
from jinja2 import Template

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

SETTINGS_TABLE_TEMPLATE = Template("""
Bokeh Settings:
{{ "=" * 80 }}
{{ "{:<30} {:<35} {:<25}".format("Setting", "Environment Variable", "Value") }}
{{ "-" * 80 }}
{%- for name, env_var, value in rows %}
{{ "{:<30} {:<35} {:<25}".format(name, env_var, value) }}
{%- endfor %}
{{ "-" * 80 }}

""")

SETTING_TEMPLATE = Template("""
Setting: {{ name }}
{{ "=" * 60 }}
Current Value: {{ current_value }}
{%- if verbose %}
Source: {{ source }}
Default Value: {{ default }}
{%- if dev_default is not none %}
Dev Default: {{ dev_default }}
{%- endif %}
{%- endif %}
Environment Variable: {{ env_var }}

Help:
{{ help }}

""")

FUZZY_MATCH_TEMPLATE = Template("""
Setting '{{ name }}' not found.
Did you mean one of these?
{%- for c in close %}
  {{ c }}
{%- endfor %}

""")

NOT_FOUND_TEMPLATE = Template("""
Setting '{{ name }}' not found.

Available settings:
{%- for n in all_names %}
  {{ n }}
{%- endfor %}

""")

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
                self._print_setting(name, descriptor, verbose=True)

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
            print(FUZZY_MATCH_TEMPLATE.render(name=name, close=close))

        # Not found
        for name in resolved.not_found:
            print(NOT_FOUND_TEMPLATE.render(name=name, all_names=sorted(all_settings)))

        # Exact matches
        to_print = sorted(set(resolved.exact_matches))
        for setting_name in to_print:
            descriptor = all_settings[setting_name]
            self._print_setting(setting_name, descriptor, verbose)

    def _print_settings_table(self, all_settings: dict[str, PrioritizedSetting[Any]]) -> None:
        ''' Print all settings in a table format.
        '''
        rows = [(name, desc.env_var, str(desc())) for name, desc in all_settings.items()]
        print(SETTINGS_TABLE_TEMPLATE.render(rows=rows))

    def _print_setting(self, setting_name: str, descriptor: PrioritizedSetting[Any], verbose: bool) -> None:
        ''' Print info (basic or detailed) for a specific setting using one template. '''
        context = {
            "name": setting_name,
            "current_value": descriptor(),
            "source": descriptor.provenance_display,
            "default": descriptor.default,
            "dev_default": descriptor.dev_default if descriptor.dev_default is not _Unset else None,
            "env_var": descriptor.env_var,
            "help": descriptor.help.strip(),
            "verbose": verbose,
        }
        print(SETTING_TEMPLATE.render(**context))

#-----------------------------------------------------------------------------
# Dev API
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
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
