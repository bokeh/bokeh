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
manually, and several examples of this can be found in ``examples/models``.
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
from ..document import Document
from ..resources import Resources, _SessionCoordinates
from ..client import DEFAULT_SESSION_ID

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

    """

    def __init__(self):
        self.last_comms_handle = None
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
    def server_enabled(self):
        return self._server_enabled

    @property
    def session_id(self):
        return self._session_coords.session_id

    @property
    def session_id_allowing_none(self):
        return self._session_coords.session_id_allowing_none

    @property
    def url(self):
        """ Gets the server base URL (not including any app path)."""
        return self._session_coords.url

    @property
    def server_url(self):
        """ Gets the full server URL (including the app path)."""
        return self._session_coords.server_url

    @property
    def app_path(self):
        return self._session_coords.app_path

    def _reset_keeping_doc(self):
        self._file = None
        self._notebook = False
        self._session_coords = _SessionCoordinates(dict())
        self._server_enabled = False

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

    def output_file(self, filename, title="Bokeh Plot", mode="cdn", root_dir=None):
        """Output to a standalone HTML file.

        Does not change the current Document from curdoc(). File,
        server, and notebook output may be active at the same
        time, so this does not clear the effects of
        output_server() or output_notebook().

        Args:
            filename (str) : a filename for saving the HTML document

            title (str, optional) : a title for the HTML document

            mode (str, optional) : how to include BokehJS (default: ``'cdn'``)
                One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
                ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

            root_dir (str, optional) :  root directory to use for 'absolute' resources.
                (default: None) This value is ignored for other resource types, e.g. ``INLINE`` or
                ``CDN``.

        .. warning::
            This output file will be overwritten on every save, e.g., each time
            show() or save() is invoked.

        """
        self._file = {
            'filename'  : filename,
            'resources' : Resources(mode=mode, root_dir=root_dir),
            'title'     : title
        }

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

    def output_server(self, session_id=DEFAULT_SESSION_ID, url="default", app_path='/'):
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

            app_path (str, optional) : relative path of the app on the Bokeh server (default: "/")

        Returns:
            None

        .. warning::
            Calling this function will replace any existing server-side document in the named session.

        """
        self._session_coords = _SessionCoordinates(dict(session_id=session_id,
                                                        url=url,
                                                        app_path=app_path))

        self._server_enabled = True
