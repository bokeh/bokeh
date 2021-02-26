#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for all objects (called Bokeh Models) that can go in
a Bokeh |Document|.

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
import typing as tp
from inspect import isclass
from json import loads
from operator import itemgetter

# Bokeh imports
from .core.has_props import HasProps, abstract
from .core.json_encoder import serialize_json
from .core.properties import AnyRef, Bool, Dict, Instance, List, Nullable, String
from .events import Event
from .themes import default as default_theme
from .util.callback_manager import EventCallbackManager, PropertyCallbackManager
from .util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'collect_models',
    'get_class',
    'DataModel',
    'Model',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def collect_filtered_models(discard, *input_values):
    ''' Collect a duplicate-free list of all other Bokeh models referred to by
    this model, or by any of its references, etc, unless filtered-out by the
    provided callable.

    Iterate over ``input_values`` and descend through their structure
    collecting all nested ``Models`` on the go.

    Args:
        *discard (Callable[[Model], bool])
            a callable which accepts a *Model* instance as its single argument
            and returns a boolean stating whether to discard the instance. The
            latter means that the instance will not be added to collected
            models nor will its references be explored.

        *input_values (Model)
            Bokeh models to collect other models from

    Returns:
        None

    '''

    ids = set()
    collected = []
    queued = []

    def queue_one(obj):
        if obj.id not in ids and not (callable(discard) and discard(obj)):
            queued.append(obj)

    for value in input_values:
        _visit_value_and_its_immediate_references(value, queue_one)

    while queued:
        obj = queued.pop(0)
        if obj.id not in ids:
            ids.add(obj.id)
            collected.append(obj)
            _visit_immediate_value_references(obj, queue_one)

    return collected

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
    return collect_filtered_models(None, *input_values)

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

    # in order to look up from the model catalog that Model maintains, it
    # has to be creates first. These imports ensure that all built-in Bokeh
    # models are represented in the catalog.
    from . import models; models
    from .plotting import Figure; Figure

    d = Model.model_class_reverse_map
    if view_model_name in d:
        return d[view_model_name]
    else:
        raise KeyError("View model name '%s' not found" % view_model_name)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

_HTML_REPR = """
<script>
(function() {
  let expanded = false;
  const ellipsis = document.getElementById("%(ellipsis_id)s");
  ellipsis.addEventListener("click", function() {
    const rows = document.getElementsByClassName("%(cls_name)s");
    for (let i = 0; i < rows.length; i++) {
      const el = rows[i];
      el.style.display = expanded ? "none" : "table-row";
    }
    ellipsis.innerHTML = expanded ? "&hellip;)" : "&lsaquo;&lsaquo;&lsaquo;";
    expanded = !expanded;
  });
})();
</script>
"""


def _process_example(cls):
    ''' A decorator to mark abstract base classes derived from |HasProps|.

    '''
    if "__example__" in cls.__dict__:
        path = cls.__dict__["__example__"]

        # running python with -OO will discard docstrings -> __doc__ is None
        if cls.__doc__ is not None:
            cls.__doc__ += _EXAMPLE_TEMPLATE % dict(path=path)

    return cls

def _qualified_model(cls):
    module = cls.__view_module__
    model = cls.__dict__.get("__subtype__", cls.__view_model__)
    impl = cls.__dict__.get("__implementation__", None)

    head = module.split(".")[0]
    if head == "bokeh" or head == "__main__" or impl is not None:
        return model
    return f"{module}.{model}"


@abstract
class Model(HasProps, PropertyCallbackManager, EventCallbackManager):
    ''' Base class for all objects stored in Bokeh  |Document| instances.

    '''

    model_class_reverse_map = {}

    @classmethod
    def __init_subclass__(cls):
        super().__init_subclass__()

        # use an explicitly provided view model name if there is one
        if "__view_model__" not in cls.__dict__:
            cls.__view_model__ = cls.__name__
        if "__view_module__" not in cls.__dict__:
            cls.__view_module__ = cls.__module__

        qualified = _qualified_model(cls)

        cls.__qualified_model__ = qualified

        # update the mapping of view model names to classes, checking for any duplicates
        previous = cls.model_class_reverse_map.get(qualified, None)
        if previous is not None and not hasattr(cls, "__implementation__"):
            raise Warning(f"Duplicate qualified model declaration of '{qualified}'. Previous definition: {previous}")
        cls.model_class_reverse_map[qualified] = cls

        _process_example(cls)

    def __new__(cls, *args, **kwargs):
        obj =  super().__new__(cls)
        obj._id = kwargs.pop("id", make_id())
        obj._document = None
        obj._temp_document = None
        return obj

    def __init__(self, **kwargs):

        # "id" is popped from **kw in __new__, so in an ideal world I don't
        # think it should be here too. But Python does this, so it is:
        #
        # class Foo(object):
        #     def __new__(cls, *args, **kw):
        #         obj = super().__new__(cls)
        #         obj.bar = kw.pop("bar", 111)
        #         print("__new__  :", id(kw), kw)
        #         return obj
        #     def __init__(self, **kw):
        #         print("__init__ :", id(kw), kw)
        #
        # >>> f = Foo(bar=10)
        # __new__  : 4405522296 {}
        # __init__ : 4405522296 {'bar': 10}
        kwargs.pop("id", None)

        super().__init__(**kwargs)
        default_theme.apply_to_model(self)

    def __str__(self) -> str:
        name = self.__class__.__name__
        return f"{name}(id={self.id!r}, ...)"

    __repr__ = __str__

    @property
    def id(self) -> str:
        return self._id

    name: tp.Union[None, str] = Nullable(String, help="""
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

    tags: tp.List[tp.Any] = List(AnyRef, help="""
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
    that can be accessed by ``CustomJS`` callbacks, etc.

    .. note::
        No uniqueness guarantees or other conditions are enforced on any tags
        that are provided, nor are the tags used directly by Bokeh for any
        reason.

    """)

    js_event_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.CustomJS")),
    help="""
    A mapping of event names to lists of ``CustomJS`` callbacks.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_event`` method:

    .. code:: python

        callback = CustomJS(code="console.log('tap event occurred')")
        plot.js_on_event('tap', callback)
    """)

    subscribed_events = List(String, help="""
    List of events that are subscribed to by Python callbacks. This is
    the set of events that will be communicated from BokehJS back to
    Python for this model.
    """)

    js_property_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.CustomJS")), help="""
    A mapping of attribute names to lists of ``CustomJS`` callbacks, to be set up on
    BokehJS side when the document is created.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_change`` method:

    .. code:: python

        callback = CustomJS(code="console.log('stuff')")
        plot.x_range.js_on_change('start', callback)

    """)

    syncable: bool = Bool(default=True, help="""
    Indicates whether this model should be synchronized back to a Bokeh server when
    updated in a web browser. Setting to ``False`` may be useful to reduce network
    traffic when dealing with frequently updated objects whose updated values we
    don't need.

    .. note::
        Setting this property to ``False`` will prevent any ``on_change()`` callbacks
        on this object from triggering. However, any JS-side callbacks will still
        work.

    """)

    # Properties --------------------------------------------------------------

    @property
    def document(self):
        ''' The |Document| this model is attached to (can be ``None``)

        '''
        if self._temp_document is not None:
            return self._temp_document
        return self._document

    @property
    def ref(self):
        return dict(id=self._id)

    @property
    def struct(self):
        ''' A Bokeh protocol "structure" of this model, i.e. a dict of the form:

        .. code-block:: python

            {
                'type' : << view model name >>
                'id'   : << unique model id >>
            }

        Additionally there may be a `subtype` field if this model is a subtype.

        '''
        this = {
            'type': self.__qualified_model__,
            'id'  : self.id,
        }

        if "__subtype__" in self.__class__.__dict__:
            # XXX: remove __subtype__ and this garbage at 2.0
            parts = this["type"].split(".")
            parts[-1] = self.__view_model__
            this["type"] = ".".join(parts)
            this["subtype"] = self.__subtype__

        return this

    # Public methods ----------------------------------------------------------

    def js_on_event(self, event: tp.Union[str, tp.Type[Event]], *callbacks) -> None:
        if isinstance(event, str):
            pass
        elif isinstance(event, type) and issubclass(event, Event):
            event = event.event_name
        else:
            raise ValueError(f"expected string event name or event class, got {event}")

        all_callbacks = list(self.js_event_callbacks.get(event, []))

        for callback in callbacks:
            if callback not in all_callbacks:
                all_callbacks.append(callback)

        self.js_event_callbacks[event] = all_callbacks

    def js_link(self, attr, other, other_attr, attr_selector=None):
        ''' Link two Bokeh model properties using JavaScript.

        This is a convenience method that simplifies adding a CustomJS callback
        to update one Bokeh model property whenever another changes value.

        Args:

            attr (str) :
                The name of a Bokeh property on this model

            other (Model):
                A Bokeh model to link to self.attr

            other_attr (str) :
                The property on ``other`` to link together

            attr_selector (Union[int, str]) :
                The index to link an item in a subscriptable ``attr``

        Added in version 1.1

        Raises:

            ValueError

        Examples:

            This code with ``js_link``:

            .. code :: python

                select.js_link('value', plot, 'sizing_mode')

            is equivalent to the following:

            .. code:: python

                from bokeh.models import CustomJS
                select.js_on_change('value',
                    CustomJS(args=dict(other=plot),
                             code="other.sizing_mode = this.value"
                    )
                )

            Additionally, to use attr_selector to attach the left side of a range slider to a plot's x_range:

            .. code :: python

                range_slider.js_link('value', plot.x_range, 'start', attr_selector=0)

            which is equivalent to:

            .. code :: python

                from bokeh.models import CustomJS
                range_slider.js_on_change('value',
                    CustomJS(args=dict(other=plot.x_range),
                             code="other.start = this.value[0]"
                    )
                )

        '''
        descriptor = self.lookup(attr, raises=False)
        if descriptor is None:
            raise ValueError("%r is not a property of self (%r)" % (attr, self))

        if not isinstance(other, Model):
            raise ValueError("'other' is not a Bokeh model: %r" % other)

        other_descriptor = other.lookup(other_attr, raises=False)
        if other_descriptor is None:
            raise ValueError("%r is not a property of other (%r)" % (other_attr, other))

        from bokeh.models import CustomJS

        selector = f"[{attr_selector!r}]" if attr_selector is not None else ""
        cb = CustomJS(args=dict(other=other), code=f"other.{other_descriptor.name} = this.{descriptor.name}{selector}")

        self.js_on_change(attr, cb)

    def js_on_change(self, event, *callbacks):
        ''' Attach a ``CustomJS`` callback to an arbitrary BokehJS model event.

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
        from bokeh.models import CustomJS
        if not all(isinstance(x, CustomJS) for x in callbacks):
            raise ValueError("not all callback values are CustomJS instances")

        descriptor = self.lookup(event, raises=False)
        if descriptor is not None:
            event = f"change:{descriptor.name}"

        old = {k: [cb for cb in cbs] for k, cbs in self.js_property_callbacks.items()}
        if event not in self.js_property_callbacks:
            self.js_property_callbacks[event] = []
        for callback in callbacks:
            if callback in self.js_property_callbacks[event]:
                continue
            self.js_property_callbacks[event].append(callback)
        self.trigger('js_property_callbacks', old, self.js_property_callbacks)

    def layout(self, side, plot):
        '''

        '''
        try:
            return self in getattr(plot, side)
        except Exception:
            return []

    def on_change(self, attr, *callbacks):
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            *callbacks (callable) : callback functions to register

        Returns:
            None

        Example:

        .. code-block:: python

            widget.on_change('value', callback1, callback2, ..., callback_n)

        '''
        descriptor = self.lookup(attr)
        super().on_change(descriptor.name, *callbacks)

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
        from .core.query import find
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
        if isclass(selector) and issubclass(selector, Model):
            selector = dict(type=selector)
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

        There's no corresponding ``from_json()`` because to
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

        There's no corresponding ``from_json_string()`` because to
        deserialize an object is normally done in the context of a
        Document (since the Document can resolve references).

        For most purposes it's best to serialize and deserialize
        entire documents.

        Args:
            include_defaults (bool) : whether to include attributes
                that haven't been changed from the default

        '''
        json_like = self._to_json_like(include_defaults=include_defaults)
        json_like['id'] = self.id
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
        # this may need to be further refined in the future, if the
        # assumption does not hold for future hinted events (e.g. the hint
        # could specify explicitly whether to do normal invalidation or not)
        if hint is None:
            dirty = { 'count' : 0 }
            def mark_dirty(obj):
                dirty['count'] += 1
            if self._document is not None:
                _visit_value_and_its_immediate_references(new, mark_dirty)
                _visit_value_and_its_immediate_references(old, mark_dirty)
                if dirty['count'] > 0:
                    self._document._invalidate_all_models()
        # chain up to invoke callbacks
        descriptor = self.lookup(attr)
        super().trigger(descriptor.name, old, new, hint=hint, setter=setter)

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

    @staticmethod
    def _clear_extensions():
        Model.model_class_reverse_map = {
            k: v for k, v in Model.model_class_reverse_map.items()
            if getattr(v, "__implementation__", None) is None
                and getattr(v, "__javascript__", None) is None
                and getattr(v, "__css__", None) is None
        }

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
        for use internal to Bokeh; use ``to_json()`` instead because
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

@abstract
class DataModel(Model):
    __data_model__ = True

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

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
        for key, value in obj.items():
            _visit_value_and_its_immediate_references(key, visitor)
            _visit_value_and_its_immediate_references(value, visitor)
    elif issubclass(typ, HasProps):
        if issubclass(typ, Model):
            visitor(obj)
        else:
            # this isn't a Model, so recurse into it
            _visit_immediate_value_references(obj, visitor)

# The "../../" is needed for bokeh-plot to construct the correct path to examples
_EXAMPLE_TEMPLATE = '''

    Example
    -------

    .. bokeh-plot:: ../../%(path)s
        :source-position: below

'''

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
