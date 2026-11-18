from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from docutils import nodes

from bokeh.sphinxext._internal.bokeh_sampledata_xref import (
    merge_xrefs,
    process_sampledata_xrefs,
    sampledata_list,
)


def test_sampledata_merge_only_uses_worker_documents() -> None:
    existing = {"docname": "examples/apple", "keyword": "iris"}
    current = {"docname": "examples/avocado", "keyword": "iris"}
    env = SimpleNamespace(all_sampledata_xrefs=[existing])
    other = SimpleNamespace(all_sampledata_xrefs=[existing, current])
    merge_xrefs(None, env, ["examples/avocado"], other)
    assert env.all_sampledata_xrefs == [existing, current]


def test_sampledata_backlinks_sort_and_disambiguate_names() -> None:
    scatter = {"docname": "examples/basic/scatter", "keyword": "iris"}
    other_scatter = {"docname": "examples/models/scatter", "keyword": "iris"}
    bars = {"docname": "examples/plotting/bars", "keyword": "iris"}
    flowers = {"docname": "examples/plotting/flowers", "keyword": "flowers"}
    env = SimpleNamespace(all_sampledata_xrefs=[scatter, flowers, other_scatter, bars, scatter, bars])
    builder = SimpleNamespace(env=env, get_relative_uri=lambda source, target: target)
    tree = nodes.container()
    tree += sampledata_list("", sampledata_key="iris")
    process_sampledata_xrefs(SimpleNamespace(builder=builder), tree, "index")
    links: list[Any] = list(tree.findall(nodes.reference))
    assert [(link.astext(), link["refuri"]) for link in links] == [
        ("bars", bars["docname"]),
        ("scatter", scatter["docname"]),
        ("scatter (models)", other_scatter["docname"]),
    ]
