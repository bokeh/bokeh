''' Provide a base class for all objects (called Bokeh Models) that can go in
a Bokeh |Document|.

'''
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__file__)

from json import loads
from operator import itemgetter

from six import iteritems

from .core.json_encoder import serialize_json
from .core.properties import Any, Dict, Instance, List, String
from .core.has_props import HasProps, MetaHasProps
from .core.query import find
from .themes import default as default_theme
from .util.callback_manager import PropertyCallbackManager, EventCallbackManager
from .util.future import with_metaclass
from .util.serialization import make_id
from .util.deprecation import deprecated
from .events import Event

def collect_models(*input_values):
    ''' Collect a duplicate-free list of all other Bokeh models referred to by
    this model, or by any of its references, etc.

    Iterate over ``input_values`` and descend through their structure
    collecting all nested ``Models`` on the go. The resulting list is
    duplicate-free based on objects' identifiers.

    Args:
        *input_values (Model)
            Bokeh models to collect other models from

    Returns:
        list[Model] : all models reachable from this one.

    '''

    ids = set([])
    collected = []
    queued = []

    def queue_one(obj):
        if obj._id not in ids:
            queued.append(obj)

    for value in input_values:
        _visit_value_and_its_immediate_references(value, queue_one)

    while queued:
        obj = queued.pop(0)
        if obj._id not in ids:
            ids.add(obj._id)
            collected.append(obj)
            _visit_immediate_value_references(obj, queue_one)

    return collected

def get_class(view_model_name):
    ''' Look up a Bokeh model class, given its view model name.

    Args:
        view_model_name (str) :
            A view model name for a Bokeh model to look up

    Returns:
        Model: the model class corresponding to ``view_model_name``

    Raises:
        KeyError, if the model cannot be found

    Example:

        .. code-block:: python

            >>> from bokeh.model import get_class
            >>> get_class("Range1d")
            <class 'bokeh.models.ranges.Range1d'>

    '''

    # in order to look up from the model catalog that MetaModel maintains, it
    # has to be creates first. These imports ensure that all built-in Bokeh
    # models are represented in the catalog.
    from . import models; models
    from .plotting import Figure; Figure

    # We have to try-except here, because this import will fail if Pandas is
    # not installed, but in that case bkcharts is not usable anyway
    # try:
    #     from bkcharts import Chart; Chart
    # except RuntimeError:
    #     pass

    d = MetaModel.model_class_reverse_map
    if view_model_name in d:
        return d[view_model_name]
    else:
        raise KeyError("View model name '%s' not found" % view_model_name)

class MetaModel(MetaHasProps):
    ''' Specialize the construction of |Model| classes.

    This class is a `metaclass`_ for |Model| that is responsible for
    automatically cataloging all Bokeh models that get defined, so that the
    serialization machinery between Bokeh and BokehJS can function properly.

    .. note::
        It is worth pointing out explicitly that this relies on the rules
        for Metaclass inheritance in Python.

    Bokeh works by replicating Python model objects (e.g. plots, ranges,
    data sources, which are all |HasProps| subclasses) into BokehJS. In the
    case of using a Bokeh server, the Bokeh model objects can also be
    synchronized bidirectionally. This is accomplished by serializing the
    models to and from a JSON format, that includes the name of the model type
    as part of the payload, as well as a unique ID, and all the attributes:

    .. code-block:: javascript

        {
            type: "Plot",
            id: 100032,
            attributes: { ... }
        }

    Typically the type name is inferred automatically from the Python class
    name, and is set as the ``__view_model__`` class attribute on the Model
    class that is create. But it is also possible to override this value
    explicitly:

    .. code-block:: python

        class Foo(Model): pass

        class Bar(Model):
            __view_model__ == "Quux"

    This metaclass will raise an error if two Bokeh models are created that
    attempt to have the same view model name. The only exception made is if
    one of the models has a custom ``__implementation__`` in its class
    definition.

    This metaclass also handles subtype relationships between Bokeh models.
    Occasionally it may be necessary for multiple class types on the Python
    side to resolve to the same type on the BokehJS side. This is called
    subtyping, and is expressed through a ``__subtype__`` class attribute on
    a model:

    .. code-block:: python

        class Foo(Model): pass

        class Bar(Foo):
            __view_model__ = "Foo"
            __subtype__ = "Bar"

    In this case, python instances of ``Foo`` and ``Bar`` will both resolve to
    ``Foo`` models in BokehJS. In the context of a Bokeh server application,
    the original python types will be faithfully round-tripped. (Without the
    ``__subtype__`` specified, the above code would raise an error due to
    duplicate view model names.)

    .. _metaclass: https://docs.python.org/3/reference/datamodel.html#metaclasses

    '''

    model_class_reverse_map = {}

    def __new__(meta_cls, class_name, bases, class_dict):
        '''

        Raises:
            Warning

        '''

        # use an explicitly provided view model name if there is one
        if "__view_model__" not in class_dict:
            class_dict["__view_model__"] = class_name

        # call the parent metaclass to create the new model type
        newcls = super(MetaModel, meta_cls).__new__(meta_cls, class_name, bases, class_dict)

        # update the mapping of view model names to classes, checking for any duplicates
        # and handling any subtype relationships or custom implementations
        entry = class_dict.get("__subtype__", class_dict["__view_model__"])
        if entry in MetaModel.model_class_reverse_map and not hasattr(newcls, "__implementation__"):
            raise Warning("Duplicate __view_model__ or __subtype__ declaration of '%s' for " \
                          "class %s.  Previous definition: %s" % \
                          (entry, class_name,
                           MetaModel.model_class_reverse_map[entry]))
        MetaModel.model_class_reverse_map[entry] = newcls

        return newcls

_HTML_REPR = """
<script>
(function() {
  var expanded = false;
  var ellipsis = document.getElementById("%(ellipsis_id)s");
  ellipsis.addEventListener("click", function() {
    var rows = document.getElementsByClassName("%(cls_name)s");
    for (var i = 0; i < rows.length; i++) {
      var el = rows[i];
      el.style.display = expanded ? "none" : "table-row";
    }
    ellipsis.innerHTML = expanded ? "&hellip;)" : "&lsaquo;&lsaquo;&lsaquo;";
    expanded = !expanded;
  });
})();
</script>
"""

class Model(with_metaclass(MetaModel, HasProps, PropertyCallbackManager, EventCallbackManager)):
    ''' Base class for all objects stored in Bokeh  |Document| instances.

    '''

    def __init__(self, **kwargs):
        self._id = kwargs.pop("id", make_id())
        self._document = None
        super(Model, self).__init__(**kwargs)
        default_theme.apply_to_model(self)

    def __str__(self):
        return "%s(id=%r, ...)" % (self.__class__.__name__, getattr(self, "_id", None))

    __repr__ = __str__


    name = String(help="""
    An arbitrary, user-supplied name for this model.

    This name can be useful when querying the document to retrieve specific
    Bokeh models.

    .. code:: python

        >>> plot.circle([1,2,3], [4,5,6], name="temp")
        >>> plot.select(name="temp")
        [GlyphRenderer(id='399d53f5-73e9-44d9-9527-544b761c7705', ...)]

    .. note::
        No uniqueness guarantees or other conditions are enforced on any names
        that are provided, nor is the name used directly by Bokeh for any
        reason.

    """)

    tags = List(Any, help="""
    An optional list of arbitrary, user-supplied values to attach to this
    model.

    This data can be useful when querying the document to retrieve specific
    Bokeh models:

    .. code:: python

        >>> r = plot.circle([1,2,3], [4,5,6])
        >>> r.tags = ["foo", 10]
        >>> plot.select(tags=['foo', 10])
        [GlyphRenderer(id='1de4c3df-a83d-480a-899b-fb263d3d5dd9', ...)]

    Or simply a convenient way to attach any necessary metadata to a model
    that can be accessed by CustomJS callbacks, etc.

    .. note::
        No uniqueness guarantees or other conditions are enforced on any tags
        that are provided, nor are the tags used directly by Bokeh for any
        reason.

    """)

    js_event_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.CustomJS")),
    help="""A mapping of event names to lists of CustomJS callbacks.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_event`` method:

    .. code:: python

        callback = CustomJS(code="console.log('tap event occured')")
        plot.js_on_event('tap', callback)
    """)

    subscribed_events = List(String, help="""
    List of events that are subscribed to by Python callbacks. This is
    the set of events that will be communicated from BokehJS back to
    Python for this model.
    """)

    js_property_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.CustomJS")), help="""
    A mapping of attribute names to lists of CustomJS callbacks, to be set up on
    BokehJS side when the document is created.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_change`` method:

    .. code:: python

        callback = CustomJS(code="console.log('stuff')")
        plot.x_range.js_on_change('start', callback)

    """)


    @property
    def document(self):
        ''' The |Document| this model is attached to (can be ``None``)

        '''
        return self._document

    @property
    def ref(self):
        ''' A Bokeh protocol "reference" to this model, i.e. a dict of the
        form:

        .. code-block:: python

            {
                'type' : << view model name >>
                'id'   : << unique model id >>
            }

        Additionally there may be a `subtype` field if this model is a subtype.

        '''
        if "__subtype__" in self.__class__.__dict__:
            return {
                'type'    : self.__view_model__,
                'subtype' : self.__subtype__,
                'id'      : self._id,
            }
        else:
            return {
                'type' : self.__view_model__,
                'id'   : self._id,
            }

    def js_on_event(self, event, *callbacks):

        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        if event not in self.js_event_callbacks:
            self.js_event_callbacks[event] = []

        for callback in callbacks:
            if callback in self.js_event_callbacks[event]:
                continue
            self.js_event_callbacks[event].append(callback)


    def js_on_change(self, event, *callbacks):
        ''' Attach a CustomJS callback to an arbitrary BokehJS model event.

        On the BokehJS side, change events for model properties have the
        form ``"change:property_name"``. As a convenience, if the event name
        passed to this method is also the name of a property on the model,
        then it will be prefixed with ``"change:"`` automatically:

        .. code:: python

            # these two are equivalent
            source.js_on_change('data', callback)
            source.js_on_change('change:data', callback)

        However, there are other kinds of events that can be useful to respond
        to, in addition to property change events. For example to run a
        callback whenever data is streamed to a ``ColumnDataSource``, use the
        ``"stream"`` event on the source:

        .. code:: python

            source.js_on_change('streaming', callback)

        '''
        if len(callbacks) == 0:
            raise ValueError("js_on_change takes an event name and one or more callbacks, got only one parameter")

        # handle any CustomJS callbacks here
        from bokeh.models.callbacks import CustomJS
        if not all(isinstance(x, CustomJS) for x in callbacks):
            raise ValueError("not all callback values are CustomJS instances")

        if event in self.properties():
            event = "change:%s" % event

        from bokeh.models.sources import ColumnarDataSource
        if isinstance(self, ColumnarDataSource):
            if event == 'stream':
                deprecated((0, 12, 6), "ColumnarDataSource.js_on_change('stream', ...)", "'streaming'")
                event = 'streaming'
            elif event == 'patch':
                event = 'patching'
                deprecated((0, 12, 6), "ColumnarDataSource.js_on_change('patch', ...)", "'patching'")

        if event not in self.js_property_callbacks:
            self.js_property_callbacks[event] = []
        for callback in callbacks:
            if callback in self.js_property_callbacks[event]:
                continue
            self.js_property_callbacks[event].append(callback)

    def layout(self, side, plot):
        '''

        '''
        try:
            return self in getattr(plot, side)
        except:
            return []

    def on_change(self, attr, *callbacks):
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            callback (callable) : a callback function to register

        Returns:
            None

        '''
        if attr not in self.properties():
            raise ValueError("attempted to add a callback on nonexistent %s.%s property" % (self.__class__.__name__, attr))
        super(Model, self).on_change(attr, *callbacks)

    def references(self):
        ''' Returns all ``Models`` that this object has references to.

        '''
        return set(collect_models(self))

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

    def to_json(self, include_defaults):
        ''' Returns a dictionary of the attributes of this object,
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
            include_defaults (bool) : whether to include attributes
                that haven't been changed from the default

        '''
        return loads(self.to_json_string(include_defaults=include_defaults))

    def to_json_string(self, include_defaults):
        ''' Returns a JSON string encoding the attributes of this object.

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
            include_defaults (bool) : whether to include attributes
                that haven't been changed from the default

        '''
        json_like = self._to_json_like(include_defaults=include_defaults)
        json_like['id'] = self._id
        # serialize_json "fixes" the JSON from _to_json_like by converting
        # all types into plain JSON types # (it converts Model into refs,
        # for example).
        return serialize_json(json_like)

    def trigger(self, attr, old, new, hint=None, setter=None):
        '''

        '''

        # The explicit assumption here is that hinted events do not need to
        # go through all the same invalidation steps. Currently this is the
        # case for ColumnsStreamedEvent and ColumnsPatchedEvent. However,
        # this may need to be further refined in the future, if the a
        # assumption does not hold for future hinted events (e.g. the hint
        # could specify explicitly whether to do normal invalidation or not)
        if not hint:
            dirty = { 'count' : 0 }
            def mark_dirty(obj):
                dirty['count'] += 1
            if self._document is not None:
                _visit_value_and_its_immediate_references(new, mark_dirty)
                _visit_value_and_its_immediate_references(old, mark_dirty)
                if dirty['count'] > 0:
                    self._document._invalidate_all_models()
        # chain up to invoke callbacks
        super(Model, self).trigger(attr, old, new, hint, setter)

    def _attach_document(self, doc):
        ''' Attach a model to a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to set the private ._document field properly

        '''
        if self._document is not None and self._document is not doc:
            raise RuntimeError("Models must be owned by only a single document, %r is already in a doc" % (self))
        doc.theme.apply_to_model(self)
        self._document = doc
        self._update_event_callbacks()

    def _detach_document(self):
        ''' Detach a model from a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to unset the private ._document field properly

        '''
        self._document = None
        default_theme.apply_to_model(self)

    def _to_json_like(self, include_defaults):
        ''' Returns a dictionary of the attributes of this object, in
        a layout corresponding to what BokehJS expects at unmarshalling time.

        This method does not convert "Bokeh types" into "plain JSON types,"
        for example each child Model will still be a Model, rather
        than turning into a reference, numpy isn't handled, etc.
        That's what "json like" means.

        This method should be considered "private" or "protected",
        for use internal to Bokeh; use to_json() instead because
        it gives you only plain JSON-compatible types.

        Args:
            include_defaults (bool) : whether to include attributes
                that haven't been changed from the default.

        '''
        all_attrs = self.properties_with_values(include_defaults=include_defaults)

        # If __subtype__ is defined, then this model may introduce properties
        # that don't exist on __view_model__ in bokehjs. Don't serialize such
        # properties.
        subtype = getattr(self.__class__, "__subtype__", None)
        if subtype is not None and subtype != self.__class__.__view_model__:
            attrs = {}
            for attr, value in all_attrs.items():
                if attr in self.__class__.__dict__:
                    continue
                else:
                    attrs[attr] = value
        else:
            attrs = all_attrs

        for (k, v) in attrs.items():
            # we can't serialize Infinity, we send it as None and
            # the other side has to fix it up. This transformation
            # can't be in our json_encoder because the json
            # module checks for inf before it calls the custom
            # encoder.
            if isinstance(v, float) and v == float('inf'):
                attrs[k] = None

        return attrs

    def _repr_html_(self):
        '''

        '''
        module = self.__class__.__module__
        name = self.__class__.__name__

        _id = getattr(self, "_id", None)

        cls_name = make_id()

        def row(c):
            return '<div style="display: table-row;">' + c + '</div>'
        def hidden_row(c):
            return '<div class="%s" style="display: none;">%s</div>' % (cls_name, c)
        def cell(c):
            return '<div style="display: table-cell;">' + c + '</div>'

        html = ''
        html += '<div style="display: table;">'

        ellipsis_id = make_id()
        ellipsis = '<span id="%s" style="cursor: pointer;">&hellip;)</span>' % ellipsis_id

        prefix = cell('<b title="%s.%s">%s</b>(' % (module, name, name))
        html += row(prefix + cell('id' + '&nbsp;=&nbsp;' + repr(_id) + ', ' + ellipsis))

        props = self.properties_with_values().items()
        sorted_props = sorted(props, key=itemgetter(0))
        all_props = sorted_props
        for i, (prop, value) in enumerate(all_props):
            end = ')' if i == len(all_props)-1 else ','
            html += hidden_row(cell("") + cell(prop + '&nbsp;=&nbsp;' + repr(value) + end))

        html += '</div>'
        html += _HTML_REPR % dict(ellipsis_id=ellipsis_id, cls_name=cls_name)

        return html

    def _repr_pretty(self, p, cycle):
        '''

        '''
        name = "%s.%s" % (self.__class__.__module__, self.__class__.__name__)
        _id = getattr(self, "_id", None)

        if cycle:
            p.text(name)
            p.text('(id=')
            p.pretty(_id)
            p.text(', ...)')
        else:
            with p.group(4, '%s(' % name, ')'):
                props = self.properties_with_values().items()
                sorted_props = sorted(props, key=itemgetter(0))
                all_props = [('id', _id)] + sorted_props
                for i, (prop, value) in enumerate(all_props):
                    if i == 0:
                        p.breakable('')
                    else:
                        p.text(',')
                        p.breakable()
                    p.text(prop)
                    p.text('=')
                    p.pretty(value)

def _visit_immediate_value_references(value, visitor):
    ''' Visit all references to another Model without recursing into any
    of the child Model; may visit the same Model more than once if
    it's referenced more than once. Does not visit the passed-in value.

    '''
    if isinstance(value, HasProps):
        for attr in value.properties_with_refs():
            child = getattr(value, attr)
            _visit_value_and_its_immediate_references(child, visitor)
    else:
        _visit_value_and_its_immediate_references(value, visitor)


_common_types = {int, float, str}


def _visit_value_and_its_immediate_references(obj, visitor):
    ''' Recurse down Models, HasProps, and Python containers

    The ordering in this function is to optimize performance.  We check the
    most comomn types (int, float, str) first so that we can quickly return in
    the common case.  We avoid isinstance and issubclass checks in a couple
    places with `type` checks because isinstance checks can be slow.
    '''
    typ = type(obj)
    if typ in _common_types:  # short circuit on common base types
        return
    if typ is list or issubclass(typ, (list, tuple)):  # check common containers
        for item in obj:
            _visit_value_and_its_immediate_references(item, visitor)
    elif issubclass(typ, dict):
        for key, value in iteritems(obj):
            _visit_value_and_its_immediate_references(key, visitor)
            _visit_value_and_its_immediate_references(value, visitor)
    elif issubclass(typ, HasProps):
        if issubclass(typ, Model):
            visitor(obj)
        else:
            # this isn't a Model, so recurse into it
            _visit_immediate_value_references(obj, visitor)
