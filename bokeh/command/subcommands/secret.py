'''

To generate a new secret key for use with Bokeh server,
type ``bokeh secret`` on the command line. The key will be printed
to standard output.

The secret key can be provided to the ``bokeh serve`` command with
the ``BOKEH_SECRET_KEY`` environment variable.

.. warning::
    You must keep the secret secret! Protect it like a root password.

'''
from __future__ import absolute_import

from bokeh.util.session_id import generate_secret_key

from ..subcommand import Subcommand

class Secret(Subcommand):
    ''' Subcommand to generate a new secret key.

    '''

    name = "secret"

    help = "Create a Bokeh secret key for use with Bokeh server"

    args = (
    )

    def invoke(self, args):
        key = generate_secret_key()
        print(key)
