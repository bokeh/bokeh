#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide Python descriptors for delegating to Bokeh properties.

The Python `descriptor protocol`_ allows fine-grained control over all
attribute access on instances ("You control the dot"). Bokeh uses the
descriptor protocol to provide easy-to-use, declarative, type-based

class properties that can automatically validate and serialize their
values, as well as help provide sophisticated documentation.

A Bokeh property really consist of two parts: a familiar "property"
portion, such as ``Int``, ``String``, etc., as well as an associated
Python descriptor that delegates attribute access to the property instance.

For example, a very simplified definition of a range-like object might
be:

.. code-block:: python

    from bokeh.model import Model
    from bokeh.core.properties import Float

    class Range(Model):
        start = Float(help="start point")
        end   = Float(help="end point")

When this class is created, each property binds its descriptor to the class.
When a user accesses those attributes, the descriptor delegates all get and
set operations to the corresponding property.

.. code-block:: python

    rng = Range()

    # The descriptor __set__ method delegates to Float, which can validate
    # the value 10.3 as a valid floating point value
    rng.start = 10.3

    # But can raise a validation exception if an attempt to set to a list
    # is made
    rng.end = [1,2,3]   # ValueError !

More sophisticated properties such as ``DataSpec`` and its subclasses can
exert control over how values are serialized. Consider this example with
the ``Circle`` glyph and its ``x`` attribute that is a ``NumberSpec``:

.. code-block:: python

    from bokeh.models import Circle

    c = Circle()

    c.x = 10      # serializes to {'value': 10}

    c.x = 'foo'   # serializes to {'field': 'foo'}

There are many other examples like this throughout Bokeh. In this way users
may operate simply and naturally, and not be concerned with the low-level
details around validation, serialization, and documentation.

This module provides the class ``PropertyDescriptor`` and various subclasses
that can be used to attach Bokeh properties to Bokeh models.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

.. _descriptor protocol: https://docs.python.org/3/howto/descriptor.html

"""

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
from copy import copy
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Protocol,
    TypeGuard,
    cast,
    overload,
)

# Bokeh imports
from .singletons import Undefined
from .wrappers import PropertyValueColumnData, PropertyValueContainer

if TYPE_CHECKING:
    from ...document import Document
    from ...document.events import DocumentPatchedEvent
    from ...model import Model
    from ..has_props import HasProps, Setter
    from .alias import Alias, DeprecatedAlias
    from .bases import Property

class _HasDocument(Protocol):
    document: Document | None

class _HasOverriddenDefaults(Protocol):
    def _overridden_defaults(self) -> dict[str, Any]: ...

class _HasTrigger(Protocol):
    def trigger(self, attr: str, old: Any, new: Any,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None: ...

class _DataSpecProperty(Protocol):
    value_type: Property[Any]
    _units_enum: Any | None

    def to_serializable(self, obj: HasProps, name: str, val: Any) -> Any: ...

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AliasPropertyDescriptor',
    'ColumnDataPropertyDescriptor',
    'DataSpecPropertyDescriptor',
    'DeprecatedAliasPropertyDescriptor',
    'PropertyDescriptor',
    'UnsetValueError',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class UnsetValueError(ValueError):
    """ Represents state in which descriptor without value was accessed. """

class AliasPropertyDescriptor[T]:
    """

    """

    serialized: bool = False

    @property
    def aliased_name(self) -> str:
        return self.alias.aliased_name

    def __init__(self, name: str, alias: Alias[T]) -> None:
        self.name = name
        self.alias = alias
        self.property = alias
        self.__doc__ = f"This is a compatibility alias for the {self.aliased_name!r} property."

    @overload
    def __get__(self, obj: HasProps, owner: type[HasProps] | None) -> T: ...
    @overload
    def __get__(self, obj: None, owner: type[HasProps] | None) -> AliasPropertyDescriptor[T]: ...
    def __get__(self, obj: HasProps | None, owner: type[HasProps] | None) -> T | AliasPropertyDescriptor[T]:
        if obj is not None:
            return getattr(obj, self.aliased_name)
        elif owner is not None:
            return self

        # This should really never happen. If it does, __get__ was called in a bad way.
        raise ValueError("both 'obj' and 'owner' are None, don't know what to do")

    def __set__(self, obj: HasProps | None, value: T) -> None:
        setattr(obj, self.aliased_name, value)

    def __delete__(self, obj: HasProps) -> None:
        delattr(obj, self.aliased_name)

    @property
    def readonly(self) -> bool:
        return self.alias.readonly

    def has_unstable_default(self, obj: HasProps) -> bool:
        return obj.lookup(self.aliased_name).has_unstable_default(obj)

    def class_default(self, cls: type[HasProps], *, no_eval: bool = False) -> Any:
        return cls.lookup(self.aliased_name).class_default(cls, no_eval=no_eval)

class DeprecatedAliasPropertyDescriptor[T](AliasPropertyDescriptor[T]):
    """

    """

    alias: DeprecatedAlias[T]

    def __init__(self, name: str, alias: DeprecatedAlias[T]) -> None:
        super().__init__(name, alias)

        major, minor, patch = self.alias.since
        since = f"{major}.{minor}.{patch}"
        self.__doc__ = f"""\
This is a backwards compatibility alias for the {self.aliased_name!r} property.

.. note::
    Property {self.name!r} was deprecated in Bokeh {since} and will be removed
    in the future. Update your code to use {self.aliased_name!r} instead.
"""

    def _warn(self) -> None:
        from ...util.deprecation import deprecated

        deprecated(self.alias.since, self.name, self.aliased_name, self.alias.extra)

    @overload
    def __get__(self, obj: HasProps, owner: type[HasProps] | None) -> T: ...
    @overload
    def __get__(self, obj: None, owner: type[HasProps] | None) -> AliasPropertyDescriptor[T]: ...
    def __get__(self, obj: HasProps | None, owner: type[HasProps] | None) -> T | AliasPropertyDescriptor[T]:
        if obj is not None:
            # Warn only when accessing descriptor's value, otherwise there would
            # be a lot of spurious warnings from parameter resolution, etc.
            self._warn()
        return super().__get__(obj, owner)

    def __set__(self, obj: HasProps | None, value: T) -> None:
        self._warn()
        super().__set__(obj, value)

    def __delete__(self, obj: HasProps) -> None:
        self._warn()
        super().__delete__(obj)

class PropertyDescriptor[T]:
    """ A base class for Bokeh properties with simple get/set and serialization
    behavior.

    """

    name: str
    #property: Property[T]
    __doc__: str | None

    def __init__(self, name: str, property: Property[T]) -> None:
        """ Create a PropertyDescriptor for basic Bokeh properties.

        Args:
            name (str) : The attribute name that this property is for
            property (Property) : A basic property to create a descriptor for

        """
        self.name = name
        self.property = property
        self.__doc__ = self.property.__doc__

    def __str__(self) -> str:
        """ Basic string representation of ``PropertyDescriptor``.

        Delegates to ``self.property.__str__``

        """
        return f"{self.property}"

    @overload
    def __get__(self, obj: HasProps, owner: type[HasProps] | None) -> T: ...
    @overload
    def __get__(self, obj: None, owner: type[HasProps] | None) -> PropertyDescriptor[T]: ...
    def __get__(self, obj: HasProps | None, owner: type[HasProps] | None) -> T | PropertyDescriptor[T]:
        """ Implement the getter for the Python `descriptor protocol`_.

        For instance attribute access, we delegate to the |Property|. For
        class attribute access, we return ourself.

        Args:
            obj (HasProps or None) :
                The instance to set a new property value on (for instance
                attribute access), or None (for class attribute access)

            owner (obj) :
                The new value to set the property to

        Returns:
            None

        Examples:

            .. code-block:: python

                >>> from bokeh.models import Range1d

                >>> r = Range1d(start=10, end=20)

                # instance attribute access, returns the property value
                >>> r.start
                10

                # class attribute access, returns the property descriptor
                >>> Range1d.start
                <bokeh.core.property.descriptors.PropertyDescriptor at 0x1148b3390>

        """
        if obj is not None:
            value = self._get(obj)
            if value is Undefined:
                raise UnsetValueError(f"{obj}.{self.name} doesn't have a value set")
            return value

        elif owner is not None:
            return self

        # This should really never happen. If it does, __get__ was called in a bad way.
        raise ValueError("both 'obj' and 'owner' are None, don't know what to do")

    def __set__(self, obj: HasProps, value: T, *, setter: Setter | None = None) -> None:
        """ Implement the setter for the Python `descriptor protocol`_.

        .. note::
            An optional argument ``setter`` has been added to the standard
            setter arguments. When needed, this value should be provided by
            explicitly invoking ``__set__``. See below for more information.

        Args:
            obj (HasProps) :
                The instance to set a new property value on

            value (obj) :
                The new value to set the property to

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        """
        if not hasattr(obj, '_property_values'):
            # Initial values should be passed in to __init__, not set directly
            class_name = obj.__class__.__name__
            raise RuntimeError(f"Cannot set a property value {self.name!r} on a {class_name} instance before HasProps.__init__")

        if self.property.readonly and obj._initialized:
            class_name = obj.__class__.__name__
            raise RuntimeError(f"{class_name}.{self.name} is a readonly property")

        value = self.property.prepare_value(obj, self.name, value)
        old = self._get(obj)
        self._set(obj, old, value, setter=setter)

    def __delete__(self, obj: HasProps) -> None:
        """ Implement the deleter for the Python `descriptor protocol`_.

        Args:
            obj (HasProps) : An instance to delete this property from

        """

        if self.property.readonly and obj._initialized:
            class_name = obj.__class__.__name__
            raise RuntimeError(f"{class_name}.{self.name} is a readonly property")

        old_value = obj._property_values.pop(self.name, Undefined)
        if isinstance(old_value, PropertyValueContainer):
            old_value._unregister_owner(obj, self)

        obj._unstable_default_values.pop(self.name, None)
        obj._unstable_themed_values.pop(self.name, None)

        if old_value is not Undefined:
            self.trigger_if_changed(obj, old_value)

    def class_default(self, cls: type[HasProps], *, no_eval: bool = False) -> Any:
        """ Get the default value for a specific subtype of ``HasProps``,
        which may not be used for an individual instance.

        Args:
            cls (class) : The class to get the default value for.

            no_eval (bool, optional) :
                Whether to evaluate callables for defaults (default: False)

        Returns:
            object


        """
        return self.property.themed_default(cls, self.name, None, no_eval=no_eval)

    def instance_default(self, obj: HasProps) -> T:
        """ Get the default value that will be used for a specific instance.

        Args:
            obj (HasProps) : The instance to get the default value for.

        Returns:
            object

        """
        return self.property.themed_default(obj.__class__, self.name, obj.themed_values())

    def get_value(self, obj: HasProps) -> Any:
        """ Produce the value used for serialization.

        Sometimes it is desirable for the serialized value to differ from
        the ``__get__`` in order for the ``__get__`` value to appear simpler
        for user or developer convenience.

        Args:
            obj (HasProps) : the object to get the serialized attribute for

        Returns:
            Any

        """
        return self.__get__(obj, obj.__class__)

    def set_from_json(self, obj: HasProps, value: Any, *, setter: Setter | None = None) -> None:
        """Sets the value of this property from a JSON value.

        Args:
            obj (HasProps) : instance to set the property value on

            value (JSON-value) : value to set to the attribute to

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        """
        value = self.property.prepare_value(obj, self.name, value)
        old = self._get(obj)
        self._set(obj, old, value, setter=setter)

    def trigger_if_changed(self, obj: HasProps, old: Any) -> None:
        """ Send a change event notification if the property is set to a
        value is not equal to ``old``.

        Args:
            obj (HasProps)
                The object the property is being set on.

            old (obj) :
                The previous value of the property to compare

        Returns:
            None

        """
        new_value = self.__get__(obj, obj.__class__)
        if not self.property.matches(old, new_value):
            self._trigger(obj, old, new_value)

    @property
    def has_ref(self) -> bool:
        """ Whether the property can refer to another ``HasProps`` instance.

        For basic properties, delegate to the ``has_ref`` attribute on the
        |Property|.

        """
        return self.property.has_ref

    @property
    def readonly(self) -> bool:
        """ Whether this property is read-only.

        Read-only properties may only be modified by the client (i.e., by BokehJS
        in the browser).

        """
        return self.property.readonly

    @property
    def serialized(self) -> bool:
        """ Whether the property should be serialized when serializing an
        object.

        This would be False for a "virtual" or "convenience" property that
        duplicates information already available in other properties, for
        example.

        """
        return self.property.serialized

    def has_unstable_default(self, obj: HasProps) -> bool:
        # _may_have_unstable_default() doesn't have access to overrides, so check manually
        return self.property._may_have_unstable_default() or \
            self.is_unstable(cast(_HasOverriddenDefaults, obj)._overridden_defaults().get(self.name, None))

    @classmethod
    def is_unstable(cls, value: Any) -> TypeGuard[Callable[[], Any]]:
        from types import FunctionType

        from .instance import InstanceDefault
        return isinstance(value, (FunctionType, InstanceDefault))

    def _get(self, obj: HasProps) -> T:
        """ Internal implementation of instance attribute access for the
        ``PropertyDescriptor`` getter.

        If the value has not been explicitly set by a user, return that
        value. Otherwise, return the default.

        Args:
            obj (HasProps) : the instance to get a value of this property for

        Returns:
            object

        Raises:
            RuntimeError
                If the |HasProps| instance has not yet been initialized, or if
                this descriptor is on a class that is not a |HasProps|.

        """
        if not hasattr(obj, '_property_values'):
            class_name = obj.__class__.__name__
            raise RuntimeError(f"Cannot get a property value {self.name!r} from a {class_name} instance before HasProps.__init__")

        if self.name not in obj._property_values:
            return self._get_default(obj)
        else:
            return obj._property_values[self.name]

    def _get_default(self, obj: HasProps) -> T:
        """ Internal implementation of instance attribute access for default
        values.

        Handles bookkeeping around ``PropertyContainer`` value, etc.

        """
        if self.name in obj._property_values:
            # this shouldn't happen because we should have checked before _get_default()
            raise RuntimeError("Bokeh internal error, does not handle the case of self.name already in _property_values")

        themed_values = obj.themed_values()
        is_themed = themed_values is not None and self.name in themed_values

        unstable_dict = obj._unstable_themed_values if is_themed else obj._unstable_default_values

        if self.name in unstable_dict:
            return unstable_dict[self.name]

        # Ensure we do not look up the default until after we check if it already present
        # in the unstable_dict because it is a very expensive operation
        # Ref: https://github.com/bokeh/bokeh/pull/13174
        default = self.instance_default(obj)

        if self.has_unstable_default(obj):
            if isinstance(default, PropertyValueContainer):
                default._register_owner(obj, self)
            unstable_dict[self.name] = default

        return default

    def _set_value(self, obj: HasProps, value: Any) -> None:
        """ Actual descriptor value assignment. """
        if isinstance(value, PropertyValueContainer):
            value._register_owner(obj, self)

        if self.name in obj._unstable_themed_values:
            del obj._unstable_themed_values[self.name]

        if self.name in obj._unstable_default_values:
            del obj._unstable_default_values[self.name]

        obj._property_values[self.name] = value

    def _set(self, obj: HasProps, old: Any, value: Any, *,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None:
        """ Internal implementation helper to set property values.

        This function handles bookkeeping around noting whether values have
        been explicitly set, etc.

        Args:
            obj (HasProps)
                The object the property is being set on.

            old (obj) :
                The previous value of the property to compare

            hint (event hint or None, optional)
                An optional update event hint, e.g. ``ColumnStreamedEvent``
                (default: None)

                Update event hints are usually used at times when better
                update performance can be obtained by special-casing in
                some way (e.g. streaming or patching column data sources)

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        """
        if value is Undefined:
            raise RuntimeError("internal error attempting to set Undefined value")

        # Normally we want a "no-op" if the new value and old value are identical
        # but some hinted events are in-place. This check will allow those cases
        # to continue on to the notification machinery
        if self.property.matches(value, old) and (hint is None):
            return

        was_set = self.name in obj._property_values

        # "old" is the logical old value, but it may not be the actual current
        # attribute value if our value was mutated behind our back and we got
        # _notify_mutated.
        old_attr_value = obj._property_values[self.name] if was_set else old

        if old_attr_value is not value:
            if isinstance(old_attr_value, PropertyValueContainer):
                old_attr_value._unregister_owner(obj, self)
            self._set_value(obj, value)

        # for notification purposes, "old" should be the logical old
        self._trigger(obj, old, value, hint=hint, setter=setter)

    # called when a container is mutated "behind our back" and
    # we detect it with our collection wrappers.
    def _notify_mutated(self, obj: HasProps, old: Any, hint: DocumentPatchedEvent | None = None) -> None:
        """ A method to call when a container is mutated "behind our back"
        and we detect it with our ``PropertyContainer`` wrappers.

        Args:
            obj (HasProps) :
                The object who's container value was mutated

            old (object) :
                The "old" value of the container

                In this case, somewhat weirdly, ``old`` is a copy and the
                new value should already be set unless we change it due to
                validation.

            hint (event hint or None, optional)
                An optional update event hint, e.g. ``ColumnStreamedEvent``
                (default: None)

                Update event hints are usually used at times when better
                update performance can be obtained by special-casing in
                some way (e.g. streaming or patching column data sources)

        Returns:
            None

        """
        value = self.__get__(obj, obj.__class__)

        # re-validate because the contents of 'old' have changed,
        # in some cases this could give us a new object for the value
        value = self.property.prepare_value(obj, self.name, value, hint=hint)

        self._set(obj, old, value, hint=hint)

    def _trigger(self, obj: HasProps, old: Any, value: Any, *,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None:
        """ Unconditionally send a change event notification for the property.

        Args:
            obj (HasProps):
                The object the property is being set on.

            old (obj) :
                The previous value of the property

            value (obj) :
                The new value of the property

            hint (event hint or None, optional)
                An optional update event hint, e.g. ``ColumnStreamedEvent``
                (default: None)

                Update event hints are usually used at times when better
                update performance can be obtained by special-casing in
                some way (e.g. streaming or patching column data sources)

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.


        Returns:
            None

        """
        if hasattr(obj, 'trigger'):
            cast(_HasTrigger, obj).trigger(self.name, old, value, hint, setter)


_CDS_SET_FROM_CDS_ERROR = """
ColumnDataSource.data properties may only be set from plain Python dicts,
not other ColumnDataSource.data values.

If you need to copy set from one CDS to another, make a shallow copy by
calling dict: s1.data = dict(s2.data)
"""

class ColumnDataPropertyDescriptor(PropertyDescriptor[Any]):
    """ A ``PropertyDescriptor`` specialized to handling ``ColumnData`` properties.

    """

    def __set__(self, obj: HasProps, value: Any, *, setter: Setter | None = None) -> None:
        """ Implement the setter for the Python `descriptor protocol`_.

        This method validates that column data is assigned from a plain
        dictionary before delegating to the standard property setter.

        .. note::
            An optional argument ``setter`` has been added to the standard
            setter arguments. When needed, this value should be provided by
            explicitly invoking ``__set__``. See below for more information.

        Args:
            obj (HasProps) :
                The instance to set a new property value on

            value (obj) :
                The new value to set the property to

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        """
        if not hasattr(obj, '_property_values'):
            # Initial values should be passed in to __init__, not set directly
            class_name = obj.__class__.__name__
            raise RuntimeError(f"Cannot set a property value {self.name!r} on a {class_name} instance before HasProps.__init__")

        if self.property.readonly and obj._initialized:
            # Allow to set a value during object initialization (e.g. value -> value_throttled)
            class_name = obj.__class__.__name__
            raise RuntimeError(f"{class_name}.{self.name} is a readonly property")

        if isinstance(value, PropertyValueColumnData):
            raise ValueError(_CDS_SET_FROM_CDS_ERROR)

        from ...document.events import ColumnDataChangedEvent
        model = cast(_HasDocument, obj)
        hint = ColumnDataChangedEvent(model.document, cast("Model", obj), "data", setter=setter) if model.document else None

        value = self.property.prepare_value(obj, self.name, value)
        old = self._get(obj)
        self._set(obj, old, value, hint=hint, setter=setter)

class DataSpecPropertyDescriptor(PropertyDescriptor[Any]):
    """ A ``PropertyDescriptor`` for Bokeh |DataSpec| properties that serialize to
    field/value dictionaries.

    """

    def get_value(self, obj: HasProps) -> Any:
        """

        """
        return cast(_DataSpecProperty, self.property).to_serializable(obj, self.name, getattr(obj, self.name))

    def __set__(self, obj: HasProps, value: Any, *, setter: Setter | None = None) -> None:
        value = self._extract_units(obj, value)
        super().__set__(obj, value, setter=setter)

    def set_from_json(self, obj: HasProps, value: Any, *, setter: Setter | None = None) -> None:
        """ Sets the value of this property from a JSON value.

        This method first

        Args:
            obj (HasProps) :

            value (JSON-dict) :

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        """
        value = self._extract_units(obj, value)

        if isinstance(value, dict):
            # we want to try to keep the "format" of the data spec as string, dict, or number,
            # assuming the serialized dict is compatible with that.
            old = getattr(obj, self.name)
            if old is not None:
                try:
                    cast(_DataSpecProperty, self.property).value_type.validate(old, False)
                    if 'value' in value:
                        value = value['value']
                except ValueError:
                    if isinstance(old, str) and 'field' in value:
                        value = value['field']
                # leave it as a dict if 'old' was a dict

        super().set_from_json(obj, value, setter=setter)

    def _extract_units(self, obj: HasProps, value: Any) -> Any:
        property = cast(_DataSpecProperty, self.property)
        if property._units_enum is None or not isinstance(value, dict) or "units" not in value:
            return value

        units_descriptor = obj.lookup(f"{self.name}_units")

        value = copy(value)
        units = value.pop("units")
        if units:
            units_descriptor.__set__(obj, units)
        return value

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
