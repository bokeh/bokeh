# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

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
from os.path import dirname, join

# External imports
from jinja2 import Environment, FileSystemLoader

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BJS_CODEPEN_INIT",
    "BJS_EPILOGUE",
    "BJS_HTML",
    "BJS_PROLOGUE",
    "COLOR_DETAIL",
    "ENUM_DETAIL",
    "GALLERY_PAGE",
    "JINJA_DETAIL",
    "MODEL_DETAIL",
    "OPTIONS_DETAIL",
    "PALETTE_DETAIL",
    "PALETTE_GROUP_DETAIL",
    "PROP_DETAIL",
    "SETTINGS_DETAIL",
    "SRI_TABLE",
)

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_templates_path = join(dirname(__file__), "_templates")

_env = Environment(loader=FileSystemLoader(_templates_path))

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

BJS_PROLOGUE = _env.get_template("bokehjs_content_prologue.html")
BJS_EPILOGUE = _env.get_template("bokehjs_content_epilogue.html")

BJS_CODEPEN_INIT = _env.get_template("bokehjs_codepen_init.html")
BJS_HTML = _env.get_template("bokehjs_html_template.html")

COLOR_DETAIL = _env.get_template("color_detail.html")

ENUM_DETAIL = _env.get_template("enum_detail.rst")

EXAMPLE_METADATA = _env.get_template("example_metadata.rst")

GALLERY_PAGE = _env.get_template("gallery_page.rst")
GALLERY_DETAIL = _env.get_template("gallery_detail.rst")

JINJA_DETAIL = _env.get_template("jinja_detail.rst")

MODEL_DETAIL = _env.get_template("model_detail.rst")

OPTIONS_DETAIL = _env.get_template("options_detail.rst")

PALETTE_DETAIL = _env.get_template("palette_detail.html")

PALETTE_GROUP_DETAIL = _env.get_template("palette_group_detail.html")

PROP_DETAIL = _env.get_template("prop_detail.rst")

SETTINGS_DETAIL = _env.get_template("settings_detail.rst")

SRI_TABLE = _env.get_template("sri_table.html")

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
