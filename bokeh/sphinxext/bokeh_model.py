# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

    .. bokeh-model:: Foo
        :module: bokeh.sphinxext.sample

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Foo``:

.. code-block:: python

    class Foo(Model):
        ''' This is a Foo model. '''
        index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
        value = Tuple(Float, Float, help="doc for value")

usage yields the output:

    .. bokeh-model:: Foo
        :module: bokeh.sphinxext.sample

The ``bokeh-model`` direction may be used explicitly, but it can also be used
in conjunction with the :ref:`bokeh.sphinxext.bokeh_autodoc` extension.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import importlib
import json
import warnings

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
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
    optional_arguments = 1
    option_spec = {"module": unchanged}

    def run(self):
        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError(f"Unable to parse signature for bokeh-model: {sig!r}")
        name_prefix, model_name, arglist, retann = m.groups()

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

        model_json = json.dumps(model_obj.to_json(include_defaults=True), sort_keys=True, indent=2, separators=(",", ": "))

        rst_text = MODEL_DETAIL.render(
            name=model_name,
            module_name=module_name,
            model_json=model_json,
        )

        return self._parse(rst_text, "<bokeh-model>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-model", BokehModelDirective)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
