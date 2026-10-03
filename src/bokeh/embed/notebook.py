#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Notebook host adapter for shared embed results.

Notebook output deliberately has no private document envelope or browser
rendering path. Both static and live initial state are ordinary
``EmbedResult`` values. The only distinction is whether canonical IDs are
retained for a later patch protocol.
"""

from __future__ import annotations

# Standard library imports
from collections.abc import Mapping, Sequence
from typing import TYPE_CHECKING

# Bokeh imports
from ._util import (
    ThemePolicy,
    ThemeSource,
    embed,
    embed_protocol,
)
from .result import EmbedResult

if TYPE_CHECKING:
    from ..document import Document
    from ..model import Model
    from .renderers import EmbedFragment

__all__ = ("notebook_content",)


type NotebookContent = Model | Document | Sequence[Model | Document] | Mapping[str, Model | Document]


def notebook_content(content: NotebookContent, *, theme: ThemeSource = ThemePolicy.CURDOC,
        live: bool = False) -> tuple[EmbedResult, EmbedFragment]:
    """Build notebook content and its host-owned fragment.

    ``live=True`` retains protocol-visible model IDs so comm patches address
    the same graph. Static content uses graph-minimal identifiers. The returned
    pair contains the versioned result and an HTML fragment that declares its
    targets but deliberately resolves no resources. A notebook frontend owns
    one explicit, shared resource policy for all displays, creates the
    :class:`BokehMount`, and disposes it when the output is released.

    This function does not create a comm, register a frontend view, or retain a
    document. Those are host lifecycle responsibilities layered on the same
    embed result and mount contracts used by other embedding consumers.
    """
    embed_fn = embed_protocol if live else embed
    result = embed_fn(content, theme=theme)
    return result, result.fragment(resources="none")
