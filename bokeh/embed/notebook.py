#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from contextlib import contextmanager

# External imports

# Bokeh imports
from ..core.templates import DOC_NB_JS
from ..core.json_encoder import serialize_json
from ..settings import settings
from ..util.string import encode_utf8
from .util import FromCurdoc
from .util import check_one_model_or_doc, div_for_render_item, find_existing_docs, standalone_docs_json_and_render_items

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dev((1,0,0))
def notebook_content(model, notebook_comms_target=None, theme=FromCurdoc):
    ''' Return script and div that will display a Bokeh plot in a Jupyter
    Notebook.

    The data for the plot is stored directly in the returned HTML.

    Args:
        model (Model) : Bokeh object to render

        notebook_comms_target (str, optional) :
            A target name for a Jupyter Comms object that can update
            the document that is rendered to this notebook div

        theme (Theme, optional) :
            Defaults to the ``Theme`` instance in the current document.
            Setting this to ``None`` uses the default theme or the theme
            already specified in the document. Any other value must be an
            instance of the ``Theme`` class.

    Returns:
        script, div, Document

    .. note::
        Assumes :func:`~bokeh.io.notebook.load_notebook` or the equivalent
        has already been executed.

    '''

    model = check_one_model_or_doc(model)

    # Comms handling relies on the fact that the new_doc returned here
    # has models with the same IDs as they were started with
    with _ModelInEmptyDocument(model, apply_theme=theme) as new_doc:
        (docs_json, render_items) = standalone_docs_json_and_render_items([model])

    item = render_items[0]
    if notebook_comms_target:
        item['notebook_comms_target'] = notebook_comms_target
    else:
        notebook_comms_target = ''

    script = DOC_NB_JS.render(
        docs_json=serialize_json(docs_json),
        render_items=serialize_json(render_items)
    )

    div = div_for_render_item(item)

    return encode_utf8(script), encode_utf8(div), new_doc

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@contextmanager
def _ModelInEmptyDocument(model, apply_theme=None):

    # Note: Comms handling relies on the fact that the new_doc returned
    # has models with the same IDs as they were started with

    from ..document import Document
    doc = find_existing_docs([model])

    model._document = None
    for ref in model.references():
        ref._document = None
    new_doc = Document()
    new_doc.add_root(model)

    if apply_theme is FromCurdoc:
        from ..io import curdoc; curdoc
        new_doc.theme = curdoc().theme
    elif apply_theme is not None:
        new_doc.theme = apply_theme

    if settings.perform_document_validation():
        new_doc.validate()

    yield new_doc

    model._document = doc
    for ref in model.references():
        ref._document = doc

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
