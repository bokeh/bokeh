from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import ScriptHandler
from bokeh.document import Document
from bokeh.util.testing import with_file_contents

class TestScriptHandler(unittest.TestCase):

    def test_runner_uses_source_from_filename(self):
        doc = Document()
        source = "# Test contents for script"
        result = {}
        def load(filename):
            handler = ScriptHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        with_file_contents(source, load)

        assert result['handler']._runner.path == result['filename']
        assert result['handler']._runner.source == source
        assert not doc.roots

    def test_runner_script_with_encoding(self):
        doc = Document()
        source = "# -*- coding: utf-8 -*-\nimport os"
        result = {}
        def load(filename):
            handler = ScriptHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        with_file_contents(source, load)

        assert result['handler'].error is None
        assert result['handler'].failed is False
        assert not doc.roots
