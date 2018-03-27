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
    callback_obj = d.add_next_tick_callback(cb)
    callback_obj.callback()
    assert len(curdoc_from_cb) == 1
    assert curdoc_from_cb[0] is d._doc
    def cb2(): pass
    callback_obj = d.add_next_tick_callback(cb2)
    d.remove_next_tick_callback(callback_obj)

def test_other_attrs_raise():
    d = locking.UnlockedDocumentProxy(Document())
    assert curdoc() is not d
    for attr in (set(dir(d._doc)) - set(dir(d))) | {'foo'}:
        with pytest.raises(RuntimeError) as e:
            getattr(d, attr)
        assert e.value.args[0] == locking.UNSAFE_DOC_ATTR_USAGE_MSG

def test_without_document_lock():
    d = Document()
    assert curdoc() is not d
    curdoc_from_cb = []
    @locking.without_document_lock
    def cb():
        curdoc_from_cb.append(curdoc())
    callback_obj = d.add_next_tick_callback(cb)
    callback_obj.callback()
    assert callback_obj.callback.nolock == True
    assert len(curdoc_from_cb) == 1
    assert curdoc_from_cb[0]._doc is d
    assert isinstance(curdoc_from_cb[0], locking.UnlockedDocumentProxy)
