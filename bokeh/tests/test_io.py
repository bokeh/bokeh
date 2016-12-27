#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import
from mock import patch, Mock, PropertyMock
import unittest

import bokeh.io as io
from bokeh.resources import Resources, _SessionCoordinates
from bokeh.document import Document
from bokeh.models.plots import Plot

class TestDefaultState(unittest.TestCase):

    def test_type(self):
        self.assertTrue(isinstance(io._state, io.State))

class testCurdoc(unittest.TestCase):

    def test(self):
        self.assertEqual(io.curdoc(), io._state.document)

class testCurstate(unittest.TestCase):

    def test(self):
        self.assertEqual(io.curstate(), io._state)


class DefaultStateTester(unittest.TestCase):

    def _check_func_called(self, func, args, kwargs):
        self.assertTrue(func.called)
        self.assertEqual(func.call_args[0], args)
        self.assertEqual(func.call_args[1], kwargs)

    def setUp(self):
        self._orig_state = io._state
        io._state = Mock()
        doc = Mock()
        roots = PropertyMock(return_value=[])
        type(doc).roots = roots
        io._state.document = doc

    def tearDown(self):
        io._state = self._orig_state
        io._state.document.clear()

class testOutputFile(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(title="Bokeh Plot", mode="cdn", root_dir=None)
        io.output_file("foo.html")
        self._check_func_called(io._state.output_file, ("foo.html",), default_kwargs)

    def test_args(self):
        kwargs = dict(title="title", mode="cdn", root_dir="foo")
        io.output_file("foo.html", **kwargs)
        self._check_func_called(io._state.output_file, ("foo.html",), kwargs)

class TestOutputNotebook(DefaultStateTester):

    @patch('bokeh.io.load_notebook')
    def test_noarg(self, mock_load_notebook):
        default_load_notebook_args = (None, False, False, 5000)
        io.output_notebook()
        self._check_func_called(io._state.output_notebook, (), {})
        self._check_func_called(mock_load_notebook, default_load_notebook_args, {})

    @patch('bokeh.io.load_notebook')
    def test_args(self, mock_load_notebook):
        load_notebook_args = (Resources(), True, True, 1000)
        io.output_notebook(*load_notebook_args)
        self._check_func_called(io._state.output_notebook, (), {})
        self._check_func_called(mock_load_notebook, load_notebook_args, {})

class TestOutputServer(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(session_id="default", url="default", app_path='/')
        io.output_server()
        self._check_func_called(io._state.output_server, (), default_kwargs)

    def test_args(self):
        kwargs = dict(session_id="foo", url="http://example.com", app_path='/foo')
        io.output_server(**kwargs)
        self._check_func_called(io._state.output_server, (), kwargs)

class TestSave(DefaultStateTester):
    pass

class Test_GetSaveArgs(DefaultStateTester):

    def test_explicit_filename(self):
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", "title")
        self.assertEqual(filename, "filename")

    def test_default_filename(self):
        io._state.file = {}
        io._state.file['filename'] = "filename"
        filename, resources, title = io._get_save_args(io._state, None, "resources", "title")
        self.assertEqual(filename, "filename")

    def test_missing_filename(self):
        io._state.file = None
        with self.assertRaises(RuntimeError):
            io.save("obj", None, "resources", "title")

    def test_explicit_resources(self):
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", "title")
        self.assertEqual(resources, "resources")

    def test_default_resources(self):
        io._state.file = {}
        io._state.file['resources'] = "resources"
        filename, resources, title = io._get_save_args(io._state, "filename", None, "title")
        self.assertEqual(resources, "resources")

    @patch('warnings.warn')
    def test_missing_resources(self, mock_warn):
        from bokeh.resources import CDN
        io._state.file = None
        filename, resources, title = io._get_save_args(io._state, "filename", None, "title")
        self.assertEqual(resources, CDN)
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ("save() called but no resources were supplied and output_file(...) "
                                                  "was never called, defaulting to resources.CDN",))
        self.assertEqual(mock_warn.call_args[1], {})

    def test_explicit_title(self):
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", "title")
        self.assertEqual(title, "title")

    def test_default_title(self):
        io._state.file = {}
        io._state.file['title'] = "title"
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", None)
        self.assertEqual(title, "title")

    @patch('warnings.warn')
    def test_missing_title(self, mock_warn):
        io._state.file = None
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", None)
        self.assertEqual(title, "Bokeh Plot")
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ("save() called but no title was supplied and output_file(...) "
                                                  "was never called, using default title 'Bokeh Plot'",))
        self.assertEqual(mock_warn.call_args[1], {})

class Test_SaveHelper(DefaultStateTester):
    pass

class TestPush(DefaultStateTester):

    @patch('bokeh.io._push_to_server')
    def test_missing_output_server(self, mock_push_to_server):
        # never calling output_server should pull session coords
        # off the io._state object
        io._state.server_enabled = False
        io._state.document = Document()
        io.push()
        self._check_func_called(mock_push_to_server, (),
                                dict(url=io._state.url,
                                     app_path=io._state.app_path,
                                     session_id=io._state.session_id_allowing_none,
                                     document=io._state.document,
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_noargs(self, mock_push_to_server):
        # if we had called output_server, the state object would be set
        # up like this
        io._state.session_id_allowing_none = "fakesessionid"
        io._state.url = "http://example.com/"
        io._state.app_path = "/bar"
        io._state.server_enabled = True
        io.push()
        self._check_func_called(mock_push_to_server, (),
                                dict(url="http://example.com/",
                                     document=io._state.document,
                                     session_id="fakesessionid",
                                     app_path="/bar",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_session_arg(self, mock_push_to_server):
        # this simulates never calling output_server
        io._state.server_enabled = False
        io.push(session_id="somesession")
        self._check_func_called(mock_push_to_server, (),
                                dict(url=io._state.url,
                                     app_path=io._state.app_path,
                                     document=io._state.document,
                                     session_id="somesession",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_url_arg(self, mock_push_to_server):
        # this simulates never calling output_server
        io._state.server_enabled = False
        io.push(url="http://example.com/")
        self._check_func_called(mock_push_to_server, (),
                                dict(url="http://example.com/",
                                     app_path=io._state.app_path,
                                     session_id=io._state.session_id_allowing_none,
                                     document=io._state.document,
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_document_arg(self, mock_push_to_server):
        # this simulates never calling output_server
        io._state.server_enabled = False
        d = Document()
        io.push(document=d)
        self._check_func_called(mock_push_to_server, (),
                                dict(url=io._state.url,
                                     app_path=io._state.app_path,
                                     session_id=io._state.session_id_allowing_none,
                                     document=d,
                                     io_loop=None))


    @patch('bokeh.io._push_to_server')
    def test_all_args(self, mock_push_to_server):
        d = Document()
        url = "https://example.com/"
        session_id = "all_args_session"
        app_path = "/foo"
        # state should get ignored since we specified everything otherwise
        state = Mock()
        io_loop = Mock()
        io.push(document=d, url=url, app_path=app_path, state=state, session_id=session_id, io_loop=io_loop)
        self._check_func_called(mock_push_to_server, (),
                                dict(url="https://example.com/",
                                     app_path="/foo",
                                     document=d,
                                     session_id="all_args_session",
                                     io_loop=io_loop))

    @patch('bokeh.io._push_to_server')
    def test_state_arg(self, mock_push_to_server):
        d = Document()
        url = "https://example.com/state/"
        session_id = "state_arg_session"
        # state should get ignored since we specified everything otherwise
        state = Mock()
        state.document = d
        state.url = url
        state.session_id_allowing_none = session_id
        io.push(state=state)
        self._check_func_called(mock_push_to_server, (),
                                dict(url="https://example.com/state/",
                                     document=d,
                                     session_id="state_arg_session",
                                     app_path = state.app_path,
                                     io_loop=None))

class TestShow(DefaultStateTester):

    @patch('bokeh.io._show_with_state')
    def test_default_args(self, mock__show_with_state):
        default_kwargs = dict(browser=None, new="tab", notebook_handle=False)
        io.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", io._state, None, "tab"), {'notebook_handle': False})

    @patch('bokeh.io._show_with_state')
    def test_explicit_args(self, mock__show_with_state):
        default_kwargs = dict(browser="browser", new="new", notebook_handle=True)
        io.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", io._state, "browser", "new"), {'notebook_handle': True})


@patch('bokeh.io._show_with_state')
def test_show_adds_obj_to_document_if_not_already_there(m):
    assert io._state.document.roots == []
    p = Plot()
    io.show(p)
    assert p in io._state.document.roots


@patch('bokeh.io._show_with_state')
def test_show_doesnt_duplicate_if_already_there(m):
    io._state.document.clear()
    p = Plot()
    io.show(p)
    assert io._state.document.roots == [p]
    io.show(p)
    assert io._state.document.roots == [p]


class Test_ShowWithState(DefaultStateTester):

    @patch('bokeh.io._show_notebook_with_state')
    @patch('bokeh.io._show_server_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.util.browser.get_browser_controller')
    def test_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = io.State()
        s.output_notebook()
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s, False), {})
        self.assertFalse(mock__show_server_with_state.called)
        self.assertFalse(mock__show_file_with_state.called)

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s, False), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session = Mock
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s, False), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

    @patch('bokeh.io.get_comms')
    @patch('bokeh.io._show_notebook_with_state')
    @patch('bokeh.io._show_server_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.util.browser.get_browser_controller')
    def test_no_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state,
            mock_get_comms):
        mock_get_browser_controller.return_value = "controller"
        mock_get_comms.return_value = "comms"
        s = io.State()

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_with_state.called)
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session_coords = _SessionCoordinates(dict(session_id="fakesession",
                                                     url="http://example.com",
                                                     app_path='/'))
        s._server_enabled = True
        io._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_with_state.called)
        self._check_func_called(mock__show_server_with_state, ("obj", s, "new", "controller"), {})
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

class Test_ShowFileWithState(DefaultStateTester):

    @patch('os.path.abspath')
    @patch('bokeh.io.save')
    def test(self, mock_save, mock_abspath):
        s = io.State()
        s.output_file("foo.html")
        controller = Mock()
        mock_save.return_value = "savepath"

        io._show_file_with_state("obj", s, "window", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://savepath",), {"new": 1})

        io._show_file_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://savepath",), {"new": 2})

class Test_ShowNotebookWithState(DefaultStateTester):

    @patch('bokeh.io.publish_display_data')
    @patch('bokeh.io.autoload_server')
    @patch('bokeh.io.push')
    def test_with_server(self, mock_push, mock_autoload_server, mock_publish_display_data):
        s = io.State()
        s._server_enabled = True
        mock_autoload_server.return_value = "snippet"

        io._show_notebook_with_state("obj", s, True)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(mock_publish_display_data, ({"text/html":"snippet"},), {})

    @patch('bokeh.io.get_comms')
    @patch('bokeh.io.publish_display_data')
    @patch('bokeh.io.notebook_div')
    def test_no_server(self, mock_notebook_div, mock_publish_display_data, mock_get_comms):
        mock_get_comms.return_value = "comms"
        s = io.State()
        mock_notebook_div.return_value = "notebook_div"

        io._nb_loaded = True
        io._show_notebook_with_state("obj", s, True)
        io._nb_loaded = False
        self._check_func_called(mock_publish_display_data, ({"text/html": "notebook_div"},), {})

class Test_ShowServerWithState(DefaultStateTester):

    @patch('bokeh.io.push')
    def test(self, mock_push):
        s = io.State()
        s._session_coords = _SessionCoordinates(dict(session_id="thesession",
                                                     url="http://example.com",
                                                     app_path='/foo'))
        s._server_enabled = True
        controller = Mock()

        io._show_server_with_state("obj", s, "window", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("http://example.com/foo?bokeh-session-id=thesession",), {"new": 1})

        io._show_server_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("http://example.com/foo?bokeh-session-id=thesession",), {"new": 2})

class TestResetOutput(DefaultStateTester):

    def test(self):
        io.reset_output()
        self.assertTrue(io._state.reset.called)


def _test_layout_added_to_root(layout_generator, children=None):
    layout = layout_generator(Plot() if children is None else children)
    assert layout in io.curdoc().roots
    io.curdoc().clear()


def _test_children_removed_from_root(layout_generator, children=None):
    component = Plot()
    io.curdoc().add_root(component if children is None else children[0][0])
    layout_generator(component if children is None else children)
    assert component not in io.curdoc().roots
    io.curdoc().clear()
