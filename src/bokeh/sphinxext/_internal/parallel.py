# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Resolve and index HTML pages in write workers when supported."""
from __future__ import annotations

from copy import copy
from types import MethodType
from typing import Any

from sphinx.builders import _write_docname
from sphinx.builders.html import StandaloneHTMLBuilder
from sphinx.errors import ExtensionError
from sphinx.search import IndexBuilder
from sphinx.util import logging
from sphinx.util.display import status_iterator
from sphinx.util.parallel import ParallelTasks, make_chunks

log = logging.getLogger(__name__)

_SEARCH_DOCUMENT_MAPS = ("_titles", "_filenames", "_all_titles", "_index_entries")
_SEARCH_TERM_MAPS = ("_mapping", "_title_mapping")
_FUZZY_COUNTERS = ("calls", "contextual", "fallbacks", "computed", "elapsed")


def _enable_parallel_write(app: Any, builder: Any) -> None:
    if app.config.bokeh_parallel_write and type(builder) is StandaloneHTMLBuilder and app.parallel > 1 and builder.parallel_ok:
        setattr(builder, "_bokeh_original_write_parallel", builder._write_parallel)
        setattr(builder, "_write_parallel", MethodType(_write_parallel, builder))


def _restore_parallel_write(app: Any, exception: Exception | None) -> None:
    builder = app.builder
    if hasattr(builder, "_bokeh_original_write_parallel"):
        builder._write_parallel = builder._bokeh_original_write_parallel
        del builder._bokeh_original_write_parallel


def _write_parallel(builder: Any, docnames: list[str], nproc: int) -> None:
    if builder.indexer is not None and type(builder.indexer) is not IndexBuilder:
        raise ExtensionError("bokeh_parallel_write requires the standard Sphinx search indexer")

    # Match Sphinx's template/cache warmup, keeping the first page in the parent.
    _write_docname(docnames[0], env=builder.env, builder=builder, tags=builder.tags)
    # The parent now only merges results, so all requested CPUs can write pages.
    nproc += 1
    chunks = make_chunks(docnames[1:], nproc)
    tasks = ParallelTasks(nproc)
    results: dict[int, Any] = {}
    progress = status_iterator(chunks, "writing output in workers... ", "darkgreen", len(chunks), builder.config.verbosity)

    def write_process(docs: list[str]) -> dict[str, Any]:
        indexer = builder.indexer
        if indexer is not None:
            # Never return the parent's retained pages or earlier batch results.
            indexer = builder.indexer = copy(indexer)
            for attr in (*_SEARCH_DOCUMENT_MAPS, *_SEARCH_TERM_MAPS):
                setattr(indexer, attr, {})
        builder.images = {}
        image_keys = set(builder.env.images)
        profile = getattr(builder._app, "_bokeh_docs_profile", None)
        resolve_start = len(profile.resolve_timings) if profile is not None else 0
        search_start = len(profile.serialize_timings) if profile is not None else 0
        fuzzy = getattr(builder, "_bokeh_python_fuzzy_lookup_stats", None)
        fuzzy_before = {attr: getattr(fuzzy, attr) for attr in _FUZZY_COUNTERS} if fuzzy is not None else {}

        for docname in docs:
            _write_docname(docname, env=builder.env, builder=builder, tags=builder.tags)
        # Ordinary HTML images are registered during reading. Custom transforms
        # that register new images need an asset-registration merge protocol.
        if set(builder.env.images) != image_keys:
            raise ExtensionError("bokeh_parallel_write does not support images registered during resolution")

        return dict(
            search={attr: getattr(indexer, attr) for attr in (*_SEARCH_DOCUMENT_MAPS, *_SEARCH_TERM_MAPS)} if indexer is not None else {},
            images=builder.images,
            resolve=profile.resolve_timings[resolve_start:] if profile is not None else [],
            serialize=profile.serialize_timings[search_start:] if profile is not None else [],
            fuzzy={attr: getattr(fuzzy, attr) - value for attr, value in fuzzy_before.items()},
        )

    def on_done(batch: tuple[int, list[str]], result: Any) -> None:
        results[batch[0]] = result
        next(progress)

    try:
        for number, chunk in enumerate(chunks):
            # Pass only names through the task queue, not large resolved trees.
            tasks.add_task(lambda batch: write_process(batch[1]), (number, chunk), on_done)
        tasks.join()
    finally:
        tasks.terminate()
    if len(results) != len(chunks):
        raise ExtensionError("bokeh_parallel_write did not receive every worker result")

    # Completion order is nondeterministic; index insertion order need not be.
    profile = getattr(builder._app, "_bokeh_docs_profile", None)
    fuzzy = getattr(builder, "_bokeh_python_fuzzy_lookup_stats", None)
    for number in range(len(chunks)):
        result = results[number]
        if builder.indexer is not None:
            for attr in _SEARCH_DOCUMENT_MAPS:
                getattr(builder.indexer, attr).update(result["search"][attr])
            for attr in _SEARCH_TERM_MAPS:
                mapping = getattr(builder.indexer, attr)
                for word, docs in result["search"][attr].items():
                    mapping.setdefault(word, set()).update(docs)
        builder.images.update(result["images"])
        if profile is not None:
            profile.resolve_timings.extend(result["resolve"])
            profile.serialize_timings.extend(result["serialize"])
        for attr, value in result["fuzzy"].items():
            setattr(fuzzy, attr, getattr(fuzzy, attr) + value)
    log.info("Bokeh parallel writing: batches=%d documents=%d workers=%d", len(chunks), len(docnames), nproc)
