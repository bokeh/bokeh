'''

'''
from __future__ import absolute_import

from ..util.future import wraps

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

class UnlockedDocumentProxy(object):
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
        raise RuntimeError(
            "Only 'add_next_tick_callback' may be used safely without taking the document lock; "
            "to make other changes to the document, add a next tick callback and make your changes "
            "from that callback.")

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
