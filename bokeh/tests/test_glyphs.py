import unittest

#Glyph Baseclasses
class TestBaseGlyph(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import BaseGlyph
        self.testGlyph = BaseGlyph()        

    def test_expected_properties(self):
        bgProperties = dir(self.testGlyph)
        expectedProperties = ['visible','margin','halign','valign','radius_units','length_units','angle_units','start_angle_units','end_angle_units']
        for prop in expectedProperties:
            if prop not in bgProperties:
                raise Exception('%s not in BaseGlyph properties' %prop)
                
        self.assertEqual(self.testGlyph.radius_units, 'screen')        
        self.assertEqual(self.testGlyph.length_units, 'screen')        
        self.assertEqual(self.testGlyph.angle_units, 'deg')        
        self.assertEqual(self.testGlyph.start_angle_units, 'deg')        
        self.assertEqual(self.testGlyph.end_angle_units, 'deg')

        self.testGlyph.radius_units = 'data'   
        self.testGlyph.length_units = 'data'
        self.testGlyph.angle_units = 'rad'
        self.testGlyph.start_angle_units = 'rad'
        self.testGlyph.end_angle_units = 'rad'     

    def test_to_gylphspec(self):
        self.assertEqual(self.testGlyph.to_glyphspec(), {'type':'BaseGlyph'})

#Basic Shapes
class TestMarker(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Marker
        self.testMarker = Marker()

    def test_expected_properties(self):
        markerProperties = dir(self.testMarker)
        expectedProperties = ['x','y','size']
        for prop in expectedProperties:
            if prop not in markerProperties:
                raise Exception('%s not in Marker properties' %prop)
        self.assertEqual(self.testMarker.size , {'default':4,'field':None})
        self.assertEqual(self.testMarker.x ,'x')
        self.assertEqual(self.testMarker.y ,'y')

class TestCircle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Circle
        self.testCircle = Circle()

    def test_expected_properties(self):        
        if 'radius' not in dir(self.testCircle):
            raise Exception('radius not in Circle properties')
        self.assertEqual(self.testCircle.radius , {'default':4,'field':None})
        self.assertEqual(self.testCircle.__view_model__,'circle')

class TestSquare(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Square
        self.testSquare = Square()

    def test_expected_properties(self):
        if 'angle' not in dir(self.testSquare): 
            raise Exception('angle not in Square properties')
        self.assertEqual(self.testSquare.__view_model__,'square')

class TestTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Triangle
        self.testTriangle = Triangle()

    def test_expected_properties(self):
        self.assertEqual(self.testTriangle.__view_model__,'triangle')

class TestCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Cross
        self.testCross = Cross()

    def test_expected_properties(self):
        self.assertEqual(self.testCross.__view_model__,'cross')

class TestXmarker(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Xmarker
        self.testXmarker = Xmarker()

    def test_expected_properties(self):
        self.assertEqual(self.testXmarker.__view_model__,'x')

class TestDiamond(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Diamond
        self.testDiamond = Diamond()

    def test_expected_properties(self):
        self.assertEqual(self.testDiamond.__view_model__,'diamond')

class TestInvertedTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import InvertedTriangle
        self.testInvertedTriangle = InvertedTriangle()

    def test_expected_properties(self):
        self.assertEqual(self.testInvertedTriangle.__view_model__,'inverted_triangle')

class TestSquareX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareX
        self.testSquareX = SquareX()

    def test_expected_properties(self):
        self.assertEqual(self.testSquareX.__view_model__,'square_x')

class TestAsterisk(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Asterisk
        self.testAsterisk = Asterisk()

    def test_expected_properties(self):
        self.assertEqual(self.testAsterisk.__view_model__,'asterisk')

class TestDiamondCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import DiamondCross
        self.testDiamondCross = DiamondCross()

    def test_expected_properties(self):
        self.assertEqual(self.testDiamondCross.__view_model__,'diamond_cross')

class TestCircleCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleCross
        self.testCircleCross =CircleCross()

    def test_expected_properties(self):
        self.assertEqual(self.testCircleCross.__view_model__,'circle_cross')

class TestHexStar(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import HexStar
        self.testHexStar = HexStar()

    def test_expected_properties(self):
        self.assertEqual(self.testHexStar.__view_model__,'hexstar')

class TestSquareCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareCross
        self.testSquareCross = SquareCross()

    def test_expected_properties(self):
        self.assertEqual(self.testSquareCross.__view_model__,'square_cross')

class TestCircleX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleX
        self.testCircleX = CircleX()

    def test_expected_properties(self):
        self.assertEqual(self.testCircleX.__view_model__,'circle_x')

#More complicated shapes
class AnnularWedge(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import AnnularWedge
        self.testAnnularWedge = AnnularWedge()

    def test_expected_properties(self):
        annularWedgeProperties = dir(self.testAnnularWedge)
        expectedProperties = ['x','y','inner_radius','outer_radius','start_angle','end_angle','direction']
        for prop in expectedProperties:
            if prop not in annularWedgeProperties:
                raise Exception('%s not in Marker properties' %prop)
        self.assertEqual(self.testAnnularWedge.__view_model__,'annular_wedge')
        self.assertEqual(self.testAnnularWedge.x,'x')
        self.assertEqual(self.testAnnularWedge.y,'y')
        self.assertEqual(self.testAnnularWedge.inner_radius, None)
        self.assertEqual(self.testAnnularWedge.outer_radius,None)
        self.assertEqual(self.testAnnularWedge.start_angle,'start_angle')
        self.assertEqual(self.testAnnularWedge.end_angle,'end_angle')

        self.assertEqual(self.testAnnularWedge.direction,'clock')
        self.testAnnularWedge.direction = 'anticlock'

    def test_to_glyphspec(self):
        self.assertEqual(self.testAnnularWedge.to_glyphspec(),{'line_color': {'value': 'black'}, 'fill_color': {'value': 'gray'}, 'start_angle': {'units': 'data', 'field': 'start_angle'}, 'end_angle': {'units': 'data', 'field': 'end_angle'}, 'outer_radius': {'units': 'data', 'field': None}, 'y': {'units': 'data', 'field': 'y'}, 'x': {'units': 'data', 'field': 'x'}, 'type': 'annular_wedge', 'inner_radius': {'units': 'data', 'field': None}})


if __name__ == "__main__":
    unittest.main()
