from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__file__)

from functools import wraps

from six import add_metaclass, iteritems

from .properties import Any, HasProps, List, MetaHasProps, Instance, String
from .query import find
from .utils import dump, is_ref, json_apply, make_id, resolve_json

class Viewable(MetaHasProps):
    """ Any plot object (Data Model) which has its own View Model in the
    persistence layer.

    Adds handling of a __view_model__ attribute to the class (which is
    provided by default) which tells the View layer what View class to
    create.

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
        entry = class_dict["__view_model__"]
        # Add it to the reverse map, but check for duplicates first
        if entry in Viewable.model_class_reverse_map:
            raise Warning("Duplicate __view_model__ declaration of '%s' for " \
                          "class %s.  Previous definition: %s" % \
                          (entry, class_name,
                           Viewable.model_class_reverse_map[entry]))
        Viewable.model_class_reverse_map[entry] = newcls
        return newcls

    @classmethod
    def _preload_models(cls):
        from . import objects, widgets
        from .crossfilter import objects

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

        special_props = {}
        for p in dict(attrs):
            if p not in instance.properties():
                special_props[p] = attrs.pop(p)

        instance._ref_props = ref_props
        instance._special_props = special_props

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
        if hasattr(self, "_ref_props"):
            return resolve_json(self._ref_props, models)
        else:
            return {}

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
    def vm_props(self):
        """ Returns the ViewModel-related properties of this object. """
        props = self.changed_properties_with_values()
        props.pop("session", None)
        return props

    def vm_serialize(self):
        """ Returns a dictionary of the attributes of this object, in
        a layout corresponding to what BokehJS expects at unmarshalling time.
        """
        attrs = self.vm_props()
        attrs['id'] = self._id
        return attrs

    def dump(self, docid=None):
        """convert all references to json
        """
        models = self.references()
        return dump(models, docid=docid)

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
