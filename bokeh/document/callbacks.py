#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Encapulate the management of Document callbacks with a
DocumentCallbackManager class.

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
import weakref
from collections import defaultdict
from functools import wraps
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Type,
)

# Bokeh imports
from ..core.enums import HoldPolicy, HoldPolicyType
from ..events import (
    _CONCRETE_EVENT_CLASSES,
    DocumentEvent,
    Event,
    ModelEvent,
)
from ..model import Model
from ..util.callback_manager import _check_callback
from .events import (  # RootAddedEvent,; RootRemovedEvent,; TitleChangedEvent,
    DocumentPatchedEvent,
    ModelChangedEvent,
    SessionCallbackAdded,
    SessionCallbackRemoved,
)
from .locking import UnlockedDocumentProxy

if TYPE_CHECKING:
    from ..application.application import SessionDestroyedCallback
    from ..core.has_props import Setter
    from ..server.callbacks import SessionCallback
    from .document import Document
    from .events import DocumentChangeCallback, DocumentChangedEvent, Invoker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocumentCallbackManager',
    'invoke_with_curdoc',
)


Callback = Callable[[], None]
Originator = Callable[..., Any]

MessageCallback = Callable[[Any], None]
EventCallback = Callable[[Event], None]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DocumentCallbackManager:
    ''' Manage and provide access to all of the models that belong to a Bokeh
    Document.

    The set of "all models" means specifically all the models reachable from
    references form a Document's roots.

    '''

    _document : weakref.ReferenceType[Document]

    _change_callbacks: dict[Any, DocumentChangeCallback]
    _event_callbacks: dict[str, list[EventCallback]]
    _message_callbacks: dict[str, list[MessageCallback]]
    _session_destroyed_callbacks: set[SessionDestroyedCallback]
    _session_callbacks: set[SessionCallback]

    _subscribed_models: dict[str, set[weakref.ReferenceType[Model]]]

    _hold: HoldPolicyType | None = None
    _held_events: list[DocumentChangedEvent]

    def __init__(self, document: Document):
        '''

        Args:
            document (Document): A Document to manage models for
                A weak reference to the Document will be retained

        '''
        self._document = weakref.ref(document)

        self._change_callbacks = {}
        self._event_callbacks = defaultdict(list)
        self._message_callbacks = defaultdict(list)
        self._session_destroyed_callbacks = set()
        self._session_callbacks = set()

        self._subscribed_models = defaultdict(set)

        self._hold = None
        self._held_events = []

        self.on_message("bokeh_event", self.trigger_event)

    @property
    def session_callbacks(self) -> list[SessionCallback]:
        ''' A list of all the session callbacks for this document.

        '''
        return list(self._session_callbacks)

    @property
    def session_destroyed_callbacks(self) -> set[SessionDestroyedCallback]:
        ''' A list of all the on_session_destroyed callbacks for this document.

        '''
        return self._session_destroyed_callbacks

    @session_destroyed_callbacks.setter
    def session_destroyed_callbacks(self, callbacks: set[SessionDestroyedCallback]) -> None:
        self._session_destroyed_callbacks = callbacks

    def add_session_callback(self, callback_obj: SessionCallback, callback: Callback, one_shot: bool) -> SessionCallback:
        ''' Internal implementation for adding session callbacks.

        Args:
            callback_obj (SessionCallback) :
                A session callback object that wraps a callable and is
                passed to ``trigger_on_change``.

            callback (callable) :
                A callable to execute when session events happen.

            one_shot (bool) :
                Whether the callback should immediately auto-remove itself
                after one execution.

        Returns:
            SessionCallback : passed in as ``callback_obj``.

        Raises:
            ValueError, if the callback has been previously added

        '''
        doc = self._document()
        if doc is None:
            raise RuntimeError("Attempting to add session callback to already-destroyed Document")

        if one_shot:
            @wraps(callback)
            def remove_then_invoke() -> None:
                if callback_obj in self._session_callbacks:
                    self.remove_session_callback(callback_obj)
                return callback()
            actual_callback = remove_then_invoke
        else:
            actual_callback = callback

        callback_obj._callback = _wrap_with_curdoc(doc, actual_callback)
        self._session_callbacks.add(callback_obj)

        # emit event so the session is notified of the new callback
        self.trigger_on_change(SessionCallbackAdded(doc, callback_obj))

        return callback_obj

    def destroy(self) -> None:
        ''' Clean up references to the Documents models

        '''
        self._change_callbacks.clear()
        del self._change_callbacks

        self._event_callbacks.clear()
        del self._event_callbacks

        self._message_callbacks.clear()
        del self._message_callbacks

    def hold(self, policy: HoldPolicyType = "combine") -> None:
        if self._hold is not None and self._hold != policy:
            log.warning(f"hold already active with '{self._hold}', ignoring '{policy}'")
            return
        if policy not in HoldPolicy:
            raise ValueError(f"Unknown hold policy {policy}")
        self._hold = policy

    @property
    def hold_value(self) -> HoldPolicyType | None:
        return self._hold

    def notify_change(self, model: Model, attr: str, old: Any, new: Any,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None, callback_invoker: Invoker | None = None) -> None:
        ''' Called by Model when it changes

        '''
        doc = self._document()
        if doc is None:
            return

        # if name changes, need to update by-name index
        if attr == 'name':
            doc.models.update_name(model, old, new)

        event: DocumentPatchedEvent
        if hint is None:
            new = model.lookup(attr).get_value(model)
            event = ModelChangedEvent(doc, model, attr, new, setter, callback_invoker)
        else:
            assert hint.callback_invoker is None
            hint.callback_invoker = callback_invoker

            if hint.setter is None:
                hint.setter = setter

            event = hint

        self.trigger_on_change(event)

    def notify_event(self, model: Model, event: ModelEvent, callback_invoker: Invoker) -> None:
        '''

        '''
        doc = self._document()
        if doc is None:
            return

        # TODO (bev): use internal event here to dispatch, rather than hard-coding invocation here
        invoke_with_curdoc(doc, callback_invoker)

    def on_change(self, *callbacks: DocumentChangeCallback) -> None:
        ''' Provide callbacks to invoke if the document or any Model reachable
        from its roots changes.

        '''
        for callback in callbacks:
            if callback in self._change_callbacks:
                continue

            _check_callback(callback, ('event',))
            self._change_callbacks[callback] = callback

    def on_change_dispatch_to(self, receiver: Any) -> None:
        if not receiver in self._change_callbacks:
            self._change_callbacks[receiver] = lambda event: event.dispatch(receiver)

    def on_event(self, event: str | Type[Event], *callbacks: EventCallback) -> None:
        ''' Provide callbacks to invoke if a bokeh event is received.

        '''
        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        if event not in _CONCRETE_EVENT_CLASSES:
            raise ValueError(f"Unknown event {event}")

        if not issubclass(_CONCRETE_EVENT_CLASSES[event], DocumentEvent):
            raise ValueError("Document.on_event may only be used to subscribe "
                             "to events of type DocumentEvent. To subscribe "
                             "to a ModelEvent use the Model.on_event method.")

        for callback in callbacks:
            _check_callback(callback, ('event',), what='Event callback')

        self._event_callbacks[event].extend(callbacks)

    def on_message(self, msg_type: str, *callbacks: MessageCallback) -> None:
        self._message_callbacks[msg_type].extend(callbacks)

    def on_session_destroyed(self, *callbacks: SessionDestroyedCallback) -> None:
        ''' Provide callbacks to invoke when the session serving the Document
        is destroyed

        '''
        for callback in callbacks:
            _check_callback(callback, ('session_context',))
            self._session_destroyed_callbacks.add(callback)

    def remove_on_change(self, *callbacks: Any) -> None:
        ''' Remove a callback added earlier with ``on_change``.

        Raises:
            KeyError, if the callback was never added

        '''
        for callback in callbacks:
            del self._change_callbacks[callback]

    def remove_on_message(self, msg_type: str, callback: MessageCallback) -> None:
        '''

        '''
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is not None and callback in message_callbacks:
            message_callbacks.remove(callback)

    def remove_session_callback(self, callback_obj: SessionCallback) -> None:
        ''' Remove a callback added earlier with ``add_periodic_callback``,
        ``add_timeout_callback``, or ``add_next_tick_callback``.

        Returns:
            None

        Raises:
            KeyError, if the callback was never added

        '''
        try:
            callback_objs = [callback_obj]
            self._session_callbacks.remove(callback_obj)
        except KeyError:
            raise ValueError("callback already ran or was already removed, cannot be removed again")

        doc = self._document()
        if doc is None:
            return

        # emit event so the session is notified and can remove the callback
        for callback_obj in callback_objs:
            self.trigger_on_change(SessionCallbackRemoved(doc, callback_obj))

    def subscribe(self, key: str, model: Model) -> None:
        self._subscribed_models[key].add(weakref.ref(model))

    def trigger_event(self, event: Event) -> None:
        # This is fairly gorpy, we are not being careful with model vs doc events, etc.
        if isinstance(event, ModelEvent):
            subscribed = self._subscribed_models[event.event_name].copy()
            for model_ref in subscribed:
                model = model_ref()
                if model:
                    model._trigger_event(event)

        for cb in self._event_callbacks.get(event.event_name, []):
            cb(event)

    def trigger_on_change(self, event: DocumentChangedEvent) -> None:
        doc = self._document()
        if doc is None:
            return

        if self._hold == "collect":
            self._held_events.append(event)
            return
        elif self._hold == "combine":
            _combine_document_events(event, self._held_events)
            return

        if event.callback_invoker is not None:
            invoke_with_curdoc(doc, event.callback_invoker)

        def invoke_callbacks() -> None:
            for cb in self._change_callbacks.values():
                cb(event)
        invoke_with_curdoc(doc, invoke_callbacks)

    def unhold(self) -> None:
        ''' Turn off any active document hold and apply any collected events.

        Returns:
            None

        '''
        # no-op if we are already no holding
        if self._hold is None:
            return

        self._hold = None
        events = list(self._held_events)
        self._held_events = []

        for event in events:
            self.trigger_on_change(event)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def invoke_with_curdoc(doc: Document, f: Callable[[], None]) -> None:
    from ..io.doc import patch_curdoc

    curdoc: Document|UnlockedDocumentProxy = UnlockedDocumentProxy(doc) if getattr(f, "nolock", False) else doc

    with patch_curdoc(curdoc):
        return f()


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _combine_document_events(new_event: DocumentChangedEvent, old_events: list[DocumentChangedEvent]) -> None:
    ''' Attempt to combine a new event with a list of previous events.

    The ``old_event`` will be scanned in reverse, and ``.combine(new_event)``
    will be called on each. If a combination can be made, the function
    will return immediately. Otherwise, ``new_event`` will be appended to
    ``old_events``.

    Args:
        new_event (DocumentChangedEvent) :
            The new event to attempt to combine

        old_events (list[DocumentChangedEvent])
            A list of previous events to attempt to combine new_event with

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

    Returns:
        None

    '''
    for event in reversed(old_events):
        if event.combine(new_event):
            return

    # no combination was possible
    old_events.append(new_event)

def _wrap_with_curdoc(doc: Document, f: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> None:
        @wraps(f)
        def invoke() -> Any:
            return f(*args, **kwargs)
        return invoke_with_curdoc(doc, invoke)
    return wrapper

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
