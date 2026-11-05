from __future__ import annotations

from types import SimpleNamespace
from typing import Any, cast

import pytest

from bokeh.sphinxext._internal.bokeh_autodoc import (
    _cache_python_domain_fuzzy_lookups,
    _canonicalize_model_source_links,
    _prune_empty_viewcode_modules,
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


@pytest.mark.parametrize("refname", ["bokeh.models", "bokeh.models.formatters"])
def test_model_source_links_use_individual_inventory_anchors(refname: str) -> None:
    modname = "bokeh.models.formatters"
    used = {"TickFormatter": "model-page", "RELATIVE_DATETIME_CONTEXT": "module-page"}
    objects = {
        "bokeh.models.TickFormatter": SimpleNamespace(docname="model-page", node_id="bokeh.models.TickFormatter"),
        f"{modname}.RELATIVE_DATETIME_CONTEXT": SimpleNamespace(docname="module-page", node_id=f"{modname}.RELATIVE_DATETIME_CONTEXT"),
    }
    env = SimpleNamespace(_viewcode_modules={modname: ("source", {}, used, refname)}, domains={"py": SimpleNamespace(objects=objects)})
    app = SimpleNamespace(builder=SimpleNamespace(env=env, get_relative_uri=lambda source, target: target))
    body = "\n".join(f'<a class="viewcode-back" href="{docname}#{refname}.{name}">[docs]</a>' for name, docname in used.items())
    context = {"body": body}
    _canonicalize_model_source_links(app, "_modules/bokeh/models/formatters", "page.html", context, None)
    assert context["body"] == (
        '<a class="viewcode-back" href="model-page#bokeh.models.TickFormatter">[docs]</a>\n'
        '<a class="viewcode-back" href="module-page#bokeh.models.formatters.RELATIVE_DATETIME_CONTEXT">[docs]</a>'
    )


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
