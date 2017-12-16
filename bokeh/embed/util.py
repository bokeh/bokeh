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
from collections import Sequence

# External imports
from six import string_types

# Bokeh imports
from ..core.json_encoder import serialize_json
from ..core.templates import DOC_JS, FILE, PLOT_DIV, SCRIPT_TAG
from ..document.document import DEFAULT_TITLE, Document
from ..model import Model
from ..settings import settings
from ..util.compiler import bundle_all_models
from ..util.serialization import make_id
from ..util.string import encode_utf8, indent

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
class FromCurdoc(object):
    ''' This class merely provides a non-None default value for ``theme``
    arguments, since ``None`` itself is a meaningful value for users to pass.

    '''
    pass

@dev((1,0,0))
def check_models_or_docs(models, allow_dict=False):
    '''

    '''
    input_type_valid = False

    # Check for single item
    if isinstance(models, (Model, Document)):
        models = [models]

    # Check for sequence
    if isinstance(models, Sequence) and all(isinstance(x, (Model, Document)) for x in models):
        input_type_valid = True

    if allow_dict:
        if isinstance(models, dict) and \
           all(isinstance(x, string_types) for x in models.keys()) and \
           all(isinstance(x, (Model, Document)) for x in models.values()):
            input_type_valid = True

    if not input_type_valid:
        if allow_dict:
            raise ValueError(
                'Input must be a Model, a Document, a Sequence of Models and Document, or a dictionary from string to Model and Document'
            )
        else:
            raise ValueError('Input must be a Model, a Document, or a Sequence of Models and Document')

    return models

@dev((1,0,0))
def check_one_model_or_doc(model):
    '''

    '''
    models = check_models_or_docs(model)
    if len(models) != 1:
        raise ValueError("Input must be exactly one Model or Document")
    return models[0]

@dev((1,0,0))
def div_for_render_item(item):
    '''

    '''
    return PLOT_DIV.render(elementid=item['elementid'])

@dev((1,0,0))
def find_existing_docs(models):
    '''

    '''
    existing_docs = set(m if isinstance(m, Document) else m.document for m in models)
    existing_docs.discard(None)

    if len(existing_docs) == 0:
        # no existing docs, use the current doc
        doc = Document()
    elif len(existing_docs) == 1:
        # all existing docs are the same, use that one
        doc = existing_docs.pop()
    else:
        # conflicting/multiple docs, raise an error
        msg = ('Multiple items in models contain documents or are '
               'themselves documents. (Models must be owned by only a '
               'single document). This may indicate a usage error.')
        raise RuntimeError(msg)
    return doc

@dev((1,0,0))
def html_page_for_render_items(bundle, docs_json, render_items, title,
                               template=FILE, template_variables={}):
    '''

    '''
    if title is None:
        title = DEFAULT_TITLE

    bokeh_js, bokeh_css = bundle

    json_id = make_id()
    json = escape(serialize_json(docs_json), quote=False)
    json = wrap_in_script_tag(json, "application/json", json_id)

    script = bundle_all_models()
    script += script_for_render_items(json_id, render_items)
    script = wrap_in_script_tag(script)

    template_variables_full = template_variables.copy()

    template_variables_full.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = json + script,
        plot_div = "\n".join(div_for_render_item(item) for item in render_items)
    ))

    html = template.render(template_variables_full)
    return encode_utf8(html)

@dev((1,0,0))
def script_for_render_items(docs_json_or_id, render_items, app_path=None, absolute_url=None):
    '''

    '''
    if isinstance(docs_json_or_id, string_types):
        docs_json = "document.getElementById('%s').textContent" % docs_json_or_id
    else:
        # XXX: encodes &, <, > and ', but not ". This is because " is used a lot in JSON,
        # and encoding it would significantly increase size of generated files. Doing so
        # is safe, because " in strings was already encoded by JSON, and the semi-encoded
        # JSON string is included in JavaScript in single quotes.
        docs_json = serialize_json(docs_json_or_id, pretty=False) # JSON string
        docs_json = escape(docs_json, quote=("'",))               # make HTML-safe
        docs_json = docs_json.replace("\\", "\\\\")               # double encode escapes
        docs_json =  "'" + docs_json + "'"                        # JS string

    js = DOC_JS.render(
        docs_json=docs_json,
        render_items=serialize_json(render_items, pretty=False),
        app_path=app_path,
        absolute_url=absolute_url,
    )

    if not settings.dev:
        js = wrap_in_safely(js)

    return wrap_in_onload(js)

@dev((1,0,0))
def standalone_docs_json_and_render_items(models):
    '''

    '''
    models = check_models_or_docs(models)

    render_items = []
    docs_by_id = {}
    for p in models:
        modelid = None
        if isinstance(p, Document):
            doc = p
        else:
            if p.document is None:
                raise ValueError("To render a Model as HTML it must be part of a Document")
            doc = p.document
            modelid = p._id
        docid = None
        for key in docs_by_id:
            if docs_by_id[key] == doc:
                docid = key
        if docid is None:
            docid = make_id()
            docs_by_id[docid] = doc

        elementid = make_id()

        render_items.append({
            'docid' : docid,
            'elementid' : elementid,
            # if modelid is None, that means the entire document
            'modelid' : modelid
            })

    docs_json = {}
    for k, v in docs_by_id.items():
        docs_json[k] = v.to_json()

    return (docs_json, render_items)

@dev((1,0,0))
def wrap_in_onload(code):
    '''

    '''
    return _ONLOAD % dict(code=indent(code, 4))

@dev((1,0,0))
def wrap_in_safely(code):
    '''

    '''
    return _SAFELY % dict(code=indent(code, 2))

@dev((1,0,0))
def wrap_in_script_tag(js, type="text/javascript", id=None):
    '''

    '''
    return SCRIPT_TAG.render(js_code=indent(js, 2), type=type, id=id)

# based on `html` stdlib module (3.2+)
@dev((1,0,0))
def escape(s, quote=("'", '"')):
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.
    If the optional flag quote is true (the default), the quotation mark
    characters, both double quote (") and single quote (') characters are also
    translated.
    """
    s = s.replace("&", "&amp;")
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        if '"' in quote:
            s = s.replace('"', "&quot;")
        if "'" in quote:
            s = s.replace("'", "&#x27;")
    return s

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_ONLOAD = """\
(function() {
  var fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

_SAFELY = """\
Bokeh.safely(function() {
%(code)s
});\
"""

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
