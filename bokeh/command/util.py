''' Provide utility functions for implementing the Bokeh command.

'''
from __future__ import print_function

import os
import sys

from bokeh.application import Application
from bokeh.application.handlers import ScriptHandler, DirectoryHandler, NotebookHandler

def die(message):
    ''' Print an error message and exit.

    Args:
        message (str) : error message to print

    '''
    print(message, file=sys.stderr)
    sys.exit(1)

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
