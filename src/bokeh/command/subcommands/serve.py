#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Run Bokeh script and directory applications using a framework-free ASGI host.

Run ``bokeh serve app.py --show`` to open an application with Python callbacks.
Use ``--auth-policy auth:policy`` to load a framework-neutral AuthPolicy instance.
See :ref:`ug_server_cli` and :ref:`ug_server_deploy` for deployment options.
"""

from __future__ import annotations

# Standard library imports
import argparse
import logging
import os
import sys
from glob import glob
from ipaddress import ip_address
from pathlib import Path

from bokeh.application import Application
from bokeh.resources import DEFAULT_SERVER_PORT
from bokeh.server.asgi import BokehASGI
from bokeh.server.auth import load_auth_policy
from bokeh.server.core import (
    DEFAULT_SESSION_TOKEN_EXPIRATION,
    DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES,
)
from bokeh.server.host import serve
from bokeh.server.util import create_hosts_allowlist
from bokeh.settings import settings
from bokeh.util.logconfig import basicConfig
from bokeh.util.strings import nice_join

from ..subcommand import Argument, Subcommand
from ..util import build_single_handler_applications, die

log = logging.getLogger(__name__)
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
        help    = f"One of: {nice_join(LOGLEVELS)}",
    )),

    ('--log-format', Argument(
        metavar ='LOG-FORMAT',
        action  = 'store',
        default = DEFAULT_LOG_FORMAT,
        help    = f"A standard Python logging format string (default: {DEFAULT_LOG_FORMAT.replace('%', '%%')!r})",
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

__all__ = ('Serve',)


class Serve(Subcommand):
    """Launch one or more Bokeh applications without a web framework."""

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

        ('--show', Argument(
            action = 'store_true',
            help   = "Open server app(s) in a browser",
        )),

        ('--allow-websocket-origin', Argument(
            metavar = 'HOST[:PORT]',
            action  = 'append',
            type    = str,
            help    = "Public hostnames which may connect to the Bokeh websocket. "
                      "Include each public page origin when serving behind a proxy.",
        )),

        ('--prefix', Argument(
            metavar = 'PREFIX',
            type    = str,
            help    = "URL prefix for Bokeh server URLs",
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

        ('--auth-policy', Argument(
            metavar='MODULE:ATTRIBUTE',
            default=None,
            help='Import an AuthPolicy instance, e.g. auth:policy',
        )),

        ('--forwarded-allow-ips', Argument(
            default='127.0.0.1',
            help='Trusted proxy IPs or networks for --use-xheaders (default: 127.0.0.1)',
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
            help    = f"One of: {nice_join(SESSION_ID_MODES)}",
        )),

        ('--exclude-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to exclude from the session '
                      'context (authorization and raw cookie headers are never copied into tokens).',
        )),

        ('--exclude-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'Cookie names to exclude from session context. Supplying this list also '
                      'copies the remaining cookies into browser-visible session tokens.',
        )),

        ('--include-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to make available in the session '
                      'context (authorization and raw cookie headers are never copied into tokens).',
        )),

        ('--include-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'Cookie names to retain in session context and copy into browser-visible '
                      'tokens. By default context retains request cookies and tokens omit them.',
        )),

        ('--disable-index', Argument(
            action = 'store_true',
            help   = 'Do not use the default index on the root path',
        )),

        ('--disable-index-redirect', Argument(
            action = 'store_true',
            help   = 'Do not redirect to running app from root path',
        )),

        ('--session-token-expiration', Argument(
            metavar = 'N',
            action  = 'store',
            help    = "Duration in seconds that a new session token "
                      "is valid for session creation. After the expiry "
                      "time has elapsed, the token will not be able "
                      "create a new session (defaults to 300 seconds).",
            default = DEFAULT_SESSION_TOKEN_EXPIRATION,
            type    = int,
        )),

        ('--websocket-max-message-size', Argument(
            metavar = 'BYTES',
            action  = 'store',
            help    = "Maximum incoming WebSocket message size "
                      "(default: 20MB)",
            default = DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES,
            type    = int,
        )),

        ('--glob', Argument(
            action='store_true',
            help='Process all filename arguments as globs',
        )),
    )


    def invoke(self, args: argparse.Namespace) -> None:
        basicConfig(format=args.log_format, filename=args.log_file)
        if args.use_config is not None:
            settings.load_config(args.use_config)
        level = settings.py_log_level(args.log_level)
        logging.getLogger('bokeh').setLevel(logging.INFO if level is None else level)

        files = [path for pattern in args.files for path in (glob(pattern) if args.glob else [pattern])]
        if any(path.endswith('.ipynb') or (Path(path).is_dir() and
                not (Path(path) / 'main.py').exists() and (Path(path) / 'main.ipynb').exists()) for path in files):
            die("Notebook applications are no longer supported by bokeh serve; use a Python script or directory app.")
        applications = build_single_handler_applications(files, {path: args.args for path in files})
        if not applications:
            applications['/'] = Application()

        kwargs = {key: getattr(args, key) for key in (
            'prefix', 'include_headers', 'include_cookies', 'exclude_headers', 'exclude_cookies',
            'session_token_expiration',
        ) if getattr(args, key) is not None}
        for option in ('check_unused_sessions', 'unused_session_lifetime'):
            if (value := getattr(args, option)) is not None:
                kwargs[option + '_milliseconds'] = value
        kwargs['sign_sessions'] = settings.sign_sessions()
        kwargs['secret_key'] = settings.secret_key_bytes()
        kwargs['generate_session_ids'] = args.session_ids != 'external-signed'
        if args.session_ids is not None:
            kwargs['sign_sessions'] = args.session_ids != 'unsigned'
        if kwargs['sign_sessions'] and not kwargs['secret_key']:
            die("To sign sessions, set BOKEH_SECRET_KEY to a strong random secret.")
        if not args.allow_websocket_origin and args.address not in (None, "0.0.0.0", "::"):
            host = f"[{args.address}]" if ":" in args.address else args.address
            origins = [f"{host}:{args.port}"]
            try:
                loopback = ip_address(args.address).is_loopback
            except ValueError:
                loopback = False
            if loopback:
                origins.append(f"localhost:{args.port}")
            kwargs['extra_websocket_origins'] = origins
        else:
            kwargs['extra_websocket_origins'] = create_hosts_allowlist(args.allow_websocket_origin or [], args.port)
        kwargs['use_index'] = not args.disable_index
        kwargs['redirect_root'] = not args.disable_index_redirect
        if (policy_spec := settings.auth_policy(args.auth_policy)) is not None:
            # Console entry points do not put the working directory on sys.path.
            if os.getcwd() not in sys.path:
                sys.path.insert(0, os.getcwd())
            kwargs['auth_policy'] = load_auth_policy(policy_spec)
        retired = {'auth_module': 'BOKEH_AUTH_MODULE', 'cookie_secret': 'BOKEH_COOKIE_SECRET',
                   'xsrf_cookies': 'BOKEH_XSRF_COOKIES'}
        for key, environment_variable in retired.items():
            if environment_variable in os.environ or any(key in config for config in (
                    settings.config_system, settings.config_user, settings.config_override)):
                die(f"{key} is no longer supported. Use --auth-policy module:attribute for authentication.")

        certfile = settings.ssl_certfile(args.ssl_certfile)
        keyfile = settings.ssl_keyfile(args.ssl_keyfile)
        if args.unix_socket and (args.address is not None or args.port != DEFAULT_SERVER_PORT or certfile or keyfile):
            die("--address, --port and SSL options cannot be combined with --unix-socket")
        if args.unix_socket and args.show:
            die("--show requires a TCP listener")
        if args.keep_alive is not None and args.keep_alive < 0:
            die("--keep-alive must be >= 0")
        if args.websocket_max_message_size <= 0:
            die("--websocket-max-message-size must be positive")
        application = BokehASGI(applications, **kwargs)
        serve(application, address=args.address, port=args.port, unix_socket=args.unix_socket,
              show=args.show, ssl_certfile=certfile, ssl_keyfile=keyfile,
              ssl_keyfile_password=settings.ssl_password(), proxy_headers=args.use_xheaders,
              forwarded_allow_ips=args.forwarded_allow_ips,
              ws_max_size=args.websocket_max_message_size,
              ws_ping_interval=37 if args.keep_alive is None else (args.keep_alive / 1000 or None))
