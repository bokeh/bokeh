#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Callable, Sequence

# Bokeh imports
from ..core.types import ID
from ..util.tornado import _CallbackGroup

if TYPE_CHECKING:
    from tornado.ioloop import IOLoop

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

Callback = Callable[[], None]

class SessionCallback:
    ''' A base class for callback objects associated with Bokeh Documents
    and Sessions.

    '''

    _id: ID

    def __init__(self, callback: Callback, *, callback_id: ID) -> None:
        '''

         Args:
            callback (callable) :

            id (ID) :

        '''
        self._id = callback_id

        # specify type here until this is released: https://github.com/python/mypy/pull/10548
        self._callback: Callback = callback

    @property
    def id(self) -> ID:
        ''' A unique ID for this callback

        '''
        return self._id

    @property
    def callback(self) -> Callback:
        ''' The callable that this callback wraps.

        '''
        return self._callback

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class NextTickCallback(SessionCallback):
    ''' Represent a callback to execute on the next ``IOLoop`` "tick".

    '''
    def __init__(self, callback: Callback, *, callback_id: ID) -> None:
        '''

         Args:
            callback (callable) :

            id (ID) :

        '''
        super().__init__(callback=callback, callback_id=callback_id)

class PeriodicCallback(SessionCallback):
    ''' Represent a callback to execute periodically on the ``IOLoop`` at a
    specified periodic time interval.

    '''

    _period: int

    def __init__(self, callback: Callback, period: int, *, callback_id: ID) -> None:
        '''

        Args:
            callback (callable) :

            period (int) :

            id (ID) :

        '''
        super().__init__(callback=callback, callback_id=callback_id)
        self._period = period

    @property
    def period(self) -> int:
        ''' The period time (in milliseconds) that this callback should
        repeat execution at.

        '''
        return self._period

class TimeoutCallback(SessionCallback):
    ''' Represent a callback to execute once on the ``IOLoop`` after a specified
    time interval passes.

    '''

    _timeout: int

    def __init__(self, callback: Callback, timeout: int, *, callback_id: ID) -> None:
        '''

        Args:
            callback (callable) :

            timeout (int) :

            id (ID) :

        '''
        super().__init__(callback=callback, callback_id=callback_id)
        self._timeout = timeout

    @property
    def timeout(self) -> int:
        ''' The timeout (in milliseconds) that the callback should run after.

        '''
        return self._timeout

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class DocumentCallbackGroup:
    '''

    '''
    def __init__(self, io_loop: IOLoop) -> None:
        '''

        '''
        self._group = _CallbackGroup(io_loop)

    def remove_all_callbacks(self) -> None:
        '''

        '''
        self._group.remove_all_callbacks()

    def add_session_callbacks(self, callbacks: Sequence[SessionCallback]) -> None:
        '''

        '''
        for cb in callbacks:
            self.add_session_callback(cb)

    def add_session_callback(self, callback_obj: SessionCallback) -> None:
        '''

        '''
        if isinstance(callback_obj, PeriodicCallback):
            self._group.add_periodic_callback(callback_obj.callback, callback_obj.period, callback_obj.id)
        elif isinstance(callback_obj, TimeoutCallback):
            self._group.add_timeout_callback(callback_obj.callback, callback_obj.timeout, callback_obj.id)
        elif isinstance(callback_obj, NextTickCallback):
            self._group.add_next_tick_callback(callback_obj.callback, callback_obj.id)
        else:
            raise ValueError(f"Expected callback of type PeriodicCallback, TimeoutCallback, NextTickCallback, got: {callback_obj.callback}")

    def remove_session_callback(self, callback_obj: SessionCallback) -> None:
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
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
