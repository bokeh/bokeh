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

from sphinx.util import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from time import perf_counter
from typing import Any

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
from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_toc import _shorten_reference_toc_titles

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
    def can_document_member(cls, member: Any, membername: str, isattr: bool, parent: Any) -> bool:
        return isinstance(member, Color)

    # We don't need/want anything from the actual NamedColor class
    def add_content(self, more_content: Any, no_docstring: bool = False) -> None:
        pass

    def get_object_members(self, want_all: bool) -> tuple[bool, list[Any]]:
        return False, []


class EnumDocumenter(ModuleLevelDocumenter):
    directivetype = "bokeh-enum"
    objtype = "enum"
    priority = 20

    @classmethod
    def can_document_member(cls, member: Any, membername: str, isattr: bool, parent: Any) -> bool:
        return isinstance(member, Enumeration)

    # Override the Sphinx default `Documenter.get_object_members()`
    # which is deprecated, and will soon be removed.
    # Ref: https://github.com/bokeh/bokeh/issues/12462
    def get_object_members(self, want_all: bool) -> tuple[bool, list[Any]]:
        return False, []


class PropDocumenter(AttributeDocumenter):
    directivetype = "bokeh-prop"
    objtype = "prop"
    priority = 20
    member_order = -100  # This puts properties first in the docs

    @classmethod
    def can_document_member(cls, member: Any, membername: str, isattr: bool, parent: Any) -> bool:
        return isinstance(member, PropertyDescriptor)


class ModelDocumenter(ClassDocumenter):
    directivetype = "bokeh-model"
    objtype = "model"
    priority = 20

    @classmethod
    def can_document_member(cls, member: Any, membername: str, isattr: bool, parent: Any) -> bool:
        return isinstance(member, type) and issubclass(member, Model)


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_autodocumenter(ColorDocumenter)
    app.add_autodocumenter(EnumDocumenter)
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)
    app.connect("builder-inited", _start_docs_profile, priority=999)
    app.connect("env-before-read-docs", _start_docs_read)
    app.connect("env-updated", _shorten_reference_toc_titles)
    app.connect("env-updated", _prune_empty_viewcode_modules)
    app.connect("env-updated", _finish_docs_read, priority=999)
    app.connect("write-started", _start_docs_write, priority=100)
    app.connect("write-started", _cache_python_domain_fuzzy_lookups, priority=999)
    app.connect("build-finished", _log_docs_profile, priority=999)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_PROFILE_ATTR = "_bokeh_docs_profile"
_FUZZY_LOOKUP_STATS_ATTR = "_bokeh_python_fuzzy_lookup_stats"


def _start_docs_profile(app: Any) -> None:
    setattr(app, _PROFILE_ATTR, {"started": perf_counter()})


def _start_docs_read(app: Any, env: Any, docnames: list[str]) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile.update(read_started=perf_counter(), documents=len(docnames))


def _finish_docs_read(app: Any, env: Any) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile["read_finished"] = perf_counter()


def _start_docs_write(app: Any, builder: Any) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile["write_started"] = perf_counter()
        profile["resolve_timings"] = []
        profile["serialize_timings"] = []

        resolve_doctree = builder.env.get_and_resolve_doctree

        def timed_resolve_doctree(docname: str, *args: Any, **kwargs: Any) -> Any:
            started = perf_counter()
            try:
                return resolve_doctree(docname, *args, **kwargs)
            finally:
                profile["resolve_timings"].append((perf_counter() - started, docname))

        builder.env.get_and_resolve_doctree = timed_resolve_doctree

        write_serialized = builder.write_doc_serialized

        def timed_write_serialized(docname: str, *args: Any, **kwargs: Any) -> Any:
            started = perf_counter()
            try:
                return write_serialized(docname, *args, **kwargs)
            finally:
                profile["serialize_timings"].append((perf_counter() - started, docname))

        builder.write_doc_serialized = timed_write_serialized


def _log_docs_profile(app: Any, exception: Exception | None) -> None:
    finished = perf_counter()
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None and all(
        key in profile
        for key in ("started", "read_started", "read_finished", "write_started")
    ):
        log.info(
            "Bokeh Sphinx timings: read=%.3fs prepare=%.3fs write=%.3fs total=%.3fs documents=%d workers=%d",
            profile["read_finished"] - profile["read_started"],
            profile["write_started"] - profile["read_finished"],
            finished - profile["write_started"],
            finished - profile["started"],
            profile["documents"],
            app.parallel,
        )

        resolve_timings = profile["resolve_timings"]
        log.info(
            "Bokeh doctree resolution: documents=%d total=%.3fs",
            len(resolve_timings),
            sum(item[0] for item in resolve_timings),
        )
        for duration, docname in sorted(resolve_timings, reverse=True)[:5]:
            log.info("Bokeh doctree slow: %.3fs %s", duration, docname)

        serialize_timings = profile["serialize_timings"]
        log.info(
            "Bokeh search-index serialization: documents=%d total=%.3fs",
            len(serialize_timings),
            sum(item[0] for item in serialize_timings),
        )

    stats = getattr(app.builder, _FUZZY_LOOKUP_STATS_ATTR, None)
    if stats is not None:
        reused = stats["fallbacks"] - stats["computed"]
        reuse_percent = 100 * reused / stats["fallbacks"] if stats["fallbacks"] else 0
        log.info(
            "Bokeh Python fuzzy lookups: calls=%d contextual=%d suffix-computed=%d suffix-reused=%d (%.1f%%) compute=%.3fs",
            stats["calls"],
            stats["contextual"],
            stats["computed"],
            reused,
            reuse_percent,
            stats["elapsed"],
        )


def _prune_empty_viewcode_modules(app: Any, env: Any) -> None:
    """Remove unused module entries retained by parallel viewcode merges."""
    modules = getattr(env, "_viewcode_modules", None)
    if modules is None:
        return

    # Sphinx removes these entries while purging serial builds, but its worker
    # merge can retain entries whose documented members were removed elsewhere.
    for name, entry in list(modules.items()):
        if entry and not entry[2]:
            del modules[name]


def _cache_python_domain_fuzzy_lookups(app: Any, builder: Any) -> None:
    """Cache fuzzy Python-domain lookups once the object inventory is final."""
    domain = builder.env.domains.get("py")
    if domain is None:
        return

    find_obj = domain.find_obj
    fallback_cache: dict[tuple[str, str | None], tuple[Any, ...]] = {}
    objtypes_cache: dict[str | None, list[str] | None] = {}
    stats = {"calls": 0, "contextual": 0, "fallbacks": 0, "computed": 0, "elapsed": 0.0}
    setattr(builder, _FUZZY_LOOKUP_STATS_ATTR, stats)

    def cached_find_obj(
        env: Any,
        modname: str | None,
        classname: str | None,
        name: str,
        objtype: str | None,
        searchmode: int = 0,
    ) -> Any:
        # Exact lookups are already constant-time. Fuzzy lookups scan every
        # Python object, so repeated misses for common annotations are costly.
        if env is not builder.env or searchmode != 1:
            return find_obj(env, modname, classname, name, objtype, searchmode)

        stats["calls"] += 1
        name = name.removesuffix("()")
        if not name:
            return []

        try:
            objtypes = objtypes_cache[objtype]
        except KeyError:
            objtypes = list(domain.object_types) if objtype is None else domain.objtypes_for_role(objtype)
            objtypes_cache[objtype] = objtypes

        if objtypes is None:
            return []

        candidates = (
            f"{modname}.{classname}.{name}" if modname and classname else None,
            f"{modname}.{name}" if modname else None,
            name,
        )
        for candidate in candidates:
            entry = domain.objects.get(candidate)
            if entry is not None and entry.objtype in objtypes:
                stats["contextual"] += 1
                return [(candidate, entry)]

        stats["fallbacks"] += 1
        key = (name, objtype)
        try:
            return list(fallback_cache[key])
        except KeyError:
            started = perf_counter()
            result = find_obj(env, None, None, name, objtype, searchmode)
            stats["elapsed"] += perf_counter() - started
            stats["computed"] += 1
            fallback_cache[key] = tuple(result)
            return result

    domain.find_obj = cached_find_obj

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
