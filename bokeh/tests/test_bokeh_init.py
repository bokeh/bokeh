from __future__ import absolute_import, print_function

import unittest
import sys

class TestContents(unittest.TestCase):

    def test_dir(self):
        import bokeh
        names = dir(bokeh)
        self.assertTrue("__version__" in names)
        self.assertTrue("__base_version__" in names)
        self.assertTrue("license" in names)
        self.assertTrue("test" in names)
        self.assertTrue("sampledata" in names)

    def test_version_defined(self):
        import bokeh
        self.assertTrue(bokeh.__version__ != 'unknown')

    def test_license(self):
        import bokeh
        try:
            bokeh.license()
        except Exception as e:
            print("If LICENSE.txt does not exist in bokeh/ subdir, one way to fix this may be to run 'python setup.py develop'", file=sys.stderr)
            raise e

if __name__ == "__main__":
    unittest.main()
