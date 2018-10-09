#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Generate new secret keys that can be used by the Bokeh server to
cryptographically sign session IDs.

To generate a new secret key for use with Bokeh server, execute

.. code-block:: sh

    bokeh secret

on the command line. The key will be printed to standard output.

The secret key can be provided to the ``bokeh serve`` command with
the ``BOKEH_SECRET_KEY`` environment variable.

.. warning::
    You must keep the secret secret! Protect it like a root password.

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
from bokeh.util.session_id import generate_secret_key

from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Secret',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Secret(Subcommand):
    ''' Subcommand to generate a new secret key.

    '''

    #: name for this subcommand
    name = "secret"

    help = "Create a Bokeh secret key for use with Bokeh server"

    args = (
    )

    def invoke(self, args):
        '''

        '''
        key = generate_secret_key()
        print(key)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
