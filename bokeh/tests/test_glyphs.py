import unittest,inspect

def getPropSet(class_object):
    #all this does is get a list of every property implemented by the object that is not present in the baseclasses of said object
    #note it wont detect overridden properties!
    baseClasses = list(inspect.getmro(class_object))
    baseClasses.remove(class_object)
    baseProperties = []
    for baseClass in baseClasses:
        baseProperties.extend(dir(baseClass))
    classProperties = set(dir(class_object)).difference(set(baseProperties))
    return classProperties


#Glyph Baseclasses
class TestBaseGlyph(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import BaseGlyph
        self.testGlyph = BaseGlyph()        

    def test_expected_properties(self):
        expectedProperties = set(['visible','margin','halign','valign','radius_units','length_units','angle_units','start_angle_units','end_angle_units'])
        actualProperties = getPropSet(type(self.testGlyph))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):                
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
        expectedProperties = set(['x','y','size'])
        actualProperties = getPropSet(type(self.testMarker))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testMarker.size , {'default':4,'field':None})
        self.assertEqual(self.testMarker.x ,'x')
        self.assertEqual(self.testMarker.y ,'y')

class TestCircle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Circle
        self.testCircle = Circle()

    def test_expected_properties(self):        
        expectedProperties = set(['radius'])
        actualProperties = getPropSet(type(self.testCircle))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testCircle.radius , {'default':4,'field':None})
        self.assertEqual(self.testCircle.__view_model__,'circle')

class TestSquare(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Square
        self.testSquare = Square()

    def test_expected_properties(self):
        expectedProperties = set(['angle'])
        actualProperties = getPropSet(type(self.testSquare))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testSquare.__view_model__,'square')

class TestTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Triangle
        self.testTriangle = Triangle()

    def test_expected_values(self):
        self.assertEqual(self.testTriangle.__view_model__,'triangle')

class TestCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Cross
        self.testCross = Cross()

    def test_expected_values(self):
        self.assertEqual(self.testCross.__view_model__,'cross')

class TestXmarker(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Xmarker
        self.testXmarker = Xmarker()

    def test_expected_values(self):
        self.assertEqual(self.testXmarker.__view_model__,'x')

class TestDiamond(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Diamond
        self.testDiamond = Diamond()

    def test_expected_values(self):
        self.assertEqual(self.testDiamond.__view_model__,'diamond')

class TestInvertedTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import InvertedTriangle
        self.testInvertedTriangle = InvertedTriangle()

    def test_expected_values(self):
        self.assertEqual(self.testInvertedTriangle.__view_model__,'inverted_triangle')

class TestSquareX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareX
        self.testSquareX = SquareX()

    def test_expected_values(self):
        self.assertEqual(self.testSquareX.__view_model__,'square_x')

class TestAsterisk(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Asterisk
        self.testAsterisk = Asterisk()

    def test_expected_values(self):
        self.assertEqual(self.testAsterisk.__view_model__,'asterisk')

class TestDiamondCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import DiamondCross
        self.testDiamondCross = DiamondCross()

    def test_expected_values(self):
        self.assertEqual(self.testDiamondCross.__view_model__,'diamond_cross')

class TestCircleCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleCross
        self.testCircleCross =CircleCross()

    def test_expected_values(self):
        self.assertEqual(self.testCircleCross.__view_model__,'circle_cross')

class TestHexStar(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import HexStar
        self.testHexStar = HexStar()

    def test_expected_values(self):
        self.assertEqual(self.testHexStar.__view_model__,'hexstar')

class TestSquareCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareCross
        self.testSquareCross = SquareCross()

    def test_expected_values(self):
        self.assertEqual(self.testSquareCross.__view_model__,'square_cross')

class TestCircleX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleX
        self.testCircleX = CircleX()

    def test_expected_values(self):
        self.assertEqual(self.testCircleX.__view_model__,'circle_x')

#More complicated shapes
class TestAnnularWedge(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import AnnularWedge
        self.testAnnularWedge = AnnularWedge()

    def test_expected_properties(self):
        annularWedgeProperties = dir(self.testAnnularWedge)
        expectedProperties = set(['x','y','inner_radius','outer_radius','start_angle','end_angle','direction'])
        actualProperties = getPropSet(type(self.testAnnularWedge))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
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

class TestAnnulus(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Annulus
        self.testAnnulus = Annulus()

    def test_expected_properties(self):
        annulusProperties = dir(self.testAnnulus)
        expectedProperties = set(['x','y','inner_radius','outer_radius'])
        actualProperties = getPropSet(type(self.testAnnulus))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testAnnulus.__view_model__,'annulus')
        self.assertEqual(self.testAnnulus.x,'x')
        self.assertEqual(self.testAnnulus.y,'y')
        self.assertEqual(self.testAnnulus.inner_radius,None)
        self.assertEqual(self.testAnnulus.outer_radius,None)

class TestArc(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Arc
        self.testArc = Arc()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','radius','start_angle','end_angle','direction'])
        actualProperties = getPropSet(type(self.testArc))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testArc.__view_model__,'arc')
        self.assertEqual(self.testArc.x,'x')
        self.assertEqual(self.testArc.y,'y')
        self.assertEqual(self.testArc.radius,None)
        self.assertEqual(self.testArc.start_angle,'start_angle')
        self.assertEqual(self.testArc.end_angle,'end_angle')
        self.assertEqual(self.testArc.direction,'clock')
        self.testArc.direction = 'anticlock'

class TestBezier(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Bezier
        self.testBezier = Bezier()

    def test_expected_properties(self):
        bezierProperties = dir(self.testBezier)
        expectedProperties = set(['x0','y0','x1','y1','cx0','cy0','cx1','cy1'])
        actualProperties = getPropSet(type(self.testBezier))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testBezier.__view_model__,'bezier')
        self.assertEqual(self.testBezier.x0,'x0')
        self.assertEqual(self.testBezier.y0,'y0')
        self.assertEqual(self.testBezier.x1,'x1')
        self.assertEqual(self.testBezier.y1,'y1')
        self.assertEqual(self.testBezier.cx0,'cx0')
        self.assertEqual(self.testBezier.cy0,'cy0')
        self.assertEqual(self.testBezier.cx1,'cx1')
        self.assertEqual(self.testBezier.cy1,'cy1')     

class TestImageURI(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import ImageURI
        self.testImageURI = ImageURI()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','angle',])
        actualProperties = getPropSet(type(self.testImageURI))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testImageURI.__view_model__,'image_uri')
        self.assertEqual(self.testImageURI.x,'x')
        self.assertEqual(self.testImageURI.y,'y')
        self.assertEqual(self.testImageURI.angle,'angle')

class TestImageRGBA(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import ImageRGBA
        self.testImageRGBA = ImageRGBA()

    def test_expected_properties(self):
        expectedProperties = set(['image','width','height','x','y','dw','dh',])
        actualProperties = getPropSet(type(self.testImageRGBA))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testImageRGBA.image,'image')
        self.assertEqual(self.testImageRGBA.width,'width')
        self.assertEqual(self.testImageRGBA.height,'height')
        self.assertEqual(self.testImageRGBA.x,'x')
        self.assertEqual(self.testImageRGBA.y,'y')
        self.assertEqual(self.testImageRGBA.dw,'dw')
        self.assertEqual(self.testImageRGBA.dh,'dh')
        self.assertEqual(self.testImageRGBA.__view_model__,'image_rgba')

class TestLine(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Line
        self.testLine = Line()

    def test_expected_properties(self):
        expectedProperties = set(['x','y'])
        actualProperties = getPropSet(type(self.testLine))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testLine.x,'x')
        self.assertEqual(self.testLine.y,'y')
        self.assertEqual(self.testLine.__view_model__,'line')

class TestMultiLine(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import MultiLine
        self.testMultiLine = MultiLine()

    def test_expected_properties(self):
        expectedProperties = set(['xs','ys'])
        actualProperties = getPropSet(type(self.testMultiLine))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testMultiLine.xs,'xs')
        self.assertEqual(self.testMultiLine.ys,'ys')
        self.assertEqual(self.testMultiLine.__view_model__,'multi_line')

class TestOval(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Oval
        self.testOvale = Oval()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','width','height','angle'])
        actualProperties = getPropSet(type(self.testOvale))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testOvale.x,'x')
        self.assertEqual(self.testOvale.y,'y')
        self.assertEqual(self.testOvale.width,'width')
        self.assertEqual(self.testOvale.height,'height')
        self.assertEqual(self.testOvale.angle,'angle')
        self.assertEqual(self.testOvale.__view_model__,'oval')

class TestPatch(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Patch
        self.testPatch = Patch()

    def test_expected_properties(self):
        expectedProperties = set(['x','y'])
        actualProperties = getPropSet(type(self.testPatch))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testPatch.x,'x')
        self.assertEqual(self.testPatch.y,'y')
        self.assertEqual(self.testPatch.__view_model__,'patch')

class TestPatches(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Patches
        self.testPatches = Patches()

    def test_expected_properties(self):
        expectedProperties = set(['xs','ys'])
        actualProperties = getPropSet(type(self.testPatches))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testPatches.xs,'xs')
        self.assertEqual(self.testPatches.ys,'ys')
        self.assertEqual(self.testPatches.__view_model__,'patches')

class TestQuad(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Quad
        self.testQuad = Quad()

    def test_expected_properties(self):
        expectedProperties = set(['left','right','bottom','top'])
        actualProperties = getPropSet(type(self.testQuad))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testQuad.left,'left')
        self.assertEqual(self.testQuad.right,'right')
        self.assertEqual(self.testQuad.bottom,'bottom')
        self.assertEqual(self.testQuad.top,'top')
        self.assertEqual(self.testQuad.__view_model__,'quad')

class TestQuadratic(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Quadratic
        self.testQuadratic = Quadratic()

    def test_expected_properties(self):
        expectedProperties = set(['x0','y0','x1','y1','cx','cy'])
        actualProperties = getPropSet(type(self.testQuadratic))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testQuadratic.x0,'x0')
        self.assertEqual(self.testQuadratic.y0,'y0')
        self.assertEqual(self.testQuadratic.x1,'x1')
        self.assertEqual(self.testQuadratic.y1,'y1')
        self.assertEqual(self.testQuadratic.cx,'cx')
        self.assertEqual(self.testQuadratic.cy,'cy')
        self.assertEqual(self.testQuadratic.__view_model__,'quadratic')

class TestRay(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Ray
        self.testRay = Ray()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','angle','length'])
        actualProperties = getPropSet(type(self.testRay))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testRay.x,'x')
        self.assertEqual(self.testRay.y,'y')
        self.assertEqual(self.testRay.angle,'angle')
        self.assertEqual(self.testRay.length,'length')
        self.assertEqual(self.testRay.__view_model__,'ray')


class TestRect(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Rect
        self.testRect = Rect()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','width','height','angle'])
        actualProperties = getPropSet(type(self.testRect))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testRect.x,'x')
        self.assertEqual(self.testRect.y,'y')
        self.assertEqual(self.testRect.width,'width')
        self.assertEqual(self.testRect.height,'height')   
        self.assertEqual(self.testRect.angle,'angle')
        self.assertEqual(self.testRect.__view_model__,'rect')

class TestSegment(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Segment
        self.testSegment = Segment()

    def test_expected_properties(self):
        expectedProperties = set(['x0','y0','x1','y1'])
        actualProperties = getPropSet(type(self.testSegment))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testSegment.x0,'x0')
        self.assertEqual(self.testSegment.y0,'y0')
        self.assertEqual(self.testSegment.x1,'x1')
        self.assertEqual(self.testSegment.y1,'y1')
        self.assertEqual(self.testSegment.__view_model__,'segment')

class TestText(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Text
        self.testText = Text()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','text','angle'])
        actualProperties = getPropSet(type(self.testText))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testText.x,'x')
        self.assertEqual(self.testText.y,'y')
        self.assertEqual(self.testText.text,None)
        self.assertEqual(self.testText.angle,'angle')
        self.assertEqual(self.testText.__view_model__,'text')

class TestWedge(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Wedge
        self.testWedge = Wedge()

    def test_expected_properties(self):
        expectedProperties = set(['x','y','radius','start_angle','end_angle','direction'])
        actualProperties = getPropSet(type(self.testWedge))
        self.assertTrue(expectedProperties.issubset(actualProperties))

    def test_expected_values(self):
        self.assertEqual(self.testWedge.x,'x')
        self.assertEqual(self.testWedge.y,'y')
        self.assertEqual(self.testWedge.radius,None)
        self.assertEqual(self.testWedge.start_angle,'start_angle')
        self.assertEqual(self.testWedge.end_angle,'end_angle')
        self.assertEqual(self.testWedge.__view_model__,'wedge')

        self.assertEqual(self.testWedge.direction,'clock')
        self.testWedge.direction = 'anticlock'


if __name__ == "__main__":
    unittest.main()
