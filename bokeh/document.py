""" The document module provides the Document class, which is a container
for all Bokeh objects that mustbe reflected to the client side BokehJS
library.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

from bokeh.util.callback_manager import _check_callback
from bokeh._json_encoder import serialize_json
from .plot_object import PlotObject
from .validation import check_integrity
from json import loads
from bokeh.properties import ContainerProperty

class DocumentChangedEvent(object):
    def __init__(self, document):
        self.document = document

class ModelChangedEvent(DocumentChangedEvent):
    def __init__(self, document, model, attr, old, new):
        super(ModelChangedEvent, self).__init__(document)
        self.model = model
        self.attr = attr
        self.old = old
        self.new = new

class RootAddedEvent(DocumentChangedEvent):
    def __init__(self, document, model):
        super(RootAddedEvent, self).__init__(document)
        self.model = model

class RootRemovedEvent(DocumentChangedEvent):
    def __init__(self, document, model):
        super(RootRemovedEvent, self).__init__(document)
        self.model = model

class Document(object):

    def __init__(self):
        self._roots = set()

        # TODO (bev) add vars, stores

        self._all_models_freeze_count = 0
        self._all_models = dict()
        self._callbacks = []

    def clear(self):
        ''' Remove all content from the document (including roots, vars, stores) '''
        self._push_all_models_freeze()
        try:
            while len(self._roots) > 0:
                r = next(iter(self._roots))
                self.remove_root(r)
        finally:
            self._pop_all_models_freeze()

    def _destructively_move(self, dest_doc):
        '''Move all fields in this doc to the dest_doc, leaving this doc empty'''
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
        # TODO other fields of doc

    def _push_all_models_freeze(self):
        self._all_models_freeze_count += 1

    def _pop_all_models_freeze(self):
        self._all_models_freeze_count -= 1
        if self._all_models_freeze_count == 0:
            self._recompute_all_models()

    def _invalidate_all_models(self):
        # if freeze count is > 0, we'll recompute on unfreeze
        if self._all_models_freeze_count == 0:
            self._recompute_all_models()

    def _recompute_all_models(self):
        new_all_models_set = set()
        for r in self.roots:
            new_all_models_set = new_all_models_set.union(r.references())
        old_all_models_set = set(self._all_models.values())
        to_detach = old_all_models_set - new_all_models_set
        to_attach = new_all_models_set - old_all_models_set
        recomputed = {}
        for m in new_all_models_set:
            recomputed[m._id] = m
        for d in to_detach:
            d._detach_document()
        for a in to_attach:
            a._attach_document(self)
        self._all_models = recomputed

    @property
    def roots(self):
        return set(self._roots)

    def add_root(self, model):
        ''' Add a model as a root model to this Document.

        Any changes to this model (including to other models referred to
        by it) will trigger "on_change" callbacks registered on this
        Document.

        '''
        if model in self._roots:
            return
        self._push_all_models_freeze()
        try:
            self._roots.add(model)
        finally:
            self._pop_all_models_freeze()
        self._trigger_on_change(RootAddedEvent(self, model))

    # TODO (havocp) should probably drop either this or add_root.
    # this is the backward compatible one but perhaps a tad unclear
    # if we also allow adding other things besides roots.
    def add(self, *objects):
        """ Call add_root() on each object.
        .. warning::
            This function should only be called on top level objects such
            as Plot, and Layout containers.
        Args:
            *objects (PlotObject) : objects to add to the Document
        Returns:
            None
        """
        for obj in objects:
            self.add_root(obj)

    def remove_root(self, model):
        ''' Remove a model as root model from this Document.

        Changes to this model may still trigger "on_change" callbacks
        on this Document, if the model is still referred to by other
        root models.
        '''
        if model not in self._roots:
            return # TODO (bev) ValueError?
        self._push_all_models_freeze()
        try:
            self._roots.remove(model)
        finally:
            self._pop_all_models_freeze()
        self._trigger_on_change(RootRemovedEvent(self, model))

    def get_model_by_id(self, model_id):
        ''' Get the model object for the given ID or None if not found'''
        return self._all_models.get(model_id, None)

    def on_change(self, *callbacks):
        ''' Invoke callback if the document or any PlotObject reachable from its roots changes.

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            _check_callback(callback, ('event',))

            self._callbacks.append(callback)

    def remove_on_change(self, *callbacks):
        ''' Remove a callback added earlier with on_change()

            Throws an error if the callback wasn't added

        '''
        for callback in callbacks:
            self._callbacks.remove(callback)

    def _trigger_on_change(self, event):
        for cb in self._callbacks:
            cb(event)

    def _notify_change(self, model, attr, old, new):
        ''' Called by PlotObject when it changes
        '''
        self._trigger_on_change(ModelChangedEvent(self, model, attr, old, new))

    @classmethod
    def _references_json(cls, references):
        '''Given a list of all models in a graph, return JSON representing them and their properties.'''
        references_json = []
        for r in references:
            ref = r.ref
            ref['attributes'] = r.vm_serialize(changed_only=False)
            # 'id' is in 'ref' already
            # TODO (havocp) don't put this id here in the first place,
            # by fixing vm_serialize once we establish that other
            # users of it don't exist anymore or whatever
            del ref['attributes']['id']
            references_json.append(ref)

        return references_json

    @classmethod
    def _instantiate_references_json(cls, references_json):
        '''Given a JSON representation of all the models in a graph, return a dict of new model objects.'''

        # Create all instances, but without setting their props
        references = {}
        for obj in references_json:
            obj_id = obj['id']
            obj_type = obj.get('subtype', obj['type'])

            cls = PlotObject.get_class(obj_type)
            instance = cls(id=obj_id, _block_events=True)
            if instance is None:
                raise RuntimeError('Error loading model from JSON (type: %s, id: %s)' % (obj_type, obj_id))
            references[instance._id] = instance

        return references

    @classmethod
    def _initialize_references_json(cls, references_json, references):
        '''Given a JSON representation of the models in a graph and new model objects, set the properties on the models from the JSON'''

        for obj in references_json:
            obj_id = obj['id']
            obj_attrs = obj['attributes']

            instance = references[obj_id]

            # replace references with actual instances in obj_attrs
            for p in instance.properties_with_refs():
                if p in obj_attrs:
                    prop = instance.lookup(p)
                    obj_attrs[p] = prop.from_json(obj_attrs[p], models=references)

            # set all properties on the instance
            remove = []
            for key in obj_attrs:
                if key not in instance.properties():
                    logger.warn("Client sent attr %r for instance %r, which is a client-only or invalid attribute that shouldn't have been sent", key, instance)
                    remove.append(key)
            for key in remove:
                del obj_attrs[key]
            instance.update(**obj_attrs)

    def to_json_string(self):
        ''' Convert the document to a JSON string. '''

        root_ids = []
        for r in self._roots:
            root_ids.append(r._id)

        root_references = self._all_models.values()

        json = {
            'roots' : {
                'root_ids' : root_ids,
                'references' : self._references_json(root_references)
            }
        }

        return serialize_json(json)

    def to_json(self):
        ''' Convert the document to a JSON object. '''

        # this is a total hack to go via a string, needed because
        # our BokehJSONEncoder goes straight to a string.
        doc_json = self.to_json_string()

        return loads(doc_json)

    @classmethod
    def from_json_string(cls, json):
        ''' Load a document from JSON. '''
        json_parsed = loads(json)
        return cls.from_json(json_parsed)

    @classmethod
    def from_json(cls, json):
        ''' Load a document from JSON. '''
        roots_json = json['roots']
        root_ids = roots_json['root_ids']
        references_json = roots_json['references']

        references = cls._instantiate_references_json(references_json)
        cls._initialize_references_json(references_json, references)

        doc = Document()
        for r in root_ids:
            doc.add_root(references[r])

        return doc

    def replace_with_json(self, json):
        ''' Overwrite everything in this document with the JSON-encoded document '''
        replacement = self.from_json(json)
        replacement._destructively_move(self)

    def create_json_patch_string(self, events):
        ''' Create a JSON string describing a patch to be applied with apply_json_patch_string()

            Args:
              events : list of events to be translated into patches

            Returns:
              str :  JSON string which can be applied to make the given updates to obj
        '''
        references = set()
        json_events = []
        for event in events:
            if event.document is not self:
                raise ValueError("Cannot create a patch using events from a different document " + repr(event))

            if isinstance(event, ModelChangedEvent):
                value = event.new

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
                value_refs = set(PlotObject.collect_plot_objects(value))

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

        json = {
            'events' : json_events,
            'references' : self._references_json(references)
            }

        return serialize_json(json)

    def apply_json_patch_string(self, patch):
        ''' Apply a JSON patch string created by create_json_patch_string() '''
        json_parsed = loads(patch)
        self.apply_json_patch(json_parsed)

    def apply_json_patch(self, patch):
        ''' Apply a JSON patch object created by parsing the result of create_json_patch_string() '''
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
                if attr in patched_obj.properties_with_refs():
                    prop = patched_obj.lookup(attr)
                    value = prop.from_json(value, models=references)
                if attr in patched_obj.properties():
                    #logger.debug("Patching attribute %s of %r", attr, patched_obj)
                    patched_obj.update(** { attr : value })
                else:
                    logger.warn("Client sent attr %r on obj %r, which is a client-only or invalid attribute that shouldn't have been sent", attr, patched_obj)
            elif event_json['kind'] == 'RootAdded':
                root_id = event_json['model']['id']
                root_obj = references[root_id]
                self.add_root(root_obj)
            elif event_json['kind'] == 'RootRemoved':
                root_id = event_json['model']['id']
                root_obj = references[root_id]
                self.remove_root(root_obj)
            else:
                raise RuntimeError("Unknown patch event " + repr(event_json))

    def validate(self):
        # logging.basicConfig is a no-op if there's already
        # some logging configured. We want to make sure warnings
        # go somewhere so configure here if nobody has.
        logging.basicConfig(level=logging.INFO)
        root_sets = []
        for r in self.roots:
            refs = r.references()
            root_sets.append(refs)
            check_integrity(refs)
