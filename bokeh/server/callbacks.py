#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide classes to represent callback code that can be associate with
Bokeh Documents and Sessions.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.serialization import make_id
from ..util.tornado import _CallbackGroup

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'NextTickCallback',
    'PeriodicCallback',
    'SessionCallback',
    'TimeoutCallback',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

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

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        raise NotImplementedError("_copy_with_changed_callback")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class NextTickCallback(SessionCallback):
    ''' Represent a callback to execute on the next ``IOLoop`` "tick".

    '''
    def __init__(self, document, callback, id=None):
        '''

         Args:
            document (Document) :

            callback (callable) :

            id (str, optional) :

        '''
        super().__init__(document, callback, id)

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        return NextTickCallback(self._document, new_callback, self._id)

class PeriodicCallback(SessionCallback):
    ''' Represent a callback to execute periodically on the ``IOLoop`` at a
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
        super().__init__(document, callback, id)
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
    ''' Represent a callback to execute once on the ``IOLoop`` after a specified
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
        super().__init__(document, callback, id)
        self._timeout = timeout

    @property
    def timeout(self):
        ''' The timeout (in milliseconds) that the callback should run after.

        '''
        return self._timeout

    def _copy_with_changed_callback(self, new_callback):
        ''' Dev API used to wrap the callback with decorators. '''
        return TimeoutCallback(self._document, new_callback, self._timeout, self._id)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _DocumentCallbackGroup(object):
    '''

    '''
    def __init__(self, io_loop=None):
        '''

        '''
        self._group = _CallbackGroup(io_loop)

    def remove_all_callbacks(self):
        '''

        '''
        self._group.remove_all_callbacks()

    def add_session_callbacks(self, callbacks):
        '''

        '''
        for cb in callbacks:
            self.add_session_callback(cb)

    def add_session_callback(self, callback_obj):
        '''

        '''
        if isinstance(callback_obj, PeriodicCallback):
            self._group.add_periodic_callback(callback_obj.callback, callback_obj.period, callback_obj.id)
        elif isinstance(callback_obj, TimeoutCallback):
            self._group.add_timeout_callback(callback_obj.callback, callback_obj.timeout, callback_obj.id)
        elif isinstance(callback_obj, NextTickCallback):
            self._group.add_next_tick_callback(callback_obj.callback, callback_obj.id)
        else:
            raise ValueError("Expected callback of type PeriodicCallback, TimeoutCallback, NextTickCallback, got: %s" % callback_obj.callback)

    def remove_session_callback(self, callback_obj):
        '''

        '''
        # we may be called multiple times because of multiple
        # views on a document - the document has to notify that
        # the callback was removed even if only one view invoked
        # it. So we need to silently no-op if we're already
        # removed.
        try:
            if isinstance(callback_obj, PeriodicCallback):
                self._group.remove_periodic_callback(callback_obj.id)
            elif isinstance(callback_obj, TimeoutCallback):
                self._group.remove_timeout_callback(callback_obj.id)
            elif isinstance(callback_obj, NextTickCallback):
                self._group.remove_next_tick_callback(callback_obj.id)
        except ValueError:
            pass

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
