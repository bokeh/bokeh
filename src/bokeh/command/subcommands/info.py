#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

    Python version        :  3.12.3 | packaged by conda-forge | (main, Apr 15 2024, 18:38:13) [GCC 12.3.0]
    IPython version       :  8.19.0
    Tornado version       :  6.3.3
    NumPy version         :  2.0.0
    Bokeh version         :  3.5.1
    BokehJS static path   :  /opt/anaconda/envs/test/lib/python3.12/site-packages/bokeh/server/static
    node.js version       :  v20.12.2
    npm version           :  10.8.2
    jupyter_bokeh version :  (not installed)
    Operating system      :  Linux-5.15.0-86-generic-x86_64-with-glibc2.35

Sometimes it can be useful to get just paths to the BokehJS static files in order
to configure other servers or processes. To do this, use the ``--static`` option

.. code-block:: sh

    bokeh info --static

This will produce output like what is shown below:

.. code-block:: none

    /opt/anaconda/envs/test/lib/python3.12/site-packages/bokeh/server/static

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

# Bokeh imports
from bokeh.settings import settings
from bokeh.util.info import print_info

# Bokeh imports
from ..subcommand import Argument, Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Info',
)

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
            print(settings.bokehjs_path())
        else:
            print_info()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
