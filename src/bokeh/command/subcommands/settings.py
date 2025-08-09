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

This will print all settings to standard output, such as:

.. code-block:: none

    Setting                    Value                    Environment Variable
    -------                    -----                    -------------------
    allowed_ws_origin         []                       BOKEH_ALLOW_WS_ORIGIN
    auth_module               None                     BOKEH_AUTH_MODULE
    browser                   None                     BOKEH_BROWSER
    cdn_version               None                     BOKEH_CDN_VERSION
    chromedriver_path         None                     BOKEH_CHROMEDRIVER_PATH
    compression_level         6                        BOKEH_COMPRESSION_LEVEL
    cookie_secret             None                     BOKEH_COOKIE_SECRET
    default_server_host       localhost                BOKEH_DEFAULT_SERVER_HOST
    default_server_port       5006                     BOKEH_DEFAULT_SERVER_PORT
    docs_cdn                  None                     BOKEH_DOCS_CDN
    docs_version              None                     BOKEH_DOCS_VERSION
    ico_path                  default                  BOKEH_ICO_PATH
    ignore_filename           False                    BOKEH_IGNORE_FILENAME
    log_level                 info                     BOKEH_LOG_LEVEL
    minified                  True                     BOKEH_MINIFIED
    nodejs_path               None                     BOKEH_NODEJS_PATH
    perform_document_validation True                   BOKEH_VALIDATE_DOC
    pretty                    False                    BOKEH_PRETTY
    py_log_level              none                     BOKEH_PY_LOG_LEVEL
    resources                 cdn                      BOKEH_RESOURCES
    rootdir                   None                     BOKEH_ROOTDIR
    secret_key                None                     BOKEH_SECRET_KEY
    serialize_include_defaults False                   BOKEH_SERIALIZE_INCLUDE_DEFAULTS
    sign_sessions             False                    BOKEH_SIGN_SESSIONS
    simple_ids                False                    BOKEH_SIMPLE_IDS
    ssl_certfile              None                     BOKEH_SSL_CERTFILE
    ssl_keyfile               None                     BOKEH_SSL_KEYFILE
    ssl_password              None                     BOKEH_SSL_PASSWORD
    validation_level          none                     BOKEH_VALIDATION_LEVEL
    xsrf_cookies              False                    BOKEH_XSRF_COOKIES

This will display all available Bokeh settings in a table format with their current values and environment variables.

To get detailed help for a specific setting, use the --detail option:

.. code-block:: sh

    bokeh settings --detail log_level
    bokeh settings --detail minified

This will show detailed information about the specified setting including its help text,
default values, and current value.

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

# Bokeh imports
from bokeh.settings import settings, PrioritizedSetting, _Unset

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

        ('--detail', Argument(
            action="store_true",
            help="Show detailed help for a specific setting",
        )),

        ('setting_name', Argument(
            nargs='?',
            help="Name of a specific setting to show detailed help for (use with --detail)",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        all_settings: list[tuple[str, PrioritizedSetting[Any]]] = []
        for name, attr in settings.__class__.__dict__.items():
            if isinstance(attr, PrioritizedSetting):
                all_settings.append((name, attr))

        all_settings.sort(key=lambda x: x[0])

        if not all_settings:
            print("No settings found")
            return

        if args.setting_name and args.detail:
            self._print_setting_detail(args.setting_name, all_settings)
        elif args.setting_name and not args.detail:
            print("To get detailed help for a specific setting, use:")
            print("  bokeh settings --detail <setting_name>")
            print("\nFor a list of all settings, use:")
            print("  bokeh settings")
        else:
            self._print_settings_table(all_settings)

    def _print_settings_table(self, all_settings: list[tuple[str, PrioritizedSetting[Any]]]) -> None:
        ''' Print all settings in a table format.
        '''
        print("Bokeh Settings:")
        print("=" * 80)
        print(f"{'Setting':<30} {'Value':<25} {'Environment Variable':<25}")
        print("-" * 80)

        for name, attr in all_settings:
            try:
                current_value = getattr(settings, name)()
                env_var = attr.env_var

                if current_value is None:
                    value_str = "None"
                elif isinstance(current_value, bool):
                    value_str = str(current_value)
                elif isinstance(current_value, list | tuple):
                    value_str = str(current_value)
                else:
                    value_str = str(current_value)

                if len(value_str) > 23:
                    value_str = value_str[:20] + "..."

                print(f"{name:<30} {value_str:<25} {env_var:<25}")

            except Exception:
                print(f"{name:<30} {'<error>':<25} {'<error>':<25}")

        print("-" * 80)

    def _print_setting_detail(self, setting_name: str, all_settings: list[tuple[str, PrioritizedSetting[Any]]]) -> None:
        ''' Print detailed help for a specific setting.
        '''
        setting_attr = None
        for name, attr in all_settings:
            if name.lower() == setting_name.lower():
                setting_attr = attr
                setting_name = name
                break

        if not setting_attr:
            print(f"Setting '{setting_name}' not found.")
            print("Available settings:")
            for name, _ in all_settings:
                print(f"  {name}")
            return

        try:
            current_value = getattr(settings, setting_name)()
            env_var = setting_attr.env_var

            print(f"Setting: {setting_name}")
            print("=" * 60)
            print(f"Current Value: {current_value}")
            print(f"Default Value: {setting_attr.default}")
            if setting_attr.dev_default is not _Unset:
                print(f"Dev Default: {setting_attr.dev_default}")
            print(f"Environment Variable: {env_var}")
            print("\nHelp:")
            print(f"{setting_attr.help.strip()}")

        except Exception as e:
            print(f"Setting: {setting_name}")
            print("=" * 60)
            print(f"Error accessing value: {e}")
            print(f"Default Value: {setting_attr.default}")
            if setting_attr.dev_default is not _Unset:
                print(f"Dev Default: {setting_attr.dev_default}")
            print(f"Environment Variable: {setting_attr.env_var}")
            print("\nHelp:")
            print(f"{setting_attr.help.strip()}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
