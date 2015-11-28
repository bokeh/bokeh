''' Provide a subcommand to run a bokeh server, optionally hosting specified
Bokeh applications.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh.application import Application
from bokeh.server.server import Server

from ..subcommand import Subcommand
from ..util import build_single_handler_applications

DEFAULT_PORT = 5006

class Serve(Subcommand):
    ''' Subcommand to launch the Bokeh server.

    '''

    name = "serve"

    help = "Run a Bokeh server hosting one or more applications"

    def __init__(self, **kwargs):
        super(Serve, self).__init__(**kwargs)

        self.parser.add_argument(
            'files',
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='*',
            help="The app directories or scripts to serve (serve empty document if not specified)",
            default=None
        )

        self.parser.add_argument(
            '--develop',
            action='store_true',
            help="Enable develop-time features that should not be used in production"
        )

        self.parser.add_argument(
            '--show',
            action='store_true',
            help="Open server app(s) in a browser"
        )

        self.parser.add_argument(
            '--port',
            metavar='PORT',
            type=int,
            help="Port to listen on",
            default=DEFAULT_PORT
        )

        self.parser.add_argument(
            '--address',
            metavar='ADDRESS',
            type=str,
            help="Address to listen on",
            default=None
        )

    def func(self, args):
        applications = build_single_handler_applications(args.files)

        # TODO make log level a command line option
        logging.basicConfig(level=logging.DEBUG)

        if len(applications) == 0:
            # create an empty application by default, typically used with output_server
            applications['/'] = Application()

        server = Server(applications, port=args.port, address=args.address)

        if args.show:
            # we have to defer opening in browser until we start up the server
            def show_callback():
                for route in applications.keys():
                    server.show(route)
            server.io_loop.add_callback(show_callback)

        if args.develop:
            log.info("Using develop mode (do not enable --develop in production)")

        address_string = ''
        if server.address is not None and server.address != '':
            address_string = ' address ' + server.address

        log.info("Starting Bokeh server on port %d%s with applications at paths %r",
                 server.port,
                 address_string,
                 sorted(applications.keys()))

        server.start()