import mock

from bokeh.document import Document

import bokeh.server.session as bss

def test_creation():
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.id == 'some-id'
    assert s.document == d
    assert s.destroyed is False
    assert s.expiration_requested is False
    assert s.expiration_blocked == 0

def test_subscribe():
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.connection_count == 0
    s.subscribe('connection1')
    assert s.connection_count == 1
    s.subscribe('connection2')
    assert s.connection_count == 2
    s.unsubscribe('connection1')
    assert s.connection_count == 1
    s.unsubscribe('connection2')
    assert s.connection_count == 0

def test_destroy():
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    with mock.patch('bokeh.document.Document.delete_modules') as docdm:
        s.destroy()
        assert s.destroyed
        docdm.assert_called_once()

    s = bss.ServerSession('some-id', d, 'ioloop')
    with mock.patch('bokeh.document.Document.remove_on_change') as docroc:
        s.destroy()
        assert s.destroyed
        docroc.assert_called_with(s)
