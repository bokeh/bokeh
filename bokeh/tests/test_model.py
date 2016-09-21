from bokeh.model import Model, _ModelInEmptyDocument
from bokeh.core.properties import Int, String, Float, Instance, List, Any
from bokeh.plotting import figure
from bokeh.io import curdoc

def test_model_in_empty_document_sets_a_new_document_on_model_and_then_restores():
    doc = curdoc()
    plot = figure()
    doc.add_root(plot)
    assert plot._document == doc

    # Check new document has been used
    with _ModelInEmptyDocument(plot) as modded_plot:
        assert modded_plot._document != doc

    # Check old document is replaced
    assert plot._document == doc


def test_model_in_empty_document_unsets_curdoc_on_model_references_and_then_restores():
    doc = curdoc()
    plot = figure()
    doc.add_root(plot)
    refs = plot.references()
    a_ref = next(iter(refs))
    assert a_ref._document == doc

    # Check new document has been used
    with _ModelInEmptyDocument(plot) as modded_plot:
        # Note we've checked above that modded_plot doc is not curdoc
        assert a_ref._document == modded_plot._document

    # Check old document is replaced
    assert a_ref._document == doc

def test_Model_pretty():
    class Foo1(Model):
        a = Int(12)
        b = String("hello")

    assert Foo1(id='xyz').pretty() == "bokeh.tests.test_model.Foo1(id='xyz', a=12, b='hello', name=None, tags=[])"

    class Foo2(Model):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])

    assert Foo2(id='xyz').pretty() == """\
bokeh.tests.test_model.Foo2(
    id='xyz',
    a=12,
    b='hello',
    c=[1, 2, 3],
    name=None,
    tags=[])"""

    class Foo3(Model):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])
        d = Float(None)

    assert Foo3(id='xyz').pretty() == """\
bokeh.tests.test_model.Foo3(
    id='xyz',
    a=12,
    b='hello',
    c=[1, 2, 3],
    d=None,
    name=None,
    tags=[])"""

    class Foo4(Model):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])
        d = Float(None)
        e = Instance(Foo1, lambda: Foo1(id='xyz'))

    assert Foo4(id='xyz').pretty() == """\
bokeh.tests.test_model.Foo4(
    id='xyz',
    a=12,
    b='hello',
    c=[1, 2, 3],
    d=None,
    e=bokeh.tests.test_model.Foo1(
        id='xyz',
        a=12,
        b='hello',
        name=None,
        tags=[]),
    name=None,
    tags=[])"""

    class Foo5(Model):
        foo6 = Any            # can't use Instance(".tests.test_model.Foo6")

    class Foo6(Model):
        foo5 = Instance(Foo5)

    f5 = Foo5(id='xyz')
    f6 = Foo6(id='uvw', foo5=f5)
    f5.foo6 = f6

    assert f5.pretty() == """\
bokeh.tests.test_model.Foo5(
    id='xyz',
    foo6=bokeh.tests.test_model.Foo6(
        id='uvw',
        foo5=bokeh.tests.test_model.Foo5(id='xyz', ...),
        name=None,
        tags=[]),
    name=None,
    tags=[])"""
