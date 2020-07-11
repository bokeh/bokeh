#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from functools import wraps

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'UnlockedDocumentProxy',
    'without_document_lock',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def without_document_lock(func):
    ''' Wrap a callback function to execute without first obtaining the
    document lock.

    Args:
        func (callable) : The function to wrap

    Returns:
        callable : a function wrapped to execute without a |Document| lock.

    While inside an unlocked callback, it is completely *unsafe* to modify
    ``curdoc()``. The value of ``curdoc()`` inside the callback will be a
    specially wrapped version of |Document| that only allows safe operations,
    which are:

    * :func:`~bokeh.document.Document.add_next_tick_callback`
    * :func:`~bokeh.document.Document.remove_next_tick_callback`

    Only these may be used safely without taking the document lock. To make
    other changes to the document, you must add a next tick callback and make
    your changes to ``curdoc()`` from that second callback.

    Attempts to otherwise access or change the Document will result in an
    exception being raised.

    '''
    @wraps(func)
    def wrapper(*args, **kw):
        return func(*args, **kw)
    wrapper.nolock = True
    return wrapper


UNSAFE_DOC_ATTR_USAGE_MSG = ("Only 'add_next_tick_callback' may be used safely without taking the document lock; "
                             "to make other changes to the document, add a next tick callback and make your changes "
                             "from that callback.")


class UnlockedDocumentProxy:
    ''' Wrap a Document object so that only methods that can safely be used
    from unlocked callbacks or threads are exposed. Attempts to otherwise
    access or change the Document results in an exception.

    '''

    def __init__(self, doc):
        '''

        '''
        self._doc = doc

    def __getattr__(self, attr):
        '''

        '''
        raise AttributeError(UNSAFE_DOC_ATTR_USAGE_MSG)

    def add_next_tick_callback(self, callback):
        ''' Add a "next tick" callback.

        Args:
            callback (callable) :

        '''
        return self._doc.add_next_tick_callback(callback)

    def remove_next_tick_callback(self, callback):
        ''' Remove a "next tick" callback.

        Args:
            callback (callable) :

        '''
        return self._doc.remove_next_tick_callback(callback)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
