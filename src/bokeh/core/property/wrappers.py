#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide special versions of list and dict, that can automatically notify
about changes when used for property values.

Mutations to these values are detected, and the properties owning the
collection is notified of the changes. Consider the following model
definition:

.. code-block:: python

    class SomeModel(Model):

        options = List(String)

If we have an instance of this model, ``m`` then we can set the entire
value of the ``options`` property at once:

.. code-block:: python

    m.options = ["foo", "bar"]

When we do this in the context of a Bokeh server application that is being
viewed in a browser, this change is automatically noticed, and the
corresponding BokehJS property in the browser is synchronized, possibly
causing some change in the visual state of the application in the browser.

But it is also desirable that changes *inside* the ``options`` list also
be detected. That is, the following kinds of operations should also be
automatically synchronized between BokehJS and a Bokeh server:

.. code-block:: python

    m.options.append("baz")

    m.options[2] = "quux"

    m.options.insert(0, "bar")

The classes in this module provide this functionality.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

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
import copy
from typing import (
    TYPE_CHECKING,
    Any,
    Iterable,
    List,
    Set,
    TypeVar,
)

# External imports
import numpy as np

if TYPE_CHECKING:
    from ...document import Document
    from ...document.events import DocumentPatchedEvent
    from ...models.sources import ColumnarDataSource
    from ..has_props import HasProps, Setter
    from .descriptors import PropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'PropertyValueColumnData',
    'PropertyValueContainer',
    'PropertyValueDict',
    'PropertyValueList',
    'PropertyValueSet',
    'notify_owner',
)

T = TypeVar("T")

#----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def notify_owner(func):
    """ A decorator for mutating methods of property container classes
    that notifies owners of the property container about mutating changes.

    Args:
        func (callable) : the container method to wrap in a notification

    Returns:
        wrapped method

    Examples:

        A ``__setitem__`` could be wrapped like this:

        .. code-block:: python

            # x[i] = y
            @notify_owner
            def __setitem__(self, i, y):
                return super().__setitem__(i, y)

    The returned wrapped method will have a docstring indicating what
    original method it is wrapping.

    """
    def wrapper(self, *args, **kwargs):
        old = self._saved_copy()
        result = func(self, *args, **kwargs)
        self._notify_owners(old)
        return result
    wrapper.__doc__ = f"Container method ``{func.__name__}`` instrumented to notify property owners"
    return wrapper

class PropertyValueContainer:
    """ A base class for property container classes that support change
    notifications on mutating operations.

    This class maintains an internal list of property owners, and also
    provides a private mechanism for methods wrapped with
    :func:`~bokeh.core.property.wrappers.notify_owners` to update
    those owners when mutating changes occur.

    """
    _owners: set[tuple[HasProps, PropertyDescriptor[Any]]]

    def __init__(self, *args, **kwargs) -> None:
        self._owners = set()
        super().__init__(*args, **kwargs)

    def _register_owner(self, owner: HasProps, descriptor: PropertyDescriptor[Any]) -> None:
        self._owners.add((owner, descriptor))

    def _unregister_owner(self, owner: HasProps, descriptor: PropertyDescriptor[Any]) -> None:
        self._owners.discard((owner, descriptor))

    def _notify_owners(self, old: Any, hint: DocumentPatchedEvent | None = None) -> None:
        for (owner, descriptor) in self._owners:
            descriptor._notify_mutated(owner, old, hint=hint)

    def _saved_copy(self) -> Any:
        raise RuntimeError("Subtypes must implement this to make a backup copy")

class PropertyValueList(PropertyValueContainer, List[T]):
    """ A list property value container that supports change notifications on
    mutating operations.

    When a Bokeh model has a ``List`` property, the ``PropertyValueLists`` are
    transparently created to wrap those values. These ``PropertyValueList``
    values are subject to normal property validation. If the property type
    ``foo = List(Str)`` then attempting to set ``x.foo[0] = 10`` will raise
    an error.

    Instances of ``PropertyValueList`` can be explicitly created by passing
    any object that the standard list initializer accepts, for example:

    .. code-block:: python

        >>> PropertyValueList([10, 20])
        [10, 20]

        >>> PropertyValueList((10, 20))
        [10, 20]

    The following mutating operations on lists automatically trigger
    notifications:

    .. code-block:: python

        del x[y]
        del x[i:j]
        x += y
        x *= y
        x[i] = y
        x[i:j] = y
        x.append
        x.extend
        x.insert
        x.pop
        x.remove
        x.reverse
        x.sort

    """

    def __init__(self, *args, **kwargs) -> None:
        return super().__init__(*args, **kwargs)

    def _saved_copy(self) -> list[T]:
        return list(self)

    # delete x[y]
    @notify_owner
    def __delitem__(self, y):
        return super().__delitem__(y)

    # x += y
    @notify_owner
    def __iadd__(self, y):
        return super().__iadd__(y)

    # x *= y
    @notify_owner
    def __imul__(self, y):
        return super().__imul__(y)

    # x[i] = y
    @notify_owner
    def __setitem__(self, i, y):
        return super().__setitem__(i, y)

    @notify_owner
    def append(self, obj):
        return super().append(obj)

    @notify_owner
    def extend(self, iterable):
        return super().extend(iterable)

    @notify_owner
    def insert(self, index, obj):
        return super().insert(index, obj)

    @notify_owner
    def pop(self, index=-1):
        return super().pop(index)

    @notify_owner
    def remove(self, obj):
        return super().remove(obj)

    @notify_owner
    def reverse(self):
        return super().reverse()

    @notify_owner
    def sort(self, **kwargs):
        return super().sort(**kwargs)

class PropertyValueSet(PropertyValueContainer, Set[T]):
    """ A list property value container that supports change notifications on
    mutating operations.

    """

    def __init__(self, *args, **kwargs) -> None:
        return super().__init__(*args, **kwargs)

    def _saved_copy(self) -> set[T]:
        return set(self)

    @notify_owner
    def add(self, element: T) -> None:
        super().add(element)

    @notify_owner
    def difference_update(self, *s: Iterable[Any]) -> None:
        super().difference_update(*s)

    @notify_owner
    def discard(self, element: T) -> None:
        super().discard(element)

    @notify_owner
    def intersection_update(self, *s: Iterable[Any]) -> None:
        super().intersection_update(*s)

    @notify_owner
    def remove(self, element: T) -> None:
        super().discard(element)

    @notify_owner
    def symmetric_difference_update(self, s: Iterable[T]) -> None:
        super().symmetric_difference_update(s)

    @notify_owner
    def update(self, *s: Iterable[T]) -> None:
        super().update(*s)

class PropertyValueDict(PropertyValueContainer, dict):
    """ A dict property value container that supports change notifications on
    mutating operations.

    When a Bokeh model has a ``List`` property, the ``PropertyValueLists`` are
    transparently created to wrap those values. These ``PropertyValueList``
    values are subject to normal property validation. If the property type
    ``foo = Dict(Str, Str)`` then attempting to set ``x.foo['bar'] = 10`` will
    raise an error.

    Instances of ``PropertyValueDict`` can be eplicitly created by passing
    any object that the standard dict initializer accepts, for example:

    .. code-block:: python

        >>> PropertyValueDict(dict(a=10, b=20))
        {'a': 10, 'b': 20}

        >>> PropertyValueDict(a=10, b=20)
        {'a': 10, 'b': 20}

        >>> PropertyValueDict([('a', 10), ['b', 20]])
        {'a': 10, 'b': 20}

    The following mutating operations on dicts automatically trigger
    notifications:

    .. code-block:: python

        del x[y]
        x[i] = y
        x.clear
        x.pop
        x.popitem
        x.setdefault
        x.update

    """
    def __init__(self, *args, **kwargs) -> None:
        return super().__init__(*args, **kwargs)

    def _saved_copy(self):
        return dict(self)

    # delete x[y]
    @notify_owner
    def __delitem__(self, y):
        return super().__delitem__(y)

    # x[i] = y
    @notify_owner
    def __setitem__(self, i, y):
        return super().__setitem__(i, y)

    @notify_owner
    def clear(self):
        return super().clear()

    @notify_owner
    def pop(self, *args):
        return super().pop(*args)

    @notify_owner
    def popitem(self):
        return super().popitem()

    @notify_owner
    def setdefault(self, *args):
        return super().setdefault(*args)

    @notify_owner
    def update(self, *args, **kwargs):
        return super().update(*args, **kwargs)

class PropertyValueColumnData(PropertyValueDict):
    """ A property value container for ColumnData that supports change
    notifications on mutating operations.

    This property value container affords specialized code paths for
    updating the .data dictionary for ColumnDataSource. When possible,
    more efficient ColumnDataChangedEvent hints are generated to perform
    the updates:

    .. code-block:: python

        x[i] = y
        x.update

    """

    # x[i] = y
    # don't wrap with notify_owner --- notifies owners explicitly
    def __setitem__(self, i, y):
        return self.update([(i, y)])

    def __copy__(self):
        return PropertyValueColumnData(dict(self))

    def __deepcopy__(self, memodict={}):
        return PropertyValueColumnData(copy.deepcopy(dict(self), memodict))

    # don't wrap with notify_owner --- notifies owners explicitly
    def update(self, *args, **kwargs):
        old = self._saved_copy()

        # call dict.update directly, bypass wrapped version on base class
        result = dict.update(self, *args, **kwargs)

        from ...document.events import ColumnDataChangedEvent

        # Grab keys to update according to  Python docstring for update([E, ]**F)
        #
        # If E is present and has a .keys() method, then does:  for k in E: D[k] = E[k]
        # If E is present and lacks a .keys() method, then does:  for k, v in E: D[k] = v
        # In either case, this is followed by: for k in F:  D[k] = F[k]
        cols = set(kwargs.keys())
        if len(args) == 1:
            E = args[0]
            if hasattr(E, 'keys'):
                cols |= set(E.keys())
            else:
                cols |= { x[0] for x in E }

        # we must loop ourselves here instead of calling _notify_owners
        # because the hint is customized for each owner separately
        for (owner, descriptor) in self._owners:
            hint = ColumnDataChangedEvent(owner.document, owner, "data", cols=list(cols))
            descriptor._notify_mutated(owner, old, hint=hint)

        return result

    # don't wrap with notify_owner --- notifies owners explicitly
    def _stream(self, doc: Document, source: ColumnarDataSource, new_data: dict[str, Any],
            rollover: int | None = None, setter: Setter | None = None) -> None:
        """ Internal implementation to handle special-casing stream events
        on ``ColumnDataSource`` columns.

        Normally any changes to the ``.data`` dict attribute on a
        ``ColumnDataSource`` triggers a notification, causing all of the data
        to be synchronized between server and clients.

        The ``.stream`` method on column data sources exists to provide a
        more efficient way to perform streaming (i.e. append-only) updates
        to a data source, without having to perform a full synchronization,
        which would needlessly re-send all the data.

        To accomplish this, this function bypasses the wrapped methods on
        ``PropertyValueDict`` and uses the unwrapped versions on the dict
        superclass directly. It then explicitly makes a notification, adding
        a special ``ColumnsStreamedEvent`` hint to the message containing
        only the small streamed data that BokehJS needs in order to
        efficiently synchronize.

        .. warning::
            This function assumes the integrity of ``new_data`` has already
            been verified.

        """
        old = self._saved_copy()

        # TODO (bev) Currently this reports old differently for array vs list
        # For arrays is reports the actual old value. For lists, the old value
        # is actually the already updated value. This is because the method
        # self._saved_copy() makes a shallow copy.
        for k, v in new_data.items():
            if isinstance(self[k], np.ndarray) or isinstance(new_data[k], np.ndarray):
                data = np.append(self[k], new_data[k])
                if rollover and len(data) > rollover:
                    data = data[-rollover:]
                # call dict.__setitem__ directly, bypass wrapped version on base class
                dict.__setitem__(self, k, data)
            else:
                L = self[k]
                L.extend(new_data[k])
                if rollover is not None:
                    del L[:-rollover]

        from ...document.events import ColumnsStreamedEvent
        self._notify_owners(old, hint=ColumnsStreamedEvent(doc, source, "data", new_data, rollover, setter))

    # don't wrap with notify_owner --- notifies owners explicitly
    def _patch(self, doc: Document, source: ColumnarDataSource, patches, setter: Setter | None = None) -> None:
        """ Internal implementation to handle special-casing patch events
        on ``ColumnDataSource`` columns.

        Normally any changes to the ``.data`` dict attribute on a
        ``ColumnDataSource`` triggers a notification, causing all of the data
        to be synchronized between server and clients.

        The ``.patch`` method on column data sources exists to provide a
        more efficient way to perform patching (i.e. random access) updates
        to a data source, without having to perform a full synchronization,
        which would needlessly re-send all the data.

        To accomplish this, this function bypasses the wrapped methods on
        ``PropertyValueDict`` and uses the unwrapped versions on the dict
        superclass directly. It then explicitly makes a notification, adding
        a special ``ColumnsPatchedEvent`` hint to the message containing
        only the small patched data that BokehJS needs in order to efficiently
        synchronize.

        .. warning::
            This function assumes the integrity of ``patches`` has already
            been verified.

        """
        old = self._saved_copy()

        for name, patch in patches.items():
            for ind, value in patch:
                if isinstance(ind, (int, slice)):
                    self[name][ind] = value
                else:
                    shape = self[name][ind[0]][tuple(ind[1:])].shape
                    self[name][ind[0]][tuple(ind[1:])] = np.array(value, copy=False).reshape(shape)

        from ...document.events import ColumnsPatchedEvent
        self._notify_owners(old, hint=ColumnsPatchedEvent(doc, source, "data", patches, setter))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
