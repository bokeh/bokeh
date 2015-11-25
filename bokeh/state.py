#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Encapsulate implicit state that is useful for Bokeh plotting APIs.

Generating output for Bokeh plots requires coordinating several things:

:class:`Documents <bokeh.document>`
    Group together Bokeh models that may be shared between plots (e.g.,
    range or data source objects) into one common namespace.

:class:`Resources <bokeh.resources>`
    Control how JavaScript and CSS for the client library BokehJS are
    included and used in the generated output.

It is certainly possible to handle the configuration of these objects
manually, and several examples of this can be found in ``examples/glyphs``.
When developing sophisticated applications, it may be necessary or
desirable to work at this level. However, for general use this would
quickly become burdensome. The ``bokeh.state`` module provides a ``State``
class that encapsulates these objects and ensures their proper configuration.

"""

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Stdlib imports
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

import os

# Third-party imports

# Bokeh imports
from .document import Document
from .resources import Resources
from .client import DEFAULT_SESSION_ID
from bokeh.resources import DEFAULT_SERVER_HTTP_URL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class State(object):
    """ Manage state related to controlling Bokeh output.

    Attributes:
        document (:class:`bokeh.document.Document`): a default document to use

        file (dict) : default filename, resources, etc. for file output
            This dictionary has the following form::

                {
                    'filename'  : # filename to use when saving
                    'resources' : # resources configuration
                    'title'     : # a title for the HTML document
                }

        notebook (bool) : whether to generate notebook output

        session_id (str) : a default session ID for Bokeh server output

        autoadd (bool) : whether certain functions automatically add roots to the document

        autosave (bool) : whether certain functions automatically save the file

        autopush (bool): whether certain functions automatically push to the server

    """

    def __init__(self):
        # TODO (havocp) right now there's no way to turn off autoadd
        self._autoadd = True
        self.reset()

    @property
    def document(self):
        return self._document

    @document.setter
    def document(self, doc):
        self._document = doc

    @property
    def file(self):
        return self._file

    @property
    def notebook(self):
        return self._notebook

    @property
    def session_id(self):
        return self._session_id

    @property
    def server_url(self):
        return self._server_url

    @property
    def autoadd(self):
        return self._autoadd

    @property
    def autosave(self):
        return self._autosave

    @property
    def autopush(self):
        return self._autopush

    def _reset_keeping_doc(self):
        self._file = None
        self._notebook = False
        self._session_id = None
        self._server_url = None
        self._autosave = False
        self._autopush = False

    def _reset_with_doc(self, doc):
        self._document = doc
        self._reset_keeping_doc()

    def reset(self):
        ''' Deactivate all currently active output modes and set curdoc() to a fresh empty Document.

        Subsequent calls to show() will not render until a new output mode is
        activated.

        Returns:
            None

        '''
        self._reset_with_doc(Document())

    def output_file(self, filename, title="Bokeh Plot", autosave=False, mode="cdn", root_dir=None):
        """Output to a standalone HTML file.

        Does not change the current Document from curdoc(). File,
        server, and notebook output may be active at the same
        time, so this does not clear the effects of
        output_server() or output_notebook().

        Args:
            filename (str) : a filename for saving the HTML document

            title (str, optional) : a title for the HTML document

            autosave (bool, optional) : whether to automatically save (default: False)
                If True, then Bokeh plotting APIs may opt to automatically
                save the file more frequently (e.g., after any plotting
                command). If False, then the file is only saved upon calling
                :func:`show` or :func:`save`.

            mode (str, optional) : how to include BokehJS (default: ``'cdn'``)
                One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
                ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

            root_dir (str, optional) :  root directory to use for 'absolute' resources. (default: None)
            This value is ignored for other resource types, e.g. ``INLINE`` or
            ``CDN``.

        .. warning::
            This output file will be overwritten on every save, e.g., each time
            show() or save() is invoked, or any time a Bokeh plotting API
            causes a save, if ``autosave`` is True.

        """
        self._file = {
            'filename'  : filename,
            'resources' : Resources(mode=mode, root_dir=root_dir),
            'title'     : title
        }
        self._autosave = autosave

        if os.path.isfile(filename):
            logger.info("Session output file '%s' already exists, will be overwritten." % filename)

    def output_notebook(self):
        """Generate output in Jupyter/IPython notebook cells.

        This does not clear the effects of output_file() or
        output_server(), it only adds an additional output
        destination (publishing to IPython Notebook). If
        output_server() has been called, the notebook output cell
        will be loaded from a Bokeh server; otherwise, Bokeh
        publishes HTML to the notebook directly.

        Returns:
            None

        """
        self._notebook = True

    def output_server(self, session_id=DEFAULT_SESSION_ID, url="default", autopush=False):
        """Store Bokeh plots and objects on a Bokeh server.

        File, server, and notebook output may be active at the
        same time, so this does not clear the effects of
        output_file() or output_notebook(). output_server()
        changes the behavior of output_notebook(), so the notebook
        will load output cells from the server rather than
        receiving them as inline HTML.

        Args:
            session_id (str) : Name of session to push on Bokeh server
                Any existing session with the same name will be overwritten.

            url (str, optional) : base URL of the Bokeh server (default: "default")
                If "default" use the default localhost URL.

            autopush (bool, optional) : whether to automatically push (default: False)
                If True, then Bokeh plotting APIs may opt to automatically
                push the document more frequently (e.g., after any plotting
                command). If False, then the document is only pushed upon calling
                :func:`show` or :func:`push`.

        Returns:
            None

        .. warning::
            Calling this function will replace any existing server-side document in the named session.

        """
        if url == "default":
            url = DEFAULT_SERVER_HTTP_URL

        self._session_id = session_id
        self._server_url = url
        self._autopush = autopush
