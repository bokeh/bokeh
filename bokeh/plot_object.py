from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__file__)

from six import add_metaclass, iteritems

from .properties import Any, HasProps, List, MetaHasProps, Instance, String
from .query import find
from .util.serialization import dump, make_id

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
        if entry in Viewable.model_class_reverse_map:
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
class PlotObject(HasProps):
    """ Base class for all plot-related objects """

    session = Instance(".session.Session")
    name = String()
    tags = List(Any)

    def __init__(self, **kwargs):
        # Eventually should use our own memo instead of storing
        # an attribute on the class
        if "id" in kwargs:
            self._id = kwargs.pop("id")
        else:
            self._id = make_id()

        self._dirty = True
        self._callbacks_dirty = False
        self._callbacks = {}
        self._callback_queue = []
        self._block_callbacks = False

        block_events = kwargs.pop('_block_events', False)

        if not block_events:
            super(PlotObject, self).__init__(**kwargs)
            self.setup_events()
        else:
            self._block_callbacks = True
            super(PlotObject, self).__init__(**kwargs)

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

    def setup_events(self):
        pass

    def select(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.

        Args:
            selector (JSON-like) :

        Returns:
            seq[PlotObject]

        '''
        return find(self.references(), selector)

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

    @classmethod
    def load_json(cls, attrs, instance=None):
        """Loads all json into a instance of cls, EXCEPT any references
        which are handled in finalize
        """
        if 'id' not in attrs:
            raise RuntimeError("Unable to find 'id' attribute in JSON: %r" % attrs)
        _id = attrs.pop('id')

        if not instance:
            instance = cls(id=_id, _block_events=True)

        ref_props = {}
        for p in instance.properties_with_refs():
            if p in attrs:
                ref_props[p] = attrs.pop(p)
        instance._ref_props = ref_props

        instance.update(**attrs)
        return instance

    def layout(self, side, plot):
        try:
            return self in getattr(plot, side)
        except:
            return []

    def finalize(self, models):
        """Convert any references into instances
        models is a dict of id->model mappings
        """
        attrs = {}

        for name, json in iteritems(getattr(self, "_ref_props", {})):
            prop = self.__class__.lookup(name)
            attrs[name] = prop.from_json(json, models=models)

        return attrs

    @classmethod
    def collect_plot_objects(cls, *input_objs):
        """ Iterate over ``input_objs`` and descend through their structure
        collecting all nested ``PlotObjects`` on the go. The resulting list
        is duplicate-free based on objects' identifiers.
        """
        ids = set([])
        objs = []

        def descend_props(obj):
            for attr in obj.properties_with_refs():
                descend(getattr(obj, attr))

        def descend(obj):
            if isinstance(obj, PlotObject):
                if obj._id not in ids:
                    ids.add(obj._id)
                    descend_props(obj)
                    objs.append(obj)
            elif isinstance(obj, HasProps):
                descend_props(obj)
            elif isinstance(obj, (list, tuple)):
                for item in obj:
                    descend(item)
            elif isinstance(obj, dict):
                for key, value in iteritems(obj):
                    descend(key); descend(value)

        descend(input_objs)
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

    def dump(self, docid=None, changed_only=True):
        """convert all references to json

        Args:
            changed_only (bool, optional) : whether to dump only attributes
                that have had their values changed at some point (default: True)
        """
        models = self.references()
        return dump(models, docid=docid, changed_only=changed_only)

    def update(self, **kwargs):
        for k,v in kwargs.items():
            setattr(self, k, v)

    def __str__(self):
        return "%s, ViewModel:%s, ref _id: %s" % (self.__class__.__name__,
                self.__view_model__, getattr(self, "_id", None))

    def on_change(self, attrname, obj, callbackname=None):
        """when attrname of self changes, call callbackname
        on obj
        """
        callbacks = self._callbacks.setdefault(attrname, [])
        callback = dict(obj=obj, callbackname=callbackname)
        if callback not in callbacks:
            callbacks.append(callback)
        self._callbacks_dirty = True

    def _trigger(self, attrname, old, new):
        """attrname of self changed.  So call all callbacks
        """
        callbacks = self._callbacks.get(attrname)
        if callbacks:
            for callback in callbacks:
                obj = callback.get('obj')
                callbackname = callback.get('callbackname')
                fn = obj if callbackname is None else getattr(obj, callbackname)
                fn(self, attrname, old, new)
