""" The document module provides the Document class, which is a container
for all Bokeh objects that mustbe reflected to the client side BokehJS
library.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

from collections import defaultdict
from bokeh.util.callback_manager import _check_callback
from bokeh.protocol import serialize_json
from .plot_object import PlotObject
from json import loads

class Document(object):

    def __init__(self):
        self._roots = set()

        # TODO (bev) add vars, stores

        self._all_model_counts = defaultdict(int)
        self._all_models = dict()
        self._callbacks = []

    def clear(self):
        ''' Remove all content from the document (including roots, vars, stores) '''
        while len(self._roots) > 0:
            r = next(iter(self._roots))
            self.remove_root(r)

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
        self._roots.add(model)
        model.attach_document(self)

    def remove_root(self, model):
        ''' Remove a model as root model from this Document.

        Changes to this model may still trigger "on_change" callbacks
        on this Document, if the model is still referred to by other
        root models.
        '''
        if model not in self._roots:
            return # TODO (bev) ValueError?
        self._roots.remove(model)
        model.detach_document()

    def on_change(self, *callbacks):
        ''' Invoke callback if any PlotObject in the document changes

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            _check_callback(callback, ('doc', 'model', 'attr', 'old', 'new'))

            self._callbacks.append(callback)

    def _notify_change(self, model, attr, old, new):
        ''' Called by PlotObject when it changes

        '''
        for cb in self._callbacks:
            cb(self, model, attr, old, new)

    def _notify_attach(self, model):
        self._all_model_counts[model._id] += 1
        self._all_models[model._id] = model

    def _notify_detach(self, model):
        ''' Called by PlotObject once for each time the PlotObject is
        removed from the object graph. Returns the attach_count

        '''
        self._all_model_counts[model._id] -= 1
        attach_count = self._all_model_counts[model._id]
        if attach_count == 0:
            del self._all_models[model._id]
            del self._all_model_counts[model._id]
        return attach_count

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

        # Now set all props
        for obj in references_json:
            obj_id = obj['id']
            obj_attrs = obj['attributes']

            instance = references[obj_id]

            # replace references with actual instances in obj_attrs
            for p in instance.properties_with_refs():
                if p in obj_attrs:
                    ref = obj_attrs[p]
                    if ref is not None:
                        obj_attrs[p] = references[ref['id']]

            # set all properties on the instance
            instance.update(**obj_attrs)

    # TODO (havocp) there are other overlapping old serialization
    # functions in the codebase, we don't need all of these probably.
    def to_json_string(self):
        ''' Convert the document to JSON. '''

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

    @classmethod
    def from_json_string(cls, json):
        ''' Load a document from JSON. '''
        json_parsed = loads(json)
        roots_json = json_parsed['roots']
        root_ids = roots_json['root_ids']
        references_json = roots_json['references']

        references = cls._instantiate_references_json(references_json)
        cls._initialize_references_json(references_json, references)

        doc = Document()
        for r in root_ids:
            doc.add_root(references[r])

        return doc

    def create_json_patch_string(self, obj, updates):
        ''' Create a JSON string describing a patch to be applied with apply_json_patch_string()

            Args:
              obj : a PlotObject in the document
                  Object in the document to be patched

              updates : dict of attribute names to values
                  Properties to be set in the patched object

            Returns:
              str :  JSON string which can be applied to make the given updates to obj
        '''
        references = set()
        for attr, value in updates.items():
            if isinstance(value, PlotObject):
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
                references = references.union(value.references())
        # we know we don't want a whole new copy of the obj we're patching
        references.discard(obj)

        json = obj.ref
        json['updates'] = updates
        json['references'] = self._references_json(references)

        return serialize_json(json)

    def apply_json_patch_string(self, patch):
        ''' Apply a JSON patch string created by create_json_patch_string() '''
        json_parsed = loads(patch)
        patched_id = json_parsed['id']
        if patched_id not in self._all_models:
            raise ProtocolError("Cannot apply patch to %s which is not in the document" % (str(patched_id)))
        patched_obj = self._all_models[patched_id]

        updates = json_parsed['updates']
        references_json = json_parsed['references']
        references = self._instantiate_references_json(references_json)

        # Use our existing model instances whenever we have them, and add the obj we're patching
        references[patched_obj._id] = patched_obj
        for obj in references.values():
            if obj._id in self._all_models:
                references[obj._id] = self._all_models[obj._id]

        self._initialize_references_json(references_json, references)

        modified_updates = {}
        for attr, value in updates.items():
            if attr in patched_obj.properties_with_refs():
                modified_updates[attr] = references[value['id']]
            else:
                modified_updates[attr] = value

        patched_obj.update(** modified_updates)
