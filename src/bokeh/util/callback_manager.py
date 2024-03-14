#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides ``PropertyCallbackManager`` and ``EventCallbackManager``
mixin classes for adding ``on_change`` and ``on_event`` callback
interfaces to classes.
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
from collections import defaultdict
from inspect import signature
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Sequence,
    TypeAlias,
    cast,
)

# Bokeh imports
from ..events import Event, ModelEvent
from ..util.functions import get_param_info

if TYPE_CHECKING:
    from ..core.has_props import Setter
    from ..core.types import ID
    from ..document.document import Document
    from ..document.events import DocumentPatchedEvent

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EventCallbackManager',
    'PropertyCallbackManager',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO (bev) the situation with no-argument Button callbacks is a mess. We
# should migrate to all callbacks receving the event as the param, even if that
# means auto-magically wrapping user-supplied callbacks for awhile.
EventCallbackWithEvent: TypeAlias = Callable[[Event], None]
EventCallbackWithoutEvent: TypeAlias = Callable[[], None]
EventCallback: TypeAlias = EventCallbackWithEvent | EventCallbackWithoutEvent

PropertyCallback: TypeAlias = Callable[[str, Any, Any], None]

class EventCallbackManager:
    ''' A mixin class to provide an interface for registering and
    triggering event callbacks on the Python side.

    '''

    document: Document | None
    id: ID
    subscribed_events: set[str]
    _event_callbacks: dict[str, list[EventCallback]]

    def __init__(self, *args: Any, **kw: Any) -> None:
        super().__init__(*args, **kw)
        self._event_callbacks = defaultdict(list)

    def on_event(self, event: str | type[Event], *callbacks: EventCallback) -> None:
        ''' Run callbacks when the specified event occurs on this Model

        Not all Events are supported for all Models.
        See specific Events in :ref:`bokeh.events` for more information on
        which Models are able to trigger them.
        '''
        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        for callback in callbacks:
            if _nargs(callback) != 0:
                _check_callback(callback, ('event',), what='Event callback')
            self._event_callbacks[event].append(callback)

        self.subscribed_events.add(event)

    def _trigger_event(self, event: ModelEvent) -> None:
        def invoke() -> None:
            for callback in self._event_callbacks.get(event.event_name, []):
                if event.model is not None and self.id == event.model.id:
                    if _nargs(callback) == 0:
                        cast(EventCallbackWithoutEvent, callback)()
                    else:
                        cast(EventCallbackWithEvent, callback)(event)

        if self.document is not None:
            from ..model import Model
            self.document.callbacks.notify_event(cast(Model, self), event, invoke)
        else:
            invoke()

    def _update_event_callbacks(self) -> None:
        if self.document is None:
            return

        for key in self._event_callbacks:
            from ..model import Model
            self.document.callbacks.subscribe(key, cast(Model, self))

class PropertyCallbackManager:
    ''' A mixin class to provide an interface for registering and
    triggering callbacks.

    '''

    document: Document | None
    _callbacks: dict[str, list[PropertyCallback]]

    def __init__(self, *args: Any, **kw: Any) -> None:
        super().__init__(*args, **kw)
        self._callbacks = {}

    def on_change(self, attr: str, *callbacks: PropertyCallback) -> None:
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            callback (callable) : a callback function to register

        Returns:
            None

        '''
        if len(callbacks) == 0:
            raise ValueError("on_change takes an attribute name and one or more callbacks, got only one parameter")

        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:
            if callback in _callbacks:
                continue

            _check_callback(callback, ('attr', 'old', 'new'))
            _callbacks.append(callback)

    def remove_on_change(self, attr: str, *callbacks: PropertyCallback) -> None:
        ''' Remove a callback from this object '''
        if len(callbacks) == 0:
            raise ValueError("remove_on_change takes an attribute name and one or more callbacks, got only one parameter")
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:
            _callbacks.remove(callback)

    def trigger(self, attr: str, old: Any, new: Any,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None:
        ''' Trigger callbacks for ``attr`` on this object.

        Args:
            attr (str) :
            old (object) :
            new (object) :

        Returns:
            None

        '''
        def invoke() -> None:
            callbacks = self._callbacks.get(attr)
            if callbacks:
                for callback in callbacks:
                    callback(attr, old, new)
        if self.document is not None:
            from ..model import Model
            self.document.callbacks.notify_change(cast(Model, self), attr, old, new, hint, setter, invoke)
        else:
            invoke()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _nargs(fn: Callable[..., Any]) -> int:
    sig = signature(fn)
    all_names, default_values = get_param_info(sig)
    return len(all_names) - len(default_values)

def _check_callback(callback: Callable[..., Any], fargs: Sequence[str], what: str ="Callback functions") -> None:
    '''Bokeh-internal function to check callback signature'''
    sig = signature(callback)
    all_names, default_values = get_param_info(sig)

    nargs = len(all_names) - len(default_values)
    if nargs != len(fargs):
        expected = ", ".join(fargs)
        received = str(sig)
        raise ValueError(f"{what} must have signature func({expected}), got func{received}")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
