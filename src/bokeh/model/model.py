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

# pyright: reportArgumentType=false, reportAssignmentType=false, reportAttributeAccessIssue=false, reportFunctionMemberAccess=false, reportIncompatibleVariableOverride=false, reportIndexIssue=false, reportOperatorIssue=false, reportOptionalMemberAccess=false, reportReturnType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from dataclasses import dataclass
from inspect import (
    Parameter,
    Signature,
    isclass,
    signature,
)
from math import isfinite
from numbers import Real
from typing import (
    TYPE_CHECKING,
    Any,
    ClassVar,
    Iterable,
    Literal,
    Self,
)

from ..core.has_props import HasProps, _default_resolver, abstract
from ..core.property._sphinx import type_link
from ..core.property.any import AnyRef
from ..core.property.container import (
    Dict,
    List,
    Set,
    Tuple,
)
from ..core.property.descriptors import ColumnDataPropertyDescriptor
from ..core.property.either import Either
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.nullable import Nullable
from ..core.property.numeric import Positive
from ..core.property.primitive import (
    Bool,
    Float,
    Null,
    String,
)
from ..core.property.validation import without_property_validation
from ..core.serialization import ObjectRefRep, Ref, Serializer
from ..events import Event
from ..themes import default as default_theme
from ..util.callback_manager import EventCallbackManager, PropertyCallbackManager
from ..util.serialization import make_id, reserve_id
from .docs import html_repr, process_example
from .util import (
    HasDocumentRef,
    collect_models,
    visit_value_and_its_immediate_references,
)

if TYPE_CHECKING:
    from ..core.has_props import Setter
    from ..core.query import SelectorType
    from ..core.serialization import ObjectRep
    from ..core.types import ID
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
    'CallbackPolicy',
    'Committed',
    'Debounce',
    'Model',
    'Throttle',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def _validate_callback_wait(wait: float) -> None:
    if isinstance(wait, bool) or not isinstance(wait, Real) or not isfinite(wait) or wait <= 0:
        raise ValueError("callback policy wait must be a finite positive number")

@dataclass(frozen=True, slots=True)
class Throttle:
    ''' Deliver changes at a limited rate, including the final value.

    The first change is delivered immediately. While changes continue, the
    latest value is delivered at most once per interval. The final value is
    always delivered.

    Args:
        wait: Minimum interval between callbacks, in milliseconds.

    '''

    wait: float

    def __post_init__(self) -> None:
        _validate_callback_wait(self.wait)

@dataclass(frozen=True, slots=True)
class Debounce:
    ''' Deliver only the final property change after changes stop.

    Each change restarts the timer. The latest value is delivered once no
    further changes arrive during the interval.

    Args:
        wait: Quiet interval before the callback, in milliseconds.

    '''

    wait: float

    def __post_init__(self) -> None:
        _validate_callback_wait(self.wait)

@dataclass(frozen=True, slots=True)
class Committed:
    ''' Deliver the final property change when an active interaction finishes. '''

type CallbackPolicy = Throttle | Debounce | Committed
type _CallbackPolicy = tuple[Literal["immediate", "committed"], None] | tuple[Literal["throttle", "debounce"], float]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

_IMMEDIATE_POLICY: _CallbackPolicy = ("immediate", None)

def _validate_callback_policy(model: Model, attr: str, mode: str) -> None:
    descriptor = model.lookup(attr)

    if isinstance(descriptor, ColumnDataPropertyDescriptor):
        raise ValueError(
            f"callback policies are not supported for column data property {descriptor.name!r}",
        )

    if descriptor.has_ref:
        raise ValueError(
            f"callback policies are not supported for properties containing Bokeh models: {descriptor.name!r}",
        )

    if mode == "committed" and descriptor.name not in model._committed_callback_properties:
        raise ValueError(
            f"committed callbacks are not supported for property {descriptor.name!r} "
            f"of {model.__class__.__name__}",
        )

def _validate_subscribed_changes(model: Model, changes: dict[str, list[tuple[str, float | None]]]) -> bool:
    for attr, policies in changes.items():
        for mode, _ in policies:
            if mode != "immediate":
                _validate_callback_policy(model, attr, mode)
    return True

def _validate_js_callback_policies(model: Model,
        events: dict[str, dict[str, list[tuple[str, float | None]]]]) -> bool:
    for event, policies in events.items():
        if not event.startswith("change:"):
            return False
        attr = event.removeprefix("change:")
        for callback_policies in policies.values():
            for mode, _ in callback_policies:
                if mode != "immediate":
                    _validate_callback_policy(model, attr, mode)
    return True

def _callback_policy(model: Model, attr: str, policy: CallbackPolicy | None) -> _CallbackPolicy:
    if policy is None:
        return _IMMEDIATE_POLICY
    if isinstance(policy, Committed):
        _validate_callback_policy(model, attr, "committed")
        return ("committed", None)
    elif isinstance(policy, Throttle):
        mode, wait = "throttle", policy.wait
    elif isinstance(policy, Debounce):
        mode, wait = "debounce", policy.wait
    else:
        raise ValueError(
            "'policy' must be a Throttle, Debounce, or Committed value",
        )
    _validate_callback_policy(model, attr, mode)
    return (mode, wait)

@abstract
class Model(HasProps, HasDocumentRef, PropertyCallbackManager, EventCallbackManager):
    ''' Base class for all objects stored in Bokeh |Document| instances.

    '''


    _committed_callback_properties: ClassVar[frozenset[str]] = frozenset()

    # a canonical order for positional args that can be
    # used for any functions derived from this class
    _args = ()

    _extra_kws = {}

    _callback_policies: dict[str, list[tuple[PropertyCallback, _CallbackPolicy]]]
    _callback_policy_values: dict[tuple[str, _CallbackPolicy], Any]
    _incoming_callback_policy: tuple[str, _CallbackPolicy, Any] | None
    _incoming_callback_dispatched: bool

    @classmethod
    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)

        initializer = cls.__init__
        # Synthesized wrappers forward through this class's MRO. In a diamond,
        # the first parent's recorded initializer may belong to another branch.
        effective_initializer = next(
            base.__dict__["__init__"] for base in cls.__mro__
            if "__init__" in base.__dict__ and not hasattr(base.__dict__["__init__"], "__bokeh_initializer__")
        )
        original_signature = getattr(effective_initializer, "__bokeh_init_signature__", None)
        if original_signature is None and effective_initializer is not Model.__init__:
            try:
                original_signature = signature(effective_initializer)
            except (TypeError, ValueError):
                # Constructor inspection may fail on unsupported callables or malformed
                # signature/wrapper metadata. Do not let that prevent class creation.
                pass

        if "__init__" not in cls.__dict__:
            # Each model needs its own function to avoid changing an inherited signature.
            def __init__(self, *args: Any, **kwargs: Any) -> None:
                # Resolve the next constructor using the instance's MRO, including mixins.
                super(cls, self).__init__(*args, **kwargs)

            try:
                display_initializer = initializer if getattr(initializer, "__bokeh_initializer__", initializer) is effective_initializer else effective_initializer
                __init__.__signature__ = signature(display_initializer)
            except (TypeError, ValueError):
                pass
            __init__.__bokeh_initializer__ = effective_initializer
            __init__.__qualname__ = f"{cls.__qualname__}.__init__"
            __init__.__module__ = cls.__module__
            cls.__init__ = __init__

        if cls.__module__.startswith("bokeh.models"):
            # Preserve explicit constructors' positional and keyword arguments.
            # Model's own *args only rejects positional inputs, so omit it.
            parameters = [Parameter("self", Parameter.POSITIONAL_ONLY)]
            if effective_initializer is not Model.__init__ and original_signature is not None:
                parameters.extend(param for param in list(original_signature.parameters.values())[1:]
                                  if param.kind != Parameter.VAR_KEYWORD)
            property_parameters = [entry[0] for entry in cls.parameters()]
            property_names = {param.name for param in property_parameters}
            names = property_names | {param.name for param in parameters}
            # A variadic argument's local name is not a caller-facing keyword.
            # Rename it in the displayed signature when a property uses that name.
            for index, param in enumerate(parameters):
                if param.kind == Parameter.VAR_POSITIONAL and param.name in property_names:
                    name = "args"
                    while name in names:
                        name += "_"
                    parameters[index] = param.replace(name=name)
                    names.add(name)
            names = {param.name for param in parameters}
            parameters.extend(param if param.kind == Parameter.KEYWORD_ONLY else param.replace(kind=Parameter.KEYWORD_ONLY)
                              for param in property_parameters
                              if param.name not in names)
            cls.__init__.__bokeh_init_signature__ = original_signature
            cls.__init__.__signature__ = Signature(parameters=parameters)
            process_example(cls)

    _id: ID

    # Don't override __new__, because then you will have to overload it every time
    # you overload __init__ with a custom signature (in e.g. ranges or figure) in
    # declaration files (*.pyi).
    @classmethod
    def _new(cls, id: ID) -> Self:
        return cls.__new__(cls, id=id)

    def __new__(cls, *args: Any, id: ID | None = None, **kwargs: Any) -> Self:
        obj = super().__new__(cls)

        # Deserialization deliberately bypasses Model.__init__, so initialize
        # runtime-only callback state while allocating every model instance.
        obj._callback_policies = {}
        obj._callback_policy_values = {}
        obj._incoming_callback_policy = None
        obj._incoming_callback_dispatched = False

        # Setting 'id' implies deferred initialization, which means properties
        # will be initialized in a separate step by a deserializer, etc.
        if id is not None:
            if args or kwargs:
                raise ValueError("'id' cannot be used together with property initializers")
            reserve_id(id)
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

    name = Nullable(String, help="""
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

    tags = List(AnyRef, help="""
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

    _js_event_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.Callback")))

    _js_property_callbacks = Dict(String, List(Instance("bokeh.models.callbacks.Callback")))

    _js_property_callback_policies = Dict(
        String,
        Dict(
            String,
            List(
                Either(
                    Tuple(Enum("immediate", "committed"), Null),
                    Tuple(Enum("throttle", "debounce"), Positive(Float)),
                ),
            ),
        ),
    ).asserts(_validate_js_callback_policies, "invalid JavaScript callback policy")

    _subscribed_events = Set(String)

    _subscribed_changes: dict[str, list[tuple[str, float | None]]] = Dict(
        String,
        List(
            Either(
                Tuple(Enum("immediate", "committed"), Null),
                Tuple(Enum("throttle", "debounce"), Positive(Float)),
            ),
        ),
    ).asserts(_validate_subscribed_changes, "invalid subscribed change policy")

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

        kwarg_params = []

        kws = {name for name in cls.properties() if not name.startswith("_")} - set(cls._args)
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

        all_callbacks = list(self._js_event_callbacks.get(event_name, []))

        for callback in callbacks:
            if callback not in all_callbacks:
                all_callbacks.append(callback)

        self._js_event_callbacks[event_name] = all_callbacks

    def js_remove_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None:
        ''' Remove ``CustomJS`` callbacks from a Bokeh model event. '''
        if len(callbacks) == 0:
            raise ValueError("js_remove_on_event takes an event name and one or more callbacks, got only one parameter")

        if isinstance(event, str):
            event_name = Event.cls_for(event).event_name
        elif isinstance(event, type) and issubclass(event, Event):
            event_name = event.event_name
        else:
            raise ValueError(f"expected string event name or event class, got {event}")

        all_callbacks = list(self._js_event_callbacks.get(event_name, []))
        for callback in callbacks:
            all_callbacks.remove(callback)

        if all_callbacks:
            self._js_event_callbacks[event_name] = all_callbacks
        else:
            del self._js_event_callbacks[event_name]

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

    def js_on_change(self, event: str, *callbacks: JSChangeCallback,
            policy: CallbackPolicy | None = None) -> None:
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

        Property callbacks can be given one delivery policy. For example,
        ``policy=Throttle(100)`` uses a 100 millisecond interval, while
        ``policy=Committed()`` defers supported widget properties until the
        active interaction finishes. Omitting ``policy`` preserves immediate
        callback delivery. The same callback can be registered again with a
        different policy.

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
        elif event.startswith("change:"):
            descriptor = self.lookup(event.removeprefix("change:"), raises=False)

        if descriptor is None:
            if policy is not None:
                raise ValueError("callback policies can only be used with property change events")
            policy = _IMMEDIATE_POLICY
        else:
            policy = _callback_policy(self, descriptor.name, policy)

        old = {k: [cb for cb in cbs] for k, cbs in self._js_property_callbacks.items()}
        callback_policies = {
            name: {callback_id: list(registered) for callback_id, registered in policies.items()}
            for name, policies in self._js_property_callback_policies.items()
        }
        event_policies = callback_policies.setdefault(event, {})
        if event not in self._js_property_callbacks:
            self._js_property_callbacks[event] = []
        for callback in callbacks:
            existing = callback in self._js_property_callbacks[event]
            if not existing:
                self._js_property_callbacks[event].append(callback)
            policies = event_policies.get(callback.id, [_IMMEDIATE_POLICY] if existing else [])
            if policy not in policies:
                policies.append(policy)
            if policies == [_IMMEDIATE_POLICY]:
                event_policies.pop(callback.id, None)
            else:
                event_policies[callback.id] = policies
        if not event_policies:
            callback_policies.pop(event, None)
        self._js_property_callback_policies = callback_policies
        self.trigger('_js_property_callbacks', old, self._js_property_callbacks)

    def js_remove_on_change(self, event: str, *callbacks: JSChangeCallback) -> None:
        ''' Remove ``CustomJS`` callbacks from a BokehJS model event. '''
        if len(callbacks) == 0:
            raise ValueError("js_remove_on_change takes an event name and one or more callbacks, got only one parameter")

        from bokeh.models.callbacks import CustomCode
        if not all(isinstance(x, CustomCode) for x in callbacks):
            raise ValueError("not all callback values are CustomCode instances")

        descriptor = self.lookup(event, raises=False)
        if descriptor is not None:
            event = f"change:{descriptor.name}"

        old = {k: [cb for cb in cbs] for k, cbs in self._js_property_callbacks.items()}
        remaining = list(self._js_property_callbacks.get(event, []))
        callback_policies = {
            name: {callback_id: list(registered) for callback_id, registered in policies.items()}
            for name, policies in self._js_property_callback_policies.items()
        }
        event_policies = callback_policies.get(event, {})
        for callback in callbacks:
            remaining.remove(callback)
            event_policies.pop(callback.id, None)

        if remaining:
            self._js_property_callbacks[event] = remaining
        else:
            del self._js_property_callbacks[event]
        if not event_policies:
            callback_policies.pop(event, None)
        self._js_property_callback_policies = callback_policies
        self.trigger('_js_property_callbacks', old, self._js_property_callbacks)

    def on_change(self, attr: str, *callbacks: PropertyCallback,
            policy: CallbackPolicy | None = None) -> None:
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            *callbacks (callable) : callback functions to register

        Returns:
            None

        Examples:

            .. code-block:: python

                widget.on_change('value', callback1, callback2, ..., callback_n)

                widget.on_change('value', update_preview, policy=Throttle(100))
                widget.on_change('value', expensive_update, policy=Committed())

        Throttle and debounce intervals are in milliseconds. The policy applies
        only to callbacks passed in that registration call, so the same
        property, and even the same callback, can have multiple policies.

        .. note::
            For changes to ``ColumnDataSource.data`` made by ``stream()`` or
            ``patch()``, callbacks receive
            :data:`~bokeh.util.callback_manager.OldValueUnavailable` as
            ``old``. Incremental updates deliberately don't retain complete
            copies of the previous columns.

        '''
        descriptor = self.lookup(attr)
        policy = _callback_policy(self, descriptor.name, policy)
        super().on_change(descriptor.name, *callbacks)

        registrations = self._callback_policies.setdefault(descriptor.name, [])
        for callback in callbacks:
            if not any(registered == callback and registered_policy == policy
                    for registered, registered_policy in registrations):
                registrations.append((callback, policy))
        if policy != _IMMEDIATE_POLICY:
            key = (descriptor.name, policy)
            if key not in self._callback_policy_values:
                self._callback_policy_values[key] = descriptor.get_value(self)
        self._update_subscribed_changes(descriptor.name)

    def remove_on_change(self, attr: str, *callbacks: PropertyCallback) -> None:
        descriptor = self.lookup(attr)
        super().remove_on_change(descriptor.name, *callbacks)
        registrations = self._callback_policies.get(descriptor.name, [])
        remaining = [
            (registered, policy) for registered, policy in registrations
            if registered not in callbacks
        ]
        if remaining:
            self._callback_policies[descriptor.name] = remaining
        else:
            self._callback_policies.pop(descriptor.name, None)
        self._update_subscribed_changes(descriptor.name)

    def _update_subscribed_changes(self, attr: str) -> None:
        changes = {name: list(policies) for name, policies in self._subscribed_changes.items()}
        policies: list[tuple[str, float | None]] = []
        for _, policy in self._callback_policies.get(attr, []):
            if policy not in policies:
                policies.append(policy)
        if policies and policies != [_IMMEDIATE_POLICY]:
            changes[attr] = policies
        else:
            changes.pop(attr, None)
        for key in [key for key in self._callback_policy_values if key[0] == attr and key[1] not in policies]:
            del self._callback_policy_values[key]
        if changes:
            self._subscribed_changes = changes
        else:
            del self._subscribed_changes

    def _callbacks_for_change(self, attr: str, old: Any) -> tuple[list[PropertyCallback], Any] | None:
        incoming = self._incoming_callback_policy
        if incoming is None or incoming[0] != attr:
            return None

        _, incoming_policy, callback_old = incoming
        self._incoming_callback_dispatched = True
        callbacks = [
            callback for callback, policy in self._callback_policies.get(attr, [])
            if policy == incoming_policy
        ]
        return callbacks, callback_old

    def _invoke_callbacks(self, callbacks: list[PropertyCallback], attr: str, old: Any, new: Any) -> None:
        incoming = self._incoming_callback_policy
        self._incoming_callback_policy = None
        try:
            super()._invoke_callbacks(callbacks, attr, old, new)
        finally:
            self._incoming_callback_policy = incoming

    def _callback_policy_for_change(self, attr: str) -> _CallbackPolicy | None:
        incoming = self._incoming_callback_policy
        return incoming[1] if incoming is not None and incoming[0] == attr else None

    def _set_from_json_with_callback_policy(self, attr: str, value: Any,
            policy: _CallbackPolicy, *, setter: Setter | None = None) -> None:
        descriptor = self.lookup(attr)
        key = (descriptor.name, policy)
        callback_old = self._callback_policy_values.get(key, descriptor.get_value(self))
        self._incoming_callback_policy = (descriptor.name, policy, callback_old)
        self._incoming_callback_dispatched = False
        try:
            self.set_from_json(descriptor.name, value, setter=setter)
        finally:
            self._incoming_callback_policy = None

        physical_new = descriptor.get_value(self)
        self._callback_policy_values[key] = physical_new
        if not self._incoming_callback_dispatched and not descriptor.property.matches(callback_old, physical_new):
            callbacks = [
                callback for callback, registered_policy in self._callback_policies.get(descriptor.name, [])
                if registered_policy == policy
            ]
            if callbacks:
                def invoke() -> None:
                    self._invoke_callbacks(callbacks, descriptor.name, callback_old, physical_new)
                if self.document is None:
                    invoke()
                else:
                    from ..document.events import ModelChangedEvent
                    event = ModelChangedEvent(
                        self.document, self, descriptor.name, physical_new,
                        setter, invoke, policy,
                    )
                    self.document.callbacks.trigger_on_change(event)

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
        match the given selector. Raises an error if more than one object
        is found. Returns single matching object, or None if nothing is found.

        Args:
            selector (JSON-like):

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

    def to_serializable(self, serializer: Serializer) -> ObjectRep | ObjectRefRep:
        ''' Create a serialized representation of this model.

        Args:
            serializer: The serializer defining model identity policy.

        Returns:
            A model representation, with an ID when the serializer requires one.
        '''
        use_id = serializer.use_model_id(self)
        if use_id:
            serializer.add_ref(self, serializer.model_ref(self.ref))

        super_rep = super().to_serializable(serializer)
        if not use_id:
            return super_rep

        if serializer.compact:
            return ObjectRefRep({
                "$type": super_rep["$type"],
                "$id": self.id,
                **{key: value for key, value in super_rep.items() if key != "$type"},
            })
        else:
            rep = ObjectRefRep(type="object", name=super_rep["name"], id=self.id)
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
        if self._incoming_callback_policy is None:
            for _, policy in self._callback_policies.get(descriptor.name, []):
                self._callback_policy_values[(descriptor.name, policy)] = new

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

    def _repr_html_(self) -> str | None:
        # marimo checks rich representations in HTML-first order. Returning
        # the structural debug representation here would prevent its generic
        # formatter from reaching Bokeh's AnyWidget MIME representation.
        try:
            from ..io.notebook import is_marimo_runtime
        except ImportError:
            return html_repr(self)
        if is_marimo_runtime():
            return None
        return html_repr(self)

    def _sphinx_height_hint(self) -> int|None:
        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
