#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from collections import defaultdict
from functools import wraps
from inspect import isclass
from json import loads
from typing import Any, Callable, Dict, List

# External imports
import jinja2

# Bokeh imports
from ..core.enums import HoldPolicy
from ..core.json_encoder import serialize_json
from ..core.query import find
from ..core.templates import FILE
from ..core.validation import check_integrity
from ..events import Event
from ..model import Model
from ..themes import Theme, built_in_themes
from ..themes import default as default_theme
from ..util.callback_manager import _check_callback
from ..util.datatypes import MultiValuedDict
from ..util.version import __version__
from .events import (
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
    SessionCallbackAdded,
    SessionCallbackRemoved,
    TitleChangedEvent,
)
from .locking import UnlockedDocumentProxy
from .util import (
    initialize_references_json,
    instantiate_references_json,
    references_json,
)

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

class Document(object):
    ''' The basic unit of serialization for Bokeh.

    Document instances collect Bokeh models (e.g. plots, layouts, widgets,
    etc.) so that they may be reflected into the BokehJS client runtime.
    Because models may refer to other models (e.g., a plot *has* a list of
    renderers), it is not generally useful or meaningful to convert individual
    models to JSON. Accordingly,  the ``Document`` is thus the smallest unit
    of serialization for Bokeh.

    '''

    _message_callbacks: Dict[str, List[Callable[[Any], None]]]

    def __init__(self, **kwargs):
        self._roots = list()
        self._theme = kwargs.pop('theme', default_theme)
        # use _title directly because we don't need to trigger an event
        self._title = kwargs.pop('title', DEFAULT_TITLE)
        self._template = FILE
        self._all_models_freeze_count = 0
        self._all_models = dict()
        self._all_models_by_name = MultiValuedDict()
        self._all_former_model_ids = set()
        self._callbacks = {}
        self._message_callbacks = {}
        self._session_destroyed_callbacks = set()
        self._session_callbacks = set()
        self._session_context = None
        self._modules = []
        self._template_variables = {}
        self._hold = None
        self._held_events = []

        # set of models subscribed to user events
        self._subscribed_models = defaultdict(set)
        self.on_message("bokeh_event", self.apply_json_event)

        self._callback_objs_by_callable = {self.add_next_tick_callback: defaultdict(set),
                                           self.add_periodic_callback: defaultdict(set),
                                           self.add_timeout_callback: defaultdict(set)}

    # Properties --------------------------------------------------------------

    @property
    def roots(self):
        ''' A list of all the root models in this Document.

        '''
        return list(self._roots)

    @property
    def session_callbacks(self):
        ''' A list of all the session callbacks on this document.

        '''
        return list(self._session_callbacks)

    @property
    def session_destroyed_callbacks(self):
        ''' A list of all the on_session_destroyed callbacks on this document.

        '''
        return self._session_destroyed_callbacks

    @session_destroyed_callbacks.setter
    def session_destroyed_callbacks(self, callbacks):
        self._session_destroyed_callbacks = callbacks

    @property
    def session_context(self):
        ''' The ``SessionContext`` for this document.

        '''
        return self._session_context

    @property
    def template(self):
        ''' A Jinja2 template to use for rendering this document.

        '''
        return self._template

    @template.setter
    def template(self, template):
        if not isinstance(template, (jinja2.Template, str)):
            raise ValueError("document template must be Jinja2 template or a string")
        self._template = template

    @property
    def template_variables(self):
        ''' A dictionary of template variables to pass when rendering
        ``self.template``.

        '''
        return self._template_variables

    @property
    def theme(self):
        ''' The current ``Theme`` instance affecting models in this Document.

        Setting this to ``None`` sets the default theme. (i.e this property
        never returns ``None``.)

        Changing theme may trigger model change events on the models in the
        document if the theme modifies any model properties.

        '''
        return self._theme

    @theme.setter
    def theme(self, theme):
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

        for model in self._all_models.values():
            self._theme.apply_to_model(model)

    @property
    def title(self):
        ''' A title for this document.

        This title will be set on standalone HTML documents, but not e.g. when
        ``autoload_server`` is used.

        '''
        return self._title

    @title.setter
    def title(self, title):
        self._set_title(title)

    # Public methods ----------------------------------------------------------

    def add_next_tick_callback(self, callback):
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
        cb = NextTickCallback(self, None)
        return self._add_session_callback(cb, callback, one_shot=True, originator=self.add_next_tick_callback)

    def add_periodic_callback(self, callback, period_milliseconds):
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
        cb = PeriodicCallback(self,
                              None,
                              period_milliseconds)
        return self._add_session_callback(cb, callback, one_shot=False, originator=self.add_periodic_callback)

    def add_root(self, model, setter=None):
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
        self._push_all_models_freeze()
        # TODO (bird) Should we do some kind of reporting of how many
        # LayoutDOM's are in the document roots? In vanilla bokeh cases e.g.
        # output_file more than one LayoutDOM is probably not going to go
        # well. But in embedded cases, you may well want more than one.
        try:
            self._roots.append(model)
        finally:
            self._pop_all_models_freeze()
        self._trigger_on_change(RootAddedEvent(self, model, setter))

    def add_timeout_callback(self, callback, timeout_milliseconds):
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
        cb = TimeoutCallback(self,
                             None,
                             timeout_milliseconds)
        return self._add_session_callback(cb, callback, one_shot=True, originator=self.add_timeout_callback)

    def apply_json_event(self, json):
        event = Event.decode_json(json)
        if not isinstance(event, Event):
            log.warning('Could not decode event json: %s' % json)
        else:
            subscribed = self._subscribed_models[event.event_name].copy()
            for model in subscribed:
                model._trigger_event(event)

    def apply_json_patch(self, patch, setter=None):
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
        references = instantiate_references_json(references_json)

        # Use our existing model instances whenever we have them
        for obj in references.values():
            if obj.id in self._all_models:
                references[obj.id] = self._all_models[obj.id]

        # The model being changed isn't always in references so add it in
        for event_json in events_json:
            if 'model' in event_json:
                model_id = event_json['model']['id']
                if model_id in self._all_models:
                    references[model_id] = self._all_models[model_id]

        initialize_references_json(references_json, references, setter)

        for event_json in events_json:
            if event_json['kind'] == 'MessageSent':
                self._trigger_on_message(event_json["msg_type"], event_json["msg_data"])

            elif event_json['kind'] == 'ModelChanged':
                patched_id = event_json['model']['id']
                if patched_id not in self._all_models:
                    if patched_id not in self._all_former_model_ids:
                        raise RuntimeError("Cannot apply patch to %s which is not in the document" % (str(patched_id)))
                    else:
                        log.debug("Cannot apply patch to %s which is not in the document anymore. This is usually harmless" % (str(patched_id)))
                        break
                patched_obj = self._all_models[patched_id]
                attr = event_json['attr']
                value = event_json['new']
                patched_obj.set_from_json(attr, value, models=references, setter=setter)

            elif event_json['kind'] == 'ColumnDataChanged':
                source_id = event_json['column_source']['id']
                if source_id not in self._all_models:
                    raise RuntimeError("Cannot apply patch to %s which is not in the document" % (str(source_id)))
                source = self._all_models[source_id]
                value = event_json['new']
                source.set_from_json('data', value, models=references, setter=setter)

            elif event_json['kind'] == 'ColumnsStreamed':
                source_id = event_json['column_source']['id']
                if source_id not in self._all_models:
                    raise RuntimeError("Cannot stream to %s which is not in the document" % (str(source_id)))
                source = self._all_models[source_id]
                data = event_json['data']
                rollover = event_json.get('rollover', None)
                source._stream(data, rollover, setter)

            elif event_json['kind'] == 'ColumnsPatched':
                source_id = event_json['column_source']['id']
                if source_id not in self._all_models:
                    raise RuntimeError("Cannot apply patch to %s which is not in the document" % (str(source_id)))
                source = self._all_models[source_id]
                patches = event_json['patches']
                source.patch(patches, setter)

            elif event_json['kind'] == 'RootAdded':
                root_id = event_json['model']['id']
                root_obj = references[root_id]
                self.add_root(root_obj, setter)

            elif event_json['kind'] == 'RootRemoved':
                root_id = event_json['model']['id']
                root_obj = references[root_id]
                self.remove_root(root_obj, setter)

            elif event_json['kind'] == 'TitleChanged':
                self._set_title(event_json['title'], setter)

            else:
                raise RuntimeError("Unknown patch event " + repr(event_json))

    def apply_json_patch_string(self, patch):
        ''' Apply a JSON patch provided as a string.

        Args:
            patch (str) :

        Returns:
            None

        '''
        json_parsed = loads(patch)
        self.apply_json_patch(json_parsed)

    def clear(self):
        ''' Remove all content from the document but do not reset title.

        Returns:
            None

        '''
        self._push_all_models_freeze()
        try:
            while len(self._roots) > 0:
                r = next(iter(self._roots))
                self.remove_root(r)
        finally:
            self._pop_all_models_freeze()

    def destroy(self, session):
        self.remove_on_change(session)

        # probably better to implement a destroy protocol on models to
        # untangle everything, then the collect below might not be needed
        for m in self._all_models.values():
            m._document = None
            del m

        self._roots = []
        self._all_models = None
        self._all_models_by_name = None
        self._theme = None
        self._template = None
        self._session_context = None
        self.delete_modules()

        import gc
        gc.collect()

    def delete_modules(self):
        ''' Clean up after any modules created by this Document when its session is
        destroyed.

        '''
        from gc import get_referrers
        from types import FrameType

        log.debug("Deleting %s modules for %s" % (len(self._modules), self))

        for module in self._modules:

            # Modules created for a Document should have three referrers at this point:
            #
            # - sys.modules
            # - self._modules
            # - a frame object
            #
            # This function will take care of removing these expected references.
            #
            # If there are any additional referrers, this probably means the module will be
            # leaked. Here we perform a detailed check that the only referrers are expected
            # ones. Otherwise issue an error log message with details.
            referrers = get_referrers(module)
            referrers = [x for x in referrers if x is not sys.modules]  # lgtm [py/comparison-using-is]
            referrers = [x for x in referrers if x is not self._modules]  # lgtm [py/comparison-using-is]
            referrers = [x for x in referrers if not isinstance(x, FrameType)]
            if len(referrers) != 0:
                log.error("Module %r has extra unexpected referrers! This could indicate a serious memory leak. Extra referrers: %r" % (module, referrers))

            # remove the reference from sys.modules
            if module.__name__ in sys.modules:
                del sys.modules[module.__name__]

        # remove the reference from self._modules
        self._modules = None

        # the frame reference will take care of itself

    @classmethod
    def from_json(cls, json):
        ''' Load a document from JSON.

        json (JSON-data) :
            A JSON-encoded document to create a new Document from.

        Returns:
            Document :

        '''
        roots_json = json['roots']
        root_ids = roots_json['root_ids']
        references_json = roots_json['references']

        references = instantiate_references_json(references_json)
        initialize_references_json(references_json, references)

        doc = Document()
        for r in root_ids:
            doc.add_root(references[r])

        doc.title = json['title']

        return doc

    @classmethod
    def from_json_string(cls, json):
        ''' Load a document from JSON.

        json (str) :
            A string with a JSON-encoded document to create a new Document
            from.

        Returns:
            Document :

        '''
        json_parsed = loads(json)
        return cls.from_json(json_parsed)

    def get_model_by_id(self, model_id):
        ''' Find the model for the given ID in this document, or ``None`` if it
        is not found.

        Args:
            model_id (str) : The ID of the model to search for

        Returns:
            Model or None

        '''
        return self._all_models.get(model_id)

    def get_model_by_name(self, name):
        ''' Find the model for the given name in this document, or ``None`` if
        it is not found.

        Args:
            name (str) : The name of the model to search for

        Returns:
            Model or None

        '''
        return self._all_models_by_name.get_one(name, "Found more than one model named '%s'" % name)

    def hold(self, policy="combine"):
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
            log.warning("hold already active with '%s', ignoring '%s'" % (self._hold, policy))
            return
        if policy not in HoldPolicy:
            raise ValueError("Unknown hold policy %r" % policy)
        self._hold = policy

    def unhold(self):
        ''' Turn off any active document hold and apply any collected events.

        Returns:
            None

        '''
        # no-op if we are already no holding
        if self._hold is None: return

        self._hold = None
        events = list(self._held_events)
        self._held_events = []

        for event in events:
            self._trigger_on_change(event)

    def on_message(self, msg_type: str, callback: Callable[[Any], None]) -> None:
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is None:
            self._message_callbacks[msg_type] = [callback]
        elif callback not in message_callbacks:
            message_callbacks.append(callback)

    def remove_on_message(self, msg_type: str, callback: Callable[[Any], None]) -> None:
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is not None and callback in message_callbacks:
            message_callbacks.remove(callback)

    def _trigger_on_message(self, msg_type: str, msg_data: Any) -> None:
        message_callbacks = self._message_callbacks.get(msg_type, None)
        if message_callbacks is not None:
            for cb in message_callbacks:
                cb(msg_data)

    def on_change(self, *callbacks):
        ''' Provide callbacks to invoke if the document or any Model reachable
        from its roots changes.

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            _check_callback(callback, ('event',))

            self._callbacks[callback] = callback

    def on_change_dispatch_to(self, receiver):
        if not receiver in self._callbacks:
            self._callbacks[receiver] = lambda event: event.dispatch(receiver)

    def on_session_destroyed(self, *callbacks):
        ''' Provide callbacks to invoke when the session serving the Document
        is destroyed

        '''
        for callback in callbacks:
            _check_callback(callback, ('session_context',))
            self._session_destroyed_callbacks.add(callback)

    def remove_next_tick_callback(self, callback_obj):
        ''' Remove a callback added earlier with ``add_next_tick_callback``.

        Args:
            callback_obj : a value returned from ``add_next_tick_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self._remove_session_callback(callback_obj, self.add_next_tick_callback)

    def remove_on_change(self, *callbacks):
        ''' Remove a callback added earlier with ``on_change``.

        Raises:
            KeyError, if the callback was never added

        '''
        for callback in callbacks:
            del self._callbacks[callback]

    def remove_periodic_callback(self, callback_obj):
        ''' Remove a callback added earlier with ``add_periodic_callback``

        Args:
            callback_obj : a value returned from ``add_periodic_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been removed

        '''
        self._remove_session_callback(callback_obj, self.add_periodic_callback)

    def remove_root(self, model, setter=None):
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
            return # TODO (bev) ValueError?
        self._push_all_models_freeze()
        try:
            self._roots.remove(model)
        finally:
            self._pop_all_models_freeze()
        self._trigger_on_change(RootRemovedEvent(self, model, setter))

    def remove_timeout_callback(self, callback_obj):
        ''' Remove a callback added earlier with ``add_timeout_callback``.

        Args:
            callback_obj : a value returned from ``add_timeout_callback``

        Returns:
            None

        Raises:
            ValueError, if the callback was never added or has already been run or removed

        '''
        self._remove_session_callback(callback_obj, self.add_timeout_callback)

    def replace_with_json(self, json):
        ''' Overwrite everything in this document with the JSON-encoded
        document.

        json (JSON-data) :
            A JSON-encoded document to overwrite this one.

        Returns:
            None

        '''
        replacement = self.from_json(json)
        replacement._destructively_move(self)

    def select(self, selector):
        ''' Query this document for objects that match the given selector.

        Args:
            selector (JSON-like query dictionary) : you can query by type or by
                name, e.g. ``{"type": HoverTool}``, ``{"name": "mycircle"}``

        Returns:
            seq[Model]

        '''
        if self._is_single_string_selector(selector, 'name'):
            # special-case optimization for by-name query
            return self._all_models_by_name.get_all(selector['name'])
        else:
            return find(self._all_models.values(), selector)

    def select_one(self, selector):
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
            raise ValueError("Found more than one model matching %s: %r" % (selector, result))
        if len(result) == 0:
            return None
        return result[0]

    def set_select(self, selector, updates):
        ''' Update objects that match a given selector with the specified
        attribute/value updates.

        Args:
            selector (JSON-like query dictionary) : you can query by type or by
                name,i e.g. ``{"type": HoverTool}``, ``{"name": "mycircle"}``
                updates (dict) :

        Returns:
            None

        '''
        if isclass(selector) and issubclass(selector, Model):
            selector = dict(type=selector)
        for obj in self.select(selector):
            for key, val in updates.items():
                setattr(obj, key, val)

    def to_json(self):
        ''' Convert this document to a JSON object.

        Return:
            JSON-data

        '''

        # this is a total hack to go via a string, needed because
        # our BokehJSONEncoder goes straight to a string.
        doc_json = self.to_json_string()
        return loads(doc_json)

    def to_json_string(self, indent=None) -> str:
        ''' Convert the document to a JSON string.

        Args:
            indent (int or None, optional) : number of spaces to indent, or
                None to suppress all newlines and indentation (default: None)

        Returns:
            str

        '''
        root_ids = []
        for r in self._roots:
            root_ids.append(r.id)

        root_references = self._all_models.values()

        json = {
            'title' : self.title,
            'roots' : {
                'root_ids' : root_ids,
                'references' : references_json(root_references)
            },
            'version' : __version__
        }

        return serialize_json(json, indent=indent)

    def validate(self):
        ''' Perform integrity checks on the modes in this document.

        Returns:
            None

        '''
        for r in self.roots:
            refs = r.references()
            check_integrity(refs)

    # Private methods ---------------------------------------------------------

    def _add_session_callback(self, callback_obj, callback, one_shot, originator):
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
                    self._remove_session_callback(callback_obj, originator)
                return callback(*args, **kwargs)
            actual_callback = remove_then_invoke
        else:
            actual_callback = callback

        callback_obj._callback = self._wrap_with_self_as_curdoc(actual_callback)
        self._session_callbacks.add(callback_obj)
        self._callback_objs_by_callable[originator][callback].add(callback_obj)

        # emit event so the session is notified of the new callback
        self._trigger_on_change(SessionCallbackAdded(self, callback_obj))

        return callback_obj

    def _destructively_move(self, dest_doc):
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
        roots = []
        self._push_all_models_freeze()
        try:
            while self.roots:
                r = next(iter(self.roots))
                self.remove_root(r)
                roots.append(r)
        finally:
            self._pop_all_models_freeze()
        for r in roots:
            if r.document is not None:
                raise RuntimeError("Somehow we didn't detach %r" % (r))
        if len(self._all_models) != 0:
            raise RuntimeError("_all_models still had stuff in it: %r" % (self._all_models))
        for r in roots:
            dest_doc.add_root(r)

        dest_doc.title = self.title

    def _invalidate_all_models(self):
        '''

        '''

        # if freeze count is > 0, we'll recompute on unfreeze
        if self._all_models_freeze_count == 0:
            self._recompute_all_models()

    def _is_single_string_selector(self, selector, field):
        '''

        '''

        if len(selector) != 1:
            return False
        if field not in selector:
            return False
        return isinstance(selector[field], str)

    def _notify_change(self, model, attr, old, new, hint=None, setter=None, callback_invoker=None):
        ''' Called by Model when it changes

        '''
        # if name changes, update by-name index
        if attr == 'name':
            if old is not None:
                self._all_models_by_name.remove_value(old, model)
            if new is not None:
                self._all_models_by_name.add_value(new, model)

        if hint is None:
            serializable_new = model.lookup(attr).serializable_value(model)
        else:
            serializable_new = None

        event = ModelChangedEvent(self, model, attr, old, new, serializable_new, hint, setter, callback_invoker)
        self._trigger_on_change(event)

    def _push_all_models_freeze(self):
        '''

        '''
        self._all_models_freeze_count += 1

    def _pop_all_models_freeze(self):
        '''

        '''
        self._all_models_freeze_count -= 1
        if self._all_models_freeze_count == 0:
            self._recompute_all_models()

    def _recompute_all_models(self):
        '''

        '''
        new_all_models_set = set()
        for r in self.roots:
            new_all_models_set = new_all_models_set.union(r.references())
        old_all_models_set = set(self._all_models.values())
        to_detach = old_all_models_set - new_all_models_set
        to_attach = new_all_models_set - old_all_models_set

        recomputed = {}
        recomputed_by_name = MultiValuedDict()
        for m in new_all_models_set:
            recomputed[m.id] = m
            if m.name is not None:
                recomputed_by_name.add_value(m.name, m)
        for d in to_detach:
            self._all_former_model_ids.add(d.id)
            d._detach_document()
        for a in to_attach:
            a._attach_document(self)
        self._all_models = recomputed
        self._all_models_by_name = recomputed_by_name

    def _remove_session_callback(self, callback_obj, originator):
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
            for cb, cb_objs in list(self._callback_objs_by_callable[originator].items()):
                try:
                    cb_objs.remove(callback_obj)
                    if not cb_objs:
                        del self._callback_objs_by_callable[originator][cb]
                except KeyError:
                    pass
        except KeyError:
            raise ValueError("callback already ran or was already removed, cannot be removed again")
        # emit event so the session is notified and can remove the callback
        for callback_obj in callback_objs:
            self._trigger_on_change(SessionCallbackRemoved(self, callback_obj))

    def _set_title(self, title, setter=None):
        '''

        '''
        if title is None:
            raise ValueError("Document title may not be None")
        if self._title != title:
            self._title = title
            self._trigger_on_change(TitleChangedEvent(self, title, setter))

    def _trigger_on_change(self, event):
        '''

        '''
        if self._hold == "collect":
            self._held_events.append(event)
            return
        elif self._hold == "combine":
            _combine_document_events(event, self._held_events)
            return

        if event.callback_invoker is not None:
            self._with_self_as_curdoc(event.callback_invoker)

        def invoke_callbacks():
            for cb in self._callbacks.values():
                cb(event)
        self._with_self_as_curdoc(invoke_callbacks)

    def _with_self_as_curdoc(self, f):
        '''

        '''
        from bokeh.io.doc import set_curdoc, curdoc
        old_doc = curdoc()
        try:
            if getattr(f, "nolock", False):
                set_curdoc(UnlockedDocumentProxy(self))
            else:
                set_curdoc(self)
            return f()
        finally:
            set_curdoc(old_doc)

    def _wrap_with_self_as_curdoc(self, f):
        '''

        '''
        doc = self
        @wraps(f)
        def wrapper(*args, **kwargs):
            @wraps(f)
            def invoke():
                return f(*args, **kwargs)
            return doc._with_self_as_curdoc(invoke)
        return wrapper


def _combine_document_events(new_event, old_events):
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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
