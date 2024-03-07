#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utility functions for implementing the ``bokeh`` command.

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
import contextlib
import errno
import os
import sys
from typing import TYPE_CHECKING, Iterator

if TYPE_CHECKING:
    # External imports
    from typing_extensions import Never

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers import (
    DirectoryHandler,
    Handler,
    NotebookHandler,
    ScriptHandler,
)
from bokeh.util.warnings import warn

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'build_single_handler_application',
    'build_single_handler_applications',
    'die',
    'report_server_init_errors',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def die(message: str, status: int = 1) -> Never:
    ''' Print an error message and exit.

    This function will call ``sys.exit`` with the given ``status`` and the
    process will terminate.

    Args:
        message (str) : error message to print

        status (int) : the exit status to pass to ``sys.exit``

    '''
    print(message, file=sys.stderr)
    sys.exit(status)

DIRSTYLE_MAIN_WARNING = """
It looks like you might be running the main.py of a directory app directly.
If this is the case, to enable the features of directory style apps, you must
call "bokeh serve" on the directory instead. For example:

    bokeh serve my_app_dir/

If this is not the case, renaming main.py will suppress this warning.
"""

def build_single_handler_application(path: str, argv: list[str] | None = None) -> Application:
    ''' Return a Bokeh application built using a single handler for a script,
    notebook, or directory.

    In general a Bokeh :class:`~bokeh.application.application.Application` may
    have any number of handlers to initialize |Document| objects for new client
    sessions. However, in many cases only a single handler is needed. This
    function examines the ``path`` provided, and returns an ``Application``
    initialized with one of the following handlers:

    * :class:`~bokeh.application.handlers.script.ScriptHandler` when ``path``
      is to a ``.py`` script.

    * :class:`~bokeh.application.handlers.notebook.NotebookHandler` when
      ``path`` is to an ``.ipynb`` Jupyter notebook.

    * :class:`~bokeh.application.handlers.directory.DirectoryHandler` when
      ``path`` is to a directory containing a ``main.py`` script.

    Args:
        path (str) : path to a file or directory for creating a Bokeh
            application.

        argv (seq[str], optional) : command line arguments to pass to the
            application handler

    Returns:
        :class:`~bokeh.application.application.Application`

    Raises:
        RuntimeError

    Notes:
        If ``path`` ends with a file ``main.py`` then a warning will be printed
        regarding running directory-style apps by passing the directory instead.

    '''
    argv = argv or []
    path = os.path.abspath(os.path.expanduser(path))
    handler: Handler

    # There are certainly race conditions here if the file/directory is deleted
    # in between the isdir/isfile tests and subsequent code. But it would be a
    # failure if they were not there to begin with, too (just a different error)
    if os.path.isdir(path):
        handler = DirectoryHandler(filename=path, argv=argv)
    elif os.path.isfile(path):
        if path.endswith(".ipynb"):
            handler = NotebookHandler(filename=path, argv=argv)
        elif path.endswith(".py"):
            if path.endswith("main.py"):
                warn(DIRSTYLE_MAIN_WARNING)
            handler = ScriptHandler(filename=path, argv=argv)
        else:
            raise ValueError("Expected a '.py' script or '.ipynb' notebook, got: '%s'" % path)
    else:
        raise ValueError("Path for Bokeh server application does not exist: %s" % path)

    if handler.failed:
        raise RuntimeError(f"Error loading {path}:\n\n{handler.error}\n{handler.error_detail} ")

    application = Application(handler)

    return application

def build_single_handler_applications(paths: list[str], argvs: dict[str, list[str]] | None = None) -> dict[str, Application]:
    ''' Return a dictionary mapping routes to Bokeh applications built using
    single handlers, for specified files or directories.

    This function iterates over ``paths`` and ``argvs`` and calls
    :func:`~bokeh.command.util.build_single_handler_application` on each
    to generate the mapping.

    Args:
        paths (seq[str]) : paths to files or directories for creating Bokeh
            applications.

        argvs (dict[str, list[str]], optional) : mapping of paths to command
            line arguments to pass to the handler for each path

    Returns:
        dict[str, Application]

    Raises:
        RuntimeError

    '''
    applications: dict[str, Application] = {}
    argvs = argvs or {}

    for path in paths:
        application = build_single_handler_application(path, argvs.get(path, []))

        route = application.handlers[0].url_path()

        if not route:
            if '/' in applications:
                raise RuntimeError("Don't know the URL path to use for %s" % (path))
            route = '/'
        applications[route] = application

    return applications


@contextlib.contextmanager
def report_server_init_errors(address: str | None = None, port: int | None = None, **kwargs: str) -> Iterator[None]:
    ''' A context manager to help print more informative error messages when a
    ``Server`` cannot be started due to a network problem.

    Args:
        address (str) : network address that the server will be listening on

        port (int) : network address that the server will be listening on

    Example:

        .. code-block:: python

            with report_server_init_errors(**server_kwargs):
                server = Server(applications, **server_kwargs)

        If there are any errors (e.g. port or address in already in use) then a
        critical error will be logged and the process will terminate with a
        call to ``sys.exit(1)``

    '''
    try:
        yield
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            log.critical("Cannot start Bokeh server, port %s is already in use", port)
        elif e.errno == errno.EADDRNOTAVAIL:
            log.critical("Cannot start Bokeh server, address '%s' not available", address)
        else:
            codename = errno.errorcode[e.errno]
            log.critical("Cannot start Bokeh server [%s]: %r", codename, e)
        sys.exit(1)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
