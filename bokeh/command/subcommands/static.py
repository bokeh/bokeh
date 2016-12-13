from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh.server.server import Server

from ..subcommand import Subcommand
from ..util import report_server_init_errors
from .serve import base_serve_args


class Static(Subcommand):
    ''' Subcommand to launch the Bokeh static server. '''

    name = "static"

    help = "Serve bokehjs' static assets (JavaScript, CSS, images, fonts, etc.)"

    args = base_serve_args

    def invoke(self, args):
        log_level = getattr(logging, args.log_level.upper())
        logging.basicConfig(level=log_level, format=args.log_format)

        applications = {}

        _allowed_keys = ['port', 'address']
        server_kwargs = { key: getattr(args, key) for key in _allowed_keys if getattr(args, key, None) is not None }

        with report_server_init_errors(**server_kwargs):
            server = Server(applications, **server_kwargs)

            address_string = ''
            if server.address is not None and server.address != '':
                address_string = ' address ' + server.address

            log.info("Starting Bokeh static server on port %d%s", server.port, address_string)
            server.run_until_shutdown()
