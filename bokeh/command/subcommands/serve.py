'''

To run a Bokeh application on a Bokeh server from a single Python script,
pass the script name to ``bokeh serve`` on the command line:

.. code-block:: sh

    bokeh serve app_script.py

By default, the Bokeh application will be served by the Bokeh server on a
default port ({DEFAULT_PORT}) at localhost, under the path ``/app_script``,
i.e.,

.. code-block:: none

    http://localhost:{DEFAULT_PORT}/app_script

Applications can also be created from directories. The directory should
contain a ``main.py`` (and any other helper modules that are required) as
well as any additional assets (e.g., theme files). Pass the directory name
to ``bokeh serve`` to run the application:

.. code-block:: sh

    bokeh serve app_dir

It is possible to run multiple applications at once:

.. code-block:: sh

    bokeh serve app_script.py app_dir

If you would like to automatically open a browser to display the HTML
page(s), you can pass the ``--show`` option on the command line:

.. code-block:: sh

    bokeh serve app_script.py app_dir --show

This will open two pages, for ``/app_script`` and ``/app_dir``,
respectively.

Network Configuration
~~~~~~~~~~~~~~~~~~~~~

To control the port that the Bokeh server listens on, use the ``--port``
argument:

.. code-block:: sh

    bokeh serve app_script.py --port=8080

Similarly, a specific network address can be specified with the
``--address`` argument. For example:

.. code-block:: sh

    bokeh serve app_script.py --address=0.0.0.0

will have the Bokeh server listen all available network addresses.

*** PREFIX OPTION BELOW NOT YET IMPLEMENTED ***

The Bokeh server can also add an optional prefix to all URL paths.
This can often be useful in conjunction with "reverse proxy" setups.

.. code-block:: sh

    bokeh serve app_script.py --prefix=foobar

Then the application will be served under the following URL:

.. code-block:: none

    http://localhost:{DEFAULT_PORT}/foobar/app_script

Development Options
~~~~~~~~~~~~~~~~~~~

The logging level can be controlled by the ``--log-level`` argument:

.. code-block:: sh

    bokeh serve app_script.py -log-level=debug

The available log levels are: {LOGLEVELS}

*** DEVELOP MODE BELOW NOT YET IMPLEMENTED ***

Additionally, the Bokeh server supports a "develop" mode, which will watch
application sources and automatically reload the application when any of them
change. To use this mode, add the ``--develop`` argument on the command line:

.. code-block:: sh

    bokeh serve app_script.py --develop

.. note::
    The ``--develop`` mode option should not be used in "production" usage.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from bokeh.application import Application
from bokeh.resources import DEFAULT_SERVER_PORT
from bokeh.server.server import Server
from bokeh.util.string import nice_join

from ..subcommand import Subcommand
from ..util import build_single_handler_applications

LOGLEVELS = ('debug', 'info', 'warning', 'error', 'critical')

__doc__ = __doc__.format(
    DEFAULT_PORT=DEFAULT_SERVER_PORT,
    LOGLEVELS=nice_join(LOGLEVELS)
)

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
            default=None
        )),

        ('--address', dict(
            metavar='ADDRESS',
            type=str,
            help="Address to listen on",
            default=None,
        )),

        ('--keep-alive', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to send a keep-alive ping to clients, 0 to disable.",
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

        if args.keep_alive is not None:
            if args.keep_alive == 0:
                log.info("Keep-alive ping disabled")
            else:
                log.info("Keep-alive ping configured every %d milliseconds", args.keep_alive)
            # rename to be compatible with Server
            args.keep_alive_milliseconds = args.keep_alive

        server_kwargs = { key: getattr(args, key) for key in ['port',
                                                              'address',
                                                              'keep_alive_milliseconds']
                          if getattr(args, key, None) is not None }

        server = Server(applications, **server_kwargs)

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
