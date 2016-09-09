from bokeh.model import Model, _ModelInEmptyDocument
from bokeh.core.properties import Int
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

def test_Model___eq_____ne__():
    class EqNe(Model):
        x = Int(12)

    class EqNeUnrelated(Model):
        x = Int(12)

    v = EqNe() == EqNe()
    assert v is False
    v = EqNe() != EqNe()
    assert v is True

    v = EqNe(id="x") == EqNe(id="x")
    assert v is True
    v = EqNe(id="x") != EqNe(id="x")
    assert v is False

    v = EqNe(id="x", x=1) == EqNe(id="x", x=1)
    assert v is True
    v = EqNe(id="x", x=1) != EqNe(id="x", x=1)
    assert v is False

    v = EqNe(id="x", x=1) == EqNe(id="x", x=2)
    assert v is False
    v = EqNe(id="x", x=1) != EqNe(id="x", x=2)
    assert v is True

    v = EqNe(id="x") == EqNeUnrelated(id="x")
    assert v is False
    v = EqNe(id="x") != EqNeUnrelated(id="x")
    assert v is True
