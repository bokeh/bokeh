#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

    Python version      :  3.9.1 (default, Dec 11 2020, 06:28:49)
    IPython version     :  7.20.0
    Tornado version     :  6.1
    Bokeh version       :  2.3.0
    BokehJS static path :  /opt/anaconda/envs/test/lib/python3.9/site-packages/bokeh/server/static
    node.js version     :  v15.10.0
    npm version         :  7.5.3

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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from argparse import Namespace
from typing import Any, Optional

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings
from bokeh.util.compiler import nodejs_version, npmjs_version
from bokeh.util.dependencies import import_optional

# Bokeh imports
from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Info',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def if_installed(version_or_none: Optional[str]) -> str:
    ''' helper method to optionally return module version number or not installed

    :param version_or_none:
    :return:
    '''
    return version_or_none or "(not installed)"

def _version(modname: str, attr: str) -> Optional[Any]:
    mod = import_optional(modname)
    if mod:
        return getattr(mod, attr)
    else:  # explicit None return for mypy typing
        return None

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

        ('--static', dict(
            action='store_true',
            help="Print the locations of BokehJS static files",
        )),

    )

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        if args.static:
            print(settings.bokehjsdir())
        else:

            print("Python version      :  %s" % sys.version.split('\n')[0])
            print("IPython version     :  %s" % if_installed(_version('IPython', '__version__')))
            print("Tornado version     :  %s" % if_installed(_version('tornado', 'version')))
            print("Bokeh version       :  %s" % __version__)
            print("BokehJS static path :  %s" % settings.bokehjsdir())
            print("node.js version     :  %s" % if_installed(nodejs_version()))
            print("npm version         :  %s" % if_installed(npmjs_version()))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
