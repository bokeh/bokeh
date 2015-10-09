from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__file__)

from six import add_metaclass, iteritems

from .properties import Any, HasProps, List, MetaHasProps, Instance, String
from .query import find
from .exceptions import DataIntegrityException
from .util.callback_manager import CallbackManager
from .util.serialization import make_id
from .validation import check_integrity

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
class PlotObject(HasProps, CallbackManager):
    """ Base class for all plot-related objects """

    session = Instance(".session.Session")
    name = String()
    tags = List(Any)

    def __init__(self, **kwargs):
        self._id = kwargs.pop("id", make_id())
        self._document = None
        # kwargs may assign to properties, so we need
        # to chain up here after we already initialize
        # some of our fields.
        super(PlotObject, self).__init__(**kwargs)

    def attach_document(self, doc):
        # we want an ERROR if you attach to a different doc,
        # but we want to call notify_attach multiple times
        # if a plot object is mentioned as the value for
        # multiple fields. There's a refcount which is supposed
        # to track the number of fields in the doc we are the value
        # of. This means we don't recurse on the second attach though.
        if self._document is not None and self._document is not doc:
            raise RuntimeError("PlotObjects must be owned by only a single document")
        first_attach = self._document is None
        self._document = doc
        if self._document is not None:
            self._document._notify_attach(self)
            if first_attach:
                doc = self._document
                def attach(obj):
                    obj.attach_document(doc)
                self._visit_immediate_references(self, attach)

    def detach_document(self):
        if self._document is not None:
            if not self._document._notify_detach(self):
                self._document = None
                # we only detach children when we are detached the
                # last time.
                def detach(obj):
                    obj.detach_document()
                self._visit_immediate_references(self, detach)

    @property
    def document(self):
        return self._document

    def trigger(self, attr, old, new):
        # attach first, then detach, so we keep refcount >0 if it will end up that way
        if self._document is not None:
            def attach(obj):
                obj.attach_document(self._document)
            self._visit_prop_value_references(new, attach, immediate_only=True)
        def detach(obj):
            obj.detach_document()
        self._visit_prop_value_references(old, detach, immediate_only=True)

        # chain up to invoke callbacks
        super(PlotObject, self).trigger(attr, old, new)

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
            seq[PlotObject]

        '''
        return find(self.references(), selector)

    def select_one(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.  Raises an error if more than one object
        is found.  Returns single matching object, or None if nothing is found
        Args:
            selector (JSON-like) :

        Returns:
            PlotObject
        '''
        result = list(self.select(selector))
        if len(result) > 1:
            raise DataIntegrityException("found more than one object matching %s" % selector)
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
    def _visit_immediate_references(cls, obj, visitor):
        ''' Visit all references to another PlotObject without recursing into any of the child PlotObject; may visit the same PlotObject more than once if it's referenced more than once. '''
        cls._visit_props_references(obj, visitor, immediate_only=True)

    @classmethod
    def _visit_props_references(cls, obj, visitor, immediate_only=False):
        ''' Visit all props of the PlotObject'''
        for attr in obj.properties_with_refs():
            cls._visit_prop_value_references(getattr(obj, attr), visitor, immediate_only)

    @classmethod
    def _visit_prop_value_references(cls, obj, visitor, immediate_only=False):
        ''' Visit all references to another PlotObject for this arbitrary value'''
        if isinstance(obj, PlotObject):
            # we visit this PlotObject
            visitor(obj)
            if not immediate_only:
                cls._visit_props_references(obj, visitor, immediate_only)
        elif isinstance(obj, HasProps):
            # this isn't a PlotObject, so recurse into it
            cls._visit_props_references(obj, visitor, immediate_only)
        elif isinstance(obj, (list, tuple)):
            for item in obj:
                cls._visit_prop_value_references(item, visitor, immediate_only)
        elif isinstance(obj, dict):
            for key, value in iteritems(obj):
                cls._visit_prop_value_references(key, visitor, immediate_only)
                cls._visit_prop_value_references(value, visitor, immediate_only)

    @classmethod
    def collect_plot_objects(cls, *input_objs):
        """ Iterate over ``input_objs`` and descend through their structure
        collecting all nested ``PlotObjects`` on the go. The resulting list
        is duplicate-free based on objects' identifiers.
        """
        ids = set([])
        objs = []

        def collect_one(obj):
            if obj._id not in ids:
                ids.add(obj._id)
                obj._visit_immediate_references(obj, collect_one)
                objs.append(obj)

        for obj in input_objs:
            collect_one(obj)
        return objs

    def references(self):
        """Returns all ``PlotObjects`` that this object has references to. """
        return set(self.collect_plot_objects(self))

    #---------------------------------------------------------------------
    # View Model connection methods
    #
    # Whereas a rich client rendering framework can maintain view state
    # alongside model state, we need an explicit send/receive protocol for
    # communicating with a set of view models that reside on the front end.
    # Many of the calls one would expect in a rich client map instead to
    # batched updates on the M-VM-V approach.
    #---------------------------------------------------------------------
    def vm_props(self, changed_only=True):
        """ Returns the ViewModel-related properties of this object.

        Args:
            changed_only (bool, optional) : whether to return only properties
                that have had their values changed at some point (default: True)

        """
        if changed_only:
            props = self.changed_properties_with_values()
        else:
            props = self.properties_with_values()
        props.pop("session", None)

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

        Args:
            changed_only (bool, optional) : whether to include only attributes
                that have had their values changed at some point (default: True)

        """
        attrs = self.vm_props(changed_only)
        attrs['id'] = self._id
        return attrs


    def update(self, **kwargs):
        for k,v in kwargs.items():
            setattr(self, k, v)

    def __str__(self):
        return "%s, ViewModel:%s, ref _id: %s" % (self.__class__.__name__,
                self.__view_model__, getattr(self, "_id", None))
