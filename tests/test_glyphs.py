import unittest

from bokeh.properties import HasProps
from bokeh.glyphs import DataSpec, Glyph

class TestGlyphs(unittest.TestCase):

    def test_dataspec(self):
        class Foo(HasProps):
            x = DataSpec("xfield")
            y = DataSpec("yfield", default=12)
        f = Foo()
        self.assertEqual(f.x, "xfield")
        self.assertEqual(f.y, {"field":"yfield", "default":12})
        f.x = 15
        self.assertEqual(f.x, 15)

if __name__ == "__main__":
    unittest.main()

