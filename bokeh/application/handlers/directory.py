#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''  Provide a Bokeh Application Handler to build up documents by running
the code from ``main.py`` or `main.ipynb`` files in specified directories.

The directory may also optionally contain:

* A ``server_lifecyle.py`` module to provide lifecycle callbacks for the
  application and sessions.

* A ``static`` subdirectory containing app-specific static resources to
  serve.

* A ``theme.yaml`` file containing a Bokeh theme to automatically apply to
  all new documents.

* A ``templates`` subdirectory containing templates for app display

A full directory layout might look like:

.. code-block:: none

    myapp
       |
       +---main.py
       +---server_lifecycle.py
       +---static
       +---theme.yaml
       +---templates
            +---index.html

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import basename, dirname, exists, join

# External imports
from jinja2 import Environment, FileSystemLoader

# Bokeh imports
from .handler import Handler
from .script import ScriptHandler
from .server_lifecycle import ServerLifecycleHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------





@general((1,0,0))
class DirectoryHandler(Handler):
    ''' Load an application directory which modifies a Document.

    '''

    def __init__(self, *args, **kwargs):
        '''
        Keywords:
            filename (str) : a path to an application directory with either "main.py" or "main.ipynb"

            argv (list[str], optional) : a list of string arguments to make available as sys.argv to main.py
        '''
        super(DirectoryHandler, self).__init__(*args, **kwargs)

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to DirectoryHandler')
        src_path = kwargs['filename']
        argv = kwargs.get('argv', [])

        main_py = join(src_path, 'main.py')
        main_ipy = join(src_path, 'main.ipynb')
        if exists(main_py) and exists(main_ipy):
            log.warn("Found both 'main.py' and 'main.ipynb' in %s, using 'main.py'" % (src_path))
            main = main_py
        elif exists(main_py):
            main = main_py
        elif exists(main_ipy):
            main = main_ipy
        else:
            raise ValueError("No 'main.py' or 'main.ipynb' in %s" % (src_path))
        self._path = src_path
        self._main = main
        self._main_handler = ScriptHandler(filename=self._main, argv=argv)

        lifecycle = join(src_path, 'server_lifecycle.py')
        if exists(lifecycle):
            self._lifecycle = lifecycle
            self._lifecycle_handler = ServerLifecycleHandler(filename=self._lifecycle, argv=argv)
        else:
            self._lifecycle = None
            self._lifecycle_handler = Handler() # no-op handler

        self._theme = None
        themeyaml = join(src_path, 'theme.yaml')
        if exists(themeyaml):
            from bokeh.themes import Theme
            self._theme = Theme(filename=themeyaml)

        appstatic = join(src_path, 'static')
        if exists(appstatic):
            self._static = appstatic

        self._template = None
        appindex = join(src_path, 'templates', 'index.html')
        if exists(appindex):
            env = Environment(loader=FileSystemLoader(dirname(appindex)))
            self._template = env.get_template('index.html')

    # Properties --------------------------------------------------------------

    @property
    @general((1,0,0))
    def error(self):
        ''' If the handler fails, may contain a related error message.

        '''
        return self._main_handler.error or self._lifecycle_handler.error

    @property
    @general((1,0,0))
    def error_detail(self):
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._main_handler.error_detail or self._lifecycle_handler.error_detail

    @property
    @general((1,0,0))
    def failed(self):
        ''' ``True`` if the handler failed to modify the doc

        '''
        return self._main_handler.failed or self._lifecycle_handler.failed

    @property
    @general((1,0,0))
    def safe_to_fork(self):
        ''' Whether it is still safe for the Bokeh server to fork new workers.

        ``False`` if the configured code (script, notebook, etc.) has already
        been run.

        '''
        return self._main_handler.safe_to_fork

    # Public methods ----------------------------------------------------------

    @general((1,0,0))
    def modify_document(self, doc):
        ''' Execute the configured ``main.py`` or ``main.ipynb`` to modify the
        document.

        This method will also search the app directory for any theme or
        template files, and automatically configure the document with them
        if they are found.

        '''
        if self.failed:
            return
        # Note: we do NOT copy self._theme, which assumes the Theme
        # class is immutable (has no setters)
        if self._theme is not None:
            doc.theme = self._theme

        if self._template is not None:
            doc.template = self._template

        # This internal handler should never add a template
        self._main_handler.modify_document(doc)

    @general((1,0,0))
    def on_server_loaded(self, server_context):
        ''' Execute `on_server_unloaded`` from ``server_lifecycle.py`` (if
        it is defined) when the server is first started.

        Args:
            server_context (ServerContext) :

        '''
        return self._lifecycle_handler.on_server_loaded(server_context)

    @general((1,0,0))
    def on_server_unloaded(self, server_context):
        ''' Execute ``on_server_unloaded`` from ``server_lifecycle.py`` (if
        it is defined) when the server cleanly exits. (Before stopping the
        server's ``IOLoop``.)

        Args:
            server_context (ServerContext) :

        .. warning::
            In practice this code may not run, since servers are often killed
            by a signal.


        '''
        return self._lifecycle_handler.on_server_unloaded(server_context)

    @general((1,0,0))
    def on_session_created(self, session_context):
        ''' Execute ``on_session_created`` from ``server_lifecycle.py`` (if
        it is defined) when a new session is created.

        Args:
            session_context (SessionContext) :

        '''
        return self._lifecycle_handler.on_session_created(session_context)

    @general((1,0,0))
    def on_session_destroyed(self, session_context):
        ''' Execute ``on_session_destroyed`` from ``server_lifecycle.py`` (if
        it is defined) when a session is destroyed.

        Args:
            session_context (SessionContext) :

        '''
        return self._lifecycle_handler.on_session_destroyed(session_context)

    @general((1,0,0))
    def url_path(self):
        ''' The last path component for the basename of the path to the
        configured directory.

        '''
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + basename(self._path)
