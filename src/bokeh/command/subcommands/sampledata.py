#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Download the Bokeh sample data sets to local disk.

To download the Bokeh sample data sets, execute

.. code-block:: sh

    bokeh sampledata

on the command line.

Executing this command is equivalent to running the Python code

.. code-block:: python

    import bokeh.sampledata

    bokeh.sampledata.download()

See :ref:`bokeh.sampledata` for more information on the specific data sets
included in Bokeh's sample data.

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
from bokeh import sampledata

# Bokeh imports
from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Sampledata',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Sampledata(Subcommand):
    ''' Subcommand to download bokeh sample data sets.

    '''

    #: name for this subcommand
    name = "sampledata"

    help = "Download the bokeh sample data sets"

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        sampledata.download()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
