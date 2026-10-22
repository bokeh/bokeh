# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Customize the Bokeh documentation table of contents."""

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
from copy import copy
from typing import Any

# External imports
from docutils import nodes
from sphinx import addnodes
from sphinx.environment import BuildEnvironment
from sphinx.environment.adapters import toctree

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_REFERENCE_DOC_PREFIX = "docs/reference/"

_titles_only_envs: dict[BuildEnvironment, BuildEnvironment] = {}
_original_entries: Any = None


def _cache_titles_only_tocs(app: Any, builder: Any) -> None:
    """Avoid copying member headings that titles-only navigation discards."""
    global _original_entries

    # Older Sphinx versions implement this operation inside a closure.
    if not hasattr(toctree, "_entries_from_toctree"):
        return

    env = builder.env
    navigation_env = copy(env)
    navigation_env.tocs = {}
    for docname, toc in env.tocs.items():
        # Sphinx applies tocdepth and conditional tags before stripping headings.
        # Retain its original ordering for trees where those affect sub-toctrees.
        if env.metadata[docname].get("tocdepth", 0) or any(toc.findall(addnodes.only)):
            navigation_env.tocs[docname] = toc
            continue

        reduced = toc.deepcopy()
        for top_level in reduced.children:
            if len(top_level) > 1:
                if subtrees := list(top_level.findall(addnodes.toctree)):
                    top_level[1][:] = subtrees
                else:
                    top_level.pop(1)
        navigation_env.tocs[docname] = reduced

    _titles_only_envs[env] = navigation_env
    if _original_entries is None:
        _original_entries = toctree._entries_from_toctree
        toctree._entries_from_toctree = _titles_only_entries


def _titles_only_entries(env: BuildEnvironment, prune: bool, titles_only: bool, *args: Any, **kwargs: Any) -> Any:
    if titles_only:
        env = _titles_only_envs.get(env, env)
    return _original_entries(env, prune, titles_only, *args, **kwargs)


def _clear_titles_only_tocs(app: Any, exception: Exception | None) -> None:
    """Keep the cache out of saved environments and later builds."""
    global _original_entries

    _titles_only_envs.pop(app.env, None)
    if not _titles_only_envs and getattr(toctree, "_entries_from_toctree", None) is _titles_only_entries:
        toctree._entries_from_toctree = _original_entries
        _original_entries = None


def _shorten_reference_toc_titles(app: object, env: BuildEnvironment) -> None:
    """Use the final component of qualified Bokeh module titles in navigation."""
    for docname, toc in env.tocs.items():
        if not docname.startswith(_REFERENCE_DOC_PREFIX):
            continue

        for reference in toc.findall(nodes.reference):
            if reference.get("refuri") != docname or reference.get("anchorname"):
                continue

            title = reference.astext()
            if title.startswith("bokeh."):
                reference.children[:] = [nodes.Text(title.rsplit(".", maxsplit=1)[-1])]
            break

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
