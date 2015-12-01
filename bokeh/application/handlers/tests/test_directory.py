from __future__ import absolute_import, print_function

import unittest

import tempfile
import shutil
import os.path

from bokeh.application.handlers import DirectoryHandler
from bokeh.document import Document

class TmpDir(object):
    def __init__(self, prefix):
        self._dir = tempfile.mkdtemp(prefix=prefix)

    def __exit__(self, type, value, traceback):
        shutil.rmtree(path=self._dir)

    def __enter__(self):
        return self._dir

def _with_directory_contents(contents, func):
    def with_file_object(f):
        f.write(contents.encode("UTF-8"))
        f.flush()
        func(f.name)
    with (TmpDir(prefix="bokeh-directory-handler-test")) as dirname:
        for filename, file_content in contents.items():
            f = open(os.path.join(dirname, filename), 'w')
            f.write(file_content)
            f.flush()
        func(dirname)

script_adds_two_roots = """
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.properties import Int, Instance

class AnotherModelInTestDirectory(Model):
    bar = Int(1)

class SomeModelInTestDirectory(Model):
    foo = Int(2)
    child = Instance(Model)

curdoc().add_root(AnotherModelInTestDirectory())
curdoc().add_root(SomeModelInTestDirectory())
"""

class TestDirectoryHandler(unittest.TestCase):

    def test_directory_empty_mainpy(self):
        doc = Document()
        def load(filename):
            handler = DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        _with_directory_contents({
            'main.py' : "# This script does nothing"
        }, load)

        assert not doc.roots

    def test_directory_mainpy_adds_roots(self):
        doc = Document()
        def load(filename):
            handler = DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        _with_directory_contents({
            'main.py' : script_adds_two_roots
        }, load)

        assert len(doc.roots) == 2
