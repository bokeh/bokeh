from __future__ import absolute_import, print_function

import os
import pytest
import subprocess

from os.path import join, dirname, pardir
from unittest import TestCase, skipIf

try:
    import notebook
except ImportError:
    is_notebook = False
else:
    is_notebook = True

@pytest.mark.examples
class TestExamples(TestCase):

    def test_examples(self):
        script = join(dirname(__file__), "test")
        proc = subprocess.Popen(["python", script])
        self.assertEqual(proc.wait(), 0, "examples do *NOT* work properly")

    @skipIf(not is_notebook, "Jupyter notebook is required to run this test")
    def test_nbexecuter(self):
        from . import nbexecuter

        example_dir = join(dirname(__file__), pardir, pardir, 'examples')
        example_nbconverted = join(example_dir, "glyphs", "glyph.ipynb")

        kernel_name = 'python2'
        pyver = os.environ.get('TRAVIS_PYTHON_VERSION')
        if pyver in ['3.4', '3.5']:
            kernel_name = 'python3'

        nbexecuter.main(example_nbconverted, kernel_name)
