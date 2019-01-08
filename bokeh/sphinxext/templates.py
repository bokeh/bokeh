#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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

# External imports
from jinja2 import Environment, PackageLoader

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CCB_PROLOGUE',
    'CCB_EPILOGUE',
    'COLOR_DETAIL',
    'ENUM_DETAIL',
    'GALLERY_PAGE',
    'JINJA_DETAIL',
    'MODEL_DETAIL',
    'OPTIONS_DETAIL',
    'PALETTE_DETAIL',
    'PALETTE_GROUP_DETAIL',
    'PLOT_PAGE',
    'PROP_DETAIL',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_env = Environment(loader=PackageLoader('bokeh.sphinxext', '_templates'))

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

CCB_PROLOGUE = _env.get_template("collapsible_code_block_prologue.html")
CCB_EPILOGUE = _env.get_template("collapsible_code_block_epilogue.html")

COLOR_DETAIL = _env.get_template("color_detail.html")

ENUM_DETAIL = _env.get_template("enum_detail.rst")

GALLERY_PAGE = _env.get_template("gallery_page.rst")

JINJA_DETAIL = _env.get_template("jinja_detail.rst")

MODEL_DETAIL = _env.get_template("model_detail.rst")

OPTIONS_DETAIL = _env.get_template("options_detail.rst")

PALETTE_DETAIL = _env.get_template("palette_detail.html")

PALETTE_GROUP_DETAIL = _env.get_template("palette_group_detail.html")

PLOT_PAGE = _env.get_template("plot_page.rst")

PROP_DETAIL = _env.get_template("prop_detail.rst")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
