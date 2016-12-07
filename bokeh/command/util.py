''' Provide utility functions for implementing the Bokeh command.

'''
from __future__ import print_function

import contextlib
import errno
import logging
import os
import sys
import warnings

from bokeh.application import Application
from bokeh.application.handlers import ScriptHandler, DirectoryHandler, NotebookHandler


log = logging.getLogger(__name__)


def die(message):
    ''' Print an error message and exit.

    Args:
        message (str) : error message to print

    '''
    print(message, file=sys.stderr)
    sys.exit(1)

DIRSTYLE_MAIN_WARNING = """
It looks like you might be running the main.py of a directory app directly.
If this is the case, to enable the features of directory style apps, you must
call "bokeh serve" on the directory instead. For example:

    bokeh serve my_app_dir/

If this is not the case, renaming main.py will supress this warning.
"""

def build_single_handler_application(path, argv=None):
    ''' Return a Bokeh application built using a single handler for a file
    or directory.

    Args:
        path (str) : path to a file or directory for creating a Bokeh
            application.
        argv (seq[str], optional) : command line arguments to pass to the
            application handler

    Returns:
        Application

    Raises:
        RuntimeError

    '''
    argv = argv or []
    path = os.path.abspath(path)
    if os.path.isdir(path):
        handler = DirectoryHandler(filename=path, argv=argv)
    else:
        if path.endswith(".ipynb"):
            handler = NotebookHandler(filename=path, argv=argv)
        elif path.endswith(".py"):
            if path.endswith("main.py"):
                warnings.warn(DIRSTYLE_MAIN_WARNING)
            handler = ScriptHandler(filename=path, argv=argv)
        else:
            raise ValueError("Expected a '.py' script or '.ipynb' notebook, got: '%s'" % path)

    if handler.failed:
        raise RuntimeError("Error loading %s:\n\n%s\n%s " % (path, handler.error, handler.error_detail))

    application = Application(handler)

    return application

def build_single_handler_applications(paths, argvs=None):
    ''' Return a dictionary mapping routes to Bokeh applications built using
    single handlers, for specified files or directories.

    Args:
        path (seq[str]) : paths to files or directories for creating Bokeh
            applications.
        argvs (dict[str, list[str]], optional) : mapping of paths to command
            line arguments to pass to the handler for each path

    Returns:
        dict[str, Application]

    Raises:
        RuntimeError

    '''
    applications = {}
    argvs = {} or argvs

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
def report_server_init_errors(address=None, port=None, **kwargs):
    try:
        yield
    except EnvironmentError as e:
        if e.errno == errno.EADDRINUSE:
            log.critical("Cannot start Bokeh server, port %s is already in use", port)
        elif e.errno == errno.EADDRNOTAVAIL:
            log.critical("Cannot start Bokeh server, address '%s' not available", address)
        else:
            codename = errno.errorcode[e.errno]
            log.critical("Cannot start Bokeh server [%s]: %r", codename, e)
        sys.exit(1)
