from __future__ import absolute_import, print_function

import os.path
from uuid import uuid4
from functools import wraps

import warnings
import logging
logger = logging.getLogger(__file__)

from six import add_metaclass, iteritems
from six.moves.urllib.parse import urlsplit

from .embed import autoload_static, autoload_server
from .properties import HasProps, MetaHasProps, Instance, String
from .protocol import serialize_json
from .utils import get_ref, convert_references, dump

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
        from . import objects, widgetobjects
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

def usesession(meth):
    """ Checks for 'session' in kwargs and in **self**, and guarantees
    that **kw** always has a valid 'session' parameter.  Wrapped methods
    should define 'session' as an optional argument, and in the body of
    the method, should expect an
    """
    @wraps(meth)
    def wrapper(self, *args, **kw):
        session = kw.get("session", None)
        if session is None:
            session = getattr(self, "session")
        if session is None:
            raise RuntimeError("Call to %s needs a session" % meth.__name__)
        kw["session"] = session
        return meth(self, *args, **kw)
    return wrapper

def is_ref(frag):
    return isinstance(frag, dict) and \
           frag.get('type') and \
           frag.get('id')

def json_apply(fragment, check_func, func):
    """recursively searches through a nested dict/lists
    if check_func(fragment) is True, then we return
    func(fragment)
    """
    if check_func(fragment):
        return func(fragment)
    elif isinstance(fragment, list):
        output = []
        for val in fragment:
            output.append(json_apply(val, check_func, func))
        return output
    elif isinstance(fragment, dict):
        output = {}
        for k, val in fragment.items():
            output[k] = json_apply(val, check_func, func)
        return output
    else:
        return fragment

def resolve_json(fragment, models):
    check_func = is_ref
    def func(fragment):
        if fragment['id'] in models:
            return models[fragment['id']]
        else:
            logging.error("model not found for %s", fragment)
            return None
    return json_apply(fragment, check_func, func)

@add_metaclass(Viewable)
class PlotObject(HasProps):
    """ Base class for all plot-related objects """

    session = Instance(".session.Session")
    name = String()

    def __init__(self, **kwargs):
        # Eventually should use our own memo instead of storing
        # an attribute on the class
        if "id" in kwargs:
            self._id = kwargs.pop("id")
        else:
            self._id = str(uuid4())

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

    def get_ref(self):
        return {
            'type': self.__view_model__,
            'id': self._id,
        }

    def setup_events(self):
        pass

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

        _doc = attrs.pop("doc", None)

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
