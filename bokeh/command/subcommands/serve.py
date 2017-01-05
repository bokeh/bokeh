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

It is also possible to run the same commmand with jupyter notebooks:

.. code-block:: sh

    bokeh serve app_notebook.ipynb

This will generate the same results as described with a python script
and the application will be served on a default port ({DEFAULT_PORT})
at localhost, under the path ``/app_notebook``

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

If you would like to pass command line arguments to Bokeh applications,
you can pass the ``--args`` option as the LAST option on the command
line:

.. code-block:: sh

    bokeh serve app_script.py myapp.py --args foo bar --baz

Everything that follows ``--args`` will be included in ``sys.argv`` when
the application runs. In this case, when ``myapp.py`` executes, the
contents of ``sys.argv`` will be ``['myapp.py', 'foo', 'bar', '--baz']``,
consistent with standard Python expectations for ``sys.argv``.

Note that if multiple scripts or directories are provided, they
all receive the same set of command line arguments (if any) given by
``--args``.

If you have only one application, the server root will redirect to it.
Otherwise, You can see an index of all running applications at the server root:

.. code-block:: none

    http://localhost:5006/

This index can be disabled with the ``--disable-index`` option, and the redirect
behavior can be disabled with the ``--disable-index-redirect`` option.

Network Configuration
~~~~~~~~~~~~~~~~~~~~~

To control the port that the Bokeh server listens on, use the ``--port``
argument:

.. code-block:: sh

    bokeh serve app_script.py --port=8080

To listen on an arbitrary port, pass ``0`` as the port number.  The actual
port number will be logged at startup.

Similarly, a specific network address can be specified with the
``--address`` argument. For example:

.. code-block:: sh

    bokeh serve app_script.py --address=0.0.0.0

will have the Bokeh server listen all available network addresses.

Additionally, it is possible to configure a hosts whitelist that must be
matched by the ``Host`` header in new requests. You can specify multiple
acceptable host values with the ``--host`` option:

.. code-block:: sh

    bokeh serve app_script.py --host foo.com:8081 --host bar.com

If no port is specified in a host value, then port 80 will be used. In
the example above Bokeh server will accept requests from ``foo.com:8081``
and ``bar.com:80``.

If no host values are specified, then by default the Bokeh server will
accept requests from ``localhost:<port>`` where ``<port>`` is the port
that the server is configured to listen on (by default: {DEFAULT_PORT}).

If an asterix ``*`` is used in the host value then it will be treated as a
wildcard:

.. code-block:: sh

    bokeh serve app_script.py --address=0.0.0.0 --host='*'

Using the wildcard can be helpful when testing applications that are deployed
with cloud orchestration tools and when the public endpoint is not known ahead
of time: for instance if the public IP is dynamically allocated during the
deployment process and no public DNS has been configured for the testing
environment.

As a warning, using permissive host values like ``*`` may be insecure and open
your application to HTTP host header attacks. Production deployments should
always set the ``--host`` flag to use the DNS name of the public endpoint such
as a TLS-enabled load balancer or reverse proxy that serves the application to
the end users.

Also note that the host whitelist applies to all request handlers,
including any extra ones added to extend the Bokeh server.

Bokeh server can fork the underlying tornado server into multiprocess.  This is
useful when trying to handle multiple connections especially in the context of
apps which require high computational loads.  Default behavior is one process.
using 0 will auto-detect the number of cores and spin up corresponding number of
processes

.. code-block:: sh

    bokeh serve app_script.py --num-procs 2

By default, cross site connections to the Bokeh server websocket are not
allowed. You can enable websocket connections originating from additional
hosts by specifying them with the ``--allow-websocket-origin`` option:

.. code-block:: sh

    bokeh serve app_script.py --allow-websocket-origin foo.com:8081

It is possible to specify multiple allowed websocket origins by adding
the ``--allow-websocket-origin`` option multiple times.

The Bokeh server can also add an optional prefix to all URL paths.
This can often be useful in conjunction with "reverse proxy" setups.

.. code-block:: sh

    bokeh serve app_script.py --prefix=foobar

Then the application will be served under the following URL:

.. code-block:: none

    http://localhost:{DEFAULT_PORT}/foobar/app_script

If needed, Bokeh server can send keep-alive pings at a fixed interval.
To configure this feature, set the ``--keep-alive`` option:

.. code-block:: sh

    bokeh serve app_script.py --keep-alive 10000

The value is specified in milliseconds. The default keep-alive interval
is 37 seconds. Give a value of 0 to disable keep-alive pings.

To control how often statistic logs are written, set the
--stats-log-frequency option:

.. code-block:: sh

    bokeh serve app_script.py --stats-log-frequency 30000

The value is specified in milliseconds. The default interval for
logging stats is 15 seconds. Only positive integer values are accepted.

To have the Bokeh server override the remote IP and URI scheme/protocol for
all requests with ``X-Real-Ip``, ``X-Forwarded-For``, ``X-Scheme``,
``X-Forwarded-Proto``  headers (if they are provided), set the
``--use-xheaders`` option:

.. code-block:: sh

    bokeh serve app_script.py --use-xheaders

This is typically needed when running a Bokeh server behind a reverse proxy
that is SSL-terminated.

.. warning::
    It is not advised to set this option on a Bokeh server directly facing
    the Internet.

Session ID Options
~~~~~~~~~~~~~~~~~~

Typically, each browser tab connected to a Bokeh server will have
its own session ID. When the server generates an ID, it will make
it cryptographically unguessable. This keeps users from accessing
one another's sessions.

To control who can use a Bokeh application, the server can sign
sessions with a secret key and reject "made up" session
names. There are three modes, controlled by the ``--session-ids``
argument:

.. code-block:: sh

    bokeh serve app_script.py --session-ids=signed

The available modes are: {SESSION_ID_MODES}

In ``unsigned`` mode, the server will accept any session ID
provided to it in the URL. For example,
``http://localhost/app_script?bokeh-session-id=foo`` will create a
session ``foo``. In ``unsigned`` mode, if the session ID isn't
provided with ``?bokeh-session-id=`` in the URL, the server will
still generate a cryptographically-unguessable ID. However, the
server allows clients to create guessable or deliberately-shared
sessions if they want to.

``unsigned`` mode is most useful when the server is running
locally for development, for example you can have multiple
processes access a fixed session name such as
``default``. ``unsigned`` mode is also convenient because there's
no need to generate or configure a secret key.

In ``signed`` mode, the session ID must be in a special format and
signed with a secret key. Attempts to use the application with an
invalid session ID will fail, but if no ``?bokeh-session-id=``
parameter is provided, the server will generate a fresh, signed
session ID. The result of ``signed`` mode is that only secure
session IDs are allowed but anyone can connect to the server.

In ``external-signed`` mode, the session ID must be signed but the
server itself won't generate a session ID; the
``?bokeh-session-id=`` parameter will be required. To use this
mode, you would need some sort of external process (such as
another web app) which would use the
``bokeh.util.session_id.generate_session_id()`` function to create
valid session IDs. The external process and the Bokeh server must
share the same ``BOKEH_SECRET_KEY`` environment variable.

``external-signed`` mode is useful if you want another process to
authenticate access to the Bokeh server; if someone is permitted
to use the Bokeh application, you would generate a session ID for
them, then redirect them to the Bokeh server with that valid
session ID. If you don't generate a session ID for someone, then
they can't load the app from the Bokeh server.

In both ``signed`` and ``external-signed`` mode, the secret key
must be kept secret; anyone with the key can generate a valid
session ID.

The secret key should be set in a ``BOKEH_SECRET_KEY`` environment
variable and should be a cryptographically random string with at
least 256 bits (32 bytes) of entropy.  You can generate a new
secret key with the ``bokeh secret`` command.

Session Expiration Options
~~~~~~~~~~~~~~~~~~~~~~~~~~

To configure how often to check for unused sessions. set the
--check-unused-sessions option:

.. code-block:: sh

    bokeh serve app_script.py --check-unused-sessions 10000

The value is specified in milliseconds. The default interval for
checking for unused sessions is 17 seconds. Only positive integer
values are accepted.

To configure how often unused sessions last. set the
--unused-session-lifetime option:

.. code-block:: sh

    bokeh serve app_script.py --unused-session-lifetime 60000

The value is specified in milliseconds. The default lifetime interval
for unused sessions is 15 seconds. Only positive integer values are
accepted.

Logging Options
~~~~~~~~~~~~~~~

The logging level can be controlled by the ``--log-level`` argument:

.. code-block:: sh

    bokeh serve app_script.py --log-level=debug

The available log levels are: {LOGLEVELS}

The log format can be controlled by the ``--log-format`` argument:

.. code-block:: sh

    bokeh serve app_script.py --log-format="%(levelname)s: %(message)s"

The default log format is ``"{DEFAULT_LOG_FORMAT}"``

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import argparse

from bokeh.application import Application
from bokeh.resources import DEFAULT_SERVER_PORT
from bokeh.server.server import Server
from bokeh.util.string import nice_join
from bokeh.settings import settings

from os import getpid

from ..subcommand import Subcommand
from ..util import build_single_handler_applications, die, report_server_init_errors

LOGLEVELS = ('debug', 'info', 'warning', 'error', 'critical')
SESSION_ID_MODES = ('unsigned', 'signed', 'external-signed')
DEFAULT_LOG_FORMAT = "%(asctime)s %(message)s"

__doc__ = __doc__.format(
    DEFAULT_PORT=DEFAULT_SERVER_PORT,
    LOGLEVELS=nice_join(LOGLEVELS),
    SESSION_ID_MODES=nice_join(SESSION_ID_MODES),
    DEFAULT_LOG_FORMAT=DEFAULT_LOG_FORMAT
)

base_serve_args = (
    ('--port', dict(
        metavar = 'PORT',
        type    = int,
        help    = "Port to listen on",
        default = None
    )),

    ('--address', dict(
        metavar = 'ADDRESS',
        type    = str,
        help    = "Address to listen on",
        default = None,
    )),

    ('--log-level', dict(
        metavar = 'LOG-LEVEL',
        action  = 'store',
        default = 'info',
        choices = LOGLEVELS,
        help    = "One of: %s" % nice_join(LOGLEVELS),
    )),

    ('--log-format', dict(
        metavar ='LOG-FORMAT',
        action  = 'store',
        default = DEFAULT_LOG_FORMAT,
        help    = "A standard Python logging format string (default: %r)" % DEFAULT_LOG_FORMAT.replace("%", "%%"),
    )),
)

class Serve(Subcommand):
    ''' Subcommand to launch the Bokeh server.

    '''

    name = "serve"

    help = "Run a Bokeh server hosting one or more applications"
    args = base_serve_args + (
        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='*',
            help="The app directories or scripts to serve (serve empty document if not specified)",
            default=None,
        )),

        ('--args', dict(
            metavar='COMMAND-LINE-ARGS',
            nargs=argparse.REMAINDER,
            help="Any command line arguments remaining are passed on to the application handler",
        )),

        ('--show', dict(
            action='store_true',
            help="Open server app(s) in a browser",
        )),

        ('--allow-websocket-origin', dict(
            metavar='HOST[:PORT]',
            action='append',
            type=str,
            help="Public hostnames which may connect to the Bokeh websocket",
        )),

        ('--host', dict(
            metavar='HOST[:PORT]',
            action='append',
            type=str,
            help="Public hostnames to allow in requests",
        )),

        ('--prefix', dict(
            metavar='PREFIX',
            type=str,
            help="URL prefix for Bokeh server URLs",
            default=None,
        )),

        ('--keep-alive', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to send a keep-alive ping to clients, 0 to disable.",
            default=None,
        )),

        ('--check-unused-sessions', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to check for unused sessions",
            default=None,
        )),

        ('--unused-session-lifetime', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How long unused sessions last",
            default=None,
        )),

        ('--stats-log-frequency', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to log stats",
            default=None,
        )),

        ('--use-xheaders', dict(
            action='store_true',
            help="Prefer X-headers for IP/protocol information",
        )),

        ('--session-ids', dict(
            metavar='MODE',
            action  = 'store',
            default = None,
            choices = SESSION_ID_MODES,
            help    = "One of: %s" % nice_join(SESSION_ID_MODES),
        )),

        ('--disable-index', dict(
            action = 'store_true',
            help    = 'Do not use the default index on the root path',
        )),

        ('--disable-index-redirect', dict(
            action = 'store_true',
            help    = 'Do not redirect to running app from root path',
        )),

        ('--num-procs', dict(
            metavar='N',
            action='store',
            help="Number of worker processes for an app. Default to one. Using "
                 "0 will autodetect number of cores",
            default=1,
            type=int,
        )),
    )


    def invoke(self, args):
        argvs = { f : args.args for f in args.files}
        applications = build_single_handler_applications(args.files, argvs)

        log_level = getattr(logging, args.log_level.upper())
        logging.basicConfig(level=log_level, format=args.log_format)

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

        if args.check_unused_sessions is not None:
            log.info("Check for unused sessions every %d milliseconds", args.check_unused_sessions)
            # rename to be compatible with Server
            args.check_unused_sessions_milliseconds = args.check_unused_sessions

        if args.unused_session_lifetime is not None:
            log.info("Unused sessions last for %d milliseconds", args.unused_session_lifetime)
            # rename to be compatible with Server
            args.unused_session_lifetime_milliseconds = args.unused_session_lifetime

        if args.stats_log_frequency is not None:
            log.info("Log statistics every %d milliseconds", args.stats_log_frequency)
            # rename to be compatible with Server
            args.stats_log_frequency_milliseconds = args.stats_log_frequency

        server_kwargs = { key: getattr(args, key) for key in ['port',
                                                              'address',
                                                              'allow_websocket_origin',
                                                              'host',
                                                              'num_procs',
                                                              'prefix',
                                                              'keep_alive_milliseconds',
                                                              'check_unused_sessions_milliseconds',
                                                              'unused_session_lifetime_milliseconds',
                                                              'stats_log_frequency_milliseconds',
                                                              'use_xheaders',
                                                            ]
                          if getattr(args, key, None) is not None }

        server_kwargs['sign_sessions'] = settings.sign_sessions()
        server_kwargs['secret_key'] = settings.secret_key_bytes()
        server_kwargs['generate_session_ids'] = True
        if args.session_ids is None:
            # no --session-ids means use the env vars
            pass
        elif args.session_ids == 'unsigned':
            server_kwargs['sign_sessions'] = False
        elif args.session_ids == 'signed':
            server_kwargs['sign_sessions'] = True
        elif args.session_ids == 'external-signed':
            server_kwargs['sign_sessions'] = True
            server_kwargs['generate_session_ids'] = False
        else:
            raise RuntimeError("argparse should have filtered out --session-ids mode " +
                               args.session_ids)

        if server_kwargs['sign_sessions'] and not server_kwargs['secret_key']:
            die("To sign sessions, the BOKEH_SECRET_KEY environment variable must be set; " +
                "the `bokeh secret` command can be used to generate a new key.")

        server_kwargs['use_index'] = not args.disable_index
        server_kwargs['redirect_root'] = not args.disable_index_redirect

        with report_server_init_errors(**server_kwargs):
            server = Server(applications, **server_kwargs)

            if args.show:
                # we have to defer opening in browser until we start up the server
                def show_callback():
                    for route in applications.keys():
                        server.show(route)
                server.io_loop.add_callback(show_callback)

            address_string = ''
            if server.address is not None and server.address != '':
                address_string = ' address ' + server.address

            log.info("Starting Bokeh server on port %d%s with applications at paths %r",
                     server.port,
                     address_string,
                     sorted(applications.keys()))

            log.info("Starting Bokeh server with process id: %d" % getpid())
            server.run_until_shutdown()
