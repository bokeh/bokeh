#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import abspath
from typing import Tuple
from warnings import warn

# External imports
from jinja2 import Template

# Bokeh imports
from ..core.templates import FILE
from ..core.types import PathLike
from ..models.layouts import LayoutDOM
from ..resources import Resources, ResourcesLike
from ..settings import settings
from ..themes import Theme
from .state import State, curstate
from .util import default_filename

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_TITLE = "Bokeh Plot"

__all__ = (
    'save',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def save(obj: LayoutDOM, filename: PathLike | None = None, resources: ResourcesLike | None = None,
        title: str | None = None, template: Template | None = None, state: State | None = None) -> str:
    ''' Save an HTML file with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``filename``, ``resources``, or ``title`` if they
    are not provided. If the filename is not given and not provided via output state,
    it is derived from the script name (e.g. ``/foo/myplot.py`` will create
    ``/foo/myplot.html``)

    Args:
        obj (LayoutDOM object) : a Layout (Row/Column), Plot or Widget object to display

        filename (PathLike, e.g. str, Path, optional) : filename to save document under (default: None)
            If None, use the default state configuration.

        resources (Resources or ResourcesMode, optional) : A Resources config to use (default: None)
            If None, use the default state configuration, if there is one.
            otherwise use ``resources.INLINE``.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use the default state title value, if there is one.
            Otherwise, use "Bokeh Plot"

        template (Template, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.core.templates.FILE for the required template
            parameters

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

    Returns:
        str: the filename where the HTML file is saved.

    '''

    if state is None:
        state = curstate()

    theme = state.document.theme

    filename, resources, title = _get_save_args(state, filename, resources, title)
    _save_helper(obj, filename, resources, title, template, theme)
    return abspath(filename)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _get_save_args(state: State, filename: PathLike | None, resources: ResourcesLike | None,
        title: str | None) -> Tuple[PathLike, Resources, str]:
    '''

    '''
    filename, is_default_filename = _get_save_filename(state, filename)

    resources = _get_save_resources(state, resources, is_default_filename)

    title = _get_save_title(state, title, is_default_filename)

    return filename, resources, title

def _get_save_filename(state: State, filename: PathLike | None) -> Tuple[PathLike, bool]:
    if filename is not None:
        return filename, False

    if state.file and not settings.ignore_filename():
        return state.file.filename, False

    return default_filename("html"), True

def _get_save_resources(state: State, resources: ResourcesLike | None, suppress_warning: bool) -> Resources:
    if resources is not None:
        if isinstance(resources, Resources):
            return resources
        else:
            return Resources(mode=resources)

    if state.file:
        return state.file.resources

    if not suppress_warning:
        warn("save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN")

    return Resources(mode=settings.resources())

def _get_save_title(state: State, title: str | None, suppress_warning: bool) -> str:
    if title is not None:
        return title

    if state.file:
        return state.file.title

    if not suppress_warning:
        warn("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'")

    return DEFAULT_TITLE

def _save_helper(obj: LayoutDOM, filename: PathLike, resources: Resources | None,
        title: str | None, template: Template | None, theme: Theme | None = None) -> None:
    '''

    '''
    from ..embed import file_html
    html = file_html(obj, resources, title=title, template=template or FILE, theme=theme)

    with open(filename, mode="w", encoding="utf-8") as f:
        f.write(html)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
