#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

# Bokeh imports
from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div, GlyphRenderer
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

pytestmark = pytest.mark.free_threading

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_independent_documents_can_be_built_concurrently(constructor) -> None:
    workers = 8
    rounds = 5
    barrier = Barrier(workers)

    def build_documents(worker: int) -> list[frozenset[str]]:
        document_model_ids: list[frozenset[str]] = []

        for iteration in range(rounds):
            barrier.wait(timeout=10)
            value = worker * rounds + iteration
            data = constructor({"x": [value, value + 1], "y": [value + 2, value + 3]})
            source = ColumnDataSource(data, name=f"source-{value}")
            plot = figure(name=f"plot-{value}", title=f"initial-{value}")
            renderer = plot.scatter(x="x", y="y", source=source, name=f"renderer-{value}")
            status = Div(text=f"worker-{worker}", name=f"status-{value}")

            doc = Document(title=f"document-{value}")
            doc.add_root(column(plot, status, name=f"layout-{value}"))
            changes = []
            doc.on_change(changes.append)

            # Keep construction and mutation/serialization concurrent in every round.
            barrier.wait(timeout=10)

            new_data = {name: [value] for name in source.data}
            new_data.update(x=[value + 4], y=[value + 5])
            source.stream(new_data)
            source.patch({"y": [(0, value + 6)]})
            source.selected.indices = [1]
            plot.title.text = f"updated-{value}"

            assert len(changes) >= 4
            assert doc.get_model_by_name(source.name) is source
            assert doc.get_model_by_name(renderer.name) is renderer
            assert all(model.document is doc for model in doc.models)
            doc.validate()

            model_ids = frozenset(model.id for model in doc.models)
            copy = Document.from_json(doc.to_json())
            copied_source = copy.get_model_by_name(source.name)
            copied_renderer = copy.get_model_by_name(renderer.name)
            copied_status = copy.get_model_by_name(status.name)

            assert isinstance(copied_source, ColumnDataSource)
            assert isinstance(copied_renderer, GlyphRenderer)
            assert isinstance(copied_status, Div)
            assert copied_renderer.data_source is copied_source
            assert copied_status.text == f"worker-{worker}"
            assert list(copied_source.data["x"]) == [value, value + 1, value + 4]
            assert list(copied_source.data["y"]) == [value + 6, value + 3, value + 5]
            assert copied_source.selected.indices == [1]
            assert copy.title == doc.title
            assert frozenset(model.id for model in copy.models) == model_ids
            assert all(model.document is copy for model in copy.models)
            copy.validate()

            document_model_ids.append(model_ids)

        return document_model_ids

    # Independent documents are supported across threads; shared document mutation is not.
    with ThreadPoolExecutor(max_workers=workers) as executor:
        model_id_sets = [model_ids for ids in executor.map(build_documents, range(workers)) for model_ids in ids]

    assert len(model_id_sets) == workers * rounds
    assert len(set().union(*model_id_sets)) == sum(map(len, model_id_sets))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
