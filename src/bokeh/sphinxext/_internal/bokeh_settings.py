# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Thoroughly document Bokeh settings.

The ``bokeh-model`` directive will automatically document all the attributes
(including Bokeh PrioritizedSettings) of an object.

This directive takes the name of a module attribute

.. code-block:: rest

    .. bokeh-settings:: settings
        :module: bokeh.settings

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
import textwrap

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
from bokeh.settings import PrioritizedSetting, _Unset

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective, py_sig_re
from .templates import SETTINGS_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehSettingsDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehSettingsDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 1
    option_spec = {"module": unchanged}

    def run(self):
        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError(f"Unable to parse signature for bokeh-model: {sig!r}")
        name_prefix, obj_name, arglist, retann = m.groups()

        module_name = self.options["module"]

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError(f"Unable to generate reference docs for {obj_name}: couldn't import module {module_name}")

        obj = getattr(module, obj_name, None)
        if obj is None:
            raise SphinxError(f"Unable to generate reference docs for {obj_name}: no model {obj_name} in module {module_name}")

        settings = []
        for x in obj.__class__.__dict__.values():
            if not isinstance(x, PrioritizedSetting):
                continue
            # help = [line.strip() for line in x.help.strip().split("\n")]
            setting = {
                "name": x.name,
                "env_var": x.env_var,
                "type": x.convert_type,
                "help": textwrap.dedent(x.help),
                "default": "(Unset)" if x.default is _Unset else repr(x.default),
                "dev_default": "(Unset)" if x.dev_default is _Unset else repr(x.dev_default),
            }
            settings.append(setting)

        rst_text = SETTINGS_DETAIL.render(name=obj_name, module_name=module_name, settings=settings)
        return self.parse(rst_text, "<bokeh-settings>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-settings", BokehSettingsDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
