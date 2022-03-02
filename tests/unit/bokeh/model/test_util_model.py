#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.document import Document
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
    r1 = LayoutDOM()
    r2 = LayoutDOM()
    r3 = LayoutDOM()
    row1 = Row(children=[r1, r2])
    row2 = Row(children=[r2, r3])

    models = bmu.collect_models(row1, row2)
    assert len(models) == 5
    assert set(models) == { r1, r2, r3, row1, row2 }

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
