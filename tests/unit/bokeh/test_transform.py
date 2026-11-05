#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import numpy as np
import pytest

from bokeh.core.property.descriptors import UnsetValueError
from bokeh.core.property.vectorization import Expr, Field
from bokeh.core.serialization import Serializer
from bokeh.models import (
    CategoricalColorMapper,
    CategoricalMarkerMapper,
    CategoricalPatternMapper,
    ColumnDataSource,
    CumSum,
    Dodge,
    EqHistColorMapper,
    FactorRange,
    IndexedLookup,
    Jitter,
    LinearColorMapper,
    LogColorMapper,
    Stack,
)
from tests.support.util.api import verify_all

# Module under test
import bokeh.transform as bt # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'cumsum',
    'dodge',
    'eqhist_cmap',
    'factor_cmap',
    'factor_hatch',
    'factor_mark',
    'gather',
    'jitter',
    'linear_cmap',
    'log_cmap',
    'stack',
    'transform',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bt, ALL)


class Test_cumsum:
    def test_basic(object) -> None:
        val = bt.cumsum("foo")
        assert isinstance(val, Expr)
        assert isinstance(val.expr, CumSum)
        assert val.expr.field == 'foo'
        assert val.expr.include_zero is False

    def test_include_zero(object) -> None:
        val = bt.cumsum("foo", include_zero=True)
        assert isinstance(val, Expr)
        assert isinstance(val.expr, CumSum)
        assert val.expr.field == 'foo'
        assert val.expr.include_zero is True


class Test_gather:
    def test_requires_indices(self) -> None:
        source = ColumnDataSource(data=dict(x=[1, 2, 3]))
        with pytest.raises(TypeError, match="indices"):
            bt.gather(source, "x")

    def test_lookup_requires_indices(self) -> None:
        source = ColumnDataSource(data=dict(x=[1, 2, 3]))
        lookup = IndexedLookup(source=source, field="x")
        with pytest.raises(UnsetValueError, match="indices"):
            Serializer().encode(lookup)

    @pytest.mark.parametrize("shaped", [False, True])
    def test_document_protocol_roundtrip(self, shaped: bool) -> None:
        from bokeh.document import Document
        from bokeh.plotting import figure
        from bokeh.protocol import apply_patch, patch_doc

        values = ColumnDataSource(data=dict(x=[0, 1, 2], y=[0, 1, 0]))
        indices = np.array([[0, 1, 2]], dtype=np.int32) if shaped else [[0, 1, 2]]
        cells = ColumnDataSource(data=dict(vertices=indices))
        p = figure()
        p.patches(xs=bt.gather(values, "x", indices="vertices"),
                  ys=bt.gather(values, "y", indices="vertices"), source=cells)
        doc = Document()
        doc.add_root(p)
        copy = Document.from_json(doc.to_json())
        lookup = copy.roots[0].renderers[0].glyph.xs.expr
        assert lookup.indices == "vertices"
        assert lookup.source.id == values.id
        assert lookup.source.data == values.data
        events = []
        doc.on_change(events.append)
        values.patch(dict(x=[(0, 10)]))
        if shaped:
            cells.data = dict(vertices=np.array([[0, 1, 2], [2, 1, 0]], dtype=np.int32))
        else:
            cells.stream(dict(vertices=[[2, 1, 0]]))
        message = patch_doc(events)
        apply_patch(message, copy)
        assert lookup.source.data["x"] == [10, 1, 2]
        np.testing.assert_equal(copy.roots[0].renderers[0].data_source.data["vertices"],
                                [[0, 1, 2], [2, 1, 0]])

    def test_basic(self) -> None:
        source = ColumnDataSource(data=dict(x=[1, 2, 3]))
        val = bt.gather(source, "x", "indices")

        assert isinstance(val, Expr)
        assert isinstance(val.expr, IndexedLookup)
        assert val.expr.source is source
        assert val.expr.field == "x"
        assert val.expr.indices == "indices"


class Test_dodge:
    def test_basic(self) -> None:
        t = bt.dodge("foo", 0.5)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, Dodge)
        assert t.transform.value == 0.5
        assert t.transform.range is None

    def test_with_range(self) -> None:
        r = FactorRange("a")
        t = bt.dodge("foo", 0.5, range=r)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, Dodge)
        assert t.transform.value == 0.5
        assert t.transform.range is r
        assert t.transform.range.factors == ["a"]


class Test_eqhist_cmap:
    def test_basic(self) -> None:
        t = bt.eqhist_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, EqHistColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color == "orange"
        assert t.transform.high_color == "blue"
        assert t.transform.nan_color == "pink"

    def test_defaults(self) -> None:
        t = bt.eqhist_cmap("foo", ["red", "green"], 0, 10)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, EqHistColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color is None
        assert t.transform.high_color is None
        assert t.transform.nan_color == "gray"


class Test_factor_cmap:
    def test_basic(self) -> None:
        t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"], start=1, end=2, nan_color="pink")
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 1
        assert t.transform.end == 2
        assert t.transform.nan_color == "pink"

    def test_defaults(self) -> None:
        t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"])
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 0
        assert t.transform.end is None
        assert t.transform.nan_color == "gray"


class Test_factor_hatch:
    def test_basic(self) -> None:
        t = bt.factor_hatch("foo", ["+", "-"], ["foo", "bar"], start=1, end=2)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalPatternMapper)
        assert t.transform.patterns == ["+", "-"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 1
        assert t.transform.end == 2

    def test_defaults(self) -> None:
        t = bt.factor_hatch("foo", ["+", "-"], ["foo", "bar"])
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalPatternMapper)
        assert t.transform.patterns == ["+", "-"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 0
        assert t.transform.end is None


class Test_factor_mark:
    def test_basic(self) -> None:
        t = bt.factor_mark("foo", ["hex", "square"], ["foo", "bar"], start=1, end=2)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalMarkerMapper)
        assert t.transform.markers == ["hex", "square"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 1
        assert t.transform.end == 2

    def test_defaults(self) -> None:
        t = bt.factor_mark("foo", ["hex", "square"], ["foo", "bar"])
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, CategoricalMarkerMapper)
        assert t.transform.markers == ["hex", "square"]
        assert t.transform.factors == ["foo", "bar"]
        assert t.transform.start == 0
        assert t.transform.end is None


class Test_jitter:
    def test_basic(self) -> None:
        t = bt.jitter("foo", width=0.5, mean=0.1, distribution="normal")
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, Jitter)
        assert t.transform.width == 0.5
        assert t.transform.mean == 0.1
        assert t.transform.distribution == "normal"
        assert t.transform.range is None

    def test_defaults(self) -> None:
        t = bt.jitter("foo", width=0.5)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, Jitter)
        assert t.transform.width == 0.5
        assert t.transform.mean == 0
        assert t.transform.distribution == "uniform"
        assert t.transform.range is None

    def test_with_range(self) -> None:
        r = FactorRange("a")
        t = bt.jitter("foo", width=0.5, mean=0.1, range=r)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, Jitter)
        assert t.transform.width == 0.5
        assert t.transform.mean == 0.1
        assert t.transform.distribution == "uniform"
        assert t.transform.range is r
        assert t.transform.range.factors == ["a"]


class Test_linear_cmap:
    def test_basic(self) -> None:
        t = bt.linear_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, LinearColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color == "orange"
        assert t.transform.high_color == "blue"
        assert t.transform.nan_color == "pink"

    def test_defaults(self) -> None:
        t = bt.linear_cmap("foo", ["red", "green"], 0, 10)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, LinearColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color is None
        assert t.transform.high_color is None
        assert t.transform.nan_color == "gray"


class Test_log_cmap:
    def test_basic(self) -> None:
        t = bt.log_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, LogColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color == "orange"
        assert t.transform.high_color == "blue"
        assert t.transform.nan_color == "pink"

    def test_defaults(self) -> None:
        t = bt.log_cmap("foo", ["red", "green"], 0, 10)
        assert isinstance(t, Field)
        assert t.field == "foo"
        assert isinstance(t.transform, LogColorMapper)
        assert t.transform.palette == ["red", "green"]
        assert t.transform.low == 0
        assert t.transform.high == 10
        assert t.transform.low_color is None
        assert t.transform.high_color is None
        assert t.transform.nan_color == "gray"


class Test_stack:
    def test_basic(self) -> None:
        val = bt.stack("foo", "baz")
        assert isinstance(val, Expr)
        assert isinstance(val.expr, Stack)
        assert val.expr.fields == ('foo', 'baz')


class Test_transform:
    def test_basic(self) -> None:
        dodge = Dodge()
        t = bt.transform("foo", dodge)
        assert t == Field(field="foo", transform=dodge)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
