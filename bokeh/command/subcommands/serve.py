''' Provide a subcommand to run a bokeh server, optionally hosting specified
Bokeh applications.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh.application import Application
from bokeh.server.server import Server
from bokeh.util.string import nice_join

from ..subcommand import Subcommand
from ..util import build_single_handler_applications

DEFAULT_PORT = 5006

LOGLEVELS = ('debug', 'info', 'warning', 'error', 'critical')

class Serve(Subcommand):
    ''' Subcommand to launch the Bokeh server.

    '''

    name = "serve"

    help = "Run a Bokeh server hosting one or more applications"

    args = (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='*',
            help="The app directories or scripts to serve (serve empty document if not specified)",
            default=None,
        )),

        ('--develop', dict(
            action='store_true',
            help="Enable develop-time features that should not be used in production",
        )),

        ('--show', dict(
            action='store_true',
            help="Open server app(s) in a browser",
        )),

        ('--port', dict(
            metavar='PORT',
            type=int,
            help="Port to listen on",
            default=DEFAULT_PORT,
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
            default = 'debug',
            choices = LOGLEVELS,
            help    = "One of: %s" % nice_join(LOGLEVELS),
        )),

    )

    def invoke(self, args):
        applications = build_single_handler_applications(args.files)

        log_level = getattr(logging, args.log_level.upper())
        logging.basicConfig(level=log_level)

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