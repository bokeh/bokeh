#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from dataclasses import dataclass

# Bokeh imports
from bokeh.core.has_props import Local
from bokeh.core.properties import (
    Dict,
    Instance,
    Int,
    List,
    Nullable,
    Object,
    Tuple,
)
from bokeh.document import Document
from bokeh.model import Model
from bokeh.models import LayoutDOM, Row

# Module under test
import bokeh.model.util as bmu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class ClassWithDocRef(bmu.HasDocumentRef):
    pass

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestHasDocumentRef:

    def test_init(self) -> None:
        obj = ClassWithDocRef()
        assert obj.document is None

    def test_setter(self) -> None:
        obj = ClassWithDocRef()
        assert obj.document is None
        d = Document()
        obj.document = d
        assert obj.document is d

    def test_getter(self) -> None:
        obj = ClassWithDocRef()
        assert obj.document is None
        d = Document()
        dt = Document()
        obj.document = d
        obj._temp_document = dt
        assert obj.document is dt
        obj._temp_document = None
        assert obj.document is d

# TODO (bev) test collect_filtered_models

def test_collect_models() -> None:
    @dataclass(frozen=True)
    class DT:
        f0: int = 0
        f1: Model | None = None
        f2: DT | None = None

    class Test(Model, Local):
        p0 = Int()

        p1 = Nullable(Instance(Model))
        p2 = List(Instance(Model))
        p3 = Dict(Instance(Model), Instance(Model))
        p4 = Nullable(Tuple(Instance(Model), Instance(Model), Instance(Model)))

        q1 = Nullable(Object(DT))
        q2 = List(Object(DT))
        q3 = Dict(Object(DT), Object(DT))
        q4 = Nullable(Tuple(Object(DT), Object(DT), Object(DT)))

    t00 = Test()

    d00 = DT()
    d01 = DT(f1=t00)
    d02 = DT(f2=d00)
    d03 = DT()
    d04 = DT()
    d05 = DT()
    d06 = DT()
    d07 = DT()
    d08 = DT()

    t01 = Test()
    t02 = Test()
    t03 = Test()
    t04 = Test()
    t05 = Test()
    t06 = Test()
    t07 = Test()
    t08 = Test()
    t09 = Test(
        p1=t01, p2=[t02, t03], p3={t04: t05}, p4=(t06, t07, t08),
        q1=d01, q2=[d02, d03], q3={d04: d05}, q4=(d06, d07, d08),
    )
    t10 = Test()

    models = bmu.collect_models(t09, t10)
    assert set(models) == {t00, t01, t02, t03, t04, t05, t06, t07, t08, t09, t10}

def test_get_class() -> None:
    from bokeh.models import Plot, Range1d
    from bokeh.plotting import GMap, figure
    assert bmu.get_class("Plot") is Plot
    assert bmu.get_class("Range1d") is Range1d
    assert bmu.get_class("Figure") is figure  # Note: __view_model__ == "Figure"
    assert bmu.get_class("GMap") is GMap

def test_visit_immediate_value_references() -> None:
    r1 = LayoutDOM()
    r2 = LayoutDOM()
    row = Row(children=[LayoutDOM()])
    obj = Row(children=[r1, r2, row])
    vals = set()
    assert bmu.visit_immediate_value_references(obj, lambda x: vals.add(x)) is None
    assert vals == { r1, r2, row }

class Test_visit_value_and_its_immediate_references:

    @pytest.mark.parametrize('typ', (int, float, str))
    def test_scalar(self, typ) -> None:
        obj = typ()
        vals = set()
        assert bmu.visit_value_and_its_immediate_references(obj, lambda x: vals.add(x)) is None
        assert vals == set()

    @pytest.mark.parametrize('typ', (tuple, list))
    def test_seq(self, typ) -> None:
        r1 = LayoutDOM()
        r2 = LayoutDOM()
        obj = typ([r1, r2])
        vals = set()
        assert bmu.visit_value_and_its_immediate_references(obj, lambda x: vals.add(x)) is None
        assert vals == { r1, r2 }

    def test_dict(self) -> None:
        r1 = LayoutDOM()
        r2 = LayoutDOM()
        obj = dict(r1=r1, r2=r2)
        vals = set()
        assert bmu.visit_value_and_its_immediate_references(obj, lambda x: vals.add(x)) is None
        assert vals == { r1, r2 }

    def test_Model(self) -> None:
        r1 = LayoutDOM()
        r2 = LayoutDOM()
        r3 = LayoutDOM()
        row = Row(children=[r3])
        obj = Row(children=[r1, r2, row])
        vals = set()
        assert bmu.visit_value_and_its_immediate_references(obj, lambda x: vals.add(x)) is None
        assert vals == { obj }

    # TODO (bev) test for HasProps (recurses)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
