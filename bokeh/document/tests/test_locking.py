import pytest

import bokeh.document.locking as locking

from bokeh.document.document import Document
from bokeh.io import curdoc

def test_next_tick_callback_works():
    d = locking.UnlockedDocumentProxy(Document())
    assert curdoc() is not d
    curdoc_from_cb = []
    def cb():
        curdoc_from_cb.append(curdoc())
    callback = d.add_next_tick_callback(cb)
    callback.callback()
    assert len(curdoc_from_cb) == 1
    assert curdoc_from_cb[0] is d._doc
    def cb2(): pass
    callback = d.add_next_tick_callback(cb2)
    d.remove_next_tick_callback(cb2)

def test_other_attrs_raise():
    d = locking.UnlockedDocumentProxy(Document())
    assert curdoc() is not d
    with pytest.raises(RuntimeError) as e:
        d.foo
        assert str(e) == "Only add_next_tick_callback may be used safely without taking the document lock; "
        "to make other changes to the document, add a next tick callback and make your changes "
        "from that callback."
    for attr in dir(d._doc):
        if attr in ["add_next_tick_callback", "remove_next_tick_callback"]: continue
        with pytest.raises(RuntimeError) as e:
            getattr(d, "foo")

def test_without_document_lock():
    d = Document()
    assert curdoc() is not d
    curdoc_from_cb = []
    @locking.without_document_lock
    def cb():
        curdoc_from_cb.append(curdoc())
    callback = d.add_next_tick_callback(cb)
    callback._callback()
    assert callback.callback.nolock == True
    assert len(curdoc_from_cb) == 1
    assert curdoc_from_cb[0]._doc is d
    assert isinstance(curdoc_from_cb[0], locking.UnlockedDocumentProxy)
