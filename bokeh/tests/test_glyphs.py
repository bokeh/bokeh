import unittest,inspect

def get_prop_set(class_object):
    #all this does is get a list of every property implemented by the object that is not present in the baseclasses of said object
    #note it wont detect overridden properties!
    base_classes = list(inspect.getmro(class_object))
    base_classes.remove(class_object)
    base_properties = []
    for base_class in base_classes:
        base_properties.extend(dir(base_class))
    class_properties = set(dir(class_object)).difference(set(base_properties))
    return class_properties


#Glyph Baseclasses
class TestBaseGlyph(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import BaseGlyph
        self.test_glyph = BaseGlyph()        

    def test_expected_properties(self):
        expected_properties = set(['visible','margin','halign','valign','radius_units','length_units','angle_units','start_angle_units','end_angle_units'])
        actual_properties = get_prop_set(type(self.test_glyph))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):                
        self.assertEqual(self.test_glyph.radius_units, 'screen')        
        self.assertEqual(self.test_glyph.length_units, 'screen')        
        self.assertEqual(self.test_glyph.angle_units, 'deg')        
        self.assertEqual(self.test_glyph.start_angle_units, 'deg')        
        self.assertEqual(self.test_glyph.end_angle_units, 'deg')

        self.test_glyph.radius_units = 'data'   
        self.test_glyph.length_units = 'data'
        self.test_glyph.angle_units = 'rad'
        self.test_glyph.start_angle_units = 'rad'
        self.test_glyph.end_angle_units = 'rad'     

    def test_to_gylphspec(self):
        self.assertEqual(self.test_glyph.to_glyphspec(), {'type':'BaseGlyph'})

#Basic Shapes
class TestMarker(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Marker
        self.test_marker = Marker()

    def test_expected_properties(self):
        expected_properties = set(['x','y','size'])
        actual_properties = get_prop_set(type(self.test_marker))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_marker.size , {'default':4,'field':None})
        self.assertEqual(self.test_marker.x ,'x')
        self.assertEqual(self.test_marker.y ,'y')

class TestCircle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Circle
        self.test_circle = Circle()

    def test_expected_properties(self):        
        expected_properties = set(['radius'])
        actual_properties = get_prop_set(type(self.test_circle))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_circle.radius , {'default':4,'field':None})
        self.assertEqual(self.test_circle.__view_model__,'circle')

class TestSquare(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Square
        self.test_square = Square()

    def test_expected_properties(self):
        expected_properties = set(['angle'])
        actual_properties = get_prop_set(type(self.test_square))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_square.__view_model__,'square')

class TestTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Triangle
        self.test_triangle = Triangle()

    def test_expected_values(self):
        self.assertEqual(self.test_triangle.__view_model__,'triangle')

class TestCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Cross
        self.test_cross = Cross()

    def test_expected_values(self):
        self.assertEqual(self.test_cross.__view_model__,'cross')

class TestXmarker(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Xmarker
        self.test_x_marker = Xmarker()

    def test_expected_values(self):
        self.assertEqual(self.test_x_marker.__view_model__,'x')

class TestDiamond(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Diamond
        self.test_diamond = Diamond()

    def test_expected_values(self):
        self.assertEqual(self.test_diamond.__view_model__,'diamond')

class TestInvertedTriangle(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import InvertedTriangle
        self.test_inverted_triangle = InvertedTriangle()

    def test_expected_values(self):
        self.assertEqual(self.test_inverted_triangle.__view_model__,'inverted_triangle')

class TestSquareX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareX
        self.test_square_x = SquareX()

    def test_expected_values(self):
        self.assertEqual(self.test_square_x.__view_model__,'square_x')

class TestAsterisk(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Asterisk
        self.test_asterisk = Asterisk()

    def test_expected_values(self):
        self.assertEqual(self.test_asterisk.__view_model__,'asterisk')

class TestDiamondCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import DiamondCross
        self.test_diamond_cross = DiamondCross()

    def test_expected_values(self):
        self.assertEqual(self.test_diamond_cross.__view_model__,'diamond_cross')

class TestCircleCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleCross
        self.test_circle_cross =CircleCross()

    def test_expected_values(self):
        self.assertEqual(self.test_circle_cross.__view_model__,'circle_cross')

class TestHexStar(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import HexStar
        self.test_hex_star = HexStar()

    def test_expected_values(self):
        self.assertEqual(self.test_hex_star.__view_model__,'hexstar')

class TestSquareCross(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import SquareCross
        self.test_square_cross = SquareCross()

    def test_expected_values(self):
        self.assertEqual(self.test_square_cross.__view_model__,'square_cross')

class TestCircleX(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import CircleX
        self.test_circle_x = CircleX()

    def test_expected_values(self):
        self.assertEqual(self.test_circle_x.__view_model__,'circle_x')

#More complicated shapes
class TestAnnularWedge(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import AnnularWedge
        self.test_annular_wedge = AnnularWedge()

    def test_expected_properties(self):
        expected_properties = set(['x','y','inner_radius','outer_radius','start_angle','end_angle','direction'])
        actual_properties = get_prop_set(type(self.test_annular_wedge))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_annular_wedge.__view_model__,'annular_wedge')
        self.assertEqual(self.test_annular_wedge.x,'x')
        self.assertEqual(self.test_annular_wedge.y,'y')
        self.assertEqual(self.test_annular_wedge.inner_radius, None)
        self.assertEqual(self.test_annular_wedge.outer_radius,None)
        self.assertEqual(self.test_annular_wedge.start_angle,'start_angle')
        self.assertEqual(self.test_annular_wedge.end_angle,'end_angle')

        self.assertEqual(self.test_annular_wedge.direction,'clock')
        self.test_annular_wedge.direction = 'anticlock'

    def test_to_glyphspec(self):
        self.assertEqual(self.test_annular_wedge.to_glyphspec(),{'line_color': {'value': 'black'}, 'fill_color': {'value': 'gray'}, 'start_angle': {'units': 'data', 'field': 'start_angle'}, 'end_angle': {'units': 'data', 'field': 'end_angle'}, 'outer_radius': {'units': 'data', 'field': None}, 'y': {'units': 'data', 'field': 'y'}, 'x': {'units': 'data', 'field': 'x'}, 'type': 'annular_wedge', 'inner_radius': {'units': 'data', 'field': None}})

class TestAnnulus(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Annulus
        self.test_annulus = Annulus()

    def test_expected_properties(self):
        expected_properties = set(['x','y','inner_radius','outer_radius'])
        actual_properties = get_prop_set(type(self.test_annulus))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_annulus.__view_model__,'annulus')
        self.assertEqual(self.test_annulus.x,'x')
        self.assertEqual(self.test_annulus.y,'y')
        self.assertEqual(self.test_annulus.inner_radius,None)
        self.assertEqual(self.test_annulus.outer_radius,None)

class TestArc(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Arc
        self.test_arc = Arc()

    def test_expected_properties(self):
        expected_properties = set(['x','y','radius','start_angle','end_angle','direction'])
        actual_properties = get_prop_set(type(self.test_arc))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_arc.__view_model__,'arc')
        self.assertEqual(self.test_arc.x,'x')
        self.assertEqual(self.test_arc.y,'y')
        self.assertEqual(self.test_arc.radius,None)
        self.assertEqual(self.test_arc.start_angle,'start_angle')
        self.assertEqual(self.test_arc.end_angle,'end_angle')
        self.assertEqual(self.test_arc.direction,'clock')
        self.test_arc.direction = 'anticlock'

class TestBezier(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Bezier
        self.test_bezier = Bezier()

    def test_expected_properties(self):
        expected_properties = set(['x0','y0','x1','y1','cx0','cy0','cx1','cy1'])
        actual_properties = get_prop_set(type(self.test_bezier))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_bezier.__view_model__,'bezier')
        self.assertEqual(self.test_bezier.x0,'x0')
        self.assertEqual(self.test_bezier.y0,'y0')
        self.assertEqual(self.test_bezier.x1,'x1')
        self.assertEqual(self.test_bezier.y1,'y1')
        self.assertEqual(self.test_bezier.cx0,'cx0')
        self.assertEqual(self.test_bezier.cy0,'cy0')
        self.assertEqual(self.test_bezier.cx1,'cx1')
        self.assertEqual(self.test_bezier.cy1,'cy1')     

class TestImageURI(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import ImageURI
        self.test_imageuri = ImageURI()

    def test_expected_properties(self):
        expected_properties = set(['x','y','angle',])
        actual_properties = get_prop_set(type(self.test_imageuri))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_imageuri.__view_model__,'image_uri')
        self.assertEqual(self.test_imageuri.x,'x')
        self.assertEqual(self.test_imageuri.y,'y')
        self.assertEqual(self.test_imageuri.angle,'angle')

class TestImageRGBA(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import ImageRGBA
        self.test_imagergba = ImageRGBA()

    def test_expected_properties(self):
        expected_properties = set(['image','width','height','x','y','dw','dh',])
        actual_properties = get_prop_set(type(self.test_imagergba))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_imagergba.image,'image')
        self.assertEqual(self.test_imagergba.width,'width')
        self.assertEqual(self.test_imagergba.height,'height')
        self.assertEqual(self.test_imagergba.x,'x')
        self.assertEqual(self.test_imagergba.y,'y')
        self.assertEqual(self.test_imagergba.dw,'dw')
        self.assertEqual(self.test_imagergba.dh,'dh')
        self.assertEqual(self.test_imagergba.__view_model__,'image_rgba')

class TestLine(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Line
        self.test_line = Line()

    def test_expected_properties(self):
        expected_properties = set(['x','y'])
        actual_properties = get_prop_set(type(self.test_line))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_line.x,'x')
        self.assertEqual(self.test_line.y,'y')
        self.assertEqual(self.test_line.__view_model__,'line')

class TestMultiLine(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import MultiLine
        self.test_multiline = MultiLine()

    def test_expected_properties(self):
        expected_properties = set(['xs','ys'])
        actual_properties = get_prop_set(type(self.test_multiline))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_multiline.xs,'xs')
        self.assertEqual(self.test_multiline.ys,'ys')
        self.assertEqual(self.test_multiline.__view_model__,'multi_line')

class TestOval(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Oval
        self.test_ovale = Oval()

    def test_expected_properties(self):
        expected_properties = set(['x','y','width','height','angle'])
        actual_properties = get_prop_set(type(self.test_ovale))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_ovale.x,'x')
        self.assertEqual(self.test_ovale.y,'y')
        self.assertEqual(self.test_ovale.width,'width')
        self.assertEqual(self.test_ovale.height,'height')
        self.assertEqual(self.test_ovale.angle,'angle')
        self.assertEqual(self.test_ovale.__view_model__,'oval')

class TestPatch(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Patch
        self.test_patch = Patch()

    def test_expected_properties(self):
        expected_properties = set(['x','y'])
        actual_properties = get_prop_set(type(self.test_patch))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_patch.x,'x')
        self.assertEqual(self.test_patch.y,'y')
        self.assertEqual(self.test_patch.__view_model__,'patch')

class TestPatches(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Patches
        self.test_patches = Patches()

    def test_expected_properties(self):
        expected_properties = set(['xs','ys'])
        actual_properties = get_prop_set(type(self.test_patches))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_patches.xs,'xs')
        self.assertEqual(self.test_patches.ys,'ys')
        self.assertEqual(self.test_patches.__view_model__,'patches')

class TestQuad(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Quad
        self.test_quad = Quad()

    def test_expected_properties(self):
        expected_properties = set(['left','right','bottom','top'])
        actual_properties = get_prop_set(type(self.test_quad))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_quad.left,'left')
        self.assertEqual(self.test_quad.right,'right')
        self.assertEqual(self.test_quad.bottom,'bottom')
        self.assertEqual(self.test_quad.top,'top')
        self.assertEqual(self.test_quad.__view_model__,'quad')

class TestQuadratic(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Quadratic
        self.test_quadratic = Quadratic()

    def test_expected_properties(self):
        expected_properties = set(['x0','y0','x1','y1','cx','cy'])
        actual_properties = get_prop_set(type(self.test_quadratic))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_quadratic.x0,'x0')
        self.assertEqual(self.test_quadratic.y0,'y0')
        self.assertEqual(self.test_quadratic.x1,'x1')
        self.assertEqual(self.test_quadratic.y1,'y1')
        self.assertEqual(self.test_quadratic.cx,'cx')
        self.assertEqual(self.test_quadratic.cy,'cy')
        self.assertEqual(self.test_quadratic.__view_model__,'quadratic')

class TestRay(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Ray
        self.test_ray = Ray()

    def test_expected_properties(self):
        expected_properties = set(['x','y','angle','length'])
        actual_properties = get_prop_set(type(self.test_ray))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_ray.x,'x')
        self.assertEqual(self.test_ray.y,'y')
        self.assertEqual(self.test_ray.angle,'angle')
        self.assertEqual(self.test_ray.length,'length')
        self.assertEqual(self.test_ray.__view_model__,'ray')


class TestRect(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Rect
        self.test_rect = Rect()

    def test_expected_properties(self):
        expected_properties = set(['x','y','width','height','angle'])
        actual_properties = get_prop_set(type(self.test_rect))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_rect.x,'x')
        self.assertEqual(self.test_rect.y,'y')
        self.assertEqual(self.test_rect.width,'width')
        self.assertEqual(self.test_rect.height,'height')   
        self.assertEqual(self.test_rect.angle,'angle')
        self.assertEqual(self.test_rect.__view_model__,'rect')

class TestSegment(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Segment
        self.test_segment = Segment()

    def test_expected_properties(self):
        expected_properties = set(['x0','y0','x1','y1'])
        actual_properties = get_prop_set(type(self.test_segment))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_segment.x0,'x0')
        self.assertEqual(self.test_segment.y0,'y0')
        self.assertEqual(self.test_segment.x1,'x1')
        self.assertEqual(self.test_segment.y1,'y1')
        self.assertEqual(self.test_segment.__view_model__,'segment')

class TestText(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Text
        self.test_text = Text()

    def test_expected_properties(self):
        expected_properties = set(['x','y','text','angle'])
        actual_properties = get_prop_set(type(self.test_text))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_text.x,'x')
        self.assertEqual(self.test_text.y,'y')
        self.assertEqual(self.test_text.text,None)
        self.assertEqual(self.test_text.angle,'angle')
        self.assertEqual(self.test_text.__view_model__,'text')

class TestWedge(unittest.TestCase):
    def setUp(self):
        from bokeh.glyphs import Wedge
        self.test_wedge = Wedge()

    def test_expected_properties(self):
        expected_properties = set(['x','y','radius','start_angle','end_angle','direction'])
        actual_properties = get_prop_set(type(self.test_wedge))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_wedge.x,'x')
        self.assertEqual(self.test_wedge.y,'y')
        self.assertEqual(self.test_wedge.radius,None)
        self.assertEqual(self.test_wedge.start_angle,'start_angle')
        self.assertEqual(self.test_wedge.end_angle,'end_angle')
        self.assertEqual(self.test_wedge.__view_model__,'wedge')

        self.assertEqual(self.test_wedge.direction,'clock')
        self.test_wedge.direction = 'anticlock'


if __name__ == "__main__":
    unittest.main()
