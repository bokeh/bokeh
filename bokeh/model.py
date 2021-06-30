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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import isclass
from json import loads
from operator import itemgetter
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Dict,
    Iterable,
    List,
    Set,
    Type,
)

# External imports
from typing_extensions import TypedDict

# Bokeh imports
from .core import properties as p
from .core.has_props import HasProps, abstract
from .core.json_encoder import serialize_json
from .core.types import ID, Unknown
from .events import Event
from .themes import default as default_theme
from .util.callback_manager import EventCallbackManager, PropertyCallbackManager
from .util.serialization import make_id
from .util.string import append_docstring

if TYPE_CHECKING:
    from .core.has_props import Setter
    from .core.query import SelectorType
    from .core.types import JSON
    from .document import Document
    from .document.events import DocumentPatchedEvent
    from .models.callbacks import Callback as JSEventCallback
    from .util.callback_manager import PropertyCallback

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

class Ref(TypedDict):
    id: ID

class _ReferenceJson(TypedDict):
    id: ID
    type: str
    attributes: Dict[str, Unknown]

class ReferenceJson(_ReferenceJson, total=False):
    subtype: str | None

def collect_filtered_models(discard: Callable[[Model], bool] | None, *input_values: Unknown) -> List[Model]:
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
        list(Model)

    '''

    ids: Set[ID] = set()
    collected: List[Model] = []
    queued: List[Model] = []

    def queue_one(obj: Model) -> None:
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

def collect_models(*input_values: Unknown) -> List[Model]:
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

def get_class(view_model_name: str) -> Type[Model]:
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
        raise KeyError(f"View model name '{view_model_name}' not found")

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


def _process_example(cls: Type[Any]) -> None:
    ''' A decorator to mark abstract base classes derived from |HasProps|.

    '''
    if "__example__" in cls.__dict__:
        cls.__doc__ = append_docstring(cls.__doc__, _EXAMPLE_TEMPLATE.format(path=cls.__dict__["__example__"]))

@abstract
class Qualified(HasProps):
    pass

def _qualified_model(cls: Type[Model]) -> str:
    module = cls.__view_module__
    model = cls.__dict__.get("__subtype__", cls.__view_model__)
    impl = cls.__dict__.get("__implementation__", None)

    if not issubclass(cls, Qualified):
        head = module.split(".")[0]
        if head == "bokeh" or head == "__main__" or impl is not None:
            return model
    return f"{module}.{model}"

@abstract
class Model(HasProps, PropertyCallbackManager, EventCallbackManager):
    ''' Base class for all objects stored in Bokeh  |Document| instances.

    '''

    model_class_reverse_map: ClassVar[Dict[str, Type[Model]]] = {}

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

    _id: ID
    _document: Document | None
    _temp_document: Document | None

    def __new__(cls, *args, **kwargs): # XXX: type annotations mess up bokeh-model directive
        obj =  super().__new__(cls)
        obj._id = kwargs.pop("id", make_id())
        obj._document = None
        obj._temp_document = None
        return obj

    def __init__(self, **kwargs: Any) -> None:

        # "id" is popped from **kw in __new__, so in an ideal world I don't
        # think it should be here too. But Python does this, so it is:
        #
        # class Foo(object):
        #     def __new__(cls, *args, **kw):
        #         obj = super().__new__(cls)
        #         obj.bar = kw.pop("bar", 111)
        #         print("__new__  :", id(kw), kw)
        #         return obj
        #     def __init__(self, **kw) -> None:
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
    def id(self) -> ID:
        return self._id

    name: str | None = p.Nullable(p.String, help="""
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

    tags: List[Any] = p.List(p.AnyRef, help="""
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

    js_event_callbacks = p.Dict(p.String, p.List(p.Instance("bokeh.models.callbacks.CustomJS")),
    help="""
    A mapping of event names to lists of ``CustomJS`` callbacks.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_event`` method:

    .. code:: python

        callback = CustomJS(code="console.log('tap event occurred')")
        plot.js_on_event('tap', callback)
    """)

    subscribed_events = p.List(p.String, help="""
    List of events that are subscribed to by Python callbacks. This is
    the set of events that will be communicated from BokehJS back to
    Python for this model.
    """)

    js_property_callbacks = p.Dict(p.String, p.List(p.Instance("bokeh.models.callbacks.CustomJS")), help="""
    A mapping of attribute names to lists of ``CustomJS`` callbacks, to be set up on
    BokehJS side when the document is created.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_change`` method:

    .. code:: python

        callback = CustomJS(code="console.log('stuff')")
        plot.x_range.js_on_change('start', callback)

    """)

    syncable: bool = p.Bool(default=True, help="""
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
    def document(self) -> Document | None:
        ''' The |Document| this model is attached to (can be ``None``)

        '''
        if self._temp_document is not None:
            return self._temp_document
        return self._document

    @property
    def ref(self) -> Ref:
        return Ref(id=self._id)

    @property
    def struct(self) -> ReferenceJson:
        ''' A Bokeh protocol "structure" of this model, i.e. a dict of the form:

        .. code-block:: python

            {
                'type' : << view model name >>
                'id'   : << unique model id >>
            }

        Additionally there may be a `subtype` field if this model is a subtype.

        '''
        this = ReferenceJson(
            id=self.id,
            type=self.__qualified_model__,
            attributes={},
        )

        if "__subtype__" in self.__class__.__dict__:
            # XXX: remove __subtype__ and this garbage at 2.0
            parts = this["type"].split(".")
            parts[-1] = self.__view_model__
            this["type"] = ".".join(parts)
            this["subtype"] = self.__subtype__

        return this

    # Public methods ----------------------------------------------------------

    def js_on_event(self, event: str | Type[Event], *callbacks: JSEventCallback) -> None:
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

    def js_link(self, attr: str, other: Model, other_attr: str, attr_selector: int | str | None = None) -> None:
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

    def js_on_change(self, event: str, *callbacks: JSEventCallback) -> None:
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

    def on_change(self, attr: str, *callbacks: PropertyCallback) -> None:
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

    def references(self) -> Set[Model]:
        ''' Returns all ``Models`` that this object has references to.

        '''
        return set(collect_models(self))

    def select(self, selector: SelectorType) -> Iterable[Model]:
        ''' Query this object and all of its references for objects that
        match the given selector.

        Args:
            selector (JSON-like) :

        Returns:
            seq[Model]

        '''
        from .core.query import find
        return find(self.references(), selector)

    def select_one(self, selector: SelectorType) -> Model | None:
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

    def set_select(self, selector: Type[Model] | SelectorType, updates: Dict[str, Unknown]) -> None:
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

    def to_json(self, include_defaults: bool) -> JSON:
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

    def to_json_string(self, include_defaults: bool) -> str:
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

    def trigger(self, attr: str, old: Unknown, new: Unknown,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None:
        '''

        '''

        # The explicit assumption here is that hinted events do not need to
        # go through all the same invalidation steps. Currently this is the
        # case for ColumnsStreamedEvent and ColumnsPatchedEvent. However,
        # this may need to be further refined in the future, if the
        # assumption does not hold for future hinted events (e.g. the hint
        # could specify explicitly whether to do normal invalidation or not)
        if hint is None:
            dirty_count = 0
            def mark_dirty(_: HasProps):
                nonlocal dirty_count
                dirty_count += 1
            if self._document is not None:
                _visit_value_and_its_immediate_references(new, mark_dirty)
                _visit_value_and_its_immediate_references(old, mark_dirty)
                if dirty_count > 0:
                    self._document._invalidate_all_models()
        # chain up to invoke callbacks
        descriptor = self.lookup(attr)
        super().trigger(descriptor.name, old, new, hint=hint, setter=setter)

    def _attach_document(self, doc: Document) -> None:
        ''' Attach a model to a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to set the private ._document field properly

        '''
        if self._document is not None and self._document is not doc:
            raise RuntimeError("Models must be owned by only a single document, %r is already in a doc" % (self))
        doc.theme.apply_to_model(self)
        self._document = doc
        self._update_event_callbacks()

    @classmethod
    def _clear_extensions(cls) -> None:
        cls.model_class_reverse_map = {
            k: v for k, v in cls.model_class_reverse_map.items()
            if getattr(v, "__implementation__", None) is None
                and getattr(v, "__javascript__", None) is None
                and getattr(v, "__css__", None) is None
        }

    def _detach_document(self) -> None:
        ''' Detach a model from a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to unset the private ._document field properly

        '''
        self._document = None
        default_theme.apply_to_model(self)

    def _to_json_like(self, include_defaults: bool):
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

    def _repr_html_(self) -> str:
        '''

        '''
        module = self.__class__.__module__
        name = self.__class__.__name__

        _id = getattr(self, "_id", None)

        cls_name = make_id()

        def row(c: str):
            return f'<div style="display: table-row;">{c}</div>'
        def hidden_row(c: str):
            return f'<div class="{cls_name}" style="display: none;">{c}</div>'
        def cell(c: str):
            return f'<div style="display: table-cell;">{c}</div>'

        html = ''
        html += '<div style="display: table;">'

        ellipsis_id = make_id()
        ellipsis = f'<span id="{ellipsis_id}" style="cursor: pointer;">&hellip;)</span>'

        prefix = cell(f'<b title="{module}.{name}">{name}</b>(')
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

def _visit_immediate_value_references(value: Unknown, visitor: Callable[[Model], None]) -> None:
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

def _visit_value_and_its_immediate_references(obj: Unknown, visitor: Callable[[Model], None]) -> None:
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

    .. bokeh-plot:: ../../{path}
        :source-position: below

'''

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
