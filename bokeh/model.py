from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__file__)

from six import add_metaclass, iteritems

from .properties import Any, HasProps, List, MetaHasProps, String
from .query import find
from . import themes
from .util.callback_manager import CallbackManager
from .util.serialization import make_id
from ._json_encoder import serialize_json
from json import loads

class Viewable(MetaHasProps):
    """ Any plot object (Data Model) which has its own View Model in the
    persistence layer.

    One thing to keep in mind is that a Viewable should have a single
    unique representation in the persistence layer, but it might have
    multiple concurrent client-side Views looking at it.  Those may
    be from different machines altogether.
    """

    # Stores a mapping from subclass __view_model__ names to classes
    model_class_reverse_map = {}

    # Mmmm.. metaclass inheritance.  On the one hand, it seems a little
    # overkill. On the other hand, this is exactly the sort of thing
    # it's meant for.
    def __new__(cls, class_name, bases, class_dict):
        if "__view_model__" not in class_dict:
            class_dict["__view_model__"] = class_name
        class_dict["get_class"] = Viewable.get_class

        # Create the new class
        newcls = super(Viewable,cls).__new__(cls, class_name, bases, class_dict)
        entry = class_dict.get("__subtype__", class_dict["__view_model__"])
        # Add it to the reverse map, but check for duplicates first
        if entry in Viewable.model_class_reverse_map and not hasattr(newcls, "__implementation__"):
            raise Warning("Duplicate __view_model__ or __subtype__ declaration of '%s' for " \
                          "class %s.  Previous definition: %s" % \
                          (entry, class_name,
                           Viewable.model_class_reverse_map[entry]))
        Viewable.model_class_reverse_map[entry] = newcls
        return newcls

    @classmethod
    def _preload_models(cls):
        from . import models; models
        from .crossfilter import models as crossfilter_models; crossfilter_models
        from .charts import Chart; Chart

    @classmethod
    def get_class(cls, view_model_name):
        """ Given a __view_model__ name, returns the corresponding class
        object
        """
        cls._preload_models()
        d = Viewable.model_class_reverse_map
        if view_model_name in d:
            return d[view_model_name]
        else:
            raise KeyError("View model name '%s' not found" % view_model_name)

@add_metaclass(Viewable)
class Model(HasProps, CallbackManager):
    """ Base class for all plot-related objects """

    name = String()
    tags = List(Any)

    def __init__(self, **kwargs):
        self._id = kwargs.pop("id", make_id())
        self._document = None
        # kwargs may assign to properties, so we need
        # to chain up here after we already initialize
        # some of our fields.
        props = dict()
        for cls in self.__class__.__mro__[-2::-1]:
            props.update(themes.default['attrs'].get(cls.__name__, {}))
        props.update(kwargs)
        super(Model, self).__init__(**props)

    def _attach_document(self, doc):
        '''This should only be called by the Document implementation to set the document field'''
        if self._document is not None and self._document is not doc:
            raise RuntimeError("Models must be owned by only a single document, %r is already in a doc" % (self))
        self._document = doc

    def _detach_document(self):
        '''This should only be called by the Document implementation to unset the document field'''
        self._document = None

    @property
    def document(self):
        return self._document

    def trigger(self, attr, old, new):
        dirty = { 'count' : 0 }
        def mark_dirty(obj):
            dirty['count'] += 1
        if self._document is not None:
            self._visit_value_and_its_immediate_references(new, mark_dirty)
            self._visit_value_and_its_immediate_references(old, mark_dirty)
            if dirty['count'] > 0:
                self._document._invalidate_all_models()
        # chain up to invoke callbacks
        super(Model, self).trigger(attr, old, new)

    @property
    def ref(self):

        if "__subtype__" in self.__class__.__dict__:
            return {
                'type': self.__view_model__,
                'subtype': self.__subtype__,
                'id': self._id,
            }
        else:
            return {
                'type': self.__view_model__,
                'id': self._id,
            }

    def select(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.

        Args:
            selector (JSON-like) :

        Returns:
            seq[Model]

        '''
        return find(self.references(), selector)

    def select_one(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.  Raises an error if more than one object
        is found.  Returns single matching object, or None if nothing is found
        Args:
            selector (JSON-like) :

        Returns:
            Model
        '''
        result = list(self.select(selector))
        if len(result) > 1:
            raise ValueError("Found more than one object matching %s: %r" % (selector, result))
        if len(result) == 0:
            return None
        return result[0]

    def set_select(self, selector, updates):
        ''' Update objects that match a given selector with the specified
        attribute/value updates.

        Args:
            selector (JSON-like) :
            updates (dict) :

        Returns:
            None

        '''
        for obj in self.select(selector):
            for key, val in updates.items():
                setattr(obj, key, val)

    def layout(self, side, plot):
        try:
            return self in getattr(plot, side)
        except:
            return []

    @classmethod
    def _visit_immediate_value_references(cls, value, visitor):
        ''' Visit all references to another Model without recursing into any
        of the child Model; may visit the same Model more than once if
        it's referenced more than once. Does not visit the passed-in value.

        '''
        if isinstance(value, HasProps):
            for attr in value.properties_with_refs():
                child = getattr(value, attr)
                cls._visit_value_and_its_immediate_references(child, visitor)
        else:
            cls._visit_value_and_its_immediate_references(value, visitor)

    @classmethod
    def _visit_value_and_its_immediate_references(cls, obj, visitor):
        if isinstance(obj, Model):
            visitor(obj)
        elif isinstance(obj, HasProps):
            # this isn't a Model, so recurse into it
            cls._visit_immediate_value_references(obj, visitor)
        elif isinstance(obj, (list, tuple)):
            for item in obj:
                cls._visit_value_and_its_immediate_references(item, visitor)
        elif isinstance(obj, dict):
            for key, value in iteritems(obj):
                cls._visit_value_and_its_immediate_references(key, visitor)
                cls._visit_value_and_its_immediate_references(value, visitor)

    @classmethod
    def collect_models(cls, *input_values):
        """ Iterate over ``input_values`` and descend through their structure
        collecting all nested ``Models`` on the go. The resulting list
        is duplicate-free based on objects' identifiers.
        """
        ids = set([])
        objs = []

        def collect_one(obj):
            if obj._id not in ids:
                ids.add(obj._id)
                cls._visit_immediate_value_references(obj, collect_one)
                objs.append(obj)

        for value in input_values:
            cls._visit_value_and_its_immediate_references(value, collect_one)
        return objs

    def references(self):
        """Returns all ``Models`` that this object has references to. """
        return set(self.collect_models(self))

    def vm_props(self, changed_only=True):
        """ Returns the ViewModel-related properties of this object.

        .. note::
            In the future this method may always return all properties,
            ignoring the changed_only argument.

        Args:
            changed_only (bool, optional) : whether to return only properties
                that have had their values changed at some point (default: True)

        """
        if changed_only:
            props = self.changed_properties_with_values()
        else:
            props = self.properties_with_values()

        # XXX: For dataspecs, getattr() returns a meaningless value
        # from serialization point of view. This should be handled in
        # the properties module, but for now, fix serialized values here.
        for attr, prop in iteritems(self.dataspecs_with_refs()):
            if props.get(attr) is not None:
                props[attr] = prop.to_dict(self)

        return props

    def vm_serialize(self, changed_only=True):
        """ Returns a dictionary of the attributes of this object, in
        a layout corresponding to what BokehJS expects at unmarshalling time.

        This method does not convert "Bokeh types" into "plain JSON types,"
        for example each child Model will still be a Model, rather
        than turning into a reference, numpy isn't handled, etc.

        This method should be considered "private" or "protected",
        for use internal to Bokeh; use to_json() instead because
        it gives you only plain JSON-compatible types. Also, the
        changed_only functionality may not be supported in the
        future.

        Args:
            changed_only (bool, optional) : whether to include only attributes
                that have had their values changed at some point (default: True)

        """
        attrs = self.vm_props(changed_only)
        attrs['id'] = self._id
        for (k, v) in attrs.items():
            # we can't serialize Infinity, we send it as None and the
            # other side has to fix it up.
            if isinstance(v, float) and v == float('inf'):
                attrs[k] = None

        return attrs

    def to_json(self):
        """ Returns a dictionary of the attributes of this object,
        containing only "JSON types" (string, number, boolean,
        none, dict, list).

        References to other objects are serialized as "refs" (just
        the object ID and type info), so the deserializer will
        need to separately have the full attributes of those
        other objects.

        There's no corresponding from_json() because to
        deserialize an object is normally done in the context of a
        Document (since the Document can resolve references).

        For most purposes it's best to serialize and deserialize
        entire documents.

        Args:
            None

        """
        return loads(self.to_json_string())

    def to_json_string(self):
        """Returns a JSON string encoding the attributes of this object.

        References to other objects are serialized as references
        (just the object ID and type info), so the deserializer
        will need to separately have the full attributes of those
        other objects.

        There's no corresponding from_json_string() because to
        deserialize an object is normally done in the context of a
        Document (since the Document can resolve references).

        For most purposes it's best to serialize and deserialize
        entire documents.

        Args:
            None

        """
        # we sort_keys to simplify the test suite by making the returned
        # string deterministic. serialize_json "fixes" the JSON from
        # vm_serialize by converting all types into plain JSON types
        # (it converts Model into refs, for example).
        return serialize_json(self.vm_serialize(changed_only=False), sort_keys=True)

    def update(self, **kwargs):
        for k,v in kwargs.items():
            setattr(self, k, v)

    def __str__(self):
        return "%s, ViewModel:%s, ref _id: %s" % (self.__class__.__name__,
                self.__view_model__, getattr(self, "_id", None))

def _find_some_document(models):
    from .document import Document

    # First try the easy stuff...
    doc = None
    for model in models:
        if isinstance(model, Document):
            doc = model
            break
        elif isinstance(model, Model):
            if model.document is not None:
                doc = model.document
                break

    # Now look in children of models
    if doc is None:
        for model in models:
            if isinstance(model, Model):
                # see if some child of ours is in a doc, this is meant to
                # handle a thing like:
                #   p = figure()
                #   box = HBox(children=[p])
                #   show(box)
                for r in model.references():
                    if r.document is not None:
                        doc = r.document
                        break

    return doc

class _ModelInDocument(object):
    # 'models' can be a single Model, a single Document, or a list of either
    def __init__(self, models):
        from .document import Document

        self._to_remove_after = []
        if not isinstance(models, list):
            models = [models]

        self._doc = _find_some_document(models)
        if self._doc is None:
            # oh well - just make up a doc
            self._doc = Document()

        for model in models:
            if isinstance(model, Model):
                if model.document is None:
                    self._to_remove_after.append(model)

    def __exit__(self, type, value, traceback):
        for model in self._to_remove_after:
            model.document.remove_root(model)

    def __enter__(self):
        for model in self._to_remove_after:
            self._doc.add_root(model)
