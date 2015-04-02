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

class TestDefaultState(unittest.TestCase):

    def test_type(self):
        self.assertTrue(isinstance(io._state, io.State))

class testCurdoc(unittest.TestCase):

    def test(self):
        self.assertEqual(io.curdoc(), io._state.document)

    @patch('bokeh.io.logger')
    @patch('flask.request')
    def test_with_request(self, mock_request, mock_logger):
        mock_request.bokeh_server_document = "FOO"
        self.assertEqual(io.curdoc(), "FOO")
        self.assertTrue(io.logger.debug.called)
        self.assertEqual(
            io.logger.debug.call_args[0],
            ("curdoc() returning Document from flask request context",)
        )

class testCursession(unittest.TestCase):

    def test(self):
        self.assertEqual(io.cursession(), io._state.session)

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
        default_kwargs = dict(title="Bokeh Plot", autosave=False, mode="inline", root_dir=None)
        io.output_file("foo.html")
        self._check_func_called(io._state.output_file, ("foo.html",), default_kwargs)

    def test_args(self):
        kwargs = dict(title="title", autosave=True, mode="cdn", root_dir="foo")
        io.output_file("foo.html", **kwargs)
        self._check_func_called(io._state.output_file, ("foo.html",), kwargs)

class TestOutputNotebook(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(url=None, docname=None, session=None, name=None)
        io.output_notebook()
        self._check_func_called(io._state.output_notebook, (), default_kwargs)

    def test_args(self):
        kwargs = dict(url="url", docname="docname", session="session", name="name")
        io.output_notebook(**kwargs)
        self._check_func_called(io._state.output_notebook, (), kwargs)

class TestOutputServer(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(session=None, url="default", name=None, clear=True)
        io.output_server("docname")
        self._check_func_called(io._state.output_server, ("docname",), default_kwargs)

    def test_args(self):
        kwargs = dict(session="session", url="url", name="name", clear="clear")
        io.output_server("docname", **kwargs)
        self._check_func_called(io._state.output_server, ("docname",), kwargs)

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
        from bokeh.resources import INLINE
        io._state.file = None
        filename, resources, title = io._get_save_args(io._state, "filename", None, "title")
        self.assertEqual(resources, INLINE)
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ("save() called but no resources was supplied and output_file(...) "
                                                  "was never called, defaulting to resources.INLINE",))
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

    def _check_doc_store(self, sess, doc):
        self._check_func_called(sess.store_document, (doc,), {})

    @patch('warnings.warn')
    def test_missing_session(self, mock_warn):
        io._state.session = None
        io.push()
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ("push() called but no session was supplied and output_server(...) "
                                                  "was never called, nothing pushed",))
        self.assertEqual(mock_warn.call_args[1], {})

    def test_noargs(self):
        io.push()
        self._check_doc_store(io._state.session, io._state.document)

    def test_session_arg(self):
        sess = Mock()
        io.push(session=sess)
        self._check_doc_store(sess, io._state.document)

    def test_document_arg(self):
        io.push(document="foo")
        self._check_doc_store(io._state.session, "foo")

    def test_session_document_args(self):
        sess = Mock()
        io.push(document="foo", session=sess)
        self._check_doc_store(sess, "foo")

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

        s._session = Mock
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
        s._session = Mock()
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
        s._session = Mock()
        s._session.object_link.return_value = "link"
        controller = Mock()

        io._show_server_with_state("obj", s, "window", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("link",), {"new": 1})

        io._show_server_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("link",), {"new": 2})

class TestResetOutput(DefaultStateTester):

    def test(self):
        io.reset_output()
        self.assertTrue(io._state.reset.called)

if __name__ == "__main__":
    unittest.main()
