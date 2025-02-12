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
from typing import TYPE_CHECKING, Any, Callable

# Bokeh imports
from ..core.has_props import HasProps, Qualified
from ..util.dataclasses import entries, is_dataclass

if TYPE_CHECKING:
    from ..core.types import ID
    from ..document import Document
    from .model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'HasDocumentRef',
    'Qualified', # XXX: for backwards compatibility
    'collect_filtered_models',
    'collect_models',
    'get_class',
    'visit_immediate_value_references',
    'visit_value_and_its_immediate_references',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class HasDocumentRef:

    _document: Document | None
    _temp_document: Document | None

    def __init__(self, *args: Any, **kw: Any):
        super().__init__(*args, **kw)
        self._document = None
        self._temp_document = None

    @property
    def document(self) -> Document | None:
        ''' The |Document| this model is attached to (can be ``None``)

        '''
        if self._temp_document is not None:
            return self._temp_document
        return self._document

    @document.setter
    def document(self, doc: Document) -> None:
        self._document = doc

def collect_filtered_models(discard: Callable[[Model], bool] | None, *input_values: Any) -> list[Model]:
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

    ids: set[ID] = set()
    collected: list[Model] = []
    queued: list[Model] = []

    def queue_one(obj: Model) -> None:
        if obj.id not in ids and not (callable(discard) and discard(obj)):
            queued.append(obj)

    for value in input_values:
        visit_value_and_its_immediate_references(value, queue_one)

    while queued:
        obj = queued.pop(0)
        if obj.id not in ids:
            ids.add(obj.id)
            collected.append(obj)
            visit_immediate_value_references(obj, queue_one)

    return collected

def collect_models(*input_values: Any) -> list[Model]:
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

def get_class(view_model_name: str) -> type[Model]:
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

    # In order to look up from the model catalog that Model maintains, it
    # has to be created first. These imports ensure that all built-in Bokeh
    # models are represented in the catalog.
    from .. import models  # noqa: F401
    from .. import plotting  # noqa: F401
    from .model import Model

    known_models = Model.model_class_reverse_map
    if view_model_name in known_models:
        return known_models[view_model_name]
    else:
        raise KeyError(f"View model name '{view_model_name}' not found")

def visit_immediate_value_references(value: Any, visitor: Callable[[Model], None]) -> None:
    ''' Visit all references to another Model without recursing into any
    of the child Model; may visit the same Model more than once if
    it's referenced more than once. Does not visit the passed-in value.

    '''
    if isinstance(value, HasProps):
        for attr in value.properties_with_refs():
            child = getattr(value, attr)
            visit_value_and_its_immediate_references(child, visitor)
    else:
        visit_value_and_its_immediate_references(value, visitor)


def visit_value_and_its_immediate_references(obj: Any, visitor: Callable[[Model], None]) -> None:
    ''' Visit Models, HasProps, and Python containers.

    Recurses down HasProps references and Python containers (does not recurse
    down Model subclasses).

    The ordering in this function is to optimize performance.  We check the
    most comomn types (int, float, str) first so that we can quickly return in
    the common case.  We avoid isinstance and issubclass checks in a couple
    places with `type` checks because isinstance checks can be slow.
    '''
    from .model import Model

    typ = type(obj)
    if typ in {int, float, str}:  # short circuit on common scalar types
        return
    if typ is list or issubclass(typ, list | tuple):  # check common containers
        for item in obj:
            visit_value_and_its_immediate_references(item, visitor)
    elif issubclass(typ, dict):
        for key, value in obj.items():
            visit_value_and_its_immediate_references(key, visitor)
            visit_value_and_its_immediate_references(value, visitor)
    elif issubclass(typ, HasProps):
        if issubclass(typ, Model):
            visitor(obj)
        else:
            # this isn't a Model, so recurse into it
            visit_immediate_value_references(obj, visitor)
    elif is_dataclass(obj):
        for _, value in entries(obj):
            visit_value_and_its_immediate_references(value, visitor)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
