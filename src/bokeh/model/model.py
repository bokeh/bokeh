#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from inspect import Parameter, Signature, isclass
from typing import TYPE_CHECKING, Any, Iterable

# Bokeh imports
from ..core import properties as p
from ..core.has_props import HasProps, _default_resolver, abstract
from ..core.property._sphinx import type_link
from ..core.property.validation import without_property_validation
from ..core.serialization import ObjectRefRep, Ref, Serializer
from ..core.types import ID
from ..events import Event
from ..themes import default as default_theme
from ..util.callback_manager import EventCallbackManager, PropertyCallbackManager
from ..util.serialization import make_id
from .docs import html_repr, process_example
from .util import (
    HasDocumentRef,
    collect_models,
    visit_value_and_its_immediate_references,
)

if TYPE_CHECKING:
    from typing_extensions import Self

    from ..core.has_props import Setter
    from ..core.query import SelectorType
    from ..document import Document
    from ..document.events import DocumentPatchedEvent
    from ..models.callbacks import (
        Callback as JSEventCallback,
        CustomCode as JSChangeCallback,
    )
    from ..util.callback_manager import PropertyCallback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Model',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Model(HasProps, HasDocumentRef, PropertyCallbackManager, EventCallbackManager):
    ''' Base class for all objects stored in Bokeh |Document| instances.

    '''


    # a canonical order for positional args that can be
    # used for any functions derived from this class
    _args = ()

    _extra_kws = {}

    @classmethod
    def __init_subclass__(cls):
        super().__init_subclass__()

        if cls.__module__.startswith("bokeh.models"):
            assert "__init__" in cls.__dict__, str(cls)
            parameters = [x[0] for x in  cls.parameters()]
            cls.__init__.__signature__ = Signature(parameters=parameters)
            process_example(cls)

    _id: ID

    def __new__(cls, *args: Any, id: ID | None = None, **kwargs: Any) -> Self:
        obj = super().__new__(cls)

        # Setting 'id' implies deferred initialization, which means properties
        # will be initialized in a separate step by a deserializer, etc.
        if id is not None:
            if args or kwargs:
                raise ValueError("'id' cannot be used together with property initializers")
            obj._id = id
        else:
            obj._id = make_id()

        return obj

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if args:
            raise ValueError("positional arguments are not allowed")
        if "id" in kwargs:
            raise ValueError("initializing 'id' is not allowed")

        super().__init__(**kwargs)
        default_theme.apply_to_model(self)

    def __str__(self) -> str:
        name = self.__class__.__name__
        return f"{name}(id={self.id!r}, ...)"

    __repr__ = __str__

    def destroy(self) -> None:
        ''' Clean up references to the document and property

        '''
        self._document = None
        self._temp_document = None
        self._property_values.clear()

    @property
    def id(self) -> ID:
        return self._id

    name = p.Nullable(p.String, help="""
    An arbitrary, user-supplied name for this model.

    This name can be useful when querying the document to retrieve specific
    Bokeh models.

    .. code:: python

        >>> plot.scatter([1,2,3], [4,5,6], name="temp")
        >>> plot.select(name="temp")
        [GlyphRenderer(id='399d53f5-73e9-44d9-9527-544b761c7705', ...)]

    .. note::
        No uniqueness guarantees or other conditions are enforced on any names
        that are provided, nor is the name used directly by Bokeh for any
        reason.

    """)

    tags = p.List(p.AnyRef, help="""
    An optional list of arbitrary, user-supplied values to attach to this
    model.

    This data can be useful when querying the document to retrieve specific
    Bokeh models:

    .. code:: python

        >>> r = plot.scatter([1,2,3], [4,5,6])
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

    js_event_callbacks = p.Dict(p.String, p.List(p.Instance("bokeh.models.callbacks.Callback")), help="""
    A mapping of event names to lists of ``CustomJS`` callbacks.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_event`` method:

    .. code:: python

        callback = CustomJS(code="console.log('tap event occurred')")
        plot.js_on_event('tap', callback)
    """)

    js_property_callbacks = p.Dict(p.String, p.List(p.Instance("bokeh.models.callbacks.Callback")), help="""
    A mapping of attribute names to lists of ``CustomJS`` callbacks, to be set up on
    BokehJS side when the document is created.

    Typically, rather then modifying this property directly, callbacks should be
    added using the ``Model.js_on_change`` method:

    .. code:: python

        callback = CustomJS(code="console.log('stuff')")
        plot.x_range.js_on_change('start', callback)

    """)

    subscribed_events = p.Set(p.String, help="""
    Collection of events that are subscribed to by Python callbacks. This is
    the set of events that will be communicated from BokehJS back to Python
    for this model.
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
    def ref(self) -> Ref:
        return Ref(id=self._id)

    # Public methods ----------------------------------------------------------

    @classmethod
    def clear_extensions(cls) -> None:
        """ Clear any currently defined custom extensions.

        Serialization calls will result in any currently defined custom
        extensions being included with the generated Document, whether or not
        there are utilized. This method can be used to clear out all existing
        custom extension definitions.

        """
        _default_resolver.clear_extensions()

    @classmethod
    @without_property_validation
    def parameters(cls: type[Model]) -> list[Parameter]:
        ''' Generate Python ``Parameter`` values suitable for functions that are
        derived from the glyph.

        Returns:
            list(Parameter)

        '''
        arg_params = []
        no_more_defaults = False

        for arg in reversed(cls._args):
            descriptor = cls.lookup(arg)
            default = descriptor.class_default(cls, no_eval=True)
            if default is None:
                no_more_defaults = True

            # simplify field(x) defaults to just present the column name
            if isinstance(default, dict) and set(default) == {"field"}:
                default = default["field"]

            # make sure built-ins don't hold on to references to actual Models
            if cls.__module__.startswith("bokeh.models"):
                assert not isinstance(default, Model)

            param = Parameter(
                name=arg,
                kind=Parameter.POSITIONAL_OR_KEYWORD,
                # For positional arg properties, default=None means no default.
                default=Parameter.empty if no_more_defaults else default,
            )
            if default:
                del default
            typ = type_link(descriptor.property)
            arg_params.insert(0, (param, typ, descriptor.__doc__))

        # these are not really useful, and should also really be private, just skip them
        omissions = {'js_event_callbacks', 'js_property_callbacks', 'subscribed_events'}

        kwarg_params = []

        kws = set(cls.properties()) - set(cls._args) - omissions
        for kw in kws:
            descriptor = cls.lookup(kw)
            default = descriptor.class_default(cls, no_eval=True)

            # simplify field(x) defaults to just present the column name
            if isinstance(default, dict) and set(default) == {"field"}:
                default = default["field"]

            # make sure built-ins don't hold on to references to actual Models
            if cls.__module__.startswith("bokeh.models"):
                assert not isinstance(default, Model)

            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
                default=default,
            )
            del default
            typ = type_link(descriptor.property)
            kwarg_params.append((param, typ, descriptor.__doc__))

        for kw, (typ, doc) in cls._extra_kws.items():
            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
            )
            kwarg_params.append((param, typ, doc))

        kwarg_params.sort(key=lambda x: x[0].name)

        return arg_params + kwarg_params

    def js_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None:
        if isinstance(event, str):
            event_name = Event.cls_for(event).event_name
        elif isinstance(event, type) and issubclass(event, Event):
            event_name = event.event_name
        else:
            raise ValueError(f"expected string event name or event class, got {event}")

        all_callbacks = list(self.js_event_callbacks.get(event_name, []))

        for callback in callbacks:
            if callback not in all_callbacks:
                all_callbacks.append(callback)

        self.js_event_callbacks[event_name] = all_callbacks

    def js_link(self, attr: str, other: Model, other_attr: str, attr_selector: int | str | None = None) -> None:
        ''' Link two Bokeh model properties using JavaScript.

        This is a convenience method that simplifies adding a
        :class:`~bokeh.models.CustomJS` callback to update one Bokeh model
        property whenever another changes value.

        Args:

            attr (str) :
                The name of a Bokeh property on this model

            other (Model):
                A Bokeh model to link to self.attr

            other_attr (str) :
                The property on ``other`` to link together

            attr_selector (int | str) :
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
            raise ValueError(f"{attr!r} is not a property of self ({self!r})")

        if not isinstance(other, Model):
            raise ValueError(f"'other' is not a Bokeh model: {other!r}")

        other_descriptor = other.lookup(other_attr, raises=False)
        if other_descriptor is None:
            raise ValueError(f"{other_attr!r} is not a property of other ({other!r})")

        from bokeh.models import CustomJS

        selector = f"[{attr_selector!r}]" if attr_selector is not None else ""
        cb = CustomJS(args=dict(other=other), code=f"other.{other_descriptor.name} = this.{descriptor.name}{selector}")

        self.js_on_change(attr, cb)

    def js_on_change(self, event: str, *callbacks: JSChangeCallback) -> None:
        ''' Attach a :class:`~bokeh.models.CustomJS` callback to an arbitrary
        BokehJS model event.

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
        from bokeh.models.callbacks import CustomCode
        if not all(isinstance(x, CustomCode) for x in callbacks):
            raise ValueError("not all callback values are CustomCode instances")

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

    def on_change(self, attr: str, *callbacks: PropertyCallback) -> None:
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            *callbacks (callable) : callback functions to register

        Returns:
            None

        Examples:

            .. code-block:: python

                widget.on_change('value', callback1, callback2, ..., callback_n)

        '''
        descriptor = self.lookup(attr)
        super().on_change(descriptor.name, *callbacks)

    def references(self) -> set[Model]:
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
        from ..core.query import find
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
            raise ValueError(f"Found more than one object matching {selector}: {result!r}")
        if len(result) == 0:
            return None
        return result[0]

    def set_select(self, selector: type[Model] | SelectorType, updates: dict[str, Any]) -> None:
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

    def to_serializable(self, serializer: Serializer) -> ObjectRefRep:
        serializer.add_ref(self, self.ref)

        super_rep = super().to_serializable(serializer)
        rep = ObjectRefRep(
            type="object",
            name=super_rep["name"],
            id=self.id,
        )

        attributes = super_rep.get("attributes")
        if attributes is not None:
            rep["attributes"] = attributes

        return rep

    def trigger(self, attr: str, old: Any, new: Any,
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
                visit_value_and_its_immediate_references(new, mark_dirty)
                visit_value_and_its_immediate_references(old, mark_dirty)
                if dirty_count > 0:
                    self.document.models.invalidate()
        # chain up to invoke callbacks
        descriptor = self.lookup(attr)
        super().trigger(descriptor.name, old, new, hint=hint, setter=setter)

    def _attach_document(self, doc: Document) -> None:
        ''' Attach a model to a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to set the private ._document field properly

        '''
        if self.document is doc:  # nothing to do
            return

        if self.document is not None:
            raise RuntimeError(f"Models must be owned by only a single document, {self!r} is already in a doc")

        doc.theme.apply_to_model(self)
        self.document = doc
        self._update_event_callbacks()

    def _detach_document(self) -> None:
        ''' Detach a model from a Bokeh |Document|.

        This private interface should only ever called by the Document
        implementation to unset the private ._document field properly

        '''
        self.document = None
        default_theme.apply_to_model(self)

    def _repr_html_(self) -> str:
        return html_repr(self)

    def _sphinx_height_hint(self) -> int|None:
        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
