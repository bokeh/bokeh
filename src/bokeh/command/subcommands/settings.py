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

    Bokeh Settings:
    ==========================================================================
    Setting                      Environment Variable              Value
    --------------------------------------------------------------------------
    allowed_ws_origin            BOKEH_ALLOW_WS_ORIGIN             []
    auth_module                  BOKEH_AUTH_MODULE                 None
    browser                      BOKEH_BROWSER                     None
    cdn_version                  BOKEH_CDN_VERSION                 None
    chromedriver_path            BOKEH_CHROMEDRIVER_PATH           None
    compression_level            BOKEH_COMPRESSION_LEVEL           9
    cookie_secret                BOKEH_COOKIE_SECRET               None
    default_server_host          BOKEH_DEFAULT_SERVER_HOST         localhost
    default_server_port          BOKEH_DEFAULT_SERVER_PORT         5006
    docs_cdn                     BOKEH_DOCS_CDN                    None
    docs_version                 BOKEH_DOCS_VERSION                None
    ico_path                     BOKEH_ICO_PATH                    /path/to/ico
    ignore_filename              BOKEH_IGNORE_FILENAME             False
    log_level                    BOKEH_LOG_LEVEL                   info
    minified                     BOKEH_MINIFIED                    True
    nodejs_path                  BOKEH_NODEJS_PATH                 None
    perform_document_validation  BOKEH_VALIDATE_DOC                True
    pretty                       BOKEH_PRETTY                      False
    py_log_level                 BOKEH_PY_LOG_LEVEL                None
    resources                    BOKEH_RESOURCES                   cdn
    rootdir                      BOKEH_ROOTDIR                     None
    secret_key                   BOKEH_SECRET_KEY                  None
    serialize_include_defaults   BOKEH_SERIALIZE_INCLUDE_DEFAULTS  False
    sign_sessions                BOKEH_SIGN_SESSIONS               False
    simple_ids                   BOKEH_SIMPLE_IDS                  True
    ssl_certfile                 BOKEH_SSL_CERTFILE                None
    ssl_keyfile                  BOKEH_SSL_KEYFILE                 None
    ssl_password                 BOKEH_SSL_PASSWORD                None
    validation_level             BOKEH_VALIDATION_LEVEL            none
    xsrf_cookies                 BOKEH_XSRF_COOKIES                False
    --------------------------------------------------------------------------

This will display all available Bokeh settings in a table format with their
current values and environment variables.

To get detailed help for a specific setting, use the -v option:

.. code-block:: sh

    bokeh settings -v log_level
    bokeh settings -v minified

This will show detailed information about the specified setting including its
help text, default values, and current value.

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

        ('setting_name', Argument(
            nargs='?',
            help="Name of a specific setting to show detailed help for (use with -v)",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        all_settings = get_all_settings()

        if args.setting_name:
            if args.setting_name in all_settings:
                if args.verbose:
                    self._print_setting_detail(args.setting_name, all_settings[args.setting_name])
                else:
                    print("To get detailed help for a specific setting, use:")
                    print("  bokeh settings [-v | --verbose] <setting_name>")
                    print("\nFor a list of all settings, use:")
                    print("  bokeh settings")
            else:
                print(f"Setting '{args.setting_name}' not found.")
                print("Available settings:")
                for name in sorted(all_settings):
                    print(f"  {name}")
        else:
            self._print_settings_table(all_settings)

    def _print_settings_table(self, all_settings: dict[str, PrioritizedSetting[Any]]) -> None:
        ''' Print all settings in a table format.
        '''
        print("Bokeh Settings:")
        print("=" * 80)
        print(f"{'Setting':<30} {'Environment Variable':<35} {'Value':<25}")
        print("-" * 80)

        for name, descriptor in all_settings.items():
            print(f"{name:<30} {descriptor.env_var:<35} {descriptor()!s:<25}")

        print("-" * 80)

    def _print_setting_detail(self, setting_name: str, descriptor: PrioritizedSetting[Any]) -> None:
        ''' Print detailed help for a specific setting.
        '''
        ''' Print all settings in a table format. '''
        print(f"Setting: {setting_name}")
        print("=" * 60)
        print(f"Current Value: {descriptor()}")
        print(f"Default Value: {descriptor.default}")
        if descriptor.dev_default is not _Unset:
            print(f"Dev Default: {descriptor.dev_default}")
        print(f"Environment Variable: {descriptor.env_var}")
        print("\nHelp:")
        print(f"{descriptor.help.strip()}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
