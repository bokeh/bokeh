#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from mock import patch
import unittest

from bokeh.document import Document

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
        self.assertTrue(s.output_server.called)
        self.assertEqual(s.output_server.call_args[0], ("docname",))
        self.assertEqual(s.output_server.call_args[1], kwargs)

        mock_ctime.return_value = "NOW"
        s.output_notebook(**kwargs)
        self.assertTrue(s.output_server.called)
        self.assertEqual(s.output_server.call_args[0], ("IPython Session at NOW",))
        self.assertEqual(s.output_server.call_args[1], kwargs)

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

if __name__ == "__main__":
    unittest.main()
