#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide Jinja2 templates used by Bokeh to embed Bokeh documents and
models in various ways.

.. bokeh-jinja:: bokeh.core.templates.AUTOLOAD_NB_JS
.. bokeh-jinja:: bokeh.core.templates.CSS_RESOURCES
.. bokeh-jinja:: bokeh.core.templates.DOC_NB_JS
.. bokeh-jinja:: bokeh.core.templates.FILE
.. bokeh-jinja:: bokeh.core.templates.JS_RESOURCES
.. bokeh-jinja:: bokeh.core.templates.NOTEBOOK_LOAD
.. bokeh-jinja:: bokeh.core.templates.ROOT_DIV
.. bokeh-jinja:: bokeh.core.templates.SCRIPT_TAG

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from functools import lru_cache
from os.path import dirname, join
from typing import Any, Callable

# External imports
from jinja2 import Environment, FileSystemLoader, Template

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "JS_RESOURCES",
    "CSS_RESOURCES",
    "SCRIPT_TAG",
    "ROOT_DIV",
    "DOC_NB_JS",
    "FILE",
    "MACROS",
    "NOTEBOOK_LOAD",
    "AUTOLOAD_NB_JS",
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@lru_cache(None)
def get_env() -> Environment:
    ''' Get the correct Jinja2 Environment, also for frozen scripts.
    '''
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        # PyInstaller uses _MEIPASS and only works with jinja2.FileSystemLoader
        templates_path = join(sys._MEIPASS, 'bokeh', 'core', '_templates')
    else:
        # Non-frozen Python and cx_Freeze can use __file__ directly
        templates_path = join(dirname(__file__), '_templates')

    return Environment(loader=FileSystemLoader(templates_path), trim_blocks=True, lstrip_blocks=True)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

JS_RESOURCES: Template
CSS_RESOURCES: Template
SCRIPT_TAG: Template
ROOT_DIV: Template
DOC_NB_JS: Template
FILE: Template
MACROS: Template
NOTEBOOK_LOAD: Template
AUTOLOAD_NB_JS: Template

_templates: dict[str, Callable[[], Template]] = dict(
    JS_RESOURCES=lambda: get_env().get_template("js_resources.html.jinja"),
    CSS_RESOURCES=lambda: get_env().get_template("css_resources.html.jinja"),
    SCRIPT_TAG=lambda: get_env().get_template("script_tag.html.jinja"),
    ROOT_DIV=lambda: get_env().get_template("root_div.html.jinja"),
    DOC_NB_JS=lambda: get_env().get_template("doc_nb_js.js.jinja"),
    FILE=lambda: get_env().get_template("file.html.jinja"),
    MACROS=lambda: get_env().get_template("macros.html.jinja"),
    NOTEBOOK_LOAD=lambda: get_env().get_template("notebook_load.html.jinja"),
    AUTOLOAD_NB_JS=lambda: get_env().get_template("autoload_nb_js.js.jinja"),
)

@lru_cache(None)
def __getattr__(name: str) -> Any:
    if name in _templates:
        return _templates[name]()
    raise AttributeError()
