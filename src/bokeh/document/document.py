#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import gc
import weakref
from json import loads
from typing import TYPE_CHECKING, Any, Iterable

# External imports
from jinja2 import Template

# Bokeh imports
from ..core.enums import HoldPolicyType
from ..core.has_props import is_DataModel
from ..core.query import find, is_single_string_selector
from ..core.serialization import (
    Deserializer,
    Serialized,
    Serializer,
    UnknownReferenceError,
)
from ..core.templates import FILE
from ..core.types import ID
from ..core.validation import check_integrity, process_validation_issues
from ..events import Event
from ..model import Model
from ..themes import Theme, built_in_themes, default as default_theme
from ..util.serialization import make_id
from ..util.strings import nice_join
from ..util.version import __version__
from .callbacks import (
    Callback,
    DocumentCallbackManager,
    EventCallback,
    JSEventCallback,
    MessageCallback,
)
from .events import (
    DocumentPatchedEvent,
    RootAddedEvent,
    RootRemovedEvent,
    TitleChangedEvent,
)
from .json import DocJson, PatchJson
from .models import DocumentModelManager
from .modules import DocumentModuleManager

if TYPE_CHECKING:
    from ..application.application import SessionContext, SessionDestroyedCallback
    from ..core.has_props import Setter
    from ..core.query import SelectorType
    from ..server.callbacks import (
        NextTickCallback,
        PeriodicCallback,
        SessionCallback,
        TimeoutCallback,
    )
    from .events import DocumentChangeCallback

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

class Document:
    ''' The basic unit of serialization for Bokeh.

    Document instances collect Bokeh models (e.g. plots, layouts, widgets,
    etc.) so that they may be reflected into the BokehJS client runtime.
    Because models may refer to other models (e.g., a plot *has* a list of
    renderers), it is not generally useful or meaningful to convert individual
    models to JSON. Accordingly,  the ``Document`` is thus the smallest unit
    of serialization for Bokeh.

    '''

    callbacks: DocumentCallbackManager
    models: DocumentModelManager
    modules: DocumentModuleManager

    _roots: list[Model]
    _theme: Theme
    _title: str
    _template: Template
    _session_context: weakref.ReferenceType[SessionContext] | None
    _template_variables: dict[str, Any]

    def __init__(self, *, theme: Theme = default_theme, title: str = DEFAULT_TITLE) -> None:
        self.callbacks = DocumentCallbackManager(self)
        self.models = DocumentModelManager(self)
        self.modules = DocumentModuleManager(self)

        self._roots = []
        self._template = FILE
        self._template_variables = {}
        self._theme = theme
        self._title = title # avoid triggering title event

        self._session_context = None

    # Properties --------------------------------------------------------------

    @property
    def roots(self) -> list[Model]:
        ''' A list of all the root models in this Document.

        '''
        return list(self._roots)

    @property
    def session_callbacks(self) -> list[SessionCallback]:
        ''' A list of all the session callbacks for this document.

        '''
        return self.callbacks.session_callbacks

    @property
    def session_destroyed_callbacks(self) -> set[SessionDestroyedCallback]:
        ''' A list of all the on_session_destroyed callbacks for this document.

        '''
        return self.callbacks.session_destroyed_callbacks

    @session_destroyed_callbacks.setter
    def session_destroyed_callbacks(self, callbacks: set[SessionDestroyedCallback]) -> None:
        self.callbacks.session_destroyed_callbacks = callbacks

    @property
    def session_context(self) -> SessionContext | None:
        ''' The ``SessionContext`` for this document.

        '''
        return self._session_context() if self._session_context is not None else None

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
    def template_variables(self) -> dict[str, Any]:
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
        theme = default_theme if theme is None else theme

        if isinstance(theme, str):
            try:
                theme = built_in_themes[theme]
            except KeyError:
                raise ValueError(f"{theme} is not a built-in theme; available themes are {nice_join(built_in_themes)}")

        if not isinstance(theme, Theme):
            raise ValueError("Theme must be a string or an instance of the Theme class")

        if self._theme is theme:
            return

        self._theme = theme

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
        return self.callbacks.add_session_callback(cb, callback, one_shot=True)

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
        return self.callbacks.add_session_callback(cb, callback, one_shot=False)

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

        self.callbacks.trigger_on_change(RootAddedEvent(self, model, setter))

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
        return self.callbacks.add_session_callback(cb, callback, one_shot=True)

    def apply_json_patch(self, patch_json: PatchJson | Serialized[PatchJson], *, setter: Setter | None = None) -> None:
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
        deserializer = Deserializer(list(self.models), setter=setter)

        try:
            patch: PatchJson = deserializer.deserialize(patch_json)
        except UnknownReferenceError as error:
            if self.models.seen(error.id):
                logging.warning(f"""\
Dropping a patch because it contains a previously known reference (id={error.id!r}). \
Most of the time this is harmless and usually a result of updating a model on one \
side of a communications channel while it was being removed on the other end.\
""")
                return
            else:
                raise

        events = patch["events"]
        assert isinstance(events, list) # list[DocumentPatched]

        for event in events:
            # TODO: assert isinstance(event, DocumentPatchedEvent)
            DocumentPatchedEvent.handle_event(self, event, setter)

        self.models.flush_synced(lambda model: not deserializer.has_ref(model))

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

        self.callbacks.destroy()
        self.models.destroy()
        self.modules.destroy()

        # TODO (bev) ideally this should not be needed, but removing it will probably
        # require converting all Model back-references to Document to be weakrefs
        gc.collect()

    @classmethod
    def from_json(cls, doc_json: DocJson | Serialized[DocJson]) -> Document:
        ''' Load a document from JSON.

        doc_json (JSON-data) :
            A JSON-encoded document to create a new Document from.

        Returns:
            Document :

        '''
        # TODO: deserialize model definitions
        if isinstance(doc_json, dict):
            doc_json["defs"] = []

        deserializer = Deserializer()
        doc_struct = deserializer.deserialize(doc_json)

        roots = doc_struct["roots"]
        title = doc_struct["title"]

        doc = Document()
        for root in roots:
            doc.add_root(root)

        doc.title = title
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
        self.callbacks.hold(policy)

    def on_change(self, *callbacks: DocumentChangeCallback) -> None:
        ''' Provide callbacks to invoke if the document or any Model reachable
        from its roots changes.

        '''
        self.callbacks.on_change(*callbacks)

    def on_change_dispatch_to(self, receiver: Any) -> None:
        '''

        '''
        self.callbacks.on_change_dispatch_to(receiver)

    def on_event(self, event: str | type[Event], *callbacks: EventCallback) -> None:
        ''' Provide callbacks to invoke if a bokeh event is received.

        '''
        self.callbacks.on_event(event, *callbacks)

    def js_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None:
        ''' Provide JS callbacks to invoke if a bokeh event is received.

        '''
        self.callbacks.js_on_event(event, *callbacks)

    def on_message(self, msg_type: str, *callbacks: MessageCallback) -> None:
        '''

        '''
        self.callbacks.on_message(msg_type, *callbacks)

    def on_session_destroyed(self, *callbacks: SessionDestroyedCallback) -> None:
        ''' Provide callbacks to invoke when the session serving the Document
        is destroyed

        '''
        self.callbacks.on_session_destroyed(*callbacks)

    def remove_next_tick_callback(self, callback_obj: NextTickCallback) -> None:
        ''' Remove a callback added earlier with ``add_next_tick_callback``.

        Args:
            callback_obj : a value returned from ``add_next_tick_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self.callbacks.remove_session_callback(callback_obj)

    def remove_on_change(self, *callbacks: Any) -> None:
        ''' Remove a callback added earlier with ``on_change``.

        Raises:
            KeyError, if the callback was never added

        '''
        self.callbacks.remove_on_change(*callbacks)

    def remove_on_message(self, msg_type: str, callback: MessageCallback) -> None:
        '''

        '''
        self.callbacks.remove_on_message(msg_type, callback)

    def remove_periodic_callback(self, callback_obj: PeriodicCallback) -> None:
        ''' Remove a callback added earlier with ``add_periodic_callback``

        Args:
            callback_obj : a value returned from ``add_periodic_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been removed

        '''
        self.callbacks.remove_session_callback(callback_obj)

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

        self.callbacks.trigger_on_change(RootRemovedEvent(self, model, setter))

    def remove_timeout_callback(self, callback_obj: TimeoutCallback) -> None:
        ''' Remove a callback added earlier with ``add_timeout_callback``.

        Args:
            callback_obj : a value returned from ``add_timeout_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self.callbacks.remove_session_callback(callback_obj)

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

    def set_select(self, selector: SelectorType | type[Model], updates: dict[str, Any]) -> None:
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

    def set_title(self, title: str, setter: Setter | None = None) -> None:
        '''

        '''
        if title is None:
            raise ValueError("Document title may not be None")
        if self._title != title:
            self._title = title
            self.callbacks.trigger_on_change(TitleChangedEvent(self, title, setter))

    def to_json(self, *, deferred: bool = True) -> DocJson:
        ''' Convert this document to a JSON-serializble object.

        Return:
            DocJson

        '''
        data_models = [ model for model in Model.model_class_reverse_map.values() if is_DataModel(model) ]

        serializer = Serializer(deferred=deferred)
        defs = serializer.encode(data_models)
        roots = serializer.encode(self._roots)
        callbacks = serializer.encode(self.callbacks._js_event_callbacks)

        doc_json = DocJson(
            version=__version__,
            title=self.title,
            roots=roots,
        )

        if data_models:
            doc_json["defs"] = defs
        if self.callbacks._js_event_callbacks:
            doc_json["callbacks"] = callbacks

        self.models.flush_synced()
        return doc_json

    def unhold(self) -> None:
        ''' Turn off any active document hold and apply any collected events.

        Returns:
            None

        '''
        self.callbacks.unhold()

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
        roots: list[Model] = []

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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
