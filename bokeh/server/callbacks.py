''' Provide classes to represent callback code that can be associate with
Bokeh Documents and Sessions.

'''
from __future__ import absolute_import

from ..util.serialization import make_id
from ..util.tornado import _CallbackGroup

class SessionCallback(object):
    ''' A base class for callback objects associated with Bokeh Documents
    and Sessions.

    '''
    def __init__(self, document, callback, id=None):
        '''

         Args:
            document (Document) :

            callback (callable) :

            id (str, optional) :

        '''
        self._id = make_id() if id is None else id
        self._document = document
        self._callback = callback

    @property
    def id(self):
        ''' A unique ID for this callback

        '''
        return self._id

    @property
    def callback(self):
        ''' The callable that this callback wraps.

        '''
        return self._callback

    def remove(self):
        ''' Remove this session callback its document.

        '''
        self.document._remove_session_callback(self)

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        raise NotImplementedError("_copy_with_changed_callback")

class NextTickCallback(SessionCallback):
    ''' Represent a callback to execute on the next IOLoop "tick".

    '''
    def __init__(self, document, callback, id=None):
        '''

         Args:
            document (Document) :

            callback (callable) :

            id (str, optional) :

        '''
        super(NextTickCallback, self).__init__(document, callback, id)

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        return NextTickCallback(self._document, new_callback, self._id)

class PeriodicCallback(SessionCallback):
    ''' Represent a callback to execute periodically on the IOLoop at a
    specified periodic time interval.

    '''
    def __init__(self, document, callback, period, id=None):
        '''

        Args:
            document (Document) :

            callback (callable) :

            period (int) :

            id (str, optional) :

        '''
        super(PeriodicCallback, self).__init__(document, callback, id)
        self._period = period

    @property
    def period(self):
        ''' The period time (in milliseconds) that this callback should
        repeat execution at.

        '''
        return self._period

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        return PeriodicCallback(self._document, new_callback, self._period, self._id)

class TimeoutCallback(SessionCallback):
    ''' Represent a callback to execute once on the IOLoop after a specifeed
    time interval passes.

    '''
    def __init__(self, document, callback, timeout, id=None):
        '''

        Args:
            document (Document) :

            callback (callable) :

            timeout (int) :

            id (str, optional) :

        '''
        super(TimeoutCallback, self).__init__(document, callback, id)
        self._timeout = timeout

    @property
    def timeout(self):
        ''' The timeout (in milliseconds) that the callback should run after.

        '''
        return self._timeout

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        return TimeoutCallback(self._document, new_callback, self._timeout, self._id)

class _DocumentCallbackGroup(object):
    '''

    '''
    def __init__(self, io_loop=None):
        '''

        '''
        self._group = _CallbackGroup(io_loop)
        # from callback ids to removers
        self._removers = dict()

    def remove_all_callbacks(self):
        '''

        '''
        for r in list(self._removers.values()):
            r()

    def add_session_callbacks(self, callbacks):
        '''

        '''
        for cb in callbacks:
            self.add_session_callback(cb)

    def add_session_callback(self, callback):
        '''

        '''
        def cleanup(func):
            if callback.id in self._removers:
                del self._removers[callback.id]
        if isinstance(callback, PeriodicCallback):
            remover = self._group.add_periodic_callback(callback.callback, callback.period, cleanup)
        elif isinstance(callback, TimeoutCallback):
            remover = self._group.add_timeout_callback(callback.callback, callback.timeout, cleanup)
        elif isinstance(callback, NextTickCallback):
            remover = self._group.add_next_tick_callback(callback.callback, cleanup)
        else:
            raise ValueError("Expected callback of type PeriodicCallback, TimeoutCallback, NextTickCallback, got: %s" % callback.callback)
        self._removers[callback.id] = remover

    def remove_session_callback(self, callback):
        '''

        '''
        # we may be called multiple times because of multiple
        # views on a document - the document has to notify that
        # the callback was removed even if only one view invoked
        # it. So we need to silently no-op if we're already
        # removed.
        if callback.id in self._removers:
            self._removers[callback.id]()
