from __future__ import absolute_import

import unittest

class TestContents(unittest.TestCase):

    def test_dir(self):
        import bokeh
        names = dir(bokeh)
        self.assertTrue("__version__" in names)
        self.assertTrue("__base_version__" in names)
        self.assertTrue("test" in names)
        self.assertTrue("sampledata" in names)

    def test_version_defined(self):
        import bokeh
        self.assertTrue(bokeh.__version__ != 'unknown')

if __name__ == "__main__":
    unittest.main()
