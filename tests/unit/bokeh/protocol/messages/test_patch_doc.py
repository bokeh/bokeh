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

# External imports
import numpy as np

# Bokeh imports
import bokeh.document as document
from bokeh.core.properties import Instance, Int, Nullable
from bokeh.document.events import (
    ColumnDataChangedEvent,
    ColumnsPatchedEvent,
    ColumnsStreamedEvent,
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
)
from bokeh.model import Model
from bokeh.models import (
    Bezier,
    BezierEdgePathProvider,
    ColumnDataSource,
    DataView,
    ForceDirectedLayoutProvider,
    GeometryDataSource,
    GlyphRenderer,
    GraphDataSource,
    GraphRenderer,
    GroupFilter,
    MultiLine,
    NormalHead,
    Scatter,
    Segment,
    StaticLayoutProvider,
)
from bokeh.models.graphics import PathDecoration
from bokeh.protocol import apply_patch, patch_doc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class AnotherModelInTestPatchDoc(Model):
    bar = Int(1)

class SomeModelInTestPatchDoc(Model):
    foo = Int(2)
    child = Nullable(Instance(Model))


class TestPatchDocument:
    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPatchDoc()
        doc.add_root(SomeModelInTestPatchDoc(child=another))
        doc.add_root(SomeModelInTestPatchDoc())
        doc.to_json() # clear new model queue
        return doc

    def test_create_then_apply_vectorized_decoration_inset(self) -> None:
        sample = document.Document()
        source = ColumnDataSource(data=dict(
            xs=[[0, 1]], ys=[[0, 1]], inset=[12], updated_inset=[18],
        ))
        renderer = GlyphRenderer(data_source=source, glyph=MultiLine())
        decoration = renderer.add_path_decoration(NormalHead(size=14), node="end", inset="inset",
        )
        sample.add_root(renderer)
        copy = document.Document.from_json(sample.to_json())
        copy_decoration = copy.get_model_by_id(decoration.id)
        assert isinstance(copy_decoration, PathDecoration)

        events = []
        sample.on_change(events.append)
        decoration.inset = "updated_inset"
        apply_patch(patch_doc(events), copy)

        assert copy_decoration.inset.field == "updated_inset"

    def test_create_no_events(self) -> None:
        with pytest.raises(ValueError):
            patch_doc([])

    def test_create_multiple_docs(self) -> None:
        sample1 = self._sample_doc()
        obj1 = next(iter(sample1.roots))
        event1 = ModelChangedEvent(sample1, obj1, 'foo', 42)

        sample2 = self._sample_doc()
        obj2 = next(iter(sample2.roots))
        event2 = ModelChangedEvent(sample2, obj2, 'foo', 42)
        with pytest.raises(ValueError):
            patch_doc([event1, event2])

    def test_create_model_changed(self) -> None:
        sample = self._sample_doc()
        obj = next(iter(sample.roots))
        event = ModelChangedEvent(sample, obj, 'foo', 42)
        patch_doc([event])

    def test_create_then_apply_model_changed(self) -> None:
        sample = self._sample_doc()

        foos = []
        for r in sample.roots:
            foos.append(r.foo)
        assert foos == [ 2, 2 ]

        obj = next(iter(sample.roots))
        assert obj.foo == 2
        event = ModelChangedEvent(sample, obj, 'foo', 42)
        msg = patch_doc([event])

        copy = document.Document.from_json(sample.to_json())
        apply_patch(msg, copy)

        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert foos == [ 2, 42 ]

    def test_create_then_apply_geometry_record_events(self) -> None:
        sample = document.Document()
        source = GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [0, 0]}, "name": "A"},
        ])
        sample.add_root(source)
        copy = document.Document.from_json(sample.to_json())
        copy_source = copy.get_model_by_id(source.id)
        assert isinstance(copy_source, GeometryDataSource)

        events = []
        sample.on_change(events.append)

        source.replace([
            {"geometry": {"type": "Point", "coordinates": [1, 1]}, "name": "B"},
        ])
        apply_patch(patch_doc(events), copy)
        assert copy_source.geometries == source.geometries
        assert copy_source.data == source.data

        events.clear()
        source.stream([
            {"geometry": {"type": "Point", "coordinates": [2, 2]}, "name": "C", "kind": "city"},
        ])
        apply_patch(patch_doc(events), copy)
        assert copy_source.geometries == source.geometries
        assert copy_source.data == source.data

        events.clear()
        source.patch({"geometry": [(0, {"type": "Point", "coordinates": [3, 3]})], "name": [(1, "D")]})
        apply_patch(patch_doc(events), copy)
        assert copy_source.geometries == source.geometries
        assert copy_source.data == source.data

        events.clear()
        source.replace({"geometries": [], "data": {"name": [], "kind": []}})
        apply_patch(patch_doc(events), copy)
        assert copy_source.geometries == []
        assert copy_source.data == {"name": [], "kind": []}

    def test_create_then_apply_data_view_events_with_geometry_source(self) -> None:
        sample = document.Document()
        source = GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [0, 0]}, "kind": "city"},
            {"geometry": {"type": "Point", "coordinates": [1, 1]}, "kind": "park"},
        ])
        group_filter = GroupFilter(field_name="kind", group="city")
        renderer = GlyphRenderer(
            data_source=source,
            view=DataView(filter=group_filter),
            glyph=Scatter(x="x", y="y"),
        )
        sample.add_root(renderer)

        copy = document.Document.from_json(sample.to_json())
        copy_filter = copy.get_model_by_id(group_filter.id)
        assert isinstance(copy_filter, GroupFilter)

        events = []
        sample.on_change(events.append)

        group_filter.group = "park"
        apply_patch(patch_doc(events), copy)
        assert copy_filter.group == "park"

    def test_create_then_apply_client_graph_layout_events(self) -> None:
        sample = document.Document()
        source = GraphDataSource(nodes=[0, 1], edges=[(0, 1)])
        layout = ForceDirectedLayoutProvider(seed=7, iterations=20)
        paths = BezierEdgePathProvider(curvature=0.2, steps=12)
        renderer = GraphRenderer(data_source=source, layout_provider=layout, edge_path_provider=paths)
        sample.add_root(renderer)

        copy = document.Document.from_json(sample.to_json())
        copy_source = copy.get_model_by_id(source.id)
        copy_layout = copy.get_model_by_id(layout.id)
        copy_paths = copy.get_model_by_id(paths.id)
        assert isinstance(copy_source, GraphDataSource)
        assert isinstance(copy_layout, ForceDirectedLayoutProvider)
        assert isinstance(copy_paths, BezierEdgePathProvider)

        events = []
        sample.on_change(events.append)

        layout.iterations = 40
        apply_patch(patch_doc(events), copy)
        assert copy_layout.iterations == 40

        events.clear()
        paths.curvature = -0.25
        apply_patch(patch_doc(events), copy)
        assert copy_paths.curvature.value == -0.25

        events.clear()
        assert isinstance(source.edges, ColumnDataSource)
        source.edges.data = {"start": [0, 1], "end": [1, 0]}
        apply_patch(patch_doc(events), copy)
        assert isinstance(copy_source.edges, ColumnDataSource)
        assert copy_source.edges.data == source.edges.data

    def test_patch_event_contains_setter(self) -> None:
        sample = self._sample_doc()
        root = None
        other_root = None
        for r in sample.roots:
            if r.child is not None:
                root = r
            else:
                other_root = r
        assert root is not None
        assert other_root is not None
        new_child = AnotherModelInTestPatchDoc(bar=56)

        cds = ColumnDataSource(data={'a': np.array([0., 1., 2.])})
        sample.add_root(cds)

        mock_session = object()
        def sample_document_callback_assert(event):
            """Asserts that setter is correctly set on event"""
            assert event.setter is mock_session
        sample.on_change(sample_document_callback_assert)

        # Model property changed
        event = ModelChangedEvent(sample, root, 'child', new_child)
        msg = patch_doc([event])
        apply_patch(msg, sample, mock_session)
        assert msg.buffers == []

        # RootAdded
        event2 = RootAddedEvent(sample, root)
        msg2 = patch_doc([event2])
        apply_patch(msg2, sample, mock_session)
        assert msg2.buffers == []

        # RootRemoved
        event3 = RootRemovedEvent(sample, root)
        msg3 = patch_doc([event3])
        apply_patch(msg3, sample, mock_session)
        assert msg3.buffers == []

        # ColumnsStreamed
        event4 = ColumnsStreamedEvent(sample, cds, "data", {"a": [3]}, None, mock_session)
        msg4 = patch_doc([event4])
        apply_patch(msg4, sample, mock_session)
        assert msg4.buffers == []

        # ColumnsPatched
        event5 = ColumnsPatchedEvent(sample, cds, "data", {"a": [(0, 11)]})
        msg5 = patch_doc([event5])
        apply_patch(msg5, sample, mock_session)
        assert msg5.buffers == []

        # ColumnDataChanged
        event7 = ColumnDataChangedEvent(sample, cds, "data")
        msg7 = patch_doc([event7])
        apply_patch(msg7, sample, mock_session)
        assert len(msg7.buffers) == 1

        # reports CDS buffer *as it is* Normally events called by setter and
        # value in local object would have been already mutated.
        [buf] = msg7.buffers
        assert bytes(buf.data) == np.array([11., 1., 2., 3]).tobytes()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------


def test_patch_inherited_marking_visuals() -> None:
    sample = document.Document()
    renderer = GlyphRenderer(data_source=ColumnDataSource(dict(xs=[[0, 1]], ys=[[0, 1]])),
                             glyph=MultiLine(line_color="red"))
    head = NormalHead(inherit_visuals=["line_color", "fill_color"])
    renderer.add_path_decoration(head, node="end")
    sample.add_root(renderer)
    copy = document.Document.from_json(sample.to_json())
    copied_head = copy.get_model_by_id(head.id)
    assert isinstance(copied_head, NormalHead)
    assert copied_head.inherit_visuals == ["line_color", "fill_color"]
    events = []
    sample.on_change(events.append)
    head.inherit_visuals = ["fill_color"]
    renderer.glyph.line_color = "blue"
    apply_patch(patch_doc(events), copy)
    assert copied_head.inherit_visuals == ["fill_color"]
    assert copy.get_model_by_id(renderer.glyph.id).line_color.value == "blue"


@pytest.mark.parametrize("glyph_type", [Segment, Bezier])
def test_patch_alternate_graph_edge_coordinates(glyph_type) -> None:
    sample = document.Document()
    graph = GraphRenderer(layout_provider=StaticLayoutProvider(graph_layout={0: (0, 0), 1: (1, 1)}))
    graph.node_renderer.data_source.data = dict(index=[0, 1])
    graph.edge_renderer.glyph = glyph_type()
    source = graph.edge_renderer.data_source
    source.data = dict(start=[0], end=[1], cx0=[0.2], cy0=[0.3], cx1=[0.4], cy1=[0.5])
    expression = graph.edge_path_provider.edge_point_coordinates(graph.data_source, graph.layout_provider, "end")
    sample.add_root(graph)
    sample.add_root(expression)
    copy = document.Document.from_json(sample.to_json())
    events = []
    sample.on_change(events.append)
    graph.layout_provider.graph_layout = {0: (2, 3), 1: (4, 5)}
    source.patch(dict(cx0=[(0, 0.8)]))
    expression.point = "control0"
    apply_patch(patch_doc(events), copy)
    copied_graph = copy.get_model_by_id(graph.id)
    assert isinstance(copied_graph.edge_renderer.glyph, glyph_type)
    assert copied_graph.layout_provider.graph_layout == {0: [2, 3], 1: [4, 5]}
    assert copied_graph.edge_renderer.data_source.data["cx0"] == [0.8]
    assert copy.get_model_by_id(expression.id).point == "control0"
