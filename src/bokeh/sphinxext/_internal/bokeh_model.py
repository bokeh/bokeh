# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Thoroughly document Bokeh model classes.

The ``bokeh-model`` directive will automatically document all the attributes
(including Bokeh properties) of a Bokeh Model subclass. A JSON prototype showing
all the possible JSON fields will also be generated.

This directive takes the name of a Bokeh model class as an argument and its
module as an option:

.. code-block:: rest

    .. bokeh-model:: SomeModel

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import importlib
import json
import warnings
from os import getenv
from typing import Any

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
from bokeh.core.property.singletons import Undefined
from bokeh.core.serialization import AnyRep, Serializer, SymbolRep
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective, py_sig_re
from .templates import MODEL_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehModelDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehModelDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True
    option_spec = {
        "module": unchanged,
        "canonical": unchanged,
    }

    def run(self):

        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError(f"Unable to parse signature for bokeh-model: {sig!r}")
        name_prefix, model_name, arglist, retann = m.groups()

        if getenv("BOKEH_SPHINX_QUICK") == "1":
            return self.parse(f"{model_name}\n{'-'*len(model_name)}\n", f"<bokeh-model: {model_name}>")

        module_name = self.options["module"]

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError(f"Unable to generate model reference docs for {model_name}, couldn't import module {module_name}")

        model = getattr(module, model_name, None)
        if model is None:
            raise SphinxError(f"Unable to generate model reference docs: no model for {model_name} in module {module_name}")

        if not issubclass(model, Model):
            raise SphinxError(f"Unable to generate model reference docs: {model_name}, is not a subclass of Model")

        # We may need to instantiate deprecated objects as part of documenting
        # them in the reference guide. Suppress any warnings here to keep the
        # docs build clean just for this case
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
            model_obj = model()

        model_json = json.dumps(to_json_rep(model_obj), sort_keys=True, indent=2, separators=(", ", ": "))

        # we only want to document things as coming from top-level `bokeh.models`
        adjusted_module_name = "bokeh.models" if module_name.startswith("bokeh.models") else module_name

        rst_text = MODEL_DETAIL.render(
            name=model_name,
            module_name=adjusted_module_name,
            model_json=model_json,
        )

        return self.parse(rst_text, f"<bokeh-model: {model_name}>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-model", BokehModelDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

class DocsSerializer(Serializer):

    def _encode(self, obj: Any) -> AnyRep:
        if obj is Undefined:
            return SymbolRep(type="symbol", name="unset")
        else:
            return super()._encode(obj)

def to_json_rep(obj: Model) -> dict[str, AnyRep]:
    serializer = DocsSerializer()

    properties = obj.properties_with_values(include_defaults=True, include_undefined=True)
    attributes = {key: serializer.encode(val) for key, val in properties.items()}

    return dict(id=obj.id, **attributes)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
