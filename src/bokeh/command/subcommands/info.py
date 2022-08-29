#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

To display information about Bokeh and Bokeh server configuration,
type ``bokeh info`` on the command line.

.. code-block:: sh

    bokeh info

This will print general information to standard output, such as Python and Bokeh versions:

.. code-block:: none

    Python version      :  3.9.7 | packaged by conda-forge | (default, Sep 29 2021, 19:20:46)
    IPython version     :  7.20.0
    Tornado version     :  6.1
    Bokeh version       :  3.0.0
    BokehJS static path :  /opt/anaconda/envs/test/lib/python3.9/site-packages/bokeh/server/static
    node.js version     :  v16.12.0
    npm version         :  7.24.2
    Operating system    :  Linux-5.11.0-40-generic-x86_64-with-glibc2.31

Sometimes it can be useful to get just paths to the BokehJS static files in order
to configure other servers or processes. To do this, use the ``--static`` option

.. code-block:: sh

    bokeh info --static

This will produce output like what is shown below

.. code-block:: none

    /opt/anaconda/envs/test/lib/python3.9/site-packages/bokeh/server/static

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
import platform
import sys
from argparse import Namespace

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings
from bokeh.util.compiler import nodejs_version, npmjs_version
from bokeh.util.dependencies import import_optional

# Bokeh imports
from ..subcommand import Argument, Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Info',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def if_installed(version_or_none: str | None) -> str:
    ''' helper method to optionally return module version number or not installed

    :param version_or_none:
    :return:
    '''
    return version_or_none or "(not installed)"

def _version(module_name: str, attr: str) -> str | None:
    module = import_optional(module_name)
    return getattr(module, attr) if module else None

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Info(Subcommand):
    ''' Subcommand to print information about Bokeh and Bokeh server configuration.

    '''

    #: name for this subcommand
    name = "info"

    help = "Print information about Bokeh and Bokeh server configuration"

    args = (

        ('--static', Argument(
            action="store_true",
            help="Print the locations of BokehJS static files",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        if args.static:
            print(settings.bokehjsdir())
        else:
            newline = '\n'
            print(f"Python version      :  {sys.version.split(newline)[0]}")
            print(f"IPython version     :  {if_installed(_version('IPython', '__version__'))}")
            print(f"Tornado version     :  {if_installed(_version('tornado', 'version'))}")
            print(f"Bokeh version       :  {__version__}")
            print(f"BokehJS static path :  {settings.bokehjsdir()}")
            print(f"node.js version     :  {if_installed(nodejs_version())}")
            print(f"npm version         :  {if_installed(npmjs_version())}")
            print(f"Operating system    :  {platform.platform()}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
