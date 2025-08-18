#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

To display all available Bokeh settings and their values,
type ``bokeh settings`` on the command line.

.. code-block:: sh

    bokeh settings

This will print all available settings to standard output, showing their current values,
environment variables, defaults, and help text:

.. code-block:: none

    Settings for Bokeh 3.8.0-rc.1
    ==============================

    allowed_ws_origin
    -----------------
    Environment Variable : BOKEH_ALLOW_WS_ORIGIN
    Current Value        : []
    Default Value        : []
    Type                 : List[String]
    Help                 : A comma-separated list of allowed websocket origins for Bokeh server applications.

    browser
    -------
    Environment Variable : BOKEH_BROWSER
    Current Value        : none (dev mode)
    Default Value        : None
    Dev Default Value    : none
    Type                 : String
    Help                 : The default browser that Bokeh should use to show documents with.

                          Valid values are any of the predefined browser names understood by the
                          Python standard library webbrowser module.

You can filter the output to show only settings containing a specific keyword:

.. code-block:: sh

    bokeh settings --filter server

This will show only settings that have "server" in their name or help text.

You can also show only non-default settings (settings that have been changed from their defaults):

.. code-block:: sh

    bokeh settings --non-default

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
import textwrap
from argparse import Namespace

# Bokeh imports
from bokeh import __version__
from bokeh.settings import PrioritizedSetting, settings

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
    ''' Subcommand to print information about Bokeh settings and their current values.

    '''

    #: name for this subcommand
    name = "settings"

    help = "Print information about Bokeh settings and their current values"

    args = (

        ('--filter', Argument(
            metavar="KEYWORD",
            help="Filter settings by keyword (case-insensitive search in name and help text)",
        )),

        ('--non-default', Argument(
            action="store_true",
            help="Show only settings that have been changed from their default values",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        print(f"Settings for Bokeh {__version__}")
        print("=" * (len(f"Settings for Bokeh {__version__}")))
        print()

        # Get all PrioritizedSetting attributes from the settings class
        setting_items = []
        for attr_name in dir(settings):
            attr = getattr(settings.__class__, attr_name, None)
            if isinstance(attr, PrioritizedSetting):
                setting_items.append((attr_name, attr))

        # Sort settings alphabetically
        setting_items.sort(key=lambda x: x[0])

        # Filter settings if requested
        if args.filter:
            keyword = args.filter.lower()
            filtered_items = []
            for name, setting in setting_items:
                if (keyword in name.lower() or 
                    keyword in setting.help.lower()):
                    filtered_items.append((name, setting))
            setting_items = filtered_items

        # Filter for non-default settings if requested
        if args.non_default:
            non_default_items = []
            for name, setting in setting_items:
                current_value = getattr(settings, name)()
                default_value = setting._default
                dev_default_value = getattr(setting, '_dev_default', None)
                
                # Check if current value differs from default
                if settings.dev and dev_default_value is not None:
                    is_default = current_value == dev_default_value
                else:
                    is_default = current_value == default_value
                
                if not is_default:
                    non_default_items.append((name, setting))
            setting_items = non_default_items

        # Display settings
        for i, (name, setting) in enumerate(setting_items):
            if i > 0:
                print()
            
            self._print_setting(name, setting)

        if not setting_items:
            if args.filter:
                print(f"No settings found matching filter: {args.filter}")
            elif args.non_default:
                print("No settings have been changed from their default values.")
            else:
                print("No settings found.")

    def _print_setting(self, name: str, setting: PrioritizedSetting) -> None:
        """Print detailed information about a single setting."""
        
        print(name)
        print("-" * len(name))
        
        # Environment variable
        env_var = setting._env_var
        print(f"Environment Variable : {env_var}")
        
        # Current value
        current_value = getattr(settings, name)()
        current_str = self._format_value(current_value)
        
        # Check if we're using dev default
        dev_default = getattr(setting, '_dev_default', None)
        if settings.dev and dev_default is not None and current_value == dev_default:
            current_str += " (dev mode)"
        
        print(f"Current Value        : {current_str}")
        
        # Default value
        default_value = setting._default
        print(f"Default Value        : {self._format_value(default_value)}")
        
        # Dev default value (if different)
        if dev_default is not None and dev_default != default_value:
            print(f"Dev Default Value    : {self._format_value(dev_default)}")
        
        # Type
        type_str = setting.convert_type
        print(f"Type                 : {type_str}")
        
        # Help text (wrapped)
        help_text = setting.help.strip()
        if help_text:
            print("Help                 :", end="")
            # Wrap help text to fit nicely
            wrapper = textwrap.TextWrapper(
                width=80,
                initial_indent=" ",
                subsequent_indent="                      "
            )
            wrapped_help = wrapper.fill(help_text)
            print(wrapped_help)

    def _format_value(self, value) -> str:
        """Format a setting value for display."""
        if value is None:
            return "None"
        elif isinstance(value, str):
            return value if value else '""'
        elif isinstance(value, list):
            if not value:
                return "[]"
            return str(value)
        elif isinstance(value, bool):
            return str(value)
        else:
            return str(value)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
