# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Integrate Bokeh extensions into Sphinx autodoc.

Ensures that autodoc directives such as ``autoclass`` automatically make use of
Bokeh-specific directives when appropriate.

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

# External imports
from sphinx.ext.autodoc import (
    AttributeDocumenter,
    ClassDocumenter,
    ModuleLevelDocumenter,
)

# Bokeh imports
from bokeh.colors.color import Color
from bokeh.core.enums import Enumeration
from bokeh.core.property.descriptors import PropertyDescriptor
from bokeh.model import Model

# Bokeh imports
from . import PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "ColorDocumenter",
    "EnumDocumenter",
    "ModelDocumenter",
    "PropDocumenter",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class ColorDocumenter(ModuleLevelDocumenter):
    directivetype = "bokeh-color"
    objtype = ""
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Color)

    # We don't need/want anything from the actual NamedColor class
    def add_content(self, more_content, no_docstring=False):
        pass

    def get_object_members(self, want_all):
        return False, []


class EnumDocumenter(ModuleLevelDocumenter):
    directivetype = "bokeh-enum"
    objtype = "enum"
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Enumeration)

    # Override the Sphinx default `Documenter.get_object_members()`
    # which is deprecated, and will soon be removed.
    # Ref: https://github.com/bokeh/bokeh/issues/12462
    def get_object_members(self, want_all):
        return False, []


class PropDocumenter(AttributeDocumenter):
    directivetype = "bokeh-prop"
    objtype = "prop"
    priority = 20
    member_order = -100  # This puts properties first in the docs

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, PropertyDescriptor)


class ModelDocumenter(ClassDocumenter):
    directivetype = "bokeh-model"
    objtype = "model"
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, type) and issubclass(member, Model)


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_autodocumenter(ColorDocumenter)
    app.add_autodocumenter(EnumDocumenter)
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
