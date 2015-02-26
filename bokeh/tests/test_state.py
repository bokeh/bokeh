
from mock import patch, Mock
import unittest

from bokeh.document import Document
from bokeh.plotting import figure
from bokeh.resources import Resources

import bokeh.state as state

class TestState(unittest.TestCase):

    def test_creation(self):
        s = state.State()
        self.assertTrue(isinstance(s.document, Document))
        self.assertEqual(s.file, None)
        self.assertEqual(s.notebook, False)
        self.assertEqual(s.session, None)

    def test_default_file_resources(self):
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['resources'].minified, True)

    def test_output_file(self):
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['filename'], "foo.html")
        self.assertEqual(s.file['autosave'], False)
        self.assertEqual(s.file['title'], "Bokeh Plot")
        self.assertEqual(s.file['resources'].log_level, 'info')
        self.assertEqual(s.file['resources'].minified, True)

    @patch('bokeh.state.logger')
    @patch('os.path.isfile')
    def test_output_file_file_exists(self, mock_isfile, mock_logger):
        mock_isfile.return_value = True
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['filename'], "foo.html")
        self.assertEqual(s.file['autosave'], False)
        self.assertEqual(s.file['title'], "Bokeh Plot")
        self.assertEqual(s.file['resources'].log_level, 'info')
        self.assertEqual(s.file['resources'].minified, True)
        self.assertTrue(state.logger.info.called)
        self.assertEqual(
            state.logger.info.call_args[0],
            ("Session output file 'foo.html' already exists, will be overwritten.",)
        )

    def test_output_notebook_noarg(self):
        s = state.State()
        s.output_notebook()
        self.assertEqual(s.session, None)
        self.assertEqual(s.notebook, True)

    @patch('bokeh.state.time.ctime')
    @patch('bokeh.state.State.output_server')
    def test_output_notebook_args(self, mock_output_server, mock_ctime):
        kwargs = dict(session="session", name="name", url="url")
        s = state.State()
        s.output_notebook(docname="docname", **kwargs)
        self.assertTrue(state._state.output_server.called)
        self.assertEqual(state._state.output_server.call_args[0], ("docname",))
        self.assertEqual(state._state.output_server.call_args[1], kwargs)

        mock_ctime.return_value = "NOW"
        s.output_notebook(**kwargs)
        self.assertTrue(state._state.output_server.called)
        self.assertEqual(state._state.output_server.call_args[0], ("IPython Session at NOW",))
        self.assertEqual(state._state.output_server.call_args[1], kwargs)

    @patch('bokeh.state.Session.load_document')
    @patch('bokeh.state.Session.use_doc')
    def test_output_server(self, mock_use_doc, mock_load_document):
        s = state.State()
        self.assertEqual(s.session, None)
        s.output_server("default")
        self.assertEqual(s.session.name, state.DEFAULT_SERVER_URL)
        self.assertEqual(s.session.root_url, state.DEFAULT_SERVER_URL)

    @patch('bokeh.state.Session')
    def test_reset(self, mock_session):
        s = state.State()
        d = s.document
        s.output_file("foo.html")
        s.output_server("default")
        s.output_notebook()
        s.reset()
        self.assertEqual(s.file, None)
        self.assertEqual(s.notebook, False)
        self.assertEqual(s.session, None)
        self.assertTrue(isinstance(s.document, Document))
        self.assertTrue(s.document != d)


class TestDefaultState(unittest.TestCase):

    def test_type(self):
        self.assertTrue(isinstance(state._state, state.State))

class testCurdoc(unittest.TestCase):

    def test(self):
        self.assertEqual(state.curdoc(), state._state.document)

    @patch('bokeh.state.logger')
    @patch('flask.request')
    def test_with_request(self, mock_request, mock_logger):
        mock_request.bokeh_server_document = "FOO"
        self.assertEqual(state.curdoc(), "FOO")
        self.assertTrue(state.logger.debug.called)
        self.assertEqual(
            state.logger.debug.call_args[0],
            ("curdoc() returning Document from flask request context",)
        )

class testCursession(unittest.TestCase):

    def test(self):
        self.assertEqual(state.cursession(), state._state.session)

class DefaultStateTester(unittest.TestCase):

    def _check_func_called(self, func, args, kwargs):
        self.assertTrue(func.called)
        self.assertEqual(func.call_args[0], args)
        self.assertEqual(func.call_args[1], kwargs)

    def setUp(self):
        self._orig_state = state._state
        state._state = Mock()

    def tearDown(self):
        state._state = self._orig_state

class testOutputFile(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(title="Bokeh Plot", autosave=False, mode="inline", root_dir=None)
        state.output_file("foo.html")
        self._check_func_called(state._state.output_file, ("foo.html",), default_kwargs)

    def test_args(self):
        kwargs = dict(title="title", autosave=True, mode="cdn", root_dir="foo")
        state.output_file("foo.html", **kwargs)
        self._check_func_called(state._state.output_file, ("foo.html",), kwargs)

class TestOutputNotebook(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(url=None, docname=None, session=None, name=None)
        state.output_notebook()
        self._check_func_called(state._state.output_notebook, (), default_kwargs)

    def test_args(self):
        kwargs = dict(url="url", docname="docname", session="session", name="name")
        state.output_notebook(**kwargs)
        self._check_func_called(state._state.output_notebook, (), kwargs)

class TestOutputServer(DefaultStateTester):

    def test_noarg(self):
        default_kwargs = dict(session=None, url="default", name=None, clear=True)
        state.output_server("docname")
        self._check_func_called(state._state.output_server, ("docname",), default_kwargs)

    def test_args(self):
        kwargs = dict(session="session", url="url", name="name", clear="clear")
        state.output_server("docname", **kwargs)
        self._check_func_called(state._state.output_server, ("docname",), kwargs)

class TestSave(DefaultStateTester):
    pass

class Test_GetSaveArgs(DefaultStateTester):

    def test_explicit_filename(self):
        filename, resources, title = state._get_save_args(state._state, "filename", "resources", "title")
        self.assertEqual(filename, "filename")

    def test_default_filename(self):
        state._state.file = {}
        state._state.file['filename'] = "filename"
        filename, resources, title = state._get_save_args(state._state, None, "resources", "title")
        self.assertEqual(filename, "filename")

    def test_missing_filename(self):
        state._state.file = None
        with self.assertRaises(RuntimeError):
            state.save("obj", None, "resources", "title")

    def test_explicit_resources(self):
        filename, resources, title = state._get_save_args(state._state, "filename", "resources", "title")
        self.assertEqual(resources, "resources")

    def test_default_resources(self):
        state._state.file = {}
        state._state.file['resources'] = "resources"
        filename, resources, title = state._get_save_args(state._state, "filename", None, "title")
        self.assertEqual(resources, "resources")

    @patch('warnings.warn')
    def test_missing_resources(self, mock_warn):
        from bokeh.resources import INLINE
        state._state.file = None
        filename, resources, title = state._get_save_args(state._state, "filename", None, "title")
        self.assertEqual(resources, INLINE)
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ('save() called but no resources was supplied and output_file(...) was never called, defaulting to resources.INLINE',))
        self.assertEqual(mock_warn.call_args[1], {})

    def test_explicit_title(self):
        filename, resources, title = state._get_save_args(state._state, "filename", "resources", "title")
        self.assertEqual(title, "title")

    def test_default_title(self):
        state._state.file = {}
        state._state.file['title'] = "title"
        filename, resources, title = state._get_save_args(state._state, "filename", "resources", None)
        self.assertEqual(title, "title")

    @patch('warnings.warn')
    def test_missing_title(self, mock_warn):
        state._state.file = None
        filename, resources, title = state._get_save_args(state._state, "filename", "resources", None)
        self.assertEqual(title, "Bokeh Plot")
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'",))
        self.assertEqual(mock_warn.call_args[1], {})

class Test_SaveHelper(DefaultStateTester):
    pass

class TestPush(DefaultStateTester):

    def _check_doc_store(self, sess, doc):
        self._check_func_called(sess.store_document, (doc,), {})

    @patch('warnings.warn')
    def test_missing_session(self, mock_warn):
        state._state.session = None
        state.push()
        self.assertTrue(mock_warn.called)
        self.assertEqual(mock_warn.call_args[0], ('push() called but no session was supplied and output_server(...) was never called, nothing pushed',))
        self.assertEqual(mock_warn.call_args[1], {})

    def test_noargs(self):
        state.push()
        self._check_doc_store(state._state.session, state._state.document)

    def test_session_arg(self):
        sess = Mock()
        state.push(session=sess)
        self._check_doc_store(sess, state._state.document)

    def test_document_arg(self):
        state.push(document="foo")
        self._check_doc_store(state._state.session, "foo")

    def test_session_document_args(self):
        sess = Mock()
        state.push(document="foo", session=sess)
        self._check_doc_store(sess, "foo")

class TestShow(DefaultStateTester):

    @patch('bokeh.state._show_with_state')
    def test_default_args(self, mock__show_with_state):
        default_kwargs = dict(browser=None, new="tab")
        state.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", state._state, None, "tab"), {})

    @patch('bokeh.state._show_with_state')
    def test_explicit_args(self, mock__show_with_state):
        default_kwargs = dict(browser="browser", new="new")
        state.show("obj", **default_kwargs)
        self._check_func_called(mock__show_with_state, ("obj", state._state, "browser", "new"), {})

class Test_ShowWithState(DefaultStateTester):

    @patch('bokeh.state._show_notebook_with_state')
    @patch('bokeh.state._show_server_with_state')
    @patch('bokeh.state._show_file_with_state')
    @patch('bokeh.browserlib.get_browser_controller')
    def test_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = state.State()
        s.output_notebook()
        state._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self.assertFalse(mock__show_file_with_state.called)

        s.output_file("foo.html")
        state._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session = Mock
        state._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_with_state, ("obj", s), {})
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

    @patch('bokeh.state._show_notebook_with_state')
    @patch('bokeh.state._show_server_with_state')
    @patch('bokeh.state._show_file_with_state')
    @patch('bokeh.browserlib.get_browser_controller')
    def test_no_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_server_with_state,
            mock__show_notebook_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = state.State()

        s.output_file("foo.html")
        state._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_with_state.called)
        self.assertFalse(mock__show_server_with_state.called)
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

        s._session = Mock
        state._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_with_state.called)
        self._check_func_called(mock__show_server_with_state, ("obj", s, "new", "controller"), {})
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

class Test_ShowFileWithState(DefaultStateTester):

    @patch('os.path.abspath')
    @patch('bokeh.state.save')
    def test(self, mock_save, mock_abspath):
        s = state.State()
        s.output_file("foo.html")
        controller = Mock()
        mock_abspath.return_value = "abspath"

        state._show_file_with_state("obj", s, "window", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://abspath",), {"new": 1})

        state._show_file_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_save, ("obj",), {"state": s})
        self._check_func_called(controller.open, ("file://abspath",), {"new": 2})

class Test_ShowNotebookWithState(DefaultStateTester):

    @patch('bokeh.state.publish_display_data')
    @patch('bokeh.state.autoload_server')
    @patch('bokeh.state.push')
    def test_with_server(self, mock_push, mock_autoload_server, mock_publish_display_data):
        s = state.State()
        s._session = Mock()
        mock_autoload_server.return_value = "snippet"

        state._show_notebook_with_state("obj", s)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(mock_publish_display_data, ({"text/html":"snippet"},), {})

    @patch('bokeh.state.publish_display_data')
    @patch('bokeh.state.notebook_div')
    def test_no_server(self, mock_notebook_div, mock_publish_display_data):
        s = state.State()
        s._session = None
        mock_notebook_div.return_value = "notebook_div"

        state._show_notebook_with_state("obj", s)
        self._check_func_called(mock_publish_display_data, ({"text/html": "notebook_div"},), {})

class Test_ShowServerWithState(DefaultStateTester):

    @patch('bokeh.state.push')
    def test(self, mock_push):
        s = state.State()
        s._session = Mock()
        s._session.object_link.return_value = "link"
        controller = Mock()

        state._show_server_with_state("obj", s, "window", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("link",), {"new": 1})

        state._show_server_with_state("obj", s, "tab", controller)
        self._check_func_called(mock_push, (), {"state": s})
        self._check_func_called(controller.open, ("link",), {"new": 2})

class TestResetOutput(DefaultStateTester):

    def test(self):
        state.reset_output()
        self.assertTrue(state._state.reset.called)

if __name__ == "__main__":
    unittest.main()
