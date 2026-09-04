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
from typing import Generator, Sequence
from weakref import WeakKeyDictionary

# Bokeh imports
from ..document.document import Document
from ..model import Model, collect_models
from ..settings import settings
from ..themes import Theme, ThemeLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contains_tex_string',
    'FromCurdoc',
    'is_tex_string',
    'OutputDocumentFor',
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

type ThemeSource = ThemeLike | type[FromCurdoc]

@contextmanager
def OutputDocumentFor(objs: Sequence[Model], apply_theme: ThemeSource = None,
        always_new: bool = False) -> Generator[Document]:
    ''' Find or create a (possibly temporary) Document to use for serializing
    Bokeh content.

    Typical usage is similar to:

    .. code-block:: python

         with OutputDocumentFor(models) as document:
             artifact = embed(document)

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

    OutputDocumentFor will also perform document validation before yielding, if
    ``settings.perform_document_validation()`` is True.


        objs (seq[Model]) :
            a sequence of Models that will be serialized, and need a common document

        apply_theme (Theme or ThemeName or FromCurdoc or None, optional):
            Sets the theme for the doc while inside this context manager. (default: None)

            If None, use whatever theme is on the document that is found or created

            If FromCurdoc, use curdoc().theme, restoring any previous theme afterwards

            If a Theme instance or built-in theme name, use that theme, restoring any
            previous theme afterwards

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
            pass

        # models have mixed docs, just make a quick clone
        else:
            def finish() -> None:
                _dispose_temp_doc(objs)
            doc = _create_temp_doc(objs)

    if settings.perform_document_validation():
        doc.validate()

    _set_temp_theme(doc, apply_theme)
    try:
        yield doc
    finally:
        _unset_temp_theme(doc)
        finish()


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

def _set_temp_theme(doc: Document, apply_theme: ThemeSource | None) -> None:
    _themes[doc] = doc.theme
    if apply_theme is FromCurdoc:
        from ..io import curdoc
        doc.theme = curdoc().theme
    elif isinstance(apply_theme, (Theme, str)):
        doc.theme = apply_theme

def _unset_temp_theme(doc: Document) -> None:
    if doc not in _themes:
        return
    doc.theme = _themes[doc]
    del _themes[doc]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
