#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Encapulate the management of Document models with a DocumentModelManager
class.

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
import contextlib
import weakref
from typing import (
    TYPE_CHECKING,
    Dict,
    Generator,
    Iterator,
    List,
    Set,
)

# Bokeh imports
from ..core.types import ID
from ..model import Model
from ..util.datatypes import MultiValuedDict

if TYPE_CHECKING:
    from .document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocumentModelManager',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DocumentModelManager:
    ''' Manage and provide access to all of the models that belong to a Bokeh
    Document.

    The set of "all models" means specifically all the models reachable from
    references form a Document's roots.

    '''

    _document : weakref.ReferenceType[Document]
    _freeze_count: int
    _models: Dict[ID, Model]
    _models_by_name: MultiValuedDict[str, Model]
    _seen_model_ids: Set[ID] = set()

    def __init__(self, document: Document):
        '''

        Args:
            document (Document): A Document to manage models for
                A weak reference to the Document will be retained

        '''
        self._document = weakref.ref(document)
        self._freeze_count = 0
        self._models = {}
        self._models_by_name = MultiValuedDict()
        self._seen_model_ids = set()

    def __len__(self) -> int:
        return len(self._models)

    def __getitem__(self, id: ID) -> Model:
        return self._models[id]

    def __setitem__(self, id: ID, model: Model) -> None:
        self._models[id] = model

    def __contains__(self, id: ID) -> bool:
        return id in self._models

    def __iter__(self) -> Iterator[Model]:
        return iter(self._models.values())

    def destroy(self) -> None:
        ''' Clean up references to the Documents models

        '''

        # probably better to implement a destroy protocol on models to
        # untangle everything, then the collect below might not be needed
        for m in self._models.values():
            m.destroy()

        del self._models
        del self._models_by_name

    @contextlib.contextmanager
    def freeze(self) -> Generator[None, None, None]:
        ''' Defer expensive model recompuation until intermediate updates are
        complete.

        Making updates to the model graph might trigger events that cause more
        updates. This context manager can be used to prevent expensive model
        recompuation from happening until all events have finished and the
        Document state is quiescent.

        Example:

        .. code-block:: python

            with models.freeze():
                # updates that might change the model graph, that might trigger
                # updates that change the model graph, etc. Recompuation will
                # happen once at the end.

        '''
        self._push_freeze()
        yield
        self._pop_freeze()

    def get_all_by_name(self, name: str) -> List[Model]:
        ''' Find all the models for this Document with a given name.

        Args:
            name (str) : the name of a model to search for

        Returns
            A list of models

        '''
        return self._models_by_name.get_all(name)

    def get_by_id(self, id: ID) -> Model | None:
        ''' Find the model for this Document with a given ID.

        Args:
            id (ID) : model ID to search for
                If no model with the given ID exists, returns None

        Return:
            a Model or None

        '''
        return self._models.get(id, None)

    def get_one_by_name(self, name: str) -> Model | None:
        ''' Find a single model for this Document with a given name.

        If multiple models are found with the name, an error is raised.

        Args:
            name (str) : the name of a model to search for

        Returns
            A model with the given name, or None

        '''
        return self._models_by_name.get_one(name, f"Found more than one model named '{name}'")

    def invalidate(self) -> None:
        ''' Recompute the set of all models, if not currently frozen

        Returns:
            None

        '''
        if self._freeze_count == 0:  # only recompute when competely unfrozen
            self.recompute()

    def recompute(self) -> None:
        ''' Recompute the set of all models based on references reachable from
        the Document's current roots.

        This computation can be expensive. Use ``freeze`` to wrap operations
        that update the model object graph to avoid over-recompuation

        .. note::
            Any models that remove during recomputation will be noted as
            "previously seen"

        '''
        document = self._document()
        if document is None:
            return

        new_models: Set[Model] = set()
        for mr in document.roots:
            new_models |= mr.references()

        old_models = set(self._models.values())

        to_detach = old_models - new_models
        to_attach = new_models - old_models

        recomputed: Dict[ID, Model] = {}
        recomputed_by_name: MultiValuedDict[str, Model] = MultiValuedDict()

        for mn in new_models:
            recomputed[mn.id] = mn
            if mn.name is not None:
                recomputed_by_name.add_value(mn.name, mn)

        for md in to_detach:
            self._seen_model_ids.add(md.id)
            md._detach_document()

        for ma in to_attach:
            ma._attach_document(document)

        self._models = recomputed
        self._models_by_name = recomputed_by_name

    # XXX (bev) In theory, this is a potential issue for long-running apps that
    # update the model graph continuously, since this set of "seen" model ids can
    # grow without bound.
    def seen(self, id: ID) -> bool:
        ''' Report whether a model id has ever previously belonged to this
        Document.

        Args:
            id (ID) : the model id of a model to check

        Returns:
            bool

        '''
        return id in self._seen_model_ids

    def update_name(self, model: Model, old_name: str | None, new_name: str | None) -> None:
        ''' Update the name for a model.

        .. note::
            This function and the internal name mapping exist to support
            optimizing the common case of name lookup for models. Keeping a
            dedicated name index is faster than using generic ``bokeh.query``
            functions with a name selector

        Args:
            model (Model) : a model to update the name for

            old_name(str, None) : a previous name for the model, or None

            new_name(str, None) : a new name for the model, or None

        Returns:
            None

        '''
        if old_name is not None:
            self._models_by_name.remove_value(old_name, model)
        if new_name is not None:
            self._models_by_name.add_value(new_name, model)

    def _push_freeze(self) -> None:
        self._freeze_count += 1

    def _pop_freeze(self) -> None:
        self._freeze_count -= 1
        if self._freeze_count == 0:
            self.recompute()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
