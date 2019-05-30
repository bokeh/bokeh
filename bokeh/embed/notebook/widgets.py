#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""
Defines a Bokeh model wrapper for Jupyter notebook/lab, which renders Bokeh models
and performs bi-directional syncing just like bokeh server does.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json

# External imports

# Bokeh imports
from ...core.json_encoder import serialize_json
from ...models import LayoutDOM
from ...document import Document
from ...protocol import Protocol
from ...util.version import __version__
from ...util.dependencies import import_optional
from ..elements import div_for_render_item
from ..util import standalone_docs_json_and_render_items

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "BokehModel",
)

_module_name = "bokehjs"
_module_version = __version__

ipywidgets = import_optional("ipywidgets")
traitlets = import_optional("traitlets")

Unicode = traitlets.Unicode
Dict = traitlets.Dict

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BokehModel(ipywidgets.DOMWidget):

    _model_name = Unicode("BokehModel").tag(sync=True)
    _model_module = Unicode(_module_name).tag(sync=True)
    _model_module_version = Unicode(_module_version).tag(sync=True)
    _view_name = Unicode("BokehView").tag(sync=True)
    _view_module = Unicode(_module_name).tag(sync=True)
    _view_module_version = Unicode(_module_version).tag(sync=True)

    render_bundle = Dict().tag(sync=True, to_json=lambda obj, _: serialize_json(obj))

    def __init__(self, model, document=None, **kwargs):
        if isinstance(model, LayoutDOM):
            self.update_from_model(model, document)
        super(BokehModel, self).__init__(**kwargs)
        self.on_msg(self._sync_model)

    def close(self):
        if self._document is not None:
            self._document.remove_on_change(self)

    @classmethod
    def _model_to_traits(cls, model, document=None):
        if document is None:
            document = Document()
            document.add_root(model)
        (docs_json, [render_item]) = standalone_docs_json_and_render_items([model], True)
        render_bundle = dict(
            docs_json=docs_json,
            render_items=[render_item.to_json()],
            div=div_for_render_item(render_item),
        )
        return render_bundle, document

    def update_from_model(self, model, document=None):
        self._model = model
        self.render_bundle, self._document = self._model_to_traits(model, document)
        self._document.on_change_dispatch_to(self)

    def _document_patched(self, event):
        msg = Protocol("1.0").create("PATCH-DOC", [event])

        self.send({"msg": "patch", "payload": msg.header_json})
        self.send({"msg": "patch", "payload": msg.metadata_json})
        self.send({"msg": "patch", "payload": msg.content_json})
        for header, buff in msg.buffers:
            self.send({"msg": "patch", "payload": json.dumps(header)})
            self.send({"msg": "patch", "payload": buff})

    def _sync_model(self, _, content, _buffers):
        if content.get("event", "") != "jsevent":
            return
        new, old, attr = content["new"], content["old"], content["attr"]
        submodel = self._model.select_one({"id": content["id"]})
        try:
            setattr(submodel, attr, new)
        except Exception:
            return
        for cb in submodel._callbacks.get(attr, []):
            cb(attr, old, new)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------
