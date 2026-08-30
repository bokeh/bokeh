from __future__ import annotations

# Standard library imports
from types import SimpleNamespace
from typing import Any, cast

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_autodoc import (
    _cache_python_domain_fuzzy_lookups,
    _DocsProfile,
    _prune_empty_viewcode_modules,
    _start_docs_write,
)


def test_prune_empty_viewcode_modules() -> None:
    used = ("source", {}, {"function": "docname"}, "module")
    empty = ("source", {}, {}, "module")
    env = SimpleNamespace(_viewcode_modules={
        "used": used,
        "empty": empty,
        "unavailable": False,
    })

    _prune_empty_viewcode_modules(None, cast(Any, env))

    assert env._viewcode_modules == {
        "used": used,
        "unavailable": False,
    }


def test_prune_empty_viewcode_modules_without_viewcode() -> None:
    env = SimpleNamespace()

    _prune_empty_viewcode_modules(None, cast(Any, env))


def test_cache_python_domain_fuzzy_lookups() -> None:
    calls = []
    contextual = SimpleNamespace(objtype="class")
    fallback = SimpleNamespace(objtype="class")

    def find_obj(*args: Any) -> list[tuple[str, Any]]:
        calls.append(args)
        return [(f"other.{args[3]}", fallback)]

    domain = SimpleNamespace(
        find_obj=find_obj,
        objects={"module.Class.target": contextual},
        object_types={"class": object()},
        objtypes_for_role=lambda role: [role],
    )
    env = SimpleNamespace(domains={"py": domain})
    builder = SimpleNamespace(env=env)

    _cache_python_domain_fuzzy_lookups(None, cast(Any, builder))

    first = domain.find_obj(env, "module", "Class", "target", "class", 1)
    second = domain.find_obj(env, "module", "Class", "target", "class", 1)

    assert first == second == [("module.Class.target", contextual)]
    assert first is not second
    assert len(calls) == 0

    first = domain.find_obj(env, "module", "Class", "suffix", "class", 1)
    second = domain.find_obj(env, "other", "Context", "suffix", "class", 1)

    assert first == second == [("other.suffix", fallback)]
    assert first is not second
    assert len(calls) == 1
    assert calls[0][1:3] == (None, None)

    domain.find_obj(env, "module", "Class", "target", "class", 0)
    domain.find_obj(SimpleNamespace(), "module", "Class", "target", "class", 1)

    assert len(calls) == 3
    stats = builder._bokeh_python_fuzzy_lookup_stats
    assert stats.calls == 4
    assert stats.contextual == 2
    assert stats.fallbacks == 2
    assert stats.computed == 1
    assert stats.elapsed >= 0


def test_start_docs_write_times_main_process_operations() -> None:
    calls = []

    def resolve(docname: str, value: int) -> tuple[str, int]:
        calls.append(("resolve", docname, value))
        return docname, value

    def serialize(docname: str, value: int) -> tuple[str, int]:
        calls.append(("serialize", docname, value))
        return docname, value

    env = SimpleNamespace(get_and_resolve_doctree=resolve)
    builder = SimpleNamespace(env=env, write_doc_serialized=serialize)
    app = SimpleNamespace(_bokeh_docs_profile=_DocsProfile(started=0.0))

    _start_docs_write(cast(Any, app), cast(Any, builder))

    assert env.get_and_resolve_doctree("document", 1) == ("document", 1)
    assert builder.write_doc_serialized("document", 2) == ("document", 2)
    assert calls == [
        ("resolve", "document", 1),
        ("serialize", "document", 2),
    ]
    assert app._bokeh_docs_profile.resolve_timings[0].docname == "document"
    assert app._bokeh_docs_profile.serialize_timings[0].docname == "document"
