#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Migration errors for the removed render-item embedding helpers.'''

from __future__ import annotations

# Standard library imports
from typing import Any, NoReturn

# Bokeh imports
from .standalone import EmbedMigrationError

__all__ = (
    'div_for_render_item',
    'html_page_for_render_items',
    'script_for_render_items',
)


def _removed(name: str) -> NoReturn:
    raise EmbedMigrationError(
        f"{name}() and RenderItem were removed in Bokeh 4.0. "
        "Compile an EmbedArtifact with bokeh.embed.embed() and use its typed page() or fragment() renderer.",
    )


def div_for_render_item(*args: Any, **kwargs: Any) -> NoReturn:
    del args, kwargs
    _removed("div_for_render_item")


def html_page_for_render_items(*args: Any, **kwargs: Any) -> NoReturn:
    del args, kwargs
    _removed("html_page_for_render_items")


def script_for_render_items(*args: Any, **kwargs: Any) -> NoReturn:
    del args, kwargs
    _removed("script_for_render_items")
