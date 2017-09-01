#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import
from mock import patch, Mock, PropertyMock
import os

from PIL import Image
import pytest
import selenium.webdriver as webdriver
import unittest

import bokeh.io as io

from bokeh.application.application import Application
from bokeh.resources import Resources
from bokeh.models.plots import Plot
from bokeh.models import Range1d

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

class TestOutputJupyter(DefaultStateTester):

    @patch('bokeh.io.load_notebook')
    def test_noarg(self, mock_load_notebook):
        # call _install_notebook_hook to register the patched `bokeh.io.load_notebook`
        from bokeh.io import _install_notebook_hook
        _install_notebook_hook()
        default_load_jupyter_args = (None, False, False, 5000)
        io.output_notebook()
        self._check_func_called(io._state.output_notebook, ('jupyter',), {})
        self._check_func_called(mock_load_notebook, default_load_jupyter_args, {'notebook_type': 'jupyter'})

    @patch('bokeh.io.load_notebook')
    def test_args(self, mock_load_notebook):
        # call _install_notebook_hook to register the patched `bokeh.io.load_notebook`
        from bokeh.io import _install_notebook_hook
        _install_notebook_hook()
        load_jupyter_args = (Resources(), True, True, 1000)
        io.output_notebook(*load_jupyter_args)
        self._check_func_called(io._state.output_notebook, ('jupyter',), {})
        self._check_func_called(mock_load_notebook, load_jupyter_args, {'notebook_type': 'jupyter'})

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

    @patch('io.open')
    @patch('bokeh.io.file_html')
    def test_save_helper_method(self, mock_file_html, mock_io_open):
        obj = Plot()
        filename, resources, title = io._get_save_args(io._state, "filename", "resources", "title")

        io._save_helper(obj, filename, resources, title)

        self._check_func_called(mock_file_html,
                                (obj, resources),
                                {"title": "title"})
        self._check_func_called(mock_io_open,
                                (filename,),
                                {"mode":"w", "encoding":"utf-8"})

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

    @patch('bokeh.io._run_notebook_hook')
    def test_show_with_app(self, mock__run_notebook_hook):
        app = Application()
        io.show(app, notebook_url="baz")
        io._state.notebook_type == "foo"
        self.assertTrue(mock__run_notebook_hook.called)
        self.assertEqual(mock__run_notebook_hook.call_args[0][0], io._state.notebook_type)
        self.assertEqual(mock__run_notebook_hook.call_args[0][1:], ("app", app, io._state, "baz"))
        self.assertEqual(mock__run_notebook_hook.call_args[1], {})

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

    @patch('bokeh.io._show_notebook_doc_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.util.browser.get_browser_controller')
    def test_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_notebook_doc_with_state):
        mock_get_browser_controller.return_value = "controller"
        s = io.State()
        s.output_notebook()
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_doc_with_state, ("obj", s, False), {})
        self.assertFalse(mock__show_file_with_state.called)

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self._check_func_called(mock__show_notebook_doc_with_state, ("obj", s, False), {})
        self._check_func_called(mock__show_file_with_state, ("obj", s, "new", "controller"), {})

    @patch('bokeh.io.get_comms')
    @patch('bokeh.io._show_notebook_doc_with_state')
    @patch('bokeh.io._show_file_with_state')
    @patch('bokeh.util.browser.get_browser_controller')
    def test_no_notebook(self, mock_get_browser_controller,
            mock__show_file_with_state, mock__show_notebook_doc_with_state,
            mock_get_comms):
        mock_get_browser_controller.return_value = "controller"
        mock_get_comms.return_value = "comms"
        s = io.State()

        s.output_file("foo.html")
        io._show_with_state("obj", s, "browser", "new")
        self.assertFalse(mock__show_notebook_doc_with_state.called)
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

class Test_ShowJupyterWithState(DefaultStateTester):

    @patch('bokeh.io.get_comms')
    @patch('bokeh.io.publish_display_data')
    @patch('bokeh.io.notebook_content')
    def test_no_server(self, mock_notebook_content, mock_publish_display_data, mock_get_comms):
        mock_get_comms.return_value = "comms"
        s = io.State()
        mock_notebook_content.return_value = ["notebook_script", "notebook_div"]

        class Obj(object):
            _id = None

        io._nb_loaded = True
        io._show_jupyter_doc_with_state(Obj(), s, True)
        io._nb_loaded = False

        expected_args = ({'application/javascript': 'notebook_script', 'application/vnd.bokehjs_exec.v0+json': ''},)
        expected_kwargs = {'metadata': {'application/vnd.bokehjs_exec.v0+json': {'id': None}}}

        self._check_func_called(mock_publish_display_data, expected_args, expected_kwargs)

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

def test__crop_image():
    image = Image.new(mode="RGBA", size=(10,10))
    rect = dict(left=2, right=8, top=3, bottom=7)
    cropped = io._crop_image(image, **rect)
    assert cropped.size == (6,4)

def test__save_layout_html_resets_plot_dims():
    initial_height, initial_width = 200, 250

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=initial_height, plot_width=initial_width)

    io._save_layout_html(layout, height=100, width=100)
    assert layout.plot_height == initial_height
    assert layout.plot_width == initial_width

def test__notebook_hooks():
    assert "jupyter" in io._notebook_hooks
    # TODO (bev) can be improved after load_notebook is simplified
    assert "load" in io._notebook_hooks["jupyter"]
    assert io._notebook_hooks["jupyter"]['doc'] == io._show_jupyter_doc_with_state
    assert io._notebook_hooks["jupyter"]['app'] == io._show_jupyter_app_with_state

def test_install_notebook_hook():
    io.install_notebook_hook("foo", "load", "doc", "app")
    assert io._notebook_hooks["foo"]['load'] == "load"
    assert io._notebook_hooks["foo"]['doc'] == "doc"
    assert io._notebook_hooks["foo"]['app'] == "app"
    with pytest.raises(RuntimeError):
        io.install_notebook_hook("foo", "load2", "doc2", "app2")
    io.install_notebook_hook("foo", "load2", "doc2", "app2", overwrite=True)
    assert io._notebook_hooks["foo"]['load'] == "load2"
    assert io._notebook_hooks["foo"]['doc'] == "doc2"
    assert io._notebook_hooks["foo"]['app'] == "app2"

@pytest.mark.unit
@pytest.mark.selenium
def test__get_screenshot_as_png():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    png = io._get_screenshot_as_png(layout)
    assert png.size == (20, 20)
    # a 20x20px image of transparent pixels
    assert png.tobytes() == ("\x00"*1600).encode()

@pytest.mark.unit
@pytest.mark.selenium
def test__get_screenshot_as_png_with_driver():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    driver = webdriver.PhantomJS(service_log_path=os.path.devnull)

    png = io._get_screenshot_as_png(layout, driver=driver)

    # Have to manually clean up the driver session
    driver.quit()

    assert png.size == (20, 20)
    # a 20x20px image of transparent pixels
    assert png.tobytes() == ("\x00"*1600).encode()

@pytest.mark.unit
@pytest.mark.selenium
def test__get_screenshot_as_png_large_plot():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=800, plot_width=800, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    driver = webdriver.PhantomJS(service_log_path=os.path.devnull)
    assert driver.get_window_size() == {'width': 400, 'height': 300}

    io._get_screenshot_as_png(layout, driver=driver)

    # LC: Although the window size doesn't match the plot dimensions (unclear
    # why), the window resize allows for the whole plot to be captured
    assert driver.get_window_size() == {'width': 1366, 'height': 768}

    # Have to manually clean up the driver session
    driver.quit()

@pytest.mark.unit
@pytest.mark.selenium
def test__get_svgs_no_svg_present():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
              plot_height=20, plot_width=20, toolbar_location=None)

    svgs = io._get_svgs(layout)
    assert svgs == []

@pytest.mark.unit
@pytest.mark.selenium
def test__get_svgs_with_svg_present():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, border_fill_color=None,
                  background_fill_color=None, output_backend="svg")

    svgs = io._get_svgs(layout)
    assert svgs[0] == ('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
                       'width="20" height="20" style="width: 20px; height: 20px;"><defs/><g><g/><g transform="scale(1,1) '
                       'translate(0.5,0.5)"><rect fill="#FFFFFF" stroke="none" x="0" y="0" width="20" height="20"/><g/><g/><g/><g/></g></g></svg>')

@pytest.mark.unit
@pytest.mark.selenium
def test__get_svgs_with_svg_present_with_driver():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, border_fill_color=None,
                  background_fill_color=None, output_backend="svg")

    driver = webdriver.PhantomJS(service_log_path=os.path.devnull)

    svgs = io._get_svgs(layout)

    # Have to manually clean up the driver session
    driver.quit()

    assert svgs[0] == ('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
                       'width="20" height="20" style="width: 20px; height: 20px;"><defs/><g><g/><g transform="scale(1,1) '
                       'translate(0.5,0.5)"><rect fill="#FFFFFF" stroke="none" x="0" y="0" width="20" height="20"/><g/><g/><g/><g/></g></g></svg>')

@patch('os.access')
def test__no_access(mock_access):
    import os
    io._no_access("test")
    assert mock_access.called
    assert mock_access.call_args[0] == ("test", os.W_OK | os.X_OK)
    assert mock_access.call_args[1] == {}

@patch('tempfile.NamedTemporaryFile')
def test__temp_filename(mock_tmp):
    fn = Mock()
    type(fn).name = PropertyMock(return_value="Junk.test")
    mock_tmp.return_value = fn

    r = io._temp_filename("test")
    assert r == "Junk.test"
    assert mock_tmp.called
    assert mock_tmp.call_args[0] == ()
    assert mock_tmp.call_args[1] == {'suffix': '.test'}

def test__shares_exec_prefix():
    import sys
    old_ex = sys.exec_prefix
    try:
        sys.exec_prefix = "/foo/bar"
        assert io._shares_exec_prefix("/foo/bar") == True
        sys.exec_prefix = "/baz/bar"
        assert io._shares_exec_prefix("/foo/bar") == False
        sys.exec_prefix = None
        assert io._shares_exec_prefix("/foo/bar") == False
    finally:
        sys.exec_prefix = old_ex

def test__detect_current_filename():
    assert io._detect_current_filename().endswith("py.test")

def test_default_filename():
    old__detect_current_filename = io._detect_current_filename
    old__no_access = io._no_access
    old__shares_exec_prefix = io._shares_exec_prefix

    io._detect_current_filename = lambda : "/a/b/foo.py"

    try:
        # .py extension
        with pytest.raises(RuntimeError):
            io.default_filename("py")

        # a current file, access, and no share exec
        io._no_access = lambda x: False
        r = io.default_filename("test")
        assert r == "/a/b/foo.test"

        # a current file, NO access, and no share exec
        io._no_access = lambda x: True
        r = io.default_filename("test")
        assert r != "/a/b/foo.test"
        assert r.endswith(".test")

        # a current file, access, but WITH share exec
        io._no_access = lambda x: False
        io._shares_exec_prefix = lambda x: True
        r = io.default_filename("test")
        assert r != "/a/b/foo.test"
        assert r.endswith(".test")

        # no current file
        io._detect_current_filename = lambda : None
        io._no_access = lambda x: False
        io._shares_exec_prefix = lambda x: False
        r = io.default_filename("test")
        assert r != "/a/b/foo.test"
        assert r.endswith(".test")

    finally:
        io._detect_current_filename = old__detect_current_filename
        io._no_access = old__no_access
        io._shares_exec_prefix = old__shares_exec_prefix
