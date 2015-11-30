#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import
from mock import patch, Mock
import unittest

import bokeh.io as io
from bokeh.resources import Resources
from bokeh.document import Document

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

    def tearDown(self):
        io._state = self._orig_state

class testOutputFile(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(title="Bokeh Plot", autosave=False, mode="cdn", root_dir=None)
        io.output_file("foo.html")
        self._check_func_called(io._state.output_file, ("foo.html",), default_kwargs)

    def test_args(self):
        kwargs = dict(title="title", autosave=True, mode="cdn", root_dir="foo")
        io.output_file("foo.html", **kwargs)
        self._check_func_called(io._state.output_file, ("foo.html",), kwargs)

class TestOutputNotebook(DefaultStateTester):

    @patch('bokeh.io.load_notebook')
    def test_noarg(self, mock_load_notebook):
        default_load_notebook_args = (None, False, False)
        io.output_notebook()
        self._check_func_called(io._state.output_notebook, (), {})
        self._check_func_called(mock_load_notebook, default_load_notebook_args, {})

    @patch('bokeh.io.load_notebook')
    def test_args(self, mock_load_notebook):
        load_notebook_args = (Resources(), True, True)
        io.output_notebook(*load_notebook_args)
        self._check_func_called(io._state.output_notebook, (), {})
        self._check_func_called(mock_load_notebook, load_notebook_args, {})

class TestOutputServer(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(session_id="default", url="default", autopush=False)
        io.output_server()
        self._check_func_called(io._state.output_server, (), default_kwargs)

    def test_args(self):
        kwargs = dict(session_id="foo", url="http://example.com", autopush=True)
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
        # set to None rather than mock objects,
        # this simulates never calling output_server
        io._state.session_id = None
        io._state.server_url = None
        io._state.document = Document()
        io.push()
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="ws://localhost:5006/ws",
                                     document=io._state.document,
                                     session_id="default",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_noargs(self, mock_push_to_server):
        # this simulates having called output_server with these params
        io._state.session_id = "fakesessionid"
        io._state.server_url = "https://example.com/"
        io.push()
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="wss://example.com/ws",
                                     document=io._state.document,
                                     session_id="fakesessionid",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_session_arg(self, mock_push_to_server):
        # set to None rather than mock objects,
        # this simulates never calling output_server
        io._state.session_id = None
        io._state.server_url = None
        io.push(session_id="somesession")
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="ws://localhost:5006/ws",
                                     document=io._state.document,
                                     session_id="somesession",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_url_arg(self, mock_push_to_server):
        # set to None rather than mock objects,
        # this simulates never calling output_server
        io._state.session_id = None
        io._state.server_url = None
        io.push(url="http://example.com/")
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="ws://example.com/ws",
                                     document=io._state.document,
                                     session_id="default",
                                     io_loop=None))

    @patch('bokeh.io._push_to_server')
    def test_document_arg(self, mock_push_to_server):
        # set to None rather than mock objects,
        # this simulates never calling output_server
        io._state.session_id = None
        io._state.server_url = None
        d = Document()
        io.push(document=d)
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="ws://localhost:5006/ws",
                                     document=d,
                                     session_id="default",
                                     io_loop=None))


    @patch('bokeh.io._push_to_server')
    def test_all_args(self, mock_push_to_server):
        d = Document()
        url = "https://example.com/foo"
        session_id = "all_args_session"
        # state should get ignored since we specified everything otherwise
        state = Mock()
        io_loop = Mock()
        io.push(document=d, url=url, state=state, session_id=session_id, io_loop=io_loop)
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="wss://example.com/foo/ws",
                                     document=d,
                                     session_id="all_args_session",
                                     io_loop=io_loop))

    @patch('bokeh.io._push_to_server')
    def test_state_arg(self, mock_push_to_server):
        d = Document()
        url = "https://example.com/state"
        session_id = "state_arg_session"
        # state should get ignored since we specified everything otherwise
        state = Mock()
        state.document = d
        state.server_url = url
        state.session_id = session_id
        io.push(state=state)
        self._check_func_called(mock_push_to_server, (),
                                dict(websocket_url="wss://example.com/state/ws",
                                     document=d,
                                     session_id="state_arg_session",
                                     io_loop=None))

class TestShow(DefaultStateTester):

    @patch('bokeh.io._show_with_state')
    def test_default_args(self, mock__show_with_state):
        default_kwargs = dict(browser=None, new="tab")
        io.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", io._state, None, "tab"), {})

    @patch('bokeh.io._show_with_state')
    def test_explicit_args(self, mock__show_with_state):
        default_kwargs = dict(browser="browser", new="new")
        io.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", io._state, "browser", "new"), {})

class Test_ShowWithState(DefaultStateTester):

    @patch('bokeh.io._show_notebook_with_state')
    @patch('bokeh.io._show_server_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.browserlib.get_browser_controller')
    def test_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = io.State()
        s.output_notebook()
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self.assertFalse(mock__show_file_with_state.called)

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session = Mock
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

    @patch('bokeh.io._show_notebook_with_state')
    @patch('bokeh.io._show_server_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.browserlib.get_browser_controller')
    def test_no_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = io.State()

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_with_state.called)
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session_id = "fakesession"
        s._server_url = "http://example.com"
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
        mock_abspath.return_value = "abspath"

        io._show_file_with_state("obj", s, "window", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://abspath",), {"new": 1})

        io._show_file_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://abspath",), {"new": 2})

class Test_ShowNotebookWithState(DefaultStateTester):

    @patch('bokeh.io.publish_display_data')
    @patch('bokeh.io.autoload_server')
    @patch('bokeh.io.push')
    def test_with_server(self, mock_push, mock_autoload_server, mock_publish_display_data):
        s = io.State()
        s._session_id = "fakesession"
        mock_autoload_server.return_value = "snippet"

        io._show_notebook_with_state("obj", s)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(mock_publish_display_data, ({"text/html":"snippet"},), {})

    @patch('bokeh.io.publish_display_data')
    @patch('bokeh.io.notebook_div')
    def test_no_server(self, mock_notebook_div, mock_publish_display_data):
        s = io.State()
        s._session = None
        mock_notebook_div.return_value = "notebook_div"

        io._show_notebook_with_state("obj", s)
        self._check_func_called(mock_publish_display_data, ({"text/html": "notebook_div"},), {})

class Test_ShowServerWithState(DefaultStateTester):

    @patch('bokeh.io.push')
    def test(self, mock_push):
        s = io.State()
        s._session_id = "thesession"
        s._server_url = "http://example.com"
        controller = Mock()

        io._show_server_with_state("obj", s, "window", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("http://example.com?bokeh-session-id=thesession",), {"new": 1})

        io._show_server_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("http://example.com?bokeh-session-id=thesession",), {"new": 2})

class TestResetOutput(DefaultStateTester):

    def test(self):
        io.reset_output()
        self.assertTrue(io._state.reset.called)

if __name__ == "__main__":
    unittest.main()
