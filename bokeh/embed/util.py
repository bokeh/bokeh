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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from collections import Sequence, OrderedDict
from contextlib import contextmanager

# External imports
from six import string_types

# Bokeh imports
from ..core.json_encoder import serialize_json
from ..core.templates import _env, DOC_JS, FILE, MACROS, PLOT_DIV, SCRIPT_TAG
from ..document.document import DEFAULT_TITLE, Document
from ..model import Model, collect_models
from ..settings import settings
from ..util.compiler import bundle_all_models
from ..util.serialization import make_id
from ..util.string import encode_utf8, escape, indent

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# Note: Comms handling relies on the fact that the new_doc returned
# has models with the same IDs as they were started with


@contextmanager
def OutputDocumentFor(objs, apply_theme=None, always_new=False):
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
      be created, and all the models will be added as roots. After the context mananger
      exits, the new Document will continue to be the models' document.

    * If passed a subset of Document.roots, then OutputDocumentFor temporarily "re-homes"
      the models in a new bare Document that is only available inside the context manager.

    * If passed a list of models that have differnet documents, then OutputDocumentFor
      temporarily "re-homes" the models in a new bare Document that is only available
      inside the context manager.

    OutputDocumentFor will also perfom document validation before yielding, if
    ``settings.perform_document_validation()`` is True.


        objs (seq[Model]) :
            a sequence of Models that will be serialized, and need a common document

        apply_theme (Theme or FromCurdoc or None, optional):
            Sets the theme for the doc while inside sith context manager. (default: None)

            If None, use whatever theme is on the document that is found or created

            If FromCurdox, use curdoc().theme, restoring any previous theme afterwards

            If a Theme instance, use that theme, restoring any previous theme afterwards

        always_new (bool, optional) :
            Always return a new document, even in cases where it is otherwise possible
            to use an existing document on models.

    Yields:
        Document

    '''
    if not isinstance(objs, Sequence) or len(objs) == 0 or not all(isinstance(x, Model) for x in objs):
        raise ValueError("OutputDocumentFor expects a sequence of Models")

    def finish(): pass

    docs = set(x.document for x in objs)

    # handle a single shared document, or missing document
    if len(docs) == 1:
        doc = docs.pop()

        # if there is no document, make one to use
        if doc is None:
            doc = Document()
            for model in objs:
                doc.add_root(model)

        # we are not using all the roots, make a quick clone for outputting purposes
        elif set(objs) != set(doc.roots) or always_new:
            def finish(): # NOQA
                _dispose_temp_doc(objs)
            doc = _create_temp_doc(objs)

        # we are using all the roots of a single doc, just use doc as-is
        pass

    # models have mixed docs, just make a quick clone
    else:
        def finish(): # NOQA
            _dispose_temp_doc(objs)
        doc = _create_temp_doc(objs)

    if settings.perform_document_validation():
        doc.validate()

    _set_temp_theme(doc, apply_theme)

    yield doc

    _unset_temp_theme(doc)

    finish()

def _set_temp_theme(doc, apply_theme):
    doc._old_theme = doc.theme
    if apply_theme is FromCurdoc:
        from ..io import curdoc; curdoc
        doc.theme = curdoc().theme
    elif apply_theme is not None:
        doc.theme = apply_theme

def _unset_temp_theme(doc):
    doc.theme = doc._old_theme
    del doc._old_theme

def _dispose_temp_doc(models):
    for m in models:
        m._temp_document = None
        for ref in m.references():
            ref._temp_document = None

def _create_temp_doc(models):
    doc = Document()
    for m in models:
        doc._all_models[m._id] = m
        m._temp_document = doc
        for ref in m.references():
            doc._all_models[ref._id] = ref
            ref._temp_document = doc
    doc._roots = models
    return doc

class FromCurdoc(object):
    ''' This class merely provides a non-None default value for ``theme``
    arguments, since ``None`` itself is a meaningful value for users to pass.

    '''
    pass

def submodel_has_python_callbacks(models):
    ''' Traverses submodels to check for Python (event) callbacks

    '''
    has_python_callback = False
    for model in collect_models(models):
        if len(model._callbacks) > 0 or len(model._event_callbacks) > 0:
            has_python_callback = True
            break

    return has_python_callback

def div_for_render_item(item):
    '''
        item: RenderItem
    '''
    return PLOT_DIV.render(doc=item, macros=MACROS)

def html_page_for_render_items(bundle, docs_json, render_items, title,
                               template=None, template_variables={}):
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

    context = template_variables.copy()

    context.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = json + script,
        docs = render_items,
        base = FILE,
        macros = MACROS,
    ))

    if len(render_items) == 1:
        context["doc"] = context["docs"][0]
        context["roots"] = context["doc"].roots

    # XXX: backwards compatibility, remove for 1.0
    context["plot_div"] = "\n".join(div_for_render_item(item) for item in render_items)

    if template is None:
        template = FILE
    elif isinstance(template, string_types):
        template = _env.from_string("{% extends base %}\n" + template)

    html = template.render(context)
    return encode_utf8(html)

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
        render_items=serialize_json([ item.to_json() for item in render_items ], pretty=False),
        app_path=app_path,
        absolute_url=absolute_url,
    )

    if not settings.dev:
        js = wrap_in_safely(js)

    return wrap_in_onload(js)

class RenderRoot(object):

    def __init__(self, elementid, id, name=None, tags=None):
        self.elementid = elementid
        self.id = id
        self.name = name or ""
        self.tags = tags or []

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.elementid == other.elementid

class RenderRoots(object):

    def __init__(self, roots):
        self._roots = roots

    def __len__(self):
        return len(self._roots.items())

    def __getitem__(self, key):
        if isinstance(key, int):
            (root, elementid) = list(self._roots.items())[key]
        else:
            for root, elementid in self._roots.items():
                if root.name == key:
                    break
            else:
                raise ValueError("root with '%s' name not found" % key)

        return RenderRoot(elementid, root._id, root.name, root.tags)

    def __getattr__(self, key):
        return self.__getitem__(key)

    def to_json(self):
        return OrderedDict([ (root._id, elementid) for root, elementid in self._roots.items() ])

class RenderItem(object):

    def __init__(self, docid=None, sessionid=None, elementid=None, roots=None, use_for_title=None):
        if (docid is None and sessionid is None) or (docid is not None and sessionid is not None):
            raise ValueError("either docid or sessionid must be provided")

        if roots is None:
            roots = OrderedDict()
        elif isinstance(roots, list):
            roots = OrderedDict([ (root, make_id()) for root in roots ])

        self.docid = docid
        self.sessionid = sessionid
        self.elementid = elementid
        self.roots = RenderRoots(roots)
        self.use_for_title = use_for_title

    def to_json(self):
        json = {}

        if self.docid is not None:
            json["docid"] = self.docid
        else:
            json["sessionid"] = self.sessionid

        if self.elementid is not None:
            json["elementid"] = self.elementid

        if self.roots:
            json["roots"] = self.roots.to_json()

        if self.use_for_title is not None:
            json["use_for_title"] = self.use_for_title

        return json

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.to_json() == other.to_json()

CALLBACKS_WARNING = """
You are generating standalone HTML/JS output, but trying to use real Python
callbacks (i.e. with on_change or on_event). This combination cannot work.

Only JavaScript callbacks may be used with standalone output. For more
information on JavaScript callbacks with Bokeh, see:

    http://bokeh.pydata.org/en/latest/docs/user_guide/interaction/callbacks.html

Alternatively, to use real Python callbacks, a Bokeh server application may
be used. For more information on building and running Bokeh applications, see:

    http://bokeh.pydata.org/en/latest/docs/user_guide/server.html
"""

def standalone_docs_json_and_render_items(models):
    '''

    '''
    if isinstance(models, (Model, Document)):
        models = [models]

    if not (isinstance(models, Sequence) and all(isinstance(x, (Model, Document)) for x in models)):
        raise ValueError("Expected a Model, Document, or Sequence of Models or Documents")

    if submodel_has_python_callbacks(models):
        log.warn(CALLBACKS_WARNING)

    docs = {}
    for model_or_doc in models:
        if isinstance(model_or_doc, Document):
            model = None
            doc = model_or_doc
        else:
            model = model_or_doc
            doc = model.document

            if doc is None:
                raise ValueError("to render a model as HTML it must be part of a document")

        if doc not in docs:
            docs[doc] = (make_id(), OrderedDict())

        (docid, roots) = docs[doc]

        if model is not None:
            roots[model] = make_id()
        else:
            for model in doc.roots:
                roots[model] = make_id()

    docs_json = {}
    for doc, (docid, _) in docs.items():
        docs_json[docid] = doc.to_json()

    render_items = []
    for _, (docid, roots) in docs.items():
        render_items.append(RenderItem(docid, roots=roots))

    return (docs_json, render_items)

def wrap_in_onload(code):
    '''

    '''
    return _ONLOAD % dict(code=indent(code, 4))

def wrap_in_safely(code):
    '''

    '''
    return _SAFELY % dict(code=indent(code, 2))

def wrap_in_script_tag(js, type="text/javascript", id=None):
    '''

    '''
    return SCRIPT_TAG.render(js_code=indent(js, 2), type=type, id=id)

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
