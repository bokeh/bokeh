''' Provide the ``Document`` class, which is a container for Bokeh Models to
be reflected to the client side BokehJS library.

As a concrete example, consider a column layout with ``Slider`` and ``Select``
widgets, and a plot with some tools, an axis and grid, and a glyph renderer
for circles. A simplified representation oh this document might look like the
figure below:

.. figure:: /_images/document.svg
    :align: center
    :width: 65%

    A Bokeh Document is a collection of Bokeh Models (e.g. plots, tools,
    glyphs, etc.) that can be serialized as a single collection.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

from json import loads
import sys

import jinja2
from six import string_types

from .core.json_encoder import serialize_json
from .core.query import find
from .core.templates import FILE
from .core.validation import check_integrity
from .model import collect_models, get_class
from .themes import default as default_theme
from .themes import Theme
from .util.callback_manager import _check_callback
from .util.datatypes import MultiValuedDict
from .util.future import wraps
from .util.version import __version__

DEFAULT_TITLE = "Bokeh Application"

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

class Document(object):
    ''' The basic unit of serialization for Bokeh.

    Document instances collect Bokeh models (e.g. plots, layouts, widgets,
    etc.) so that they may be reflected into the BokehJS client runtime.
    Because models may refer to other models (e.g., a plot *has* a list of
    renderers), it is not generally useful or meaningful to convert individual
    models to JSON. Accordingly,  the ``Document`` is thus the smallest unit
    of serialization for Bokeh.

    '''
    def __init__(self, **kwargs):
        self._roots = list()
        self._theme = kwargs.pop('theme', default_theme)
        # use _title directly because we don't need to trigger an event
        self._title = kwargs.pop('title', DEFAULT_TITLE)
        self._template = FILE
        self._all_models_freeze_count = 0
        self._all_models = dict()
        self._all_models_by_name = MultiValuedDict()
        self._callbacks = {}
        self._session_callbacks = {}
        self._session_context = None
        self._modules = []
        self._template_variables = {}

    def delete_modules(self):
        ''' Clean up sys.modules after the session is destroyed.
        '''
        for module in self._modules:
            if module.__name__ in sys.modules:
                del sys.modules[module.__name__]

    @property
    def roots(self):
        ''' A list of all the root models in this Document.

        '''
        return list(self._roots)

    @property
    def session_callbacks(self):
        ''' A list of all the session callbacks on this document.

        '''
        return list(self._session_callbacks.values())

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
        if not isinstance(template, jinja2.Template):
            raise ValueError("Document templates must be Jinja2 Templates")
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
        if not isinstance(theme, Theme):
            raise ValueError("Theme must be an instance of the Theme class")
        if self._theme is theme:
            return
        self._theme = theme
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

    def add_next_tick_callback(self, callback):
        ''' Add callback to be invoked once on the next tick of the event loop.

        Args:
            callback (callable) :
                A callback function to execute on the next tick.

        Returns:
            NextTickCallback :

        .. note::
            Next tick callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from .server.callbacks import NextTickCallback
        cb = NextTickCallback(self, None)
        return self._add_session_callback(cb, callback, one_shot=True)

    def add_periodic_callback(self, callback, period_milliseconds):
        ''' Add a callback to be invoked on a session periodically.

        Args:
            callback (callable) :
                A callback function to execute periodically

            period_milliseconds (int) :
                Number of milliseconds between each callback execution.

        Returns:
            PeriodicCallback :

        .. note::
            Periodic callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from .server.callbacks import PeriodicCallback
        cb = PeriodicCallback(self,
                              None,
                              period_milliseconds)
        return self._add_session_callback(cb, callback, one_shot=False)

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
        from .server.events import RootAddedEvent

        if model in self._roots:
            return
        self._push_all_models_freeze()
        # TODO (bird) Should we do some kind of reporting of how many LayoutDOM
        # items are in the document roots. In vanilla bokeh cases e.g.
        # output_file, output_server more than one LayoutDOM is probably not
        # going to go well. But in embedded cases, you may well want more than
        # one.
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
            TimeoutCallback :

        .. note::
            Timeout callbacks only work within the context of a Bokeh server
            session. This function will no effect when Bokeh outputs to
            standalone HTML or Jupyter notebook cells.

        '''
        from .server.callbacks import TimeoutCallback
        cb = TimeoutCallback(self,
                             None,
                             timeout_milliseconds)
        return self._add_session_callback(cb, callback, one_shot=True)

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
        references = self._instantiate_references_json(references_json)

        # Use our existing model instances whenever we have them
        for obj in references.values():
            if obj._id in self._all_models:
                references[obj._id] = self._all_models[obj._id]

        # The model being changed isn't always in references so add it in
        for event_json in events_json:
            if 'model' in event_json:
                model_id = event_json['model']['id']
                if model_id in self._all_models:
                    references[model_id] = self._all_models[model_id]

        self._initialize_references_json(references_json, references)

        for event_json in events_json:
            if event_json['kind'] == 'ModelChanged':
                patched_id = event_json['model']['id']
                if patched_id not in self._all_models:
                    raise RuntimeError("Cannot apply patch to %s which is not in the document" % (str(patched_id)))
                patched_obj = self._all_models[patched_id]
                attr = event_json['attr']
                value = event_json['new']
                patched_obj.set_from_json(attr, value, models=references, setter=setter)
            elif event_json['kind'] == 'ColumnsStreamed':
                source_id = event_json['column_source']['id']
                if source_id not in self._all_models:
                    raise RuntimeError("Cannot stream to %s which is not in the document" % (str(source_id)))
                source = self._all_models[source_id]
                data = event_json['data']
                rollover = event_json['rollover']
                source.stream(data, rollover, setter)
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

    def create_json_patch_string(self, events):
        ''' Create a JSON string describing a patch to be applied.

        Args:
          events : list of events to be translated into patches

        Returns:
          str :  JSON string which can be applied to make the given updates to obj

        '''
        from .server.events import (ColumnsPatchedEvent, ColumnsStreamedEvent, ModelChangedEvent,
                                    RootAddedEvent, RootRemovedEvent, TitleChangedEvent)
        references = set()
        json_events = []
        for event in events:
            if event.document is not self:
                raise ValueError("Cannot create a patch using events from a different document " + repr(event))

            if isinstance(event, ModelChangedEvent):
                if isinstance(event.hint, ColumnsStreamedEvent):
                    json_events.append({ 'kind' : 'ColumnsStreamed',
                                         'column_source' : event.hint.column_source.ref,
                                         'data' : event.hint.data,
                                         'rollover' : event.hint.rollover })

                elif isinstance(event.hint, ColumnsPatchedEvent):
                    json_events.append({ 'kind' : 'ColumnsPatched',
                                         'column_source' : event.hint.column_source.ref,
                                         'patches' : event.hint.patches })
                else:
                    value = event.serializable_new

                    # the new value is an object that may have
                    # not-yet-in-the-remote-doc references, and may also
                    # itself not be in the remote doc yet.  the remote may
                    # already have some of the references, but
                    # unfortunately we don't have an easy way to know
                    # unless we were to check BEFORE the attr gets changed
                    # (we need the old _all_models before setting the
                    # property). So we have to send all the references the
                    # remote could need, even though it could be inefficient.
                    # If it turns out we need to fix this we could probably
                    # do it by adding some complexity.
                    value_refs = set(collect_models(value))

                    # we know we don't want a whole new copy of the obj we're patching
                    # unless it's also the new value
                    if event.model != value:
                        value_refs.discard(event.model)
                    references = references.union(value_refs)

                    json_events.append({ 'kind' : 'ModelChanged',
                                         'model' : event.model.ref,
                                         'attr' : event.attr,
                                         'new' : value })
            elif isinstance(event, RootAddedEvent):
                references = references.union(event.model.references())
                json_events.append({ 'kind' : 'RootAdded',
                                     'model' : event.model.ref })
            elif isinstance(event, RootRemovedEvent):
                json_events.append({ 'kind' : 'RootRemoved',
                                     'model' : event.model.ref })
            elif isinstance(event, TitleChangedEvent):
                json_events.append({ 'kind' : 'TitleChanged',
                                     'title' : event.title })

        json = {
            'events' : json_events,
            'references' : self._references_json(references)
            }

        return serialize_json(json)

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

        references = cls._instantiate_references_json(references_json)
        cls._initialize_references_json(references_json, references)

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

    def on_change(self, *callbacks):
        ''' Provide callbacks to invovke if the document or any Model reachable
        from its roots changes.

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            _check_callback(callback, ('event',))

            self._callbacks[callback] = callback

    def on_change_dispatch_to(self, receiver):
        if not receiver in self._callbacks:
            self._callbacks[receiver] = lambda event: event.dispatch(receiver)

    def remove_next_tick_callback(self, callback):
        ''' Remove a callback added earlier with ``add_next_tick_callback``.

        Returns:
            None

        Raises:
            KeyError, if the callback was never added

        '''
        self._remove_session_callback(callback)

    def remove_on_change(self, *callbacks):
        ''' Remove a callback added earlier with ``on_change``.

        Raises:
            KeyError, if the callback was never added

        '''
        for callback in callbacks:
            del self._callbacks[callback]

    def remove_periodic_callback(self, callback):
        ''' Remove a callback added earlier with ``add_periodic_callback``

        Returns:
            None

        Raises:
            KeyError, if the callback was never added

        '''
        self._remove_session_callback(callback)

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
        from bokeh.server.events import RootRemovedEvent

        if model not in self._roots:
            return # TODO (bev) ValueError?
        self._push_all_models_freeze()
        try:
            self._roots.remove(model)
        finally:
            self._pop_all_models_freeze()
        self._trigger_on_change(RootRemovedEvent(self, model, setter))

    def remove_timeout_callback(self, callback):
        ''' Remove a callback added earlier with ``add_timeout_callback``.

        Returns:
            None

        Raises:
            KeyError, if the callback was never added

        '''
        self._remove_session_callback(callback)

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

    def to_json_string(self, indent=None):
        ''' Convert the document to a JSON string.

        Args:
            indent (int or None, optional) : number of spaces to indent, or
                None to suppress all newlines and indentation (default: None)

        Returns:
            str

        '''
        root_ids = []
        for r in self._roots:
            root_ids.append(r._id)

        root_references = self._all_models.values()

        json = {
            'title' : self.title,
            'roots' : {
                'root_ids' : root_ids,
                'references' : self._references_json(root_references)
            },
            'version' : __version__
        }

        return serialize_json(json, indent=indent)

    def validate(self):
        ''' Perform integrity checks on the modes in this document.

        Returns:
            None

        '''
        root_sets = []
        for r in self.roots:
            refs = r.references()
            root_sets.append(refs)
            check_integrity(refs)

    def _add_session_callback(self, callback_obj, callback, one_shot):
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
        from .server.events import SessionCallbackAdded

        if callback in self._session_callbacks:
            raise ValueError("callback has already been added")

        if one_shot:
            @wraps(callback)
            def remove_then_invoke(*args, **kwargs):
                if callback in self._session_callbacks:
                    obj = self._session_callbacks[callback]
                    if obj is callback_obj:
                        self._remove_session_callback(callback)
                return callback(*args, **kwargs)
            actual_callback = remove_then_invoke
        else:
            actual_callback = callback

        callback_obj._callback = self._wrap_with_self_as_curdoc(actual_callback)
        self._session_callbacks[callback] = callback_obj

        # emit event so the session is notified of the new callback
        self._trigger_on_change(SessionCallbackAdded(self, callback_obj))

        return callback_obj

    # we use this to send changes that happened between show() and
    # push_notebook()
    @classmethod
    def _compute_patch_between_json(cls, from_json, to_json):
        '''

        '''

        def refs(json):
            result = {}
            for obj in json['roots']['references']:
                result[obj['id']] = obj
            return result

        from_references = refs(from_json)
        from_roots = {}
        from_root_ids = []
        for r in from_json['roots']['root_ids']:
            from_roots[r] = from_references[r]
            from_root_ids.append(r)

        to_references = refs(to_json)
        to_roots = {}
        to_root_ids = []
        for r in to_json['roots']['root_ids']:
            to_roots[r] = to_references[r]
            to_root_ids.append(r)

        from_root_ids.sort()
        to_root_ids.sort()

        from_set = set(from_root_ids)
        to_set = set(to_root_ids)
        removed = from_set - to_set
        added = to_set - from_set

        combined_references = dict(from_references)
        for k in to_references.keys():
            combined_references[k] = to_references[k]

        value_refs = {}
        events = []

        for removed_root_id in removed:
            model = dict(combined_references[removed_root_id])
            del model['attributes']
            events.append({ 'kind' : 'RootRemoved',
                            'model' : model })

        for added_root_id in added:
            Document._value_record_references(combined_references,
                                              combined_references[added_root_id],
                                              value_refs)
            model = dict(combined_references[added_root_id])
            del model['attributes']
            events.append({ 'kind' : 'RootAdded',
                            'model' : model })

        for id in to_references:
            if id in from_references:
                update_model_events = Document._events_to_sync_objects(
                    combined_references,
                    from_references[id],
                    to_references[id],
                    value_refs
                )
                events.extend(update_model_events)

        return dict(
            events=events,
            references=list(value_refs.values())
        )

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

    @classmethod
    def _event_for_attribute_change(cls, all_references, changed_obj, key, new_value, value_refs):
        '''

        '''

        event = dict(
            kind='ModelChanged',
            model=dict(id=changed_obj['id'], type=changed_obj['type']),
            attr=key,
            new=new_value,
        )
        Document._value_record_references(all_references, new_value, value_refs)
        return event

    @classmethod
    def _events_to_sync_objects(cls, all_references, from_obj, to_obj, value_refs):
        '''

        '''

        from_keys = set(from_obj['attributes'].keys())
        to_keys = set(to_obj['attributes'].keys())
        removed = from_keys - to_keys
        added = to_keys - from_keys
        shared = from_keys & to_keys

        events = []
        for key in removed:
            raise RuntimeError("internal error: should not be possible to delete attribute %s" % key)

        for key in added:
            new_value = to_obj['attributes'][key]
            events.append(Document._event_for_attribute_change(all_references,
                                                               from_obj,
                                                               key,
                                                               new_value,
                                                               value_refs))

        for key in shared:
            old_value = from_obj['attributes'].get(key)
            new_value = to_obj['attributes'].get(key)

            if old_value is None and new_value is None:
                continue

            if old_value is None or new_value is None or old_value != new_value:
                event = Document._event_for_attribute_change(all_references,
                                                             from_obj,
                                                             key,
                                                             new_value,
                                                             value_refs)
                events.append(event)

        return events

    @classmethod
    def _initialize_references_json(cls, references_json, references, setter=None):
        ''' Given a JSON representation of the models in a graph and new model objects,
        set the properties on the models from the JSON

        '''

        for obj in references_json:
            obj_id = obj['id']
            obj_attrs = obj['attributes']

            instance = references[obj_id]

            instance.update_from_json(obj_attrs, models=references, setter=setter)

    @classmethod
    def _instantiate_references_json(cls, references_json):
        ''' Given a JSON representation of all the models in a graph, return a
        dict of new model objects.

        '''

        # Create all instances, but without setting their props
        references = {}
        for obj in references_json:
            obj_id = obj['id']
            obj_type = obj.get('subtype', obj['type'])

            cls = get_class(obj_type)
            instance = cls(id=obj_id, _block_events=True)
            if instance is None:
                raise RuntimeError('Error loading model from JSON (type: %s, id: %s)' % (obj_type, obj_id))
            references[instance._id] = instance

        return references

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
        return isinstance(selector[field], string_types)

    def _notify_change(self, model, attr, old, new, hint=None, setter=None):
        ''' Called by Model when it changes

        '''

        from .server.events import ModelChangedEvent

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
        self._trigger_on_change(ModelChangedEvent(self, model, attr, old, new, serializable_new, hint, setter))

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
            recomputed[m._id] = m
            if m.name is not None:
                recomputed_by_name.add_value(m.name, m)
        for d in to_detach:
            d._detach_document()
        for a in to_attach:
            a._attach_document(self)
        self._all_models = recomputed
        self._all_models_by_name = recomputed_by_name

    @classmethod
    def _references_json(cls, references):
        ''' Given a list of all models in a graph, return JSON representing
        them and their properties.

        '''

        references_json = []
        for r in references:
            ref = r.ref
            ref['attributes'] = r._to_json_like(include_defaults=False)
            references_json.append(ref)

        return references_json

    def _remove_session_callback(self, callback):
        ''' Remove a callback added earlier with ``add_periodic_callback``
        or ``add_timeout_callback``.

        Returns:
            None

        Raises:
            KeyError, if the callback was never added

        '''
        from bokeh.server.events import SessionCallbackRemoved

        if callback not in self._session_callbacks:
            raise ValueError("callback already ran or was already removed, cannot be removed again")
        cb = self._session_callbacks.pop(callback)
        # emit event so the session is notified and can remove the callback
        self._trigger_on_change(SessionCallbackRemoved(self, cb))

    def _set_title(self, title, setter=None):
        '''

        '''
        from bokeh.server.events import TitleChangedEvent

        if title is None:
            raise ValueError("Document title may not be None")
        if self._title != title:
            self._title = title
            self._trigger_on_change(TitleChangedEvent(self, title, setter))

    def _trigger_on_change(self, event):
        '''

        '''

        def invoke_callbacks():
            for cb in self._callbacks.values():
                cb(event)
        self._with_self_as_curdoc(invoke_callbacks)

    @classmethod
    def _value_record_references(cls, all_references, v, result):
        '''

        '''

        if v is None: return

        if isinstance(v, dict) and set(['id', 'type']).issubset(set(v.keys())):
            if v['id'] not in result:
                ref = all_references[v['id']]
                result[v['id']] = ref
                Document._value_record_references(all_references, ref['attributes'], result)
        elif isinstance(v, (list, tuple)):
            for elem in v:
                Document._value_record_references(all_references, elem, result)
        elif isinstance(v, dict):
            for k, elem in v.items():
                Document._value_record_references(all_references, elem, result)

    def _with_self_as_curdoc(self, f):
        '''

        '''
        from bokeh.io import set_curdoc, curdoc
        old_doc = curdoc()
        try:
            if getattr(f, "nolock", False):
                set_curdoc(_UnlockedDocumentProxy(self))
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

class _UnlockedDocumentProxy(object):
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
