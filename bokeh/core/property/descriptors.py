#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

When this class is created, the ``MetaHasProps`` metaclass wires up both
the ``start`` and ``end`` attributes to a ``Float`` property. Then, when
a user accesses those attributes, the descriptor delegates all get and
set operations to the ``Float`` property.

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

This module provides the class |PropertyDescriptor| and various subclasses
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
    Dict,
    Generic,
    Type,
    TypeVar,
)

# Bokeh imports
from .singletons import Undefined
from .wrappers import PropertyValueColumnData, PropertyValueContainer

if TYPE_CHECKING:
    from ...document.events import DocumentPatchedEvent
    from ..has_props import HasProps, Setter
    from ..types import ID, Unknown
    from .bases import Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AliasPropertyDescriptor',
    'ColumnDataPropertyDescriptor',
    'DataSpecPropertyDescriptor',
    'PropertyDescriptor',
    'UnitsSpecPropertyDescriptor',
    'UnsetValueError',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

T = TypeVar("T")

class UnsetValueError(ValueError):
    """ Represents state in which descriptor without value was accessed. """

class AliasPropertyDescriptor(Generic[T]):
    """

    """

    serialized: bool = False

    def __init__(self, name: str, aliased_name: str, property: Property[T]) -> None:
        self.name = name
        self.aliased_name = aliased_name
        self.property = property
        self.__doc__ = f"This is a compatibility alias for the ``{aliased_name}`` property"

    def __get__(self, obj: HasProps | None, owner: Type[HasProps] | None) -> T:
        if obj is not None:
            return getattr(obj, self.aliased_name)
        elif owner is not None:
            return self

        # This should really never happen. If it does, __get__ was called in a bad way.
        raise ValueError("both 'obj' and 'owner' are None, don't know what to do")

    def __set__(self, obj: HasProps | None, value: T) -> None:
        setattr(obj, self.aliased_name, value)

    @property
    def readonly(self) -> bool:
        return self.property.readonly

class PropertyDescriptor(Generic[T]):
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

    def __get__(self, obj: HasProps | None, owner: Type[HasProps] | None) -> T:
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

        if self.property._readonly and obj._initialized:
            # Allow to set a value during object initialization (e.g. value -> value_throttled)
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

        if self.name in obj._property_values:
            old_value = obj._property_values[self.name]
            del obj._property_values[self.name]
            self.trigger_if_changed(obj, old_value)

        if self.name in obj._unstable_default_values:
            del obj._unstable_default_values[self.name]

    def class_default(self, cls):
        """ Get the default value for a specific subtype of ``HasProps``,
        which may not be used for an individual instance.

        Args:
            cls (class) : The class to get the default value for.

        Returns:
            object


        """
        return self.property.themed_default(cls, self.name, None)

    def instance_default(self, obj: HasProps) -> T:
        """ Get the default value that will be used for a specific instance.

        Args:
            obj (HasProps) : The instance to get the default value for.

        Returns:
            object

        """
        return self.property.themed_default(obj.__class__, self.name, obj.themed_values())

    def serializable_value(self, obj: HasProps) -> Any:
        """ Produce the value as it should be serialized.

        Sometimes it is desirable for the serialized value to differ from
        the ``__get__`` in order for the ``__get__`` value to appear simpler
        for user or developer convenience.

        Args:
            obj (HasProps) : the object to get the serialized attribute for

        Returns:
            JSON-like

        """
        value = self.__get__(obj, obj.__class__)
        return self.property.serialize_value(value)

    def set_from_json(self, obj: HasProps, json: Any, *,
            models: Dict[ID, HasProps] | None = None, setter: Setter | None = None):
        """Sets the value of this property from a JSON value.

        Args:
            obj: (HasProps) : instance to set the property value on

            json: (JSON-value) : value to set to the attribute to

            models (dict or None, optional) :
                Mapping of model ids to models (default: None)

                This is needed in cases where the attributes to update also
                have values that have references.

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
        value = self.property.prepare_value(obj, self.name, self.property.from_json(json, models=models))
        old = self._get(obj)
        self._set(obj, old, value, setter=setter)

    def trigger_if_changed(self, obj: HasProps, old: Unknown) -> None:
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

        Handles bookeeping around |PropertyContainer| value, etc.

        """
        if self.name in obj._property_values:
            # this shouldn't happen because we should have checked before _get_default()
            raise RuntimeError("Bokeh internal error, does not handle the case of self.name already in _property_values")

        themed_values = obj.themed_values()
        is_themed = themed_values is not None and self.name in themed_values

        default = self.instance_default(obj)

        unstable_dict = obj._unstable_themed_values if is_themed else obj._unstable_default_values

        if self.name in unstable_dict:
            return unstable_dict[self.name]

        if self.property._may_have_unstable_default():
            if isinstance(default, PropertyValueContainer):
                default._register_owner(obj, self)
            unstable_dict[self.name] = default

        return default

    def _set_value(self, obj: HasProps, value: Unknown) -> None:
        """ Actual descriptor value assignment. """
        if isinstance(value, PropertyValueContainer):
            value._register_owner(obj, self)

        if self.name in obj._unstable_themed_values:
            del obj._unstable_themed_values[self.name]

        if self.name in obj._unstable_default_values:
            del obj._unstable_default_values[self.name]

        obj._property_values[self.name] = value

    def _set(self, obj: HasProps, old: Unknown, value: Unknown, *,
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
    def _notify_mutated(self, obj: HasProps, old: Unknown, hint: DocumentPatchedEvent | None = None) -> None:
        """ A method to call when a container is mutated "behind our back"
        and we detect it with our |PropertyContainer| wrappers.

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

    def _trigger(self, obj: HasProps, old: Unknown, value: Unknown, *,
            hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None:
        """ Unconditionally send a change event notification for the property.

        Args:
            obj (HasProps)
                The object the property is being set on.

            old (obj) :
                The previous value of the property

            new (obj) :
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
            obj.trigger(self.name, old, value, hint, setter)


_CDS_SET_FROM_CDS_ERROR = """
ColumnDataSource.data properties may only be set from plain Python dicts,
not other ColumnDataSource.data values.

If you need to copy set from one CDS to another, make a shallow copy by
calling dict: s1.data = dict(s2.data)
"""

class ColumnDataPropertyDescriptor(PropertyDescriptor):
    """ A ``PropertyDescriptor`` specialized to handling ``ColumnData`` properties.

    """

    def __set__(self, obj, value, *, setter=None):
        """ Implement the setter for the Python `descriptor protocol`_.

        This method first separately extracts and removes any ``units`` field
        in the JSON, and sets the associated units property directly. The
        remaining value is then passed to the superclass ``__set__`` to
        be handled.

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

        if self.property._readonly and obj._initialized:
            # Allow to set a value during object initialization (e.g. value -> value_throttled)
            class_name = obj.__class__.__name__
            raise RuntimeError(f"{class_name}.{self.name} is a readonly property")

        if isinstance(value, PropertyValueColumnData):
            raise ValueError(_CDS_SET_FROM_CDS_ERROR)

        from ...document.events import ColumnDataChangedEvent

        hint = ColumnDataChangedEvent(obj.document, obj, setter=setter) if obj.document else None

        value = self.property.prepare_value(obj, self.name, value)
        old = self._get(obj)
        self._set(obj, old, value, hint=hint, setter=setter)

class DataSpecPropertyDescriptor(PropertyDescriptor):
    """ A ``PropertyDescriptor`` for Bokeh |DataSpec| properties that serialize to
    field/value dictionaries.

    """

    def serializable_value(self, obj):
        """

        """
        return self.property.to_serializable(obj, self.name, getattr(obj, self.name))

    def set_from_json(self, obj, json, *, models=None, setter=None):
        """ Sets the value of this property from a JSON value.

        This method first

        Args:
            obj (HasProps) :

            json (JSON-dict) :

            models(seq[Model], optional) :

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
        if isinstance(json, dict):
            # we want to try to keep the "format" of the data spec as string, dict, or number,
            # assuming the serialized dict is compatible with that.
            old = getattr(obj, self.name)
            if old is not None:
                try:
                    self.property._type.validate(old, False)
                    if 'value' in json:
                        json = json['value']
                except ValueError:
                    if isinstance(old, str) and 'field' in json:
                        json = json['field']
                # leave it as a dict if 'old' was a dict

        super().set_from_json(obj, json, models=models, setter=setter)

class UnitsSpecPropertyDescriptor(DataSpecPropertyDescriptor):
    """ A ``PropertyDescriptor`` for Bokeh |PropertyUnitsSpec| properties that
    contribute associated ``_units`` properties automatically as a side effect.

    """

    def __init__(self, name, property, units_property) -> None:
        """

        Args:
            name (str) :
                The attribute name that this property is for

            property (Property) :
                A basic property to create a descriptor for

            units_property (Property) :
                An associated property to hold units information

        """
        super().__init__(name, property)
        self.units_prop = units_property

    def __set__(self, obj, value, *, setter=None):
        """ Implement the setter for the Python `descriptor protocol`_.

        This method first separately extracts and removes any ``units`` field
        in the JSON, and sets the associated units property directly. The
        remaining value is then passed to the superclass ``__set__`` to
        be handled.

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
        value = self._extract_units(obj, value)
        super().__set__(obj, value, setter=setter)

    def set_from_json(self, obj, json, *, models=None, setter=None):
        """ Sets the value of this property from a JSON value.

        This method first separately extracts and removes any ``units`` field
        in the JSON, and sets the associated units property directly. The
        remaining JSON is then passed to the superclass ``set_from_json`` to
        be handled.

        Args:
            obj: (HasProps) : instance to set the property value on

            json: (JSON-value) : value to set to the attribute to

            models (dict or None, optional) :
                Mapping of model ids to models (default: None)

                This is needed in cases where the attributes to update also
                have values that have references.

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
        json = self._extract_units(obj, json)
        super().set_from_json(obj, json, models=models, setter=setter)

    def _extract_units(self, obj, value):
        """ Internal helper for dealing with units associated units properties
        when setting values on |PropertyUnitsSpec| properties.

        When ``value`` is a dict, this function may mutate the value of the
        associated units property.

        Args:
            obj (HasProps) : instance to update units spec property value for
            value (obj) : new value to set for the property

        Returns:
            copy of ``value``, with 'units' key and value removed when
            applicable

        """
        if isinstance(value, dict):
            if 'units' in value:
                value = copy(value) # so we can modify it
            units = value.pop("units", None)
            if units:
                self.units_prop.__set__(obj, units)
        return value

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
