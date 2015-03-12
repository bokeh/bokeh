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

:class:`Sessions <bokeh.session>`
    Create and manage persistent connections to a Bokeh server.

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

import os, time

# Third-party imports

# Bokeh imports
from .document import Document
from .resources import Resources
from .session import DEFAULT_SERVER_URL, Session

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
                    'autosave'  : # whether to autosave
                    'title'     : # a title for the HTML document
                }

        notebook (bool) : whether to generate notebook output

        session (:class:`bokeh.session.Session`) : a default session for Bokeh server output

    """

    def __init__(self):
        self.reset()

    @property
    def document(self):
        return self._document

    @property
    def file(self):
        return self._file

    @property
    def notebook(self):
        return self._notebook

    @property
    def session(self):
        return self._session

    def reset(self):
        ''' Deactivate all currently active output modes.

        Subsequent calls to show() will not render until a new output mode is
        activated.

        Returns:
            None

        '''
        self._document = Document()
        self._file = None
        self._notebook = False
        self._session = None

    def output_file(self, filename, title="Bokeh Plot", autosave=False, mode="inline", root_dir=None):
        """ Output to a static HTML file.

        Args:
            filename (str) : a filename for saving the HTML document

            title (str, optional) : a title for the HTML document

            autosave (bool, optional) : whether to automatically save (default: False)
                If True, then Bokeh plotting APIs may opt to automatically
                save the file more frequently (e.g., after any plotting
                command). If False, then the file is only saved upon calling
                :func:`show` or :func:`show`.

            mode (str, optional) : how to include BokehJS (default: ``'inline'``)
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
            'autosave'  : autosave,
            'title'     : title,
        }

        if os.path.isfile(filename):
            logger.info("Session output file '%s' already exists, will be overwritten." % filename)

    def output_notebook(self, url=None, docname=None, session=None, name=None):
        """ Generate output in Jupyter/IPython notebook cells.

        Args:
            url (str, optional) : URL of the Bokeh server (default: "default")
                If "default", then ``session.DEFAULT_SERVER_URL`` is used.

            docname (str) : Name of document to push on Bokeh server
                Any existing documents with the same name will be overwritten.

            session (Session, optional) : An explicit session to use (default: None)
                If None, a new default session is created.

            name (str, optional) : A name for the session
                If None, the server URL is used as the name

        Returns:
            None

        """
        self._notebook = True

        if session or url or name:
            if docname is None:
                docname = "IPython Session at %s" % time.ctime()
            self.output_server(docname, url=url, session=session, name=name)

    def output_server(self, docname, session=None, url="default", name=None, clear=True):
        """ Store Bokeh plots and objects on a Bokeh server.

        Args:
            docname (str) : Name of document to push on Bokeh server
                Any existing documents with the same name will be overwritten.

            session (Session, optional) : An explicit session to use (default: None)
                If None, a new default session is created.

            url (str, optional) : URL of the Bokeh server (default: "default")
                If "default", then ``session.DEFAULT_SERVER_URL`` is used.

            name (str, optional) : A name for the session
                If None, the server URL is used as the name

            clear (bool, optional) : Whether to clear the document (default: True)
                If True, an existing server document will be cleared of any
                existing objects.

        Returns:
            None

        .. warning::
            Calling this function will replace any existing default session.

        """
        if url == "default":
            url = DEFAULT_SERVER_URL

        if name is None:
            name = url

        if not session:
            self._session = Session(name=name, root_url=url)
        else:
            self._session = session

        self._session.use_doc(docname)
        self._session.load_document(self._document)

        if clear:
            self._document.clear()
