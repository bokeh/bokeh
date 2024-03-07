#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
import re
from contextlib import contextmanager
from typing import (
    TYPE_CHECKING,
    Any,
    Iterator,
    Sequence,
)
from weakref import WeakKeyDictionary

# Bokeh imports
from ..core.types import ID
from ..document.document import Document
from ..model import Model, collect_models
from ..settings import settings
from ..themes.theme import Theme
from ..util.dataclasses import dataclass, field
from ..util.serialization import (
    make_globally_unique_css_safe_id,
    make_globally_unique_id,
)

if TYPE_CHECKING:
    from ..document.document import DocJson

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contains_tex_string',
    'FromCurdoc',
    'is_tex_string',
    'OutputDocumentFor',
    'RenderItem',
    'RenderRoot',
    'RenderRoots',
    'standalone_docs_json',
    'standalone_docs_json_and_render_items',
    'submodel_has_python_callbacks',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class FromCurdoc:
    ''' This class merely provides a non-None default value for ``theme``
    arguments, since ``None`` itself is a meaningful value for users to pass.

    '''
    pass

@contextmanager
def OutputDocumentFor(objs: Sequence[Model], apply_theme: Theme | type[FromCurdoc] | None = None,
        always_new: bool = False) -> Iterator[Document]:
    ''' Find or create a (possibly temporary) Document to use for serializing
    Bokeh content.

    Typical usage is similar to:

    .. code-block:: python

         with OutputDocumentFor(models):
            (docs_json, [render_item]) = standalone_docs_json_and_render_items(models)

    Inside the context manager, the models will be considered to be part of a single
    Document, with any theme specified, which can thus be serialized as a unit. Where
    possible, OutputDocumentFor attempts to use an existing Document. However, this is
    not possible in three cases:

    * If passed a series of models that have no Document at all, a new Document will
      be created, and all the models will be added as roots. After the context manager
      exits, the new Document will continue to be the models' document.

    * If passed a subset of Document.roots, then OutputDocumentFor temporarily "re-homes"
      the models in a new bare Document that is only available inside the context manager.

    * If passed a list of models that have different documents, then OutputDocumentFor
      temporarily "re-homes" the models in a new bare Document that is only available
      inside the context manager.

    OutputDocumentFor will also perfom document validation before yielding, if
    ``settings.perform_document_validation()`` is True.


        objs (seq[Model]) :
            a sequence of Models that will be serialized, and need a common document

        apply_theme (Theme or FromCurdoc or None, optional):
            Sets the theme for the doc while inside this context manager. (default: None)

            If None, use whatever theme is on the document that is found or created

            If FromCurdoc, use curdoc().theme, restoring any previous theme afterwards

            If a Theme instance, use that theme, restoring any previous theme afterwards

        always_new (bool, optional) :
            Always return a new document, even in cases where it is otherwise possible
            to use an existing document on models.

    Yields:
        Document

    '''
    # Note: Comms handling relies on the fact that the new_doc returned
    # has models with the same IDs as they were started with

    if not isinstance(objs, Sequence) or len(objs) == 0 or not all(isinstance(x, Model) for x in objs):
        raise ValueError("OutputDocumentFor expects a non-empty sequence of Models")

    def finish() -> None:
        pass

    docs = {obj.document for obj in objs if obj.document is not None}

    if always_new:
        def finish() -> None:
            _dispose_temp_doc(objs)
        doc = _create_temp_doc(objs)
    else:
        if len(docs) == 0:
            doc = _new_doc()
            for model in objs:
                doc.add_root(model)

        # handle a single shared document
        elif len(docs) == 1:
            doc = docs.pop()

            # we are not using all the roots, make a quick clone for outputting purposes
            if set(objs) != set(doc.roots):
                def finish() -> None:
                    _dispose_temp_doc(objs)
                doc = _create_temp_doc(objs)

            # we are using all the roots of a single doc, just use doc as-is
            pass  # lgtm [py/unnecessary-pass]

        # models have mixed docs, just make a quick clone
        else:
            def finish():
                _dispose_temp_doc(objs)
            doc = _create_temp_doc(objs)

    if settings.perform_document_validation():
        doc.validate()

    _set_temp_theme(doc, apply_theme)
    yield doc
    _unset_temp_theme(doc)

    finish()


class RenderItem:
    def __init__(self, docid: ID | None = None, token: str | None = None, elementid: ID | None = None,
            roots: list[Model] | dict[Model, ID] | None = None, use_for_title: bool | None = None):

        if (docid is None and token is None) or (docid is not None and token is not None):
            raise ValueError("either docid or sessionid must be provided")

        if roots is None:
            roots = dict()
        elif isinstance(roots, list):
            roots = {root: make_globally_unique_id() for root in roots}

        self.docid = docid
        self.token = token
        self.elementid = elementid
        self.roots = RenderRoots(roots)
        self.use_for_title = use_for_title

    def to_json(self) -> dict[str, Any]:
        json: dict[str, Any] = {}

        if self.docid is not None:
            json["docid"] = self.docid
        else:
            json["token"] = self.token

        if self.elementid is not None:
            json["elementid"] = self.elementid

        if self.roots:
            json["roots"] = self.roots.to_json()
            json["root_ids"] = [root.id for root in self.roots]

        if self.use_for_title is not None:
            json["use_for_title"] = self.use_for_title

        return json

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.to_json() == other.to_json()


@dataclass
class RenderRoot:
    """ Encapsulate data needed for embedding a Bokeh document root.

    Values for ``name`` or ``tags`` are optional. They may be useful for
    querying a collection of roots to find a specific one to embed.

    """

    #: A unique ID to use for the DOM element
    elementid: ID

    #: The Bokeh model ID for this root
    id: ID = field(compare=False)

    #: An optional user-supplied name for this root
    name: str | None = field(default="", compare=False)

    #: A list of any user-supplied tag values for this root
    tags: list[Any] = field(default_factory=list, compare=False)

    def __post_init__(self):
        # Model.name is nullable, and field() won't enforce the default when name=None
        self.name = self.name or ""


class RenderRoots:
    def __init__(self, roots: dict[Model, ID]) -> None:
        self._roots = roots

    def __iter__(self) -> Iterator[RenderRoot]:
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self._roots.items())

    def __getitem__(self, key: int | str) -> RenderRoot:
        if isinstance(key, int):
            (root, elementid) = list(self._roots.items())[key]
        else:
            for root, elementid in self._roots.items():
                if root.name == key:
                    break
            else:
                raise ValueError(f"root with {key!r} name not found")

        return RenderRoot(elementid, root.id, root.name, root.tags)

    def __getattr__(self, key: str) -> RenderRoot:
        return self.__getitem__(key)

    def to_json(self) -> dict[ID, ID]:
        return {root.id: elementid for root, elementid in self._roots.items()}

    def __repr__(self) -> str:
        return repr(self._roots)

def standalone_docs_json(models: Sequence[Model | Document]) -> dict[ID, DocJson]:
    '''

    '''
    docs_json, _ = standalone_docs_json_and_render_items(models)
    return docs_json

def standalone_docs_json_and_render_items(models: Model | Document | Sequence[Model | Document], *,
        suppress_callback_warning: bool = False) -> tuple[dict[ID, DocJson], list[RenderItem]]:
    '''

    '''
    if isinstance(models, (Model, Document)):
        models = [models]

    if not (isinstance(models, Sequence) and all(isinstance(x, (Model, Document)) for x in models)):
        raise ValueError("Expected a Model, Document, or Sequence of Models or Documents")

    if submodel_has_python_callbacks(models) and not suppress_callback_warning:
        log.warning(_CALLBACKS_WARNING)

    docs: dict[Document, tuple[ID, dict[Model, ID]]] = {}
    for model_or_doc in models:
        if isinstance(model_or_doc, Document):
            model = None
            doc = model_or_doc
        else:
            model = model_or_doc
            doc = model.document

            if doc is None:
                raise ValueError("A Bokeh Model must be part of a Document to render as standalone content")

        if doc not in docs:
            docs[doc] = (make_globally_unique_id(), dict())

        (docid, roots) = docs[doc]

        if model is not None:
            roots[model] = make_globally_unique_css_safe_id()
        else:
            for model in doc.roots:
                roots[model] = make_globally_unique_css_safe_id()

    docs_json: dict[ID, DocJson] = {}
    for doc, (docid, _) in docs.items():
        docs_json[docid] = doc.to_json(deferred=False)

    render_items: list[RenderItem] = []
    for _, (docid, roots) in docs.items():
        render_items.append(RenderItem(docid, roots=roots))

    return (docs_json, render_items)

def submodel_has_python_callbacks(models: Sequence[Model | Document]) -> bool:
    ''' Traverses submodels to check for Python (event) callbacks

    '''
    has_python_callback = False
    for model in collect_models(models):
        if len(model._callbacks) > 0 or len(model._event_callbacks) > 0:
            has_python_callback = True
            break

    return has_python_callback

def is_tex_string(text: str) -> bool:
    ''' Whether a string begins and ends with MathJax default delimiters

    Args:
        text (str): String to check

    Returns:
        bool: True if string begins and ends with delimiters, False if not
    '''
    dollars = r"^\$\$.*?\$\$$"
    braces  = r"^\\\[.*?\\\]$"
    parens  = r"^\\\(.*?\\\)$"

    pat = re.compile(f"{dollars}|{braces}|{parens}", flags=re.S)
    return pat.match(text) is not None

def contains_tex_string(text: str) -> bool:
    ''' Whether a string contains any pair of MathJax default delimiters
    Args:
        text (str): String to check
    Returns:
        bool: True if string contains delimiters, False if not
    '''
    # these are non-greedy
    dollars = r"\$\$.*?\$\$"
    braces  = r"\\\[.*?\\\]"
    parens  = r"\\\(.*?\\\)"

    pat = re.compile(f"{dollars}|{braces}|{parens}", flags=re.S)
    return pat.search(text) is not None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_CALLBACKS_WARNING = """
You are generating standalone HTML/JS output, but trying to use real Python
callbacks (i.e. with on_change or on_event). This combination cannot work.

Only JavaScript callbacks may be used with standalone output. For more
information on JavaScript callbacks with Bokeh, see:

    https://docs.bokeh.org/en/latest/docs/user_guide/interaction/js_callbacks.html

Alternatively, to use real Python callbacks, a Bokeh server application may
be used. For more information on building and running Bokeh applications, see:

    https://docs.bokeh.org/en/latest/docs/user_guide/server.html
"""

def _new_doc() -> Document:
    # TODO: embed APIs need to actually respect the existing document's
    # configuration, but for now this is better than nothing.
    from ..io import curdoc
    doc = Document()
    callbacks = curdoc().callbacks._js_event_callbacks
    doc.callbacks._js_event_callbacks.update(callbacks)
    return doc

def _create_temp_doc(models: Sequence[Model]) -> Document:
    doc = _new_doc()
    for m in models:
        doc.models[m.id] = m
        m._temp_document = doc
        for ref in m.references():
            doc.models[ref.id] = ref
            ref._temp_document = doc
    doc._roots = list(models)
    return doc

def _dispose_temp_doc(models: Sequence[Model]) -> None:
    for m in models:
        m._temp_document = None
        for ref in m.references():
            ref._temp_document = None

_themes: WeakKeyDictionary[Document, Theme] = WeakKeyDictionary()

def _set_temp_theme(doc: Document, apply_theme: Theme | type[FromCurdoc] | None) -> None:
    _themes[doc] = doc.theme
    if apply_theme is FromCurdoc:
        from ..io import curdoc
        doc.theme = curdoc().theme
    elif isinstance(apply_theme, Theme):
        doc.theme = apply_theme

def _unset_temp_theme(doc: Document) -> None:
    if doc not in _themes:
        return
    doc.theme = _themes[doc]
    del _themes[doc]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
