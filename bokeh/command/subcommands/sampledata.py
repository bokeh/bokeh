#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh import sampledata

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

    args = (
    )

    def invoke(self, args):
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
