from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from docutils import nodes

from bokeh.sphinxext._internal.bokeh_sampledata_xref import (
    gallery_xrefs,
    merge_gallery_xrefs,
    merge_xrefs,
    process_gallery_overview,
)


def test_gallery_merge_only_uses_worker_documents() -> None:
    existing = {"docname": "examples/apple"}
    current = {"docname": "examples/avocado"}
    env = SimpleNamespace(all_gallery_overview=[existing])
    other = SimpleNamespace(all_gallery_overview=[existing, current])
    merge_gallery_xrefs(None, env, ["examples/avocado"], other)
    assert env.all_gallery_overview == [existing, current]


def test_sampledata_merge_only_uses_worker_documents() -> None:
    existing = {"docname": "examples/apple", "keyword": "iris"}
    current = {"docname": "examples/avocado", "keyword": "iris"}
    env = SimpleNamespace(all_sampledata_xrefs=[existing])
    other = SimpleNamespace(all_sampledata_xrefs=[existing, current])
    merge_xrefs(None, env, ["examples/avocado"], other)
    assert env.all_sampledata_xrefs == [existing, current]


def test_duplicate_gallery_records_do_not_discard_other_examples() -> None:
    apple = {"docname": "examples/apple"}
    avocado = {"docname": "examples/avocado"}
    env = SimpleNamespace(all_gallery_overview=[apple, avocado, apple, avocado])
    builder = SimpleNamespace(env=env, get_relative_uri=lambda source, target: target)
    tree = nodes.container()
    tree += gallery_xrefs("", subfolder="all")
    process_gallery_overview(SimpleNamespace(builder=builder), tree, "index")
    links: list[Any] = list(tree.findall(nodes.reference))
    assert [link["refuri"] for link in links] == ["examples/apple", "examples/avocado"]
