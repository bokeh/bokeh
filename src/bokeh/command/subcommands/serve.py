#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
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

Another way to run multiple applications is using glob notation to indicate
that all the files matching a particular pattern should be served.

.. code-block:: sh

    bokeh serve *.py

Command line shells will normally expand the ``*.py`` automatically. However,
if you are starting a Bokeh server programmatically, then filename arguments
with globs may not be expanded by the shell. In situations like this, the
``--glob`` flag may be used to make the Bokeh server explicitly perform globbing:

.. code-block:: python

    subprocess.call(["bokeh", "serve", "--glob", "*.py"])

A .ico file may be configured with the ``--ico-path`` option, and the Bokeh
server will return the contents of this file for ``/favicon.ico``:

.. code-block:: sh

    bokeh serve app.py --ico-path=/assets/app.ico

Since browsers only look at the top-level root, only one .ico file may be
supplied, even if multiple apps are running. By default, a Bokeh project logo
is returned as the favicon.ico file.

Application Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh server can fork the underlying tornado server into multiprocess.  This is
useful when trying to handle multiple connections especially in the context of
apps which require high computational loads.  Default behavior is one process.
using 0 will auto-detect the number of cores and spin up corresponding number of
processes

.. code-block:: sh

    bokeh serve app_script.py --num-procs 2

Note that due to limitations inherent in Tornado, Windows does not support
``--num-procs`` values greater than one! In this case consider running multiple
Bokeh server instances behind a load balancer.

The Bokeh server can also add an optional prefix to all URL paths.
This can often be useful in conjunction with "reverse proxy" setups.

.. code-block:: sh

    bokeh serve app_script.py --prefix foobar

Then the application will be served under the following URL:

.. code-block:: none

    http://localhost:{DEFAULT_PORT}/foobar/app_script

If needed, Bokeh server can send keep-alive pings at a fixed interval.
To configure this feature, set the ``--keep-alive`` option:

.. code-block:: sh

    bokeh serve app_script.py --keep-alive 10000

The value is specified in milliseconds. The default keep-alive interval
is 37 seconds. Give a value of 0 to disable keep-alive pings.

Network Configuration
~~~~~~~~~~~~~~~~~~~~~

To control the port that the Bokeh server listens on, use the ``--port``
argument:

.. code-block:: sh

    bokeh serve app_script.py --port 8080

To listen on an arbitrary port, pass ``0`` as the port number.  The actual
port number will be logged at startup.

Similarly, a specific network address can be specified with the
``--address`` argument. For example:

.. code-block:: sh

    bokeh serve app_script.py --address 0.0.0.0

will have the Bokeh server listen all available network addresses.

By default, cross site connections to the Bokeh server websocket are not
allowed. You can enable websocket connections originating from additional
hosts by specifying them with the ``BOKEH_ALLOW_WS_ORIGIN`` environment variable
or the ``--allow-websocket-origin`` option:

.. code-block:: sh

    bokeh serve app_script.py --allow-websocket-origin foo.com:8081

It is possible to specify multiple allowed websocket origins by adding
the ``--allow-websocket-origin`` option multiple times and to provide a
comma separated list of hosts to ``BOKEH_ALLOW_WS_ORIGIN``

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

A Bokeh server can also terminate SSL connections directly by specifying the
path to a single file in PEM format containing the certificate as well as any
number of CA certificates needed to establish the certificate's authenticity:

.. code-block:: sh

    bokeh serve --ssl-certfile /path/to/cert.pem

Alternatively, the path may also be supplied by setting the environment
variable ``BOKEH_SSL_CERTFILE``.

If the private key is stored separately, its location may be supplied by
setting the ``--ssl-keyfile`` command line argument, or by setting the
``BOKEH_SSL_KEYFILE`` environment variable. If a password is required for the
private key, it should be supplied by setting the ``BOKEH_SSL_PASSWORD``
environment variable.

Session ID Options
~~~~~~~~~~~~~~~~~~

Typically, each browser tab connected to a Bokeh server will have its own
session ID. When the server generates an ID, it will make it cryptographically
unguessable. This keeps users from accessing one another's sessions.

To control who can use a Bokeh application, the server can sign session IDs
with a secret key and reject "made up" session names. There are three modes,
controlled by the ``--session-ids`` argument:

.. code-block:: sh

    bokeh serve app_script.py --session-ids signed

The available modes are: {SESSION_ID_MODES}

In ``unsigned`` mode, the server will accept any session ID provided to it in
the URL. For example, ``http://localhost/app_script?bokeh-session-id=foo`` will
create a session ``foo``. In ``unsigned`` mode, if the session ID isn't
provided with ``?bokeh-session-id=`` in the URL, the server will still generate
a cryptographically-unguessable ID. However, the server allows clients to
create guessable or deliberately-shared sessions if they want to.

``unsigned`` mode is most useful when the server is running locally for
development, for example you can have multiple processes access a fixed session
name such as ``default``. ``unsigned`` mode is also convenient because there's
no need to generate or configure a secret key.

In ``signed`` mode, the session ID must be in a special format and signed with
a secret key. Attempts to use the application with an invalid session ID will
fail, but if no ``?bokeh-session-id=`` parameter is provided, the server will
generate a fresh, signed session ID. The result of ``signed`` mode is that only
secure session IDs are allowed but anyone can connect to the server.

In ``external-signed`` mode, the session ID must be signed but the server
itself won't generate a session ID; the ``?bokeh-session-id=`` parameter will
be required. To use this mode, an external process (such as another web app)
would use the function ``bokeh.util.token.generate_session_id()`` to
create valid session IDs. The external process and the Bokeh server must share
the same ``BOKEH_SECRET_KEY`` environment variable.

``external-signed`` mode is useful if you want another process to authenticate
access to the Bokeh server. If someone is permitted to use a Bokeh application,
you would generate a session ID for them, then redirect them to the Bokeh
server with that valid session ID. If you don't generate a session ID for
someone, then they can't load the app from the Bokeh server.

In both ``signed`` and ``external-signed`` mode, the secret key must be kept
secret; anyone with the key can generate a valid session ID.

The secret key should be set in a ``BOKEH_SECRET_KEY`` environment variable and
should be a cryptographically random string with at least 256 bits (32 bytes)
of entropy. The ``bokeh secret`` command can generate new secret keys.

Authentication Options
~~~~~~~~~~~~~~~~~~~~~~

The Bokeh server can be configured to only allow connections in case there is
a properly authenticated user. This is accomplished by providing the path to
a module that implements the necessary functions on the command line:

.. code-block:: sh

    bokeh serve --auth-module=/path/to/auth.py

or by setting the ``BOKEH_AUTH_MODULE`` environment variable.

The module must contain *one* of the following two functions that will return
the current user (or None):

.. code-block:: python

    def get_user(request_handler):
        pass

    async def get_user_async(request_handler):
        pass

The function is passed the Tornado ``RequestHandler`` and can inspect cookies
or request headers to determine the authenticated user. If there is no valid
authenticated user, these functions should return None.

Additionally, the module must specify where to redirect unauthenticated users.
It must contain either:

* a module attribute ``login_url`` and (optionally) a ``LoginHandler`` class
* a function definition for ``get_login_url``

.. code-block:: python

    login_url = "..."

    class LoginHandler(RequestHandler):
        pass

    def get_login_url(request_handler):
        pass

When a relative ``login_url`` is given, an optional ``LoginHandler`` class may
also be provided, and it will be installed as a route on the Bokeh server
automatically.

The ``get_login_url`` function is useful in cases where the login URL must
vary based on the request, or cookies, etc. It is not possible to specify a
``LoginHandler`` when ``get_url_function`` is defined.

Analogous to the login options, optional ``logout_url`` and ``LogoutHandler``
values may be define an endpoint for logging users out.

If no auth module is provided, then a default user will be assumed, and no
authentication will be required to access Bokeh server endpoints.

.. warning::
    The contents of the auth module will be executed!

Bokeh can also enable the use of Tornado's XFRF cookie protection. To turn this
feature on, use the ``--enable-xsrf-cookies`` option, or set the environment
variable ``BOKEH_XSRF_COOKIES=yes``. If this setting is enabled, any PUT, POST,
or DELETE operations on custom or login handlers must be instrumented properly
in order to function. Typically, this means adding the ``xsrf_form_html()``
module to HTML form submissions templates. For full details, see:

    https://www.tornadoweb.org/en/stable/guide/security.html#cross-site-request-forgery-protection

Session Expiration Options
~~~~~~~~~~~~~~~~~~~~~~~~~~

To configure how often to check for unused sessions. set the
``--check-unused-sessions`` option:

.. code-block:: sh

    bokeh serve app_script.py --check-unused-sessions 10000

The value is specified in milliseconds. The default interval for checking for
unused sessions is 17 seconds. Only positive integer values are accepted.

To configure how often unused sessions last. set the
``--unused-session-lifetime`` option:

.. code-block:: sh

    bokeh serve app_script.py --unused-session-lifetime 60000

The value is specified in milliseconds. The default lifetime interval for
unused sessions is 15 seconds. Only positive integer values are accepted.

Diagnostic Options
~~~~~~~~~~~~~~~~~~

The logging level can be controlled by the ``--log-level`` argument:

.. code-block:: sh

    bokeh serve app_script.py --log-level debug

The available log levels are: {LOGLEVELS}

The log format can be controlled by the ``--log-format`` argument:

.. code-block:: sh

    bokeh serve app_script.py --log-format "%(levelname)s: %(message)s"

The default log format is ``"{DEFAULT_LOG_FORMAT}"``

To control how often statistic logs are written, set the
``--stats-log-frequency`` option:

.. code-block:: sh

    bokeh serve app_script.py --stats-log-frequency 30000

The value is specified in milliseconds. The default interval for
logging stats is 15 seconds. Only positive integer values are accepted.

Bokeh can also optionally log process memory usage. This feature requires
the optional ``psutil`` package to be installed. To enable memory logging
set the ``--mem-log-frequency`` option:

.. code-block:: sh

    bokeh serve app_script.py --mem-log-frequency 30000

The value is specified in milliseconds. The default interval for
logging stats is 0 (disabled). Only positive integer values are accepted.

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
import argparse
import os
from fnmatch import fnmatch
from glob import glob
from typing import TYPE_CHECKING, Any

# External imports
from tornado.autoreload import watch

# Bokeh imports
from bokeh.application import Application
from bokeh.resources import DEFAULT_SERVER_PORT
from bokeh.server.auth_provider import AuthModule, NullAuth
from bokeh.server.tornado import DEFAULT_SESSION_TOKEN_EXPIRATION, DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES
from bokeh.settings import settings
from bokeh.util.logconfig import basicConfig
from bokeh.util.strings import format_docstring, nice_join

# Bokeh imports
from ..subcommand import Argument, Subcommand
from ..util import build_single_handler_applications, die, report_server_init_errors

if TYPE_CHECKING:
    from bokeh.server.server import Server

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

LOGLEVELS = ('trace', 'debug', 'info', 'warning', 'error', 'critical')
SESSION_ID_MODES = ('unsigned', 'signed', 'external-signed')
DEFAULT_LOG_FORMAT = "%(asctime)s %(message)s"

base_serve_args = (
    ('--port', Argument(
        metavar = 'PORT',
        type    = int,
        help    = "Port to listen on",
        default = DEFAULT_SERVER_PORT,
    )),

    ('--address', Argument(
        metavar = 'ADDRESS',
        type    = str,
        help    = "Address to listen on",
        default = None,
    )),

    ('--unix-socket', Argument(
        metavar = 'UNIX-SOCKET',
        type    = str,
        help    = "Unix socket to bind. Network options such as port, address, ssl options are incompatible with unix socket",
        default = None,
    )),

    ('--log-level', Argument(
        metavar = 'LOG-LEVEL',
        action  = 'store',
        default = None,
        choices = (*LOGLEVELS, 'None'),
        help    = "One of: %s" % nice_join(LOGLEVELS),
    )),

    ('--log-format', Argument(
        metavar ='LOG-FORMAT',
        action  = 'store',
        default = DEFAULT_LOG_FORMAT,
        help    = "A standard Python logging format string (default: %r)" % DEFAULT_LOG_FORMAT.replace("%", "%%"),
    )),

    ('--log-file', Argument(
        metavar ='LOG-FILE',
        action  = 'store',
        default = None,
        help    = "A filename to write logs to, or None to write to the standard stream (default: None)",
    )),

    ('--use-config', Argument(
        metavar = 'CONFIG',
        type    = str,
        help    = "Use a YAML config file for settings",
        default = None,
    )),

)

__all__ = (
    'Serve',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Serve(Subcommand):
    ''' Subcommand to launch the Bokeh server.

    '''

    #: name for this subcommand
    name = "serve"

    help = "Run a Bokeh server hosting one or more applications"

    args = (
        *base_serve_args,

        ('files', Argument(
            metavar = 'DIRECTORY-OR-SCRIPT',
            nargs   = '*',
            help    = "The app directories or scripts to serve (serve empty document if not specified)",
            default = None,
        )),

        ('--args', Argument(
            metavar = 'COMMAND-LINE-ARGS',
            nargs   = "...",
            help    = "Command line arguments remaining to passed on to the application handler. "
                      "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g. "
                      "--show, must be placed before the directory or script. ",
        )),

        ('--dev', Argument(
            metavar ='FILES-TO-WATCH',
            action  ='store',
            default = None,
            type    = str,
            nargs   = '*',
            help    = "Enable live reloading during app development. "
                      "By default it watches all *.py *.html *.css *.yaml files "
                      "in the app directory tree. Additional files can be passed "
                      "as arguments. "
                      "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g "
                      "--show, must be placed before the directory or script. "
                      "NOTE: This setting only works with a single app. "
                      "It also restricts the number of processes to 1. "
                      "NOTE FOR WINDOWS USERS : this option must be invoked using "
                      "'python -m bokeh'. If not Tornado will fail to restart the "
                      "server",
        )),

        ('--show', Argument(
            action = 'store_true',
            help   = "Open server app(s) in a browser",
        )),

        ('--allow-websocket-origin', Argument(
            metavar = 'HOST[:PORT]',
            action  = 'append',
            type    = str,
            help    = "Public hostnames which may connect to the Bokeh websocket "
                      "With unix socket, the websocket origin restrictions should be enforced by the proxy.",
        )),

        ('--prefix', Argument(
            metavar = 'PREFIX',
            type    = str,
            help    = "URL prefix for Bokeh server URLs",
            default = None,
        )),

        ('--ico-path', Argument(
            metavar = "ICO_PATH",
            type    = str,
            help    = "Path to a .ico file to use as the favicon.ico, or 'none' to "
                      "disable favicon.ico support. If unset, a default Bokeh .ico "
                      "file will be used",
            default = None,
        )),

        ('--keep-alive', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to send a keep-alive ping to clients, 0 to disable.",
            default = None,
        )),

        ('--check-unused-sessions', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to check for unused sessions",
            default = None,
        )),

        ('--unused-session-lifetime', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How long unused sessions last",
            default = None,
        )),

        ('--stats-log-frequency', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to log stats",
            default = None,
        )),

        ('--mem-log-frequency', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to log memory usage information",
            default = None,
        )),

        ('--use-xheaders', Argument(
            action = 'store_true',
            help   = "Prefer X-headers for IP/protocol information",
        )),

        ('--ssl-certfile', Argument(
            metavar = 'CERTFILE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a certificate file for SSL termination',
        )),

        ('--ssl-keyfile', Argument(
            metavar = 'KEYFILE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a private key file for SSL termination',
        )),

        ('--session-ids', Argument(
            metavar = 'MODE',
            action  = 'store',
            default = None,
            choices = SESSION_ID_MODES,
            help    = "One of: %s" % nice_join(SESSION_ID_MODES),
        )),

        ('--auth-module', Argument(
            metavar = 'AUTH_MODULE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a Python module that implements auth hooks',
        )),

        ('--enable-xsrf-cookies', Argument(
            action  = 'store_true',
            default = False,
            help    = 'Whether to enable Tornado support for XSRF cookies. All '
                      'PUT, POST, or DELETE handlers must be properly instrumented '
                      'when this setting is enabled.',
        )),

        ('--exclude-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to exclude from the session '
                      'context (by default all headers are included).',
        )),

        ('--exclude-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request cookies to exclude from the session '
                      'context (by default all cookies are included).',
        )),

        ('--include-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to make available in the session '
                      'context (by default all headers are included).',
        )),

        ('--include-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request cookies to make available in the session '
                      'context (by default all cookies are included).',
        )),

        ('--cookie-secret', Argument(
            metavar = 'COOKIE_SECRET',
            action  = 'store',
            default = None,
            help    = 'Configure to enable getting/setting secure cookies',
        )),

        ('--index', Argument(
            metavar = 'INDEX',
            action  = 'store',
            default = None,
            help    = 'Path to a template to use for the site index',
        )),

        ('--disable-index', Argument(
            action = 'store_true',
            help   = 'Do not use the default index on the root path',
        )),

        ('--disable-index-redirect', Argument(
            action = 'store_true',
            help   = 'Do not redirect to running app from root path',
        )),

        ('--num-procs', Argument(
            metavar = 'N',
            action  = 'store',
            help    = "Number of worker processes for an app. Using "
                      "0 will autodetect number of cores (defaults to 1)",
            default = 1,
            type    = int,
        )),

        ('--session-token-expiration', Argument(
            metavar = 'N',
            action  = 'store',
            help    = "Duration in seconds that a new session token "
                      "is valid for session creation. After the expiry "
                      "time has elapsed, the token will not be able "
                      "create a new session (defaults to  seconds).",
            default = DEFAULT_SESSION_TOKEN_EXPIRATION,
            type    = int,
        )),

        ('--websocket-max-message-size', Argument(
            metavar = 'BYTES',
            action  = 'store',
            help    = "Set the Tornado websocket_max_message_size value "
                      "(default: 20MB)",
            default = DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES,
            type    = int,
        )),

        ('--websocket-compression-level', Argument(
            metavar = 'LEVEL',
            action  = 'store',
            help    = "Set the Tornado WebSocket compression_level",
            default = None,
            type    = int,
        )),

        ('--websocket-compression-mem-level', Argument(
            metavar = 'LEVEL',
            action  = 'store',
            help    = "Set the Tornado WebSocket compression mem_level",
            default = None,
            type    = int,
        )),

        ('--glob', Argument(
            action='store_true',
            help='Process all filename arguments as globs',
        )),
    )

    def customize_applications(self, args: argparse.Namespace, applications: dict[str, Any]) -> dict[str, Any]:
        '''Allows subclasses to customize ``applications``.

        Should modify and return a copy of the ``applications`` dictionary.
        '''
        return dict(applications)

    def customize_kwargs(self, args: argparse.Namespace, server_kwargs: dict[str, Any]) -> dict[str, Any]:
        '''Allows subclasses to customize ``server_kwargs``.

        Should modify and return a copy of the ``server_kwargs`` dictionary.
        '''
        return dict(server_kwargs)

    def customize_server(self, server: Server) -> Server:
        '''Allows subclasses to customize the ``server``.

        Should apply modifications to the server and wrap it or return the same instance.
        '''
        return server

    def invoke(self, args: argparse.Namespace) -> None:
        '''

        '''
        basicConfig(format=args.log_format, filename=args.log_file)

        # This is a bit of a fudge. We want the default log level for non-server
        # cases to be None, i.e. we don't set a log level. But for the server we
        # do want to set the log level to INFO if nothing else overrides that.
        log_level = settings.py_log_level(args.log_level)
        if log_level is None:
            log_level = logging.INFO
        logging.getLogger('bokeh').setLevel(log_level)

        if args.use_config is not None:
            log.info(f"Using override config file: {args.use_config}")
            settings.load_config(args.use_config)

        # protect this import inside a function so that "bokeh info" can work
        # even if Tornado is not installed
        from bokeh.server.server import Server

        files: list[str] = []
        for f in args.files:
            if args.glob:
                files.extend(glob(f))
            else:
                files.append(f)

        argvs = {f: args.args for f in files}
        applications = build_single_handler_applications(files, argvs)

        if len(applications) == 0:
            # create an empty application by default
            applications['/'] = Application()

        # rename args to be compatible with Server
        if args.keep_alive is not None:
            args.keep_alive_milliseconds = args.keep_alive

        if args.check_unused_sessions is not None:
            args.check_unused_sessions_milliseconds = args.check_unused_sessions

        if args.unused_session_lifetime is not None:
            args.unused_session_lifetime_milliseconds = args.unused_session_lifetime

        if args.stats_log_frequency is not None:
            args.stats_log_frequency_milliseconds = args.stats_log_frequency

        if args.mem_log_frequency is not None:
            args.mem_log_frequency_milliseconds = args.mem_log_frequency

        server_kwargs = { key: getattr(args, key) for key in ['port',
                                                              'address',
                                                              'unix_socket',
                                                              'allow_websocket_origin',
                                                              'num_procs',
                                                              'prefix',
                                                              'index',
                                                              'keep_alive_milliseconds',
                                                              'check_unused_sessions_milliseconds',
                                                              'unused_session_lifetime_milliseconds',
                                                              'stats_log_frequency_milliseconds',
                                                              'mem_log_frequency_milliseconds',
                                                              'use_xheaders',
                                                              'websocket_max_message_size',
                                                              'websocket_compression_level',
                                                              'websocket_compression_mem_level',
                                                              'include_cookies',
                                                              'include_headers',
                                                              'exclude_cookies',
                                                              'exclude_headers',
                                                              'session_token_expiration',
                                                            ]
                          if getattr(args, key, None) is not None }

        server_kwargs['sign_sessions'] = settings.sign_sessions()
        server_kwargs['secret_key'] = settings.secret_key_bytes()
        server_kwargs['ssl_certfile'] = settings.ssl_certfile(getattr(args, 'ssl_certfile', None))
        server_kwargs['ssl_keyfile'] = settings.ssl_keyfile(getattr(args, 'ssl_keyfile', None))
        server_kwargs['ssl_password'] = settings.ssl_password()
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

        if 'unix_socket' in server_kwargs:
            if server_kwargs['port'] != DEFAULT_SERVER_PORT:
                die("--port arg is not supported with a unix socket")
            invalid_args = ['address', 'ssl_certfile', 'ssl_keyfile']

            if any(server_kwargs.get(x) for x in invalid_args):
                die(f"{[*invalid_args, 'port']} args are not supported with a unix socket")

        auth_module_path = settings.auth_module(getattr(args, 'auth_module', None))
        if auth_module_path:
            server_kwargs['auth_provider'] = AuthModule(auth_module_path)
        else:
            server_kwargs['auth_provider'] = NullAuth()

        server_kwargs['xsrf_cookies'] = settings.xsrf_cookies(getattr(args, 'enable_xsrf_cookies', False))
        server_kwargs['cookie_secret'] = settings.cookie_secret(getattr(args, 'cookie_secret', None))
        server_kwargs['use_index'] = not args.disable_index
        server_kwargs['redirect_root'] = not args.disable_index_redirect
        server_kwargs['autoreload'] = args.dev is not None
        server_kwargs['ico_path'] = settings.ico_path(getattr(args, 'ico_path', None))

        def find_autoreload_targets(app_path: str) -> None:
            path = os.path.abspath(app_path)
            if not os.path.isdir(path):
                return

            for path, _, files in os.walk(path):
                for name in files:
                    if (fnmatch(name, '*.html') or
                        fnmatch(name, '*.css') or
                        fnmatch(name, '*.yaml')):
                        log.info("Watching: " + os.path.join(path, name))
                        watch(os.path.join(path, name))

        def add_optional_autoreload_files(file_list: list[str]) -> None:
            for filen in file_list:
                if os.path.isdir(filen):
                    log.warning("Cannot watch directory " + filen)
                    continue
                log.info("Watching: " + filen)
                watch(filen)

        if server_kwargs['autoreload']:
            if len(applications.keys()) != 1:
                die("--dev can only support a single app.")
            if server_kwargs['num_procs'] != 1:
                log.info("Running in --dev mode. --num-procs is limited to 1.")
                server_kwargs['num_procs'] = 1

            find_autoreload_targets(args.files[0])
            add_optional_autoreload_files(args.dev)

        applications = self.customize_applications(args, applications)
        server_kwargs = self.customize_kwargs(args, server_kwargs)

        with report_server_init_errors(**server_kwargs):
            server = Server(applications, **server_kwargs)

            if args.show:

                # we have to defer opening in browser until we start up the server
                def show_callback() -> None:
                    for route in applications.keys():
                        server.show(route)

                server.io_loop.add_callback(show_callback)

            # Server may not have a port when bound to a unix socket
            if server.port:
                address_string = 'localhost'
                if server.address is not None and server.address != '':
                    address_string = server.address

                if server_kwargs['ssl_certfile'] and (server_kwargs['ssl_certfile'].endswith('.pem') or server_kwargs['ssl_keyfile']):
                    protocol = 'https'
                else:
                    protocol = 'http'

                for route in sorted(applications.keys()):
                    url = f"{protocol}://{address_string}:{server.port}{server.prefix}{route}"
                    log.info("Bokeh app running at: %s" % url)

                log.info("Starting Bokeh server with process id: %d" % os.getpid())

            server = self.customize_server(server)

            server.run_until_shutdown()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

__doc__ = format_docstring(__doc__,
    DEFAULT_PORT=DEFAULT_SERVER_PORT,
    LOGLEVELS=nice_join(LOGLEVELS),
    SESSION_ID_MODES=nice_join(SESSION_ID_MODES),
    DEFAULT_LOG_FORMAT=DEFAULT_LOG_FORMAT,
)
