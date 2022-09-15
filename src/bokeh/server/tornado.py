#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides the Bokeh Server Tornado application.

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
import gc
import os
from pprint import pformat
from types import ModuleType
from typing import (
    TYPE_CHECKING,
    Any,
    Mapping,
    Sequence,
    Type,
)
from urllib.parse import urljoin

# External imports
from tornado.ioloop import PeriodicCallback
from tornado.web import Application as TornadoApplication, StaticFileHandler

if TYPE_CHECKING:
    from tornado.ioloop import IOLoop

# Bokeh imports
from ..application import Application
from ..document import Document
from ..model import Model
from ..resources import Resources
from ..settings import settings
from ..util.dependencies import import_optional
from ..util.strings import format_docstring
from ..util.tornado import fixup_windows_event_loop_policy
from .auth_provider import NullAuth
from .connection import ServerConnection
from .contexts import ApplicationContext
from .session import ServerSession
from .urls import per_app_patterns, toplevel_patterns
from .views.ico_handler import IcoHandler
from .views.root_handler import RootHandler
from .views.static_handler import StaticHandler
from .views.ws import WSHandler

if TYPE_CHECKING:
    from ..application.handlers.function import ModifyDoc
    from ..core.types import ID
    from ..protocol import Protocol
    from .auth_provider import AuthProvider
    from .urls import RouteContext, URLRoutes

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_CHECK_UNUSED_MS                  = 17000
DEFAULT_KEEP_ALIVE_MS                    = 37000  # heroku, nginx default to 60s timeout, so use less than that
DEFAULT_MEM_LOG_FREQ_MS                  = 0
DEFAULT_STATS_LOG_FREQ_MS                = 15000
DEFAULT_UNUSED_LIFETIME_MS               = 15000
DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES = 20*1024*1024
DEFAULT_SESSION_TOKEN_EXPIRATION         = 300

__all__ = (
    'BokehTornado',
)

psutil = import_optional("psutil")

GB = 2**20
PID = os.getpid()
if psutil:
    PROC = psutil.Process(PID)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BokehTornado(TornadoApplication):
    ''' A Tornado Application used to implement the Bokeh Server.

    Args:
        applications (dict[str,Application] or Application) :
            A map from paths to ``Application`` instances.

            If the value is a single Application, then the following mapping
            is generated:

            .. code-block:: python

                applications = {{ '/' : applications }}

            When a connection comes in to a given path, the associate
            Application is used to generate a new document for the session.

        prefix (str, optional) :
            A URL prefix to use for all Bokeh server paths. (default: None)

        ico_path (str, optional) :
            A path to a .ico file to return for ``/favicon.ico``.

        extra_websocket_origins (list[str], optional) :
            A list of hosts that can connect to the websocket.

            This is typically required when embedding a Bokeh server app in an
            external web site using :func:`~bokeh.embed.server_document` or
            similar.

            If None, ``["localhost"]`` will be assumed (default: None)

        extra_patterns (seq[tuple], optional) :
            A list of tuples of (str, http or websocket handler)

            Use this argument to add additional endpoints to custom deployments
            of the Bokeh Server.

            If None, then ``[]`` will be used. (default: None)

        secret_key (str, optional) :
            A secret key for signing session IDs.

            Defaults to the current value of the environment variable
            ``BOKEH_SECRET_KEY``

        sign_sessions (bool, optional) :
            Whether to cryptographically sign session IDs

            Defaults to the current value of the environment variable
            ``BOKEH_SIGN_SESSIONS``. If ``True``, then ``secret_key`` must
            also be provided (either via environment setting or passed as
            a parameter value)

        generate_session_ids (bool, optional) :
            Whether to generate a session ID if one is not provided
            (default: True)

        keep_alive_milliseconds (int, optional) :
            Number of milliseconds between keep-alive pings
            (default: {DEFAULT_KEEP_ALIVE_MS})

            Pings normally required to keep the websocket open. Set to 0 to
            disable pings.

        check_unused_sessions_milliseconds (int, optional) :
            Number of milliseconds between checking for unused sessions
            (default: {DEFAULT_CHECK_UNUSED_MS})

        unused_session_lifetime_milliseconds (int, optional) :
            Number of milliseconds for unused session lifetime
            (default: {DEFAULT_UNUSED_LIFETIME_MS})

        stats_log_frequency_milliseconds (int, optional) :
            Number of milliseconds between logging stats
            (default: {DEFAULT_STATS_LOG_FREQ_MS})

        mem_log_frequency_milliseconds (int, optional) :
            Number of milliseconds between logging memory information
            (default: {DEFAULT_MEM_LOG_FREQ_MS})

            Enabling this feature requires the optional dependency ``psutil`` to be
            installed.

        use_index (bool, optional) :
            Whether to generate an index of running apps in the ``RootHandler``
            (default: True)

        index (str, optional) :
            Path to a Jinja2 template to serve as the index for "/" if use_index
            is True. If None, the basic built in app index template is used.
            (default: None)

        redirect_root (bool, optional) :
            When there is only a single running application, whether to
            redirect requests to ``"/"`` to that application automatically
            (default: True)

            If there are multiple Bokeh applications configured, this option
            has no effect.

        websocket_max_message_size_bytes (int, optional):
            Set the Tornado ``websocket_max_message_size`` value.
            (default: {DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES})

        websocket_compression_level (int, optional):
            Set the Tornado WebSocket ``compression_level`` documented in
            https://docs.python.org/3.7/library/zlib.html#zlib.compressobj.

        websocket_compression_mem_level (int, optional):
            Set the Tornado WebSocket compression ``mem_level`` documented in
            https://docs.python.org/3.7/library/zlib.html#zlib.compressobj.

        index (str, optional):
            Path to a Jinja2 template to use for the root URL

        auth_provider (AuthProvider, optional):
            An AuthProvider instance

        include_headers (list, optional) :
            List of request headers to include in session context
            (by default all headers are included)

        exclude_headers (list, optional) :
            List of request headers to exclude in session context
            (by default all headers are included)

        include_cookies (list, optional) :
            List of cookies to include in session context
            (by default all cookies are included)

        exclude_cookies (list, optional) :
            List of cookies to exclude in session context
            (by default all cookies are included)

        session_token_expiration (int, optional) :
            Duration in seconds that a new session token is valid
            for session creation. After the expiry time has elapsed,
            the token will not be able create a new session
            (default: {DEFAULT_SESSION_TOKEN_EXPIRATION})

    Any additional keyword arguments are passed to ``tornado.web.Application``.

    .. autoclasstoc::

    '''

    _loop: IOLoop
    _applications: Mapping[str, ApplicationContext]
    _prefix: str
    _websocket_origins: set[str]
    auth_provider: AuthProvider

    _clients: set[ServerConnection]

    _mem_job: PeriodicCallback | None
    _ping_job: PeriodicCallback | None

    def __init__(self,
                 applications: Mapping[str, Application | ModifyDoc] | Application | ModifyDoc,
                 prefix: str | None = None,
                 extra_websocket_origins: Sequence[str] | None = None,
                 extra_patterns: URLRoutes | None = None,
                 secret_key: bytes | None = settings.secret_key_bytes(),
                 sign_sessions: bool = settings.sign_sessions(),
                 generate_session_ids: bool = True,
                 keep_alive_milliseconds: int = DEFAULT_KEEP_ALIVE_MS,
                 check_unused_sessions_milliseconds: int = DEFAULT_CHECK_UNUSED_MS,
                 unused_session_lifetime_milliseconds: int = DEFAULT_UNUSED_LIFETIME_MS,
                 stats_log_frequency_milliseconds: int = DEFAULT_STATS_LOG_FREQ_MS,
                 mem_log_frequency_milliseconds: int = DEFAULT_MEM_LOG_FREQ_MS,
                 use_index: bool = True,
                 redirect_root: bool = True,
                 websocket_max_message_size_bytes: int = DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES,
                 websocket_compression_level: int | None = None,
                 websocket_compression_mem_level: int | None = None,
                 ico_path: str = settings.ico_path(),
                 index: str | None = None,
                 auth_provider: AuthProvider = NullAuth(),
                 xsrf_cookies: bool = False,
                 include_headers: list[str] | None = None,
                 include_cookies: list[str] | None = None,
                 exclude_headers: list[str] | None = None,
                 exclude_cookies: list[str] | None = None,
                 session_token_expiration: int = DEFAULT_SESSION_TOKEN_EXPIRATION,
                 **kwargs: Any):

        from bokeh.application.handlers.document_lifecycle import DocumentLifecycleHandler
        from bokeh.application.handlers.function import FunctionHandler

        if callable(applications):
            applications = Application(FunctionHandler(applications))

        if isinstance(applications, Application):
            applications = {'/' : applications}
        else:
            applications = dict(applications)

        for url, app in list(applications.items()):
            if callable(app):
                applications[url] = app = Application(FunctionHandler(app))
            if all(not isinstance(handler, DocumentLifecycleHandler) for handler in app._handlers):
                app.add(DocumentLifecycleHandler())

        if prefix is None:
            prefix = ""
        prefix = prefix.strip("/")
        if prefix:
            prefix = "/" + prefix

        self._prefix = prefix

        self._index = index

        if keep_alive_milliseconds < 0:
            # 0 means "disable"
            raise ValueError("keep_alive_milliseconds must be >= 0")
        else:
            if keep_alive_milliseconds == 0:
                log.info("Keep-alive ping disabled")
            elif keep_alive_milliseconds != DEFAULT_KEEP_ALIVE_MS:
                log.info("Keep-alive ping configured every %d milliseconds", keep_alive_milliseconds)
        self._keep_alive_milliseconds = keep_alive_milliseconds

        if check_unused_sessions_milliseconds <= 0:
            raise ValueError("check_unused_sessions_milliseconds must be > 0")
        elif check_unused_sessions_milliseconds != DEFAULT_CHECK_UNUSED_MS:
            log.info("Check for unused sessions every %d milliseconds", check_unused_sessions_milliseconds)
        self._check_unused_sessions_milliseconds = check_unused_sessions_milliseconds

        if unused_session_lifetime_milliseconds <= 0:
            raise ValueError("unused_session_lifetime_milliseconds must be > 0")
        elif unused_session_lifetime_milliseconds != DEFAULT_UNUSED_LIFETIME_MS:
            log.info("Unused sessions last for %d milliseconds", unused_session_lifetime_milliseconds)
        self._unused_session_lifetime_milliseconds = unused_session_lifetime_milliseconds

        if stats_log_frequency_milliseconds <= 0:
            raise ValueError("stats_log_frequency_milliseconds must be > 0")
        elif stats_log_frequency_milliseconds != DEFAULT_STATS_LOG_FREQ_MS:
            log.info("Log statistics every %d milliseconds", stats_log_frequency_milliseconds)
        self._stats_log_frequency_milliseconds = stats_log_frequency_milliseconds

        if mem_log_frequency_milliseconds < 0:
            # 0 means "disable"
            raise ValueError("mem_log_frequency_milliseconds must be >= 0")
        elif mem_log_frequency_milliseconds > 0:
            if psutil is None:
                log.warning("Memory logging requested, but is disabled. Optional dependency 'psutil' is missing. "
                         "Try 'pip install psutil' or 'conda install psutil'")
                mem_log_frequency_milliseconds = 0
            elif mem_log_frequency_milliseconds != DEFAULT_MEM_LOG_FREQ_MS:
                log.info("Log memory usage every %d milliseconds", mem_log_frequency_milliseconds)
        self._mem_log_frequency_milliseconds = mem_log_frequency_milliseconds

        if websocket_max_message_size_bytes <= 0:
            raise ValueError("websocket_max_message_size_bytes must be positive")
        elif websocket_max_message_size_bytes != DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES:
            log.info("Torndado websocket_max_message_size set to %d bytes (%0.2f MB)",
                     websocket_max_message_size_bytes,
                     websocket_max_message_size_bytes/1024.0**2)

        self.auth_provider = auth_provider

        if self.auth_provider.get_user or self.auth_provider.get_user_async:
            log.info("User authentication hooks provided (no default user)")
        else:
            log.info("User authentication hooks NOT provided (default user enabled)")

        kwargs['xsrf_cookies'] = xsrf_cookies
        if xsrf_cookies:
            log.info("XSRF cookie protection enabled")

        if session_token_expiration <= 0:
            raise ValueError("session_token_expiration must be > 0")
        else:
            self._session_token_expiration = session_token_expiration

        if exclude_cookies and include_cookies:
            raise ValueError("Declare either an include or an exclude list for the cookies, not both.")
        self._exclude_cookies = exclude_cookies
        self._include_cookies = include_cookies

        if exclude_headers and include_headers:
            raise ValueError("Declare either an include or an exclude list for the headers, not both.")
        self._exclude_headers = exclude_headers
        self._include_headers = include_headers

        if extra_websocket_origins is None:
            self._websocket_origins = set()
        else:
            self._websocket_origins = set(extra_websocket_origins)
        self._secret_key = secret_key
        self._sign_sessions = sign_sessions
        self._generate_session_ids = generate_session_ids
        log.debug(f"These host origins can connect to the websocket: {list(self._websocket_origins)!r}")

        # Wrap applications in ApplicationContext
        self._applications = {}
        for url, app in applications.items():
            assert isinstance(app, Application) # TODO: unnecessary; improve type flow to remove this
            self._applications[url] = ApplicationContext(app, url=url, logout_url=self.auth_provider.logout_url)

        extra_patterns = extra_patterns or []
        extra_patterns.extend(self.auth_provider.endpoints)

        if ico_path == "none":
            self._icon = None
        else:
            with open(ico_path, 'rb') as f:
                self._icon = f.read()
        all_patterns: URLRoutes = [(r'/favicon.ico', IcoHandler, dict(app=self))]

        for key, ctx in self._applications.items():
            app_patterns: URLRoutes = []
            for p in per_app_patterns:
                if key == "/":
                    route = p[0]
                else:
                    route = key + p[0]
                context: RouteContext = {"application_context": self._applications[key]}
                if issubclass(p[1], WSHandler):
                    context['compression_level'] = websocket_compression_level
                    context['mem_level'] = websocket_compression_mem_level
                route = self._prefix + route
                app_patterns.append((route, p[1], context))

            websocket_path = None
            for r in app_patterns:
                if r[0].endswith("/ws"):
                    websocket_path = r[0]
            if not websocket_path:
                raise RuntimeError("Couldn't find websocket path")
            for r in app_patterns:
                assert len(r) == 3 # TODO: handle two valued case as well
                r[2]["bokeh_websocket_path"] = websocket_path # type: ignore[misc] # TODO: possible bug in mypy; pyright supports the assertion

            all_patterns.extend(app_patterns)

            # if the app requests a custom static path, use that, otherwise add Bokeh's standard static handler
            all_patterns.append(create_static_handler(self._prefix, key, ctx.application))

        for p in extra_patterns + toplevel_patterns:
            if p[1] == RootHandler:
                if use_index:
                    data = {
                        "applications": self._applications,
                        "prefix": self._prefix,
                        "index": self._index,
                        "use_redirect": redirect_root,
                    }
                    prefixed_pat = (self._prefix + p[0],) + p[1:] + (data,)
                    all_patterns.append(prefixed_pat) # type: ignore[arg-type] # TODO: easy to fix types, but also easy to break logic
            else:
                prefixed_pat = (self._prefix + p[0],) + p[1:]
                all_patterns.append(prefixed_pat) # type: ignore[arg-type] # TODO: easy to fix types, but also easy to break logic

        log.debug("Patterns are:")
        for line in pformat(all_patterns, width=60).split("\n"):
            log.debug("  " + line)

        super().__init__(all_patterns, # type: ignore[arg-type] # TODO: this may be another bug in mypy (not sure; but looks suspicious)
            websocket_max_message_size=websocket_max_message_size_bytes,
            **kwargs)

    def initialize(self, io_loop: IOLoop) -> None:
        ''' Start a Bokeh Server Tornado Application on a given Tornado IOLoop.

        '''
        self._loop = io_loop

        for app_context in self._applications.values():
            app_context._loop = self._loop

        self._clients = set()

        self._stats_job = PeriodicCallback(self._log_stats,
                                           self._stats_log_frequency_milliseconds)

        if self._mem_log_frequency_milliseconds > 0:
            self._mem_job = PeriodicCallback(self._log_mem,
                                             self._mem_log_frequency_milliseconds)
        else:
            self._mem_job = None

        self._cleanup_job = PeriodicCallback(self._cleanup_sessions,
                                             self._check_unused_sessions_milliseconds)

        if self._keep_alive_milliseconds > 0:
            self._ping_job = PeriodicCallback(self._keep_alive,
                                              self._keep_alive_milliseconds)
        else:
            self._ping_job = None

    @property
    def applications(self) -> Mapping[str, ApplicationContext]:
        ''' The configured applications

        '''
        return self._applications

    @property
    def app_paths(self) -> set[str]:
        ''' A list of all application paths for all Bokeh applications
        configured on this Bokeh server instance.

        '''
        return set(self._applications)

    @property
    def index(self) -> str | None:
        ''' Path to a Jinja2 template to serve as the index "/"

        '''
        return self._index

    @property
    def icon(self) -> bytes | None:
        ''' Favicon.ico file data, or None

        '''
        return self._icon

    @property
    def io_loop(self) -> IOLoop:
        ''' The Tornado IOLoop that this  Bokeh Server Tornado Application
        is running on.

        '''
        return self._loop

    @property
    def prefix(self) -> str:
        ''' A URL prefix for this Bokeh Server Tornado Application to use
        for all paths

        '''
        return self._prefix

    @property
    def websocket_origins(self) -> set[str]:
        ''' A list of websocket origins permitted to connect to this server.

        '''
        return self._websocket_origins

    @property
    def secret_key(self) -> bytes | None:
        ''' A secret key for this Bokeh Server Tornado Application to use when
        signing session IDs, if configured.

        '''
        return self._secret_key

    @property
    def include_cookies(self) -> list[str] | None:
        ''' A list of request cookies to make available in the session
        context.

        '''
        return self._include_cookies

    @property
    def include_headers(self) -> list[str] | None:
        ''' A list of request headers to make available in the session
        context.

        '''
        return self._include_headers

    @property
    def exclude_cookies(self) -> list[str] | None:
        ''' A list of request cookies to exclude in the session context.

        '''
        return self._exclude_cookies

    @property
    def exclude_headers(self) -> list[str] | None:
        ''' A list of request headers to exclude in the session context.

        '''
        return self._exclude_headers

    @property
    def sign_sessions(self) -> bool:
        ''' Whether this Bokeh Server Tornado Application has been configured
        to cryptographically sign session IDs

        If ``True``, then ``secret_key`` must also have been configured.
        '''
        return self._sign_sessions

    @property
    def generate_session_ids(self) -> bool:
        ''' Whether this Bokeh Server Tornado Application has been configured
        to automatically generate session IDs.

        '''
        return self._generate_session_ids

    @property
    def session_token_expiration(self) -> int:
        ''' Duration in seconds that a new session token is valid for
        session creation.

        After the expiry time has elapsed, the token will not be able
        create a new session.
        '''
        return self._session_token_expiration

    def resources(self, absolute_url: str | None = None) -> Resources:
        ''' Provide a :class:`~bokeh.resources.Resources` that specifies where
        Bokeh application sessions should load BokehJS resources from.

        Args:
            absolute_url (bool):
                An absolute URL prefix to use for locating resources. If None,
                relative URLs are used (default: None)

        '''
        mode = settings.resources(default="server")
        if mode == "server":
            root_url = urljoin(absolute_url, self._prefix) if absolute_url else self._prefix
            return Resources(mode="server", root_url=root_url, path_versioner=StaticHandler.append_version)
        return Resources(mode=mode)

    def start(self) -> None:
        ''' Start the Bokeh Server application.

        Starting the Bokeh Server Tornado application will run periodic
        callbacks for stats logging, cleanup, pinging, etc. Additionally, any
        startup hooks defined by the configured Bokeh applications will be run.

        '''
        self._stats_job.start()
        if self._mem_job is not None:
            self._mem_job.start()
        self._cleanup_job.start()
        if self._ping_job is not None:
            self._ping_job.start()

        for context in self._applications.values():
            self._loop.add_callback(context.run_load_hook)

    def stop(self, wait: bool = True) -> None:
        ''' Stop the Bokeh Server application.

        Args:
            wait (bool): whether to wait for orderly cleanup (default: True)

        Returns:
            None

        '''

        # TODO should probably close all connections and shut down all sessions here
        for context in self._applications.values():
            context.run_unload_hook()

        self._stats_job.stop()
        if self._mem_job is not None:
            self._mem_job.stop()
        self._cleanup_job.stop()
        if self._ping_job is not None:
            self._ping_job.stop()

        self._clients.clear()

    def new_connection(self, protocol: Protocol, socket: WSHandler,
            application_context: ApplicationContext, session: ServerSession) -> ServerConnection:
        connection = ServerConnection(protocol, socket, application_context, session)
        self._clients.add(connection)
        return connection

    def client_lost(self, connection: ServerConnection) -> None:
        self._clients.discard(connection)
        connection.detach_session()

    def get_session(self, app_path: str, session_id: ID) -> ServerSession:
        ''' Get an active a session by name application path and session ID.

        Args:
            app_path (str) :
                The configured application path for the application to return
                a session for.

            session_id (str) :
                The session ID of the session to retrieve.

        Returns:
            ServerSession

        '''
        if app_path not in self._applications:
            raise ValueError("Application %s does not exist on this server" % app_path)
        return self._applications[app_path].get_session(session_id)

    def get_sessions(self, app_path: str) -> list[ServerSession]:
        ''' Gets all currently active sessions for an application.

        Args:
            app_path (str) :
                The configured application path for the application to return
                sessions for.

        Returns:
            list[ServerSession]

        '''
        if app_path not in self._applications:
            raise ValueError("Application %s does not exist on this server" % app_path)
        return list(self._applications[app_path].sessions)

    # Periodic Callbacks ------------------------------------------------------

    async def _cleanup_sessions(self) -> None:
        log.trace("Running session cleanup job") # type: ignore[attr-defined]
        for app in self._applications.values():
            await app._cleanup_sessions(self._unused_session_lifetime_milliseconds)
        return None

    def _log_stats(self) -> None:
        log.trace("Running stats log job") # type: ignore[attr-defined]

        if log.getEffectiveLevel() > logging.DEBUG:
            # avoid the work below if we aren't going to log anything
            return

        log.debug("[pid %d] %d clients connected", PID, len(self._clients))
        for app_path, app in self._applications.items():
            sessions = list(app.sessions)
            unused_count = 0
            for s in sessions:
                if s.connection_count == 0:
                    unused_count += 1
            log.debug("[pid %d]   %s has %d sessions with %d unused",
                      PID, app_path, len(sessions), unused_count)

    def _log_mem(self) -> None:
        # we should be able to assume PROC is define, if psutil is not installed
        # then the _log_mem callback is not started at all
        mem = PROC.memory_info()
        log.info("[pid %d] Memory usage: %0.2f MB (RSS), %0.2f MB (VMS)", PID, mem.rss/GB, mem.vms/GB)
        del mem

        # skip the rest if we would not log it anyway
        if log.getEffectiveLevel() > logging.DEBUG:
            return

        #from collections import Counter
        # pprint.pprint(Counter([str(type(x)) for x in gc.get_objects() if "DataFrame" in str(type(x))]).most_common(30))

        all_objs = gc.get_objects()

        for name, typ in [('Documents', Document), ('Sessions', ServerSession), ('Models', Model)]:
            objs = [x for x in all_objs if isinstance(x, typ)]
            log.debug(f"  uncollected {name}: {len(objs)}")

            # uncomment for potentially voluminous referrers output
            # if name == 'Models' and len(objs):
            #     import pprint
            #     for i in range(10):
            #         print(i, objs[i], gc.get_referents(objs[i]))

        objs = [x for x in gc.get_objects() if isinstance(x, ModuleType) and "bokeh_app_" in str(x)]
        log.debug(f"  uncollected modules: {len(objs)}")

        import pandas as pd
        objs = [x for x in all_objs if isinstance(x, pd.DataFrame)]
        log.debug("  uncollected DataFrames: %d", len(objs))

        # uncomment (and install pympler) for mem usage by type report
        # from operator import itemgetter
        # import pprint
        # from pympler import tracker
        # mem = tracker.SummaryTracker()
        # pprint.pprint(sorted(mem.create_summary(), reverse=True, key=itemgetter(2))[:30])

    def _keep_alive(self) -> None:
        log.trace("Running keep alive job") # type: ignore[attr-defined]
        for c in self._clients:
            c.send_ping()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def create_static_handler(prefix: str, key: str, app: Application) -> tuple[str, Type[StaticFileHandler | StaticHandler], dict[str, Any]]:
    route = prefix
    route += "/static/(.*)" if key == "/" else key + "/static/(.*)"
    if app.static_path is not None:
        return (route, StaticFileHandler, {"path" : app.static_path})
    return (route, StaticHandler, {})

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

BokehTornado.__doc__ = format_docstring(
    BokehTornado.__doc__,
    DEFAULT_CHECK_UNUSED_MS=DEFAULT_CHECK_UNUSED_MS,
    DEFAULT_KEEP_ALIVE_MS=DEFAULT_KEEP_ALIVE_MS,
    DEFAULT_MEM_LOG_FREQ_MS=DEFAULT_MEM_LOG_FREQ_MS,
    DEFAULT_STATS_LOG_FREQ_MS=DEFAULT_STATS_LOG_FREQ_MS,
    DEFAULT_UNUSED_LIFETIME_MS=DEFAULT_UNUSED_LIFETIME_MS,
    DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES=DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES,
    DEFAULT_SESSION_TOKEN_EXPIRATION=DEFAULT_SESSION_TOKEN_EXPIRATION,
)

fixup_windows_event_loop_policy()
