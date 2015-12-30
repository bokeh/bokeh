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
from bokeh.resources import DEFAULT_SERVER_HTTP_URL

import bokeh.core.state as state

GENERATED_SESSION_ID_LEN = 44

class TestState(unittest.TestCase):

    def test_creation(self):
        s = state.State()
        self.assertTrue(isinstance(s.document, Document))
        self.assertEqual(s.file, None)
        self.assertEqual(s.notebook, False)
        self.assertEqual(GENERATED_SESSION_ID_LEN, len(s.session_id))

    def test_default_file_resources(self):
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['resources'].minified, True)

    def test_output_file(self):
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['filename'], "foo.html")
        self.assertEqual(s.autosave, False)
        self.assertEqual(s.file['title'], "Bokeh Plot")
        self.assertEqual(s.file['resources'].log_level, 'info')
        self.assertEqual(s.file['resources'].minified, True)

    @patch('bokeh.core.state.logger')
    @patch('os.path.isfile')
    def test_output_file_file_exists(self, mock_isfile, mock_logger):
        mock_isfile.return_value = True
        s = state.State()
        s.output_file("foo.html")
        self.assertEqual(s.file['filename'], "foo.html")
        self.assertEqual(s.autosave, False)
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
        self.assertEqual(GENERATED_SESSION_ID_LEN, len(s.session_id))
        self.assertEqual(s.notebook, True)

    def test_output_server(self):
        s = state.State()
        self.assertEqual(GENERATED_SESSION_ID_LEN, len(s.session_id))
        s.output_server()
        self.assertEqual(s.session_id, "default")
        self.assertEqual(s.server_url + "/", DEFAULT_SERVER_HTTP_URL)
        self.assertEqual(s.app_path, '/')
        s.output_server("foo")
        self.assertEqual(s.session_id, "foo")
        self.assertEqual(s.server_url + "/", DEFAULT_SERVER_HTTP_URL)
        self.assertEqual(s.app_path, '/')

    def test_reset(self):
        s = state.State()
        d = s.document
        s.output_file("foo.html")
        s.output_server("default")
        s.output_notebook()
        s.reset()
        self.assertEqual(s.file, None)
        self.assertEqual(s.notebook, False)
        self.assertEqual(GENERATED_SESSION_ID_LEN, len(s.session_id))
        self.assertTrue(isinstance(s.document, Document))
        self.assertTrue(s.document != d)

if __name__ == "__main__":
    unittest.main()
