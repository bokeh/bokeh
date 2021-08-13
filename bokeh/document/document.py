#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``Document`` class, which is a container for Bokeh Models to
be reflected to the client side BokehJS library.

As a concrete example, consider a column layout with ``Slider`` and ``Select``
widgets, and a plot with some tools, an axis and grid, and a glyph renderer
for circles. A simplified representation of this document might look like the
figure below:

.. figure:: /_images/document.svg
    :align: center
    :width: 65%

    A Bokeh Document is a collection of Bokeh Models (e.g. plots, tools,
    glyphs, etc.) that can be serialized as a single collection.

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
from functools import wraps
from json import loads
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    Iterable,
    List,
    Set,
    Type,
    TypeVar,
)

# External imports
from jinja2 import Template

# Bokeh imports
from ..core.enums import HoldPolicy, HoldPolicyType
from ..core.has_props import is_DataModel
from ..core.json_encoder import serialize_json
from ..core.query import find, is_single_string_selector
from ..core.templates import FILE
from ..core.types import ID, Unknown
from ..core.validation import check_integrity, process_validation_issues
from ..events import _CONCRETE_EVENT_CLASSES, DocumentEvent, Event
from ..model import Model
from ..themes import Theme, built_in_themes, default as default_theme
from ..util.callback_manager import _check_callback
from ..util.deprecation import deprecated
from ..util.serialization import make_id
from ..util.version import __version__
from .events import (
    DocumentPatchedEvent,
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
    SessionCallbackAdded,
    SessionCallbackRemoved,
    TitleChangedEvent,
)
from .json import DocJson, PatchJson, RootsJson
from .locking import UnlockedDocumentProxy
from .models import DocumentModelManager
from .modules import DocumentModuleManager
from .util import initialize_references_json, instantiate_references_json, references_json

if TYPE_CHECKING:
    from ..application.application import SessionContext, SessionDestroyedCallback
    from ..core.has_props import Setter
    from ..core.query import SelectorType
    from ..events import EventJson
    from ..server.callbacks import (
        NextTickCallback,
        PeriodicCallback,
        SessionCallback,
        TimeoutCallback,
    )
    from .events import DocumentChangeCallback, DocumentChangedEvent, Invoker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_TITLE = "Bokeh Application"

__all__ = (
    'Document',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

Callback = Callable[[], None]
Originator = Callable[..., Any]

MessageCallback = Callable[[Unknown], None]
EventCallback = Callable[[Event], None]

F = TypeVar("F", bound=Callable[..., Any])

class Document:
    ''' The basic unit of serialization for Bokeh.

    Document instances collect Bokeh models (e.g. plots, layouts, widgets,
    etc.) so that they may be reflected into the BokehJS client runtime.
    Because models may refer to other models (e.g., a plot *has* a list of
    renderers), it is not generally useful or meaningful to convert individual
    models to JSON. Accordingly,  the ``Document`` is thus the smallest unit
    of serialization for Bokeh.

    .. autoclasstoc::

    '''

    models: DocumentModelManager
    modules: DocumentModuleManager

    _roots: List[Model]
    _theme: Theme
    _title: str
    _template: Template
    _change_callbacks: Dict[Any, DocumentChangeCallback]
    _event_callbacks: Dict[str, List[EventCallback]]
    _message_callbacks: Dict[str, List[MessageCallback]]
    _session_destroyed_callbacks: Set[SessionDestroyedCallback]
    _session_callbacks: Set[SessionCallback]
    _session_context: SessionContext | None
    _template_variables: Dict[str, Unknown]
    _hold: HoldPolicyType | None = None
    _held_events: List[DocumentChangedEvent]
    _subscribed_models: Dict[str, Set[Model]]

    def __init__(self, *, theme: Theme = default_theme, title: str = DEFAULT_TITLE) -> None:
        self.models = DocumentModelManager(self)
        self.modules = DocumentModuleManager(self)

        self._roots = []
        self._theme = theme
        # use _title directly because we don't need to trigger an event
        self._title = title
        self._template = FILE
        self._change_callbacks = {}
        self._event_callbacks = {}
        self._message_callbacks = {}
        self._session_destroyed_callbacks = set()
        self._session_callbacks = set()
        self._session_context = None
        self._template_variables = {}
        self._hold = None
        self._held_events = []

        # set of models subscribed to user events
        self._subscribed_models = defaultdict(set)
        self.on_message("bokeh_event", self.apply_json_event)

    # Properties --------------------------------------------------------------

    @property
    def roots(self) -> List[Model]:
        ''' A list of all the root models in this Document.

        '''
        return list(self._roots)

    @property
    def session_callbacks(self) -> List[SessionCallback]:
        ''' A list of all the session callbacks on this document.

        '''
        return list(self._session_callbacks)

    @property
    def session_destroyed_callbacks(self) -> Set[SessionDestroyedCallback]:
        ''' A list of all the on_session_destroyed callbacks on this document.

        '''
        return self._session_destroyed_callbacks

    @session_destroyed_callbacks.setter
    def session_destroyed_callbacks(self, callbacks: Set[SessionDestroyedCallback]) -> None:
        self._session_destroyed_callbacks = callbacks

    @property
    def session_context(self) -> SessionContext | None:
        ''' The ``SessionContext`` for this document.

        '''
        return self._session_context

    @property
    def template(self) -> Template:
        ''' A Jinja2 template to use for rendering this document.

        '''
        return self._template

    @template.setter
    def template(self, template: Template) -> None:
        if not isinstance(template, (Template, str)):
            raise ValueError("document template must be Jinja2 template or a string")
        self._template = template

    @property
    def template_variables(self) -> Dict[str, Unknown]:
        ''' A dictionary of template variables to pass when rendering
        ``self.template``.

        '''
        return self._template_variables

    @property
    def theme(self) -> Theme:
        ''' The current ``Theme`` instance affecting models in this Document.

        Setting this to ``None`` sets the default theme. (i.e this property
        never returns ``None``.)

        Changing theme may trigger model change events on the models in the
        document if the theme modifies any model properties.

        '''
        return self._theme

    @theme.setter
    def theme(self, theme: Theme | str | None) -> None:
        if theme is None:
            theme = default_theme

        if self._theme is theme:
            return

        if isinstance(theme, str):
            try:
                self._theme = built_in_themes[theme]
            except KeyError:
                raise ValueError(
                    "{0} is not a built-in theme; available themes are "
                    "{1}".format(theme, ', '.join(built_in_themes.keys()))
                )
        elif isinstance(theme, Theme):
            self._theme = theme
        else:
            raise ValueError("Theme must be a string or an instance of the Theme class")

        for model in self.models:
            self._theme.apply_to_model(model)

    @property
    def title(self) -> str:
        ''' A title for this document.

        This title will be set on standalone HTML documents, but not e.g. when
        ``autoload_server`` is used.

        '''
        return self._title

    @title.setter
    def title(self, title: str) -> None:
        self.set_title(title)

    # Public methods ----------------------------------------------------------

    def add_next_tick_callback(self, callback: Callback) -> NextTickCallback:
        ''' Add callback to be invoked once on the next tick of the event loop.

        Args:
            callback (callable) :
                A callback function to execute on the next tick.

        Returns:
            NextTickCallback : can be used with ``remove_next_tick_callback``

        .. note::
            Next tick callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from ..server.callbacks import NextTickCallback
        cb = NextTickCallback(callback=None, callback_id=make_id())
        return self._add_session_callback(cb, callback, one_shot=True)

    def add_periodic_callback(self, callback: Callback, period_milliseconds: int) -> PeriodicCallback:
        ''' Add a callback to be invoked on a session periodically.

        Args:
            callback (callable) :
                A callback function to execute periodically

            period_milliseconds (int) :
                Number of milliseconds between each callback execution.

        Returns:
            PeriodicCallback : can be used with ``remove_periodic_callback``

        .. note::
            Periodic callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from ..server.callbacks import PeriodicCallback
        cb = PeriodicCallback(callback=None, period=period_milliseconds, callback_id=make_id())
        return self._add_session_callback(cb, callback, one_shot=False)

    def add_root(self, model: Model, setter: Setter | None = None) -> None:
        ''' Add a model as a root of this Document.

        Any changes to this model (including to other models referred to
        by it) will trigger ``on_change`` callbacks registered on this
        document.

        Args:
            model (Model) :
                The model to add as a root of this document.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        '''
        if model in self._roots:
            return

        with self.models.freeze():
            self._roots.append(model)

        self._trigger_on_change(RootAddedEvent(self, model, setter))

    def add_timeout_callback(self, callback: Callback, timeout_milliseconds: int) -> TimeoutCallback:
        ''' Add callback to be invoked once, after a specified timeout passes.

        Args:
            callback (callable) :
                A callback function to execute after timeout

            timeout_milliseconds (int) :
                Number of milliseconds before callback execution.

        Returns:
            TimeoutCallback : can be used with ``remove_timeout_callback``

        .. note::
            Timeout callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from ..server.callbacks import TimeoutCallback
        cb = TimeoutCallback(callback=None, timeout=timeout_milliseconds, callback_id=make_id())
        return self._add_session_callback(cb, callback, one_shot=True)

    def apply_json_event(self, json: EventJson) -> None:
        event = Event.decode_json(json)
        if not isinstance(event, Event):
            log.warning('Could not decode event json: %s' % json)
        else:
            subscribed = self._subscribed_models[event.event_name].copy()
            for model in subscribed:
                model._trigger_event(event)

        for cb in self._event_callbacks.get(event.event_name, []):
            cb(event)

    def apply_json_patch(self, patch: PatchJson, setter: Setter | None = None) -> None:
        ''' Apply a JSON patch object and process any resulting events.

        Args:
            patch (JSON-data) :
                The JSON-object containing the patch to apply.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        '''
        references_json = patch['references']
        events_json = patch['events']
        references = instantiate_references_json(references_json, self.models)

        # The model being changed isn't always in references so add it in
        for event_json in events_json:
            if 'model' in event_json:
                model_id = event_json['model']['id']
                if model_id in self.models:
                    references[model_id] = self.models[model_id]

        initialize_references_json(references_json, references, setter)

        for event_json in events_json:
            DocumentPatchedEvent.handle_json(self, event_json, references, setter)

    def apply_json_patch_string(self, patch: str) -> None:
        ''' Apply a JSON patch provided as a string.

        Args:
            patch (str) :

        Returns:
            None

        '''
        json_parsed = loads(patch)
        self.apply_json_patch(json_parsed)

    def clear(self) -> None:
        ''' Remove all content from the document but do not reset title.

        Returns:
            None

        '''
        with self.models.freeze():
            while len(self._roots) > 0:
                r = next(iter(self._roots))
                self.remove_root(r)

    def destroy(self, session: Any) -> None:
        self.remove_on_change(session)
        del self._roots
        del self._theme
        del self._template
        self._session_context = None
        self.models.destroy()
        self.modules.destroy()

        import gc
        gc.collect()

    def delete_modules(self):
        deprecated((2, 4, 0), "Document.delete_modules", "Document.models.destroy")
        self.modules.destroy()

    @classmethod
    def from_json(cls, json: DocJson) -> Document:
        ''' Load a document from JSON.

        json (JSON-data) :
            A JSON-encoded document to create a new Document from.

        Returns:
            Document :

        '''
        roots_json = json['roots']
        root_ids = roots_json['root_ids']
        references_json = roots_json['references']

        references = instantiate_references_json(references_json, {})
        initialize_references_json(references_json, references)

        doc = Document()
        for r in root_ids:
            doc.add_root(references[r])

        doc.title = json['title']

        return doc

    @classmethod
    def from_json_string(cls, json: str) -> Document:
        ''' Load a document from JSON.

        json (str) :
            A string with a JSON-encoded document to create a new Document
            from.

        Returns:
            Document :

        '''
        json_parsed = loads(json)
        return cls.from_json(json_parsed)

    def get_model_by_id(self, model_id: ID) -> Model | None:
        ''' Find the model for the given ID in this document, or ``None`` if it
        is not found.

        Args:
            model_id (str) : The ID of the model to search for

        Returns:
            Model or None

        '''
        return self.models.get_by_id(model_id)

    def get_model_by_name(self, name: str) -> Model | None:
        ''' Find the model for the given name in this document, or ``None`` if
        it is not found.

        Args:
            name (str) : The name of the model to search for

        Returns:
            Model or None

        '''
        return self.models.get_one_by_name(name)

    def hold(self, policy: HoldPolicyType = "combine") -> None:
        ''' Activate a document hold.

        While a hold is active, no model changes will be applied, or trigger
        callbacks. Once ``unhold`` is called, the events collected during the
        hold will be applied according to the hold policy.

        Args:
            hold ('combine' or 'collect', optional)
                Whether events collected during a hold should attempt to be
                combined (default: 'combine')

                When set to ``'collect'`` all events will be collected and
                replayed in order as-is when ``unhold`` is called.

                When set to ``'combine'`` Bokeh will attempt to combine
                compatible events together. Typically, different events that
                change the same property on the same mode can be combined.
                For example, if the following sequence occurs:

                .. code-block:: python

                    doc.hold('combine')
                    slider.value = 10
                    slider.value = 11
                    slider.value = 12

                Then only *one* callback, for the last ``slider.value = 12``
                will be triggered.

        Returns:
            None

        .. note::
            ``hold`` only applies to document change events, i.e. setting
            properties on models. It does not apply to events such as
            ``ButtonClick``, etc.

        '''
        if self._hold is not None and self._hold != policy:
            log.warning(f"hold already active with '{self._hold}', ignoring '{policy}'")
            return
        if policy not in HoldPolicy:
            raise ValueError(f"Unknown hold policy {policy}")
        self._hold = policy

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
            self._trigger_on_change(event)

    def on_message(self, msg_type: str, callback: MessageCallback) -> None:
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is None:
            self._message_callbacks[msg_type] = [callback]
        elif callback not in message_callbacks:
            message_callbacks.append(callback)

    def remove_on_message(self, msg_type: str, callback: MessageCallback) -> None:
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is not None and callback in message_callbacks:
            message_callbacks.remove(callback)

    def on_event(self, event: str | Type[Event], *callbacks: EventCallback) -> None:
        ''' Provide callbacks to invoke if a bokeh event is received.

        '''
        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        if not issubclass(_CONCRETE_EVENT_CLASSES[event], DocumentEvent):
            raise ValueError("Document.on_event may only be used to subscribe "
                             "to events of type DocumentEvent. To subscribe "
                             "to a ModelEvent use the Model.on_event method.")

        for callback in callbacks:
            _check_callback(callback, ('event',), what='Event callback')

        if event not in self._event_callbacks:
            self._event_callbacks[event] = [cb for cb in callbacks]
        else:
            self._event_callbacks[event].extend(callbacks)

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

    def on_session_destroyed(self, *callbacks: SessionDestroyedCallback) -> None:
        ''' Provide callbacks to invoke when the session serving the Document
        is destroyed

        '''
        for callback in callbacks:
            _check_callback(callback, ('session_context',))
            self._session_destroyed_callbacks.add(callback)

    def remove_next_tick_callback(self, callback_obj: NextTickCallback) -> None:
        ''' Remove a callback added earlier with ``add_next_tick_callback``.

        Args:
            callback_obj : a value returned from ``add_next_tick_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self._remove_session_callback(callback_obj)

    def remove_on_change(self, *callbacks: Any) -> None:
        ''' Remove a callback added earlier with ``on_change``.

        Raises:
            KeyError, if the callback was never added

        '''
        for callback in callbacks:
            del self._change_callbacks[callback]

    def remove_periodic_callback(self, callback_obj: PeriodicCallback) -> None:
        ''' Remove a callback added earlier with ``add_periodic_callback``

        Args:
            callback_obj : a value returned from ``add_periodic_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been removed

        '''
        self._remove_session_callback(callback_obj)

    def remove_root(self, model: Model, setter: Setter | None = None) -> None:
        ''' Remove a model as root model from this Document.

        Changes to this model may still trigger ``on_change`` callbacks
        on this document, if the model is still referred to by other
        root models.

        Args:
            model (Model) :
                The model to add as a root of this document.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        '''
        if model not in self._roots:
            return

        with self.models.freeze():
            self._roots.remove(model)

        self._trigger_on_change(RootRemovedEvent(self, model, setter))

    def remove_timeout_callback(self, callback_obj: TimeoutCallback) -> None:
        ''' Remove a callback added earlier with ``add_timeout_callback``.

        Args:
            callback_obj : a value returned from ``add_timeout_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self._remove_session_callback(callback_obj)

    def replace_with_json(self, json: DocJson) -> None:
        ''' Overwrite everything in this document with the JSON-encoded
        document.

        json (JSON-data) :
            A JSON-encoded document to overwrite this one.

        Returns:
            None

        '''
        replacement = self.from_json(json)
        replacement._destructively_move(self)

    def select(self, selector: SelectorType) -> Iterable[Model]:
        ''' Query this document for objects that match the given selector.

        Args:
            selector (JSON-like query dictionary) : you can query by type or by
                name, e.g. ``{"type": HoverTool}``, ``{"name": "mycircle"}``

        Returns:
            seq[Model]

        '''
        if is_single_string_selector(selector, 'name'):
            # special-case optimization for by-name query
            return self.models.get_all_by_name(selector['name'])

        return find(self.models, selector)

    def select_one(self, selector: SelectorType) -> Model | None:
        ''' Query this document for objects that match the given selector.
        Raises an error if more than one object is found.  Returns
        single matching object, or None if nothing is found

        Args:
            selector (JSON-like query dictionary) : you can query by type or by
                name, e.g. ``{"type": HoverTool}``, ``{"name": "mycircle"}``

        Returns:
            Model or None

        '''
        result = list(self.select(selector))
        if len(result) > 1:
            raise ValueError(f"Found more than one model matching {selector}: {result!r}")
        if len(result) == 0:
            return None
        return result[0]

    def set_select(self, selector: SelectorType | Type[Model], updates: Dict[str, Unknown]) -> None:
        ''' Update objects that match a given selector with the specified
        attribute/value updates.

        Args:
            selector (JSON-like query dictionary) : you can query by type or by
                name,i e.g. ``{"type": HoverTool}``, ``{"name": "mycircle"}``
                updates (dict) :

        Returns:
            None

        '''
        if isinstance(selector, type) and issubclass(selector, Model):
            selector = dict(type=selector)
        for obj in self.select(selector):
            for key, val in updates.items():
                setattr(obj, key, val)

    def to_json(self) -> DocJson:
        ''' Convert this document to a JSON object.

        Return:
            JSON-data

        '''

        # this is a total hack to go via a string, needed because
        # our BokehJSONEncoder goes straight to a string.
        doc_json = self.to_json_string()
        return loads(doc_json)

    def to_json_string(self, indent: int | None = None) -> str:
        ''' Convert the document to a JSON string.

        Args:
            indent (int or None, optional) : number of spaces to indent, or
                None to suppress all newlines and indentation (default: None)

        Returns:
            str

        '''
        serializer = StaticSerializer()
        for model in Model.model_class_reverse_map.values():
            if is_DataModel(model):
                # TODO: serializer.serialize(model)
                model.static_to_serializable(serializer)

        root_ids = [ r.id for r in self._roots ]

        json = DocJson(
            title=self.title,
            defs=serializer.definitions,
            roots=RootsJson(
                root_ids=root_ids,
                references=references_json(self.models),
            ),
            version=__version__,
        )

        return serialize_json(json, indent=indent)

    def validate(self) -> None:
        ''' Perform integrity checks on the modes in this document.

        Returns:
            None

        '''
        for r in self.roots:
            refs = r.references()
            issues = check_integrity(refs)

            process_validation_issues(issues)

    # Private methods ---------------------------------------------------------

    def _add_session_callback(self, callback_obj: SessionCallback, callback: Callback, one_shot: bool) -> SessionCallback:
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
        if one_shot:
            @wraps(callback)
            def remove_then_invoke(*args, **kwargs):
                if callback_obj in self._session_callbacks:
                    self._remove_session_callback(callback_obj)
                return callback(*args, **kwargs)
            actual_callback = remove_then_invoke
        else:
            actual_callback = callback

        callback_obj._callback = self._wrap_with_self_as_curdoc(actual_callback)
        self._session_callbacks.add(callback_obj)

        # emit event so the session is notified of the new callback
        self._trigger_on_change(SessionCallbackAdded(self, callback_obj))

        return callback_obj

    def _destructively_move(self, dest_doc: Document) -> None:
        ''' Move all data in this doc to the dest_doc, leaving this doc empty.

        Args:
            dest_doc (Document) :
                The Bokeh document to populate with data from this one

        Returns:
            None

        '''

        if dest_doc is self:
            raise RuntimeError("Attempted to overwrite a document with itself")

        dest_doc.clear()
        # we have to remove ALL roots before adding any
        # to the new doc or else models referenced from multiple
        # roots could be in both docs at once, which isn't allowed.
        roots: List[Model] = []

        with self.models.freeze():
            while self.roots:
                r = next(iter(self.roots))
                self.remove_root(r)
                roots.append(r)

        for r in roots:
            if r.document is not None:
                raise RuntimeError("Somehow we didn't detach %r" % (r))

        if len(self.models) != 0:
            raise RuntimeError(f"_all_models still had stuff in it: {self.models!r}")

        for r in roots:
            dest_doc.add_root(r)

        dest_doc.title = self.title

    def _notify_change(self, model: Model, attr: str, old: Unknown, new: Unknown,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None, callback_invoker: Invoker | None = None) -> None:
        ''' Called by Model when it changes

        '''
        # if name changes, need to update by-name index
        if attr == 'name':
            self.models.update_name(model, old, new)

        if hint is None:
            serializable_new = model.lookup(attr).serializable_value(model)
        else:
            serializable_new = None

        event = ModelChangedEvent(self, model, attr, old, new, serializable_new, hint, setter, callback_invoker)
        self._trigger_on_change(event)

    def _remove_session_callback(self, callback_obj: SessionCallback) -> None:
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
        # emit event so the session is notified and can remove the callback
        for callback_obj in callback_objs:
            self._trigger_on_change(SessionCallbackRemoved(self, callback_obj))

    def set_title(self, title: str, setter: Setter | None = None) -> None:
        '''

        '''
        if title is None:
            raise ValueError("Document title may not be None")
        if self._title != title:
            self._title = title
            self._trigger_on_change(TitleChangedEvent(self, title, setter))

    def _trigger_on_change(self, event: DocumentChangedEvent) -> None:
        if self._hold == "collect":
            self._held_events.append(event)
            return
        elif self._hold == "combine":
            _combine_document_events(event, self._held_events)
            return

        if event.callback_invoker is not None:
            self._with_self_as_curdoc(event.callback_invoker)

        def invoke_callbacks():
            for cb in self._change_callbacks.values():
                cb(event)
        self._with_self_as_curdoc(invoke_callbacks)

    def _with_self_as_curdoc(self, f: Callable[[], None]) -> None:
        from ..io.doc import patch_curdoc

        doc = UnlockedDocumentProxy(self) if getattr(f, "nolock", False) else self

        with patch_curdoc(doc):
            return f()

    def _wrap_with_self_as_curdoc(self, f: F) -> F:
        @wraps(f)
        def wrapper(*args, **kwargs):
            @wraps(f)
            def invoke() -> None:
                return f(*args, **kwargs)
            return self._with_self_as_curdoc(invoke)
        return wrapper


def _combine_document_events(new_event: DocumentChangedEvent, old_events: List[DocumentChangedEvent]) -> None:
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

class StaticSerializer:

    _refs: Dict[object, Any] = {} # obj -> ref (dict, preferably dataclass)
    _defs: List[Any] = [] # (ref & def)[] (dict, preferably dataclass)

    def __init__(self) -> None:
        self._refs = {} # obj -> ref (dict, preferably dataclass)
        self._defs = [] # (ref & def)[] (dict, preferably dataclass)

    def serialize(self, obj: object) -> Any:
        pass # TODO: serialize built-ins, {to_serializable}, etc.

    def get_ref(self, obj: object) -> Any:
        return self._refs.get(obj, None)

    def add_ref(self, obj: object, obj_ref: Any, obj_def: Any) -> None:
        if obj not in self._refs:
            self._refs[obj] = obj_ref
            self._defs.append(obj_def)

    @property
    def definitions(self) -> List[Any]:
        return list(self._defs)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
