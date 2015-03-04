from __future__ import absolute_import, print_function

import subprocess

from os.path import join, dirname, pardir
from unittest import TestCase, skipIf

try:
    import IPython
except ImportError:
    is_IPython = False
else:
    is_IPython = True

class TestExamples(TestCase):

    def test_examples(self):
        script = join(dirname(__file__), "test")
        proc = subprocess.Popen(["python", script])
        self.assertEqual(proc.wait(), 0, "examples do *NOT* work properly")

    @skipIf(not is_IPython, "IPython is required to run this test")
    def test_nbexecuter(self):
        from . import nbexecuter
        example_dir = join(dirname(__file__), pardir, pardir, 'examples')
        example_nbconverted = join(example_dir, "glyphs", "glyph.ipynb")
        nbexecuter.main(example_nbconverted)
