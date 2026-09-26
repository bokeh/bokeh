#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from os.path import abspath, expanduser
from typing import TYPE_CHECKING

# External imports
from jinja2 import Template

# Bokeh imports
from ..core.templates import FILE
from ..resources import Resources
from .util import default_filename

if TYPE_CHECKING:
    from ..core.types import PathLike
    from ..embed.util import ThemeSource
    from .showing import Showable

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

def save(obj: Showable, filename: PathLike | None = None, resources: Resources | str | None = None,
        title: str | None = None, template: Template | str | None = None) -> str:
    ''' Save an HTML file with the data for the current document.

    If the filename is not given, it is derived from the script name (e.g.
    ``/foo/myplot.py`` will create ``/foo/myplot.html``).

    Args:
        obj (UIElement or DOMNode object) : a Layout (Row/Column), Plot or Widget object to display

        filename (PathLike, e.g. str, Path, optional) : filename to save document under (default: None)
            If None, derive the filename from the running script.

        resources (Resources or str, optional) : A resources configuration to use (default: None)
            If None, use the configured default resource policy.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use "Bokeh Plot".

        template (Template, str, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.core.templates.FILE for the required template
            parameters

    Returns:
        str: the filename where the HTML file is saved.

    '''

    filename, resources, title = _get_save_args(filename, resources, title)
    _save_helper(obj, filename, resources, title, template)
    return abspath(expanduser(filename))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _get_save_args(filename: PathLike | None, resources: Resources | str | None,
        title: str | None) -> tuple[PathLike, Resources, str]:
    '''

    '''
    return (
        filename if filename is not None else default_filename("html"),
        Resources.build(resources),
        title if title is not None else DEFAULT_TITLE,
    )

def _save_helper(obj: Showable, filename: PathLike, resources: Resources | str | None,
        title: str | None, template: Template | str | None, theme: ThemeSource | None = None) -> None:
    '''

    '''
    from ..embed import file_html
    html = file_html(obj, resources=resources, title=title, template=template or FILE, theme=theme)

    with open(filename, mode="w", encoding="utf-8") as f:
        f.write(html)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
