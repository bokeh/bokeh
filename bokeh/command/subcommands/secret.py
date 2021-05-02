#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from argparse import Namespace

# Bokeh imports
from bokeh.util.token import generate_secret_key

# Bokeh imports
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

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        key = generate_secret_key()

        # suppress LGTM, since the intent is precisesly to output a secret
        print(key)  # lgtm [py/clear-text-logging-sensitive-data]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
