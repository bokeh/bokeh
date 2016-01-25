from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh.server.server import Server
from bokeh.util.string import nice_join

from ..subcommand import Subcommand

LOGLEVELS = ('debug', 'info', 'warning', 'error', 'critical')

class Static(Subcommand):
    ''' Subcommand to launch the Bokeh static server. '''

    name = "static"

    help = "Run a Bokeh static server (hosting bokehjs' static files)"

    args = (
        ('--port', dict(
            metavar='PORT',
            type=int,
            help="Port to listen on",
            default=None
        )),

        ('--address', dict(
            metavar='ADDRESS',
            type=str,
            help="Address to listen on",
            default=None,
        )),

        ('--log-level', dict(
            metavar='LOG-LEVEL',
            action  = 'store',
            default = 'info',
            choices = LOGLEVELS,
            help    = "One of: %s" % nice_join(LOGLEVELS),
        )),
    )

    def invoke(self, args):
        log_level = getattr(logging, args.log_level.upper())
        logging.basicConfig(level=log_level)

        applications = {}

        _allowed_keys = ['port', 'address']
        server_kwargs = { key: getattr(args, key) for key in _allowed_keys if getattr(args, key, None) is not None }

        server = Server(applications, **server_kwargs)

        address_string = ''
        if server.address is not None and server.address != '':
            address_string = ' address ' + server.address

        log.info("Starting Bokeh static server on port %d%s", server.port, address_string)
        server.start()
