from bokeh.model import _ModelInEmptyDocument
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
