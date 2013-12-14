import unittest

class TestBaseGlyph(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import BaseGlyph
        self.testGylph = BaseGlyph()        

    def test_expected_properties(self):
        bgProperties = dir(self.testGylph)
        expectedProperties = ['visible','margin','halign','valign','radius_units','length_units','angle_units','start_angle_units','end_angle_units']
        for prop in expectedProperties:
            if prop not in bgProperties:
                raise Exception('%s not in BaseGlyph properties' %prop)
                
        self.assertEqual(self.testGylph.radius_units, 'screen')
        self.assertEqual(self.testGylph.length_units, 'screen')
        self.assertEqual(self.testGylph.angle_units, 'deg')
        self.assertEqual(self.testGylph.start_angle_units, 'deg')
        self.assertEqual(self.testGylph.end_angle_units, 'deg')        

    def test_to_gylphspec(self):
        self.assertEqual(self.testGylph.to_glyphspec(), {'type':'BaseGlyph'})


if __name__ == "__main__":
    unittest.main()
