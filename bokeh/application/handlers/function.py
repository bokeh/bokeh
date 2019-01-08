#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Bokeh Application Handler to build up documents by running
a specified Python function.

This Handler is not used by the Bokeh server command line tool, but is often
useful if users wish to embed the Bokeh server programmatically:

.. code-block:: python

    def make_doc(doc):

        # do work to modify the document, add plots, widgets, etc.

        return doc

    app = Application(FunctionHandler(make_doc))

    server = Server({'/bkapp': app}, io_loop=IOLoop.current())

    server.start()

For complete examples of this technique, see
:bokeh-tree:`examples/howto/server_embed`

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from ...util.callback_manager import _check_callback
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'FunctionHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class FunctionHandler(Handler):
    ''' A Handler that accepts a plain python function to use for modifying
    Bokeh Documents.

    For example, the following code configures a handler with a function that
    adds an empty plot to a Document:

    .. code-block:: python

        def add_empty_plot(doc):
            p = figure(x_range=(0,10), y_range=(0, 10))
            doc.add_root(p)
            return doc

        handler = FunctionHandler(add_empty_plot)

    This handler could be configured on an Application, and the Application
    would run this function every time a new session is created.

    '''

    def __init__(self, func):
        '''

        Args:
            func (callable) : a function to modify and return a Bokeh Document.
                The function should have the form:

                .. code-block:: python

                    def func(doc):
                        # modify doc
                        return doc

                and it  should return the passed-in document after making any
                modifications in-place.

        '''
        super(FunctionHandler, self).__init__()

        _check_callback(func, ('doc',))

        self._func = func
        self._safe_to_fork = True

    # Properties --------------------------------------------------------------

    @property
    def safe_to_fork(self):
        ''' Whether it is still safe for the Bokeh server to fork new workers.

        ``False`` if ``modify_doc`` has already been called.

        '''
        return self._safe_to_fork

    # Public methods ----------------------------------------------------------

    def modify_document(self, doc):
        ''' Execute the configured ``func`` to modify the document.

        After this method is first executed, ``safe_to_fork`` will return
        ``False``.

        '''
        self._func(doc)
        self._safe_to_fork = False

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
