#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide collection types used throughout Bokeh.

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

from typing import Any

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Many',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Many[T](list[T]):
    ''' An ordered collection that forwards attribute access and assignment.

    ``Many`` contains zero or more items and preserves normal list operations
    such as indexing, iteration, and ``len()``. Assigning an attribute sets it
    on every item, or warns that the assignment has no effect when the
    collection is empty. Reading an attribute returns the value from the only
    item, or another ``Many`` containing the values when there is more than one
    item.

    The :attr:`first` property and :meth:`one` method provide statically typed
    ways to access individual items. Like an ordinary list, ``Many`` is a
    snapshot. Mutating the collection itself does not change the object that
    produced it.

    '''

    @property
    def first(self) -> T | None:
        ''' The first item, or ``None`` when the collection is empty. '''
        return self[0] if self else None

    def one(self) -> T:
        ''' Return the only item.

        Raises:
            ValueError: if the collection does not contain exactly one item

        '''
        if len(self) != 1:
            raise ValueError(f"expected exactly one item, found {len(self)}")
        return self[0]

    def __setattr__(self, attr: str, value: Any) -> None:
        # Generic aliases record their type arguments on the collection itself.
        if attr == "__orig_class__":
            object.__setattr__(self, attr, value)
            return
        if len(self) == 0:
            from ..util.warnings import warn

            warn(f"Setting {attr!r} on an empty Many collection has no effect")
        for item in self:
            setattr(item, attr, value)

    def __getattr__(self, attr: str) -> Any:
        if len(self) == 0:
            raise AttributeError(f"Trying to access {attr!r} attribute on an empty Many collection")
        if len(self) == 1:
            return getattr(self[0], attr)
        try:
            return Many([getattr(item, attr) for item in self])
        except Exception:
            raise AttributeError(f"Trying to access {attr!r} attribute on a Many collection, but items have no {attr!r} attribute")

    def __dir__(self) -> list[str]:
        attributes = set(super().__dir__())
        if len({type(item) for item in self}) == 1:
            attributes.update(dir(self[0]))
        return sorted(attributes)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
