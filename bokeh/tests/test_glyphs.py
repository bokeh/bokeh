import unittest
import inspect


def get_prop_set(class_object):
    # all this does is get a list of every property implemented by the object that is not present in the baseclasses of said object
    # note it wont detect overridden properties!
    base_classes = list(inspect.getmro(class_object))
    base_classes.remove(class_object)
    base_properties = []
    for base_class in base_classes:
        base_properties.extend(dir(base_class))
    class_properties = set(dir(class_object)).difference(set(base_properties))
    return class_properties

GENERIC_LINE_DICT = {
    'line_color': {'value': 'black'},
    'line_alpha': {'field': 1.0, 'units': 'data'},
    'line_width': {'field': 'line_width', 'units': 'data'}
}

GENERIC_FILL_DICT = {
    'fill_color': {'value': 'gray'},
    'fill_alpha': {'field': 1.0, 'units': 'data'},
}

GENERIC_TEXT_DICT = {
    'text'      : {'field': 'text', 'units': 'data'},
    'text_color': {'value': 'black'},
    'text_alpha': {'field': 1.0, 'units': 'data'},
}

GENERIC_XY_DICT = {
    'y': {'units': 'data', 'field': 'y'},
    'x': {'units': 'data', 'field': 'x'},
}

GENERIC_GLYPH_DICT = {}
GENERIC_GLYPH_DICT.update(GENERIC_XY_DICT)
GENERIC_GLYPH_DICT.update(GENERIC_LINE_DICT)
GENERIC_GLYPH_DICT.update(GENERIC_FILL_DICT)

GENERIC_MARKER_DICT = {
    'size': {'units': 'screen', 'field': None, 'default': 4},
}
GENERIC_MARKER_DICT.update(GENERIC_XY_DICT)
GENERIC_MARKER_DICT.update(GENERIC_LINE_DICT)
GENERIC_MARKER_DICT.update(GENERIC_FILL_DICT)


# Glyph Baseclasses
class TestBaseGlyph(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import BaseGlyph
        self.test_glyph = BaseGlyph()

    def test_expected_properties(self):
        expected_properties = set(['visible', 'margin', 'halign', 'valign', 'radius_units', 'length_units', 'angle_units', 'start_angle_units', 'end_angle_units'])
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

    def test_to_glyphspec(self):
        self.assertEqual(self.test_glyph.to_glyphspec(), {'type': 'BaseGlyph'})
        self.test_glyph.visible = False
        self.test_glyph.margin = 5
        self.assertEqual(self.test_glyph.to_glyphspec(), {'visible': False, 'margin': 5, 'type': 'BaseGlyph'})

    def test_constructor(self):
        from bokeh.glyphs import BaseGlyph
        test_glyph = BaseGlyph(visible=True, margin=8)
        self.assertEqual(test_glyph.to_glyphspec(), {'visible': True, 'margin': 8, 'type': 'BaseGlyph'})

# Basic Shapes


class TestMarker(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Marker
        self.test_marker = Marker()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'size'])
        actual_properties = get_prop_set(type(self.test_marker))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_marker.size, {'default': 4, 'field': None})
        self.assertEqual(self.test_marker.x, 'x')
        self.assertEqual(self.test_marker.y, 'y')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'Marker'
        self.assertEqual(self.test_marker.to_glyphspec(), expected)
        self.test_marker.x = 20
        self.test_marker.y = 50
        self.test_marker.size = 100
        expected['x'] = {'units': 'data', 'value': 20}
        expected['y'] = {'units': 'data', 'value': 50}
        expected['size'] = {'units': 'screen', 'value': 100}
        self.assertEqual(self.test_marker.to_glyphspec(), expected)


class TestCircle(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Circle
        self.test_circle = Circle()

    def test_expected_properties(self):
        expected_properties = set(['radius'])
        actual_properties = get_prop_set(type(self.test_circle))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_circle.radius, {'default': 4, 'field': None})
        self.assertEqual(self.test_circle.__view_model__, 'circle')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'circle'
        expected['size'] = {'default': 4, 'field': None, 'units': 'screen'}
        self.assertEqual(self.test_circle.to_glyphspec(), expected)
        # self.test_circle.size = 6
        # expected['size'] = {'value': 6, 'units': 'screen'}
        # self.assertEqual(self.test_circle.to_glyphspec(), expected)
        self.test_circle.radius = 500
        del expected['size']
        expected['radius'] = {'units': 'data', 'value': 500}
        self.assertEqual(self.test_circle.to_glyphspec(), expected)


class TestSquare(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Square
        self.test_square = Square()

    def test_expected_properties(self):
        expected_properties = set(['angle'])
        actual_properties = get_prop_set(type(self.test_square))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_square.__view_model__, 'square')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'square'
        expected['angle'] = {'units': 'data', 'field': 'angle'}
        self.assertEqual(self.test_square.to_glyphspec(), expected)
        self.test_square.angle = 90
        expected['angle'] = {'units': 'data', 'value': 90}
        self.assertEqual(self.test_square.to_glyphspec(), expected)


class TestTriangle(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Triangle
        self.test_triangle = Triangle()

    def test_expected_values(self):
        self.assertEqual(self.test_triangle.__view_model__, 'triangle')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'triangle'
        self.assertEqual(self.test_triangle.to_glyphspec(), expected)


class TestCross(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Cross
        self.test_cross = Cross()

    def test_expected_values(self):
        self.assertEqual(self.test_cross.__view_model__, 'cross')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'cross'
        self.assertEqual(self.test_cross.to_glyphspec(), expected)


class TestXmarker(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Xmarker
        self.test_x_marker = Xmarker()

    def test_expected_values(self):
        self.assertEqual(self.test_x_marker.__view_model__, 'x')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'x'
        self.assertEqual(self.test_x_marker.to_glyphspec(), expected)


class TestDiamond(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Diamond
        self.test_diamond = Diamond()

    def test_expected_values(self):
        self.assertEqual(self.test_diamond.__view_model__, 'diamond')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'diamond'
        self.assertEqual(self.test_diamond.to_glyphspec(), expected)


class TestInvertedTriangle(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import InvertedTriangle
        self.test_inverted_triangle = InvertedTriangle()

    def test_expected_values(self):
        self.assertEqual(self.test_inverted_triangle.__view_model__, 'inverted_triangle')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'inverted_triangle'
        self.assertEqual(self.test_inverted_triangle.to_glyphspec(), expected)


class TestSquareX(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import SquareX
        self.test_square_x = SquareX()

    def test_expected_values(self):
        self.assertEqual(self.test_square_x.__view_model__, 'square_x')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'square_x'
        self.assertEqual(self.test_square_x.to_glyphspec(), expected)


class TestAsterisk(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Asterisk
        self.test_asterisk = Asterisk()

    def test_expected_values(self):
        self.assertEqual(self.test_asterisk.__view_model__, 'asterisk')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'asterisk'
        self.assertEqual(self.test_asterisk.to_glyphspec(), expected)


class TestDiamondCross(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import DiamondCross
        self.test_diamond_cross = DiamondCross()

    def test_expected_values(self):
        self.assertEqual(self.test_diamond_cross.__view_model__, 'diamond_cross')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'diamond_cross'
        self.assertEqual(self.test_diamond_cross.to_glyphspec(), expected)


class TestCircleCross(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import CircleCross
        self.test_circle_cross = CircleCross()

    def test_expected_values(self):
        self.assertEqual(self.test_circle_cross.__view_model__, 'circle_cross')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'circle_cross'
        self.assertEqual(self.test_circle_cross.to_glyphspec(), expected)


class TestSquareCross(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import SquareCross
        self.test_square_cross = SquareCross()

    def test_expected_values(self):
        self.assertEqual(self.test_square_cross.__view_model__, 'square_cross')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'square_cross'
        self.assertEqual(self.test_square_cross.to_glyphspec(), expected)


class TestCircleX(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import CircleX
        self.test_circle_x = CircleX()

    def test_expected_values(self):
        self.assertEqual(self.test_circle_x.__view_model__, 'circle_x')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_MARKER_DICT)
        expected['type'] = 'circle_x'
        self.assertEqual(self.test_circle_x.to_glyphspec(), expected)

# More complicated shapes


class TestAnnularWedge(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import AnnularWedge
        self.test_annular_wedge = AnnularWedge()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction'])
        actual_properties = get_prop_set(type(self.test_annular_wedge))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_annular_wedge.__view_model__, 'annular_wedge')
        self.assertEqual(self.test_annular_wedge.x, 'x')
        self.assertEqual(self.test_annular_wedge.y, 'y')
        self.assertEqual(self.test_annular_wedge.inner_radius, None)
        self.assertEqual(self.test_annular_wedge.outer_radius, None)
        self.assertEqual(self.test_annular_wedge.start_angle, 'start_angle')
        self.assertEqual(self.test_annular_wedge.end_angle, 'end_angle')

        self.assertEqual(self.test_annular_wedge.direction, 'clock')
        self.test_annular_wedge.direction = 'anticlock'

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'annular_wedge'
        expected.update({
            'start_angle':  {'units': 'data', 'field': 'start_angle'},
            'end_angle':    {'units': 'data', 'field': 'end_angle'},
            'outer_radius': {'units': 'data', 'field': None},
            'inner_radius': {'units': 'data', 'field': None},
        })
        self.assertEqual(self.test_annular_wedge.to_glyphspec(), expected)
        self.test_annular_wedge.x = 50
        self.test_annular_wedge.y = 100
        self.test_annular_wedge.inner_radius = 50
        self.test_annular_wedge.outer_radius = 51
        self.test_annular_wedge.start_angle = 91
        self.test_annular_wedge.end_angle = 92
        self.test_annular_wedge.direction = 'anticlock'
        expected.update({
            'x':            {'units': 'data', 'value': 50},
            'y':            {'units': 'data', 'value': 100},
            'start_angle':  {'units': 'data', 'value': 91},
            'end_angle':    {'units': 'data', 'value': 92},
            'outer_radius': {'units': 'data', 'value': 51},
            'inner_radius': {'units': 'data', 'value': 50},
            'direction':    'anticlock',
        })
        self.assertEqual(self.test_annular_wedge.to_glyphspec(), expected)


class TestAnnulus(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Annulus
        self.test_annulus = Annulus()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'inner_radius', 'outer_radius'])
        actual_properties = get_prop_set(type(self.test_annulus))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_annulus.__view_model__, 'annulus')
        self.assertEqual(self.test_annulus.x, 'x')
        self.assertEqual(self.test_annulus.y, 'y')
        self.assertEqual(self.test_annulus.inner_radius, None)
        self.assertEqual(self.test_annulus.outer_radius, None)

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'annulus'
        expected.update({
            'outer_radius': {'units': 'data', 'field': None},
            'inner_radius': {'units': 'data', 'field': None},
        })
        self.assertEqual(self.test_annulus.to_glyphspec(), expected)
        self.test_annulus.x = 50
        self.test_annulus.y = 100
        self.test_annulus.inner_radius = 61
        self.test_annulus.outer_radius = 62
        expected.update({
            'x':            {'units': 'data', 'value': 50},
            'y':            {'units': 'data', 'value': 100},
            'outer_radius': {'units': 'data', 'value': 62},
            'inner_radius': {'units': 'data', 'value': 61},
        })
        self.assertEqual(self.test_annulus.to_glyphspec(), expected)


class TestArc(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Arc
        self.test_arc = Arc()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction'])
        actual_properties = get_prop_set(type(self.test_arc))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_arc.__view_model__, 'arc')
        self.assertEqual(self.test_arc.x, 'x')
        self.assertEqual(self.test_arc.y, 'y')
        self.assertEqual(self.test_arc.radius, None)
        self.assertEqual(self.test_arc.start_angle, 'start_angle')
        self.assertEqual(self.test_arc.end_angle, 'end_angle')
        self.assertEqual(self.test_arc.direction, 'clock')
        self.test_arc.direction = 'anticlock'

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        del expected['fill_color']  # only has line props
        del expected['fill_alpha']  # only has line pros:ps
        expected['type'] = 'arc'
        expected.update({
            'radius': {'units': 'data', 'field': None},
            'start_angle':  {'units': 'data', 'field': 'start_angle'},
            'end_angle':    {'units': 'data', 'field': 'end_angle'},
        })
        self.assertEqual(self.test_arc.to_glyphspec(), expected)
        self.test_arc.x = 50
        self.test_arc.y = 100
        self.test_arc.radius = 51
        self.test_arc.start_angle = 52
        self.test_arc.end_angle = 53
        self.test_arc.direction = 'anticlock'
        expected.update({
            'x':            {'units': 'data', 'value': 50},
            'y':            {'units': 'data', 'value': 100},
            'radius': {'units': 'data', 'value': 51},
            'start_angle':  {'units': 'data', 'value': 52},
            'end_angle':    {'units': 'data', 'value': 53},
            'direction':    'anticlock',
        })
        self.assertEqual(self.test_arc.to_glyphspec(), expected)


class TestBezier(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Bezier
        self.test_bezier = Bezier()

    def test_expected_properties(self):
        expected_properties = set(['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1'])
        actual_properties = get_prop_set(type(self.test_bezier))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_bezier.__view_model__, 'bezier')
        self.assertEqual(self.test_bezier.x0, 'x0')
        self.assertEqual(self.test_bezier.y0, 'y0')
        self.assertEqual(self.test_bezier.x1, 'x1')
        self.assertEqual(self.test_bezier.y1, 'y1')
        self.assertEqual(self.test_bezier.cx0, 'cx0')
        self.assertEqual(self.test_bezier.cy0, 'cy0')
        self.assertEqual(self.test_bezier.cx1, 'cx1')
        self.assertEqual(self.test_bezier.cy1, 'cy1')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_LINE_DICT)
        expected['type'] = 'bezier'
        expected.update({
            'x0': {'units': 'data', 'field': 'x0'},
            'x1': {'units': 'data', 'field': 'x1'},
            'y0': {'units': 'data', 'field': 'y0'},
            'y1': {'units': 'data', 'field': 'y1'},
            'cx0': {'units': 'data', 'field': 'cx0'},
            'cy0': {'units': 'data', 'field': 'cy0'},
            'cx1': {'units': 'data', 'field': 'cx1'},
            'cy1': {'units': 'data', 'field': 'cy1'},
        })
        self.assertEqual(self.test_bezier.to_glyphspec(), expected)
        self.test_bezier.x0 = 1
        self.test_bezier.x1 = 2
        self.test_bezier.cx0 = 3
        self.test_bezier.cx1 = 4
        self.test_bezier.y0 = 5
        self.test_bezier.y1 = 6
        self.test_bezier.cy0 = 7
        self.test_bezier.cy1 = 8
        expected.update({
            'x0': {'units': 'data', 'value': 1},
            'x1': {'units': 'data', 'value': 2},
            'y0': {'units': 'data', 'value': 5},
            'y1': {'units': 'data', 'value': 6},
            'cx0': {'units': 'data', 'value': 3},
            'cx1': {'units': 'data', 'value': 4},
            'cy0': {'units': 'data', 'value': 7},
            'cy1': {'units': 'data', 'value': 8},
        })
        self.assertEqual(self.test_bezier.to_glyphspec(), expected)


class TestImageURL(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import ImageURL
        self.test_image_url = ImageURL()

    def test_expected_properties(self):
        expected_properties = set(['url', 'x', 'y', 'w', 'h', 'angle'])
        actual_properties = get_prop_set(type(self.test_image_url))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_image_url.__view_model__, 'image_url')
        self.assertEqual(self.test_image_url.url, 'url')
        self.assertEqual(self.test_image_url.x, 'x')
        self.assertEqual(self.test_image_url.y, 'y')
        self.assertEqual(self.test_image_url.w, 'w')
        self.assertEqual(self.test_image_url.h, 'h')
        self.assertEqual(self.test_image_url.angle, 'angle')

    def test_to_glyphspec(self):
        self.assertEqual(self.test_image_url.to_glyphspec(), {
            'url': {'units': 'data', 'field': 'url'},
            'x': {'units': 'data', 'field': 'x'},
            'y': {'units': 'data', 'field': 'y'},
            'w': {'units': 'data', 'field': 'w'},
            'h': {'units': 'data', 'field': 'h'},
            'angle': {'units': 'data', 'field': 'angle'},
            'type': 'image_url',
        })

        self.test_image_url.url = ['foo']
        self.test_image_url.x = 50
        self.test_image_url.y = 51
        self.test_image_url.w = 60
        self.test_image_url.h = 61
        self.test_image_url.angle = 90

        self.assertEqual(self.test_image_url.to_glyphspec(), {
            'url': {'units': 'data', 'value': ['foo']},
            'x': {'units': 'data', 'value': 50},
            'y': {'units': 'data', 'value': 51},
            'w': {'units': 'data', 'value': 60},
            'h': {'units': 'data', 'value': 61},
            'angle': {'units': 'data', 'value': 90},
            'type': 'image_url',
        })

class TestImage(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Image
        self.test_image = Image()

    def test_expected_properties(self):
        expected_properties = set(['image', 'x', 'y', 'dw', 'dh', 'palette'])
        actual_properties = get_prop_set(type(self.test_image))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_image.image, 'image')
        self.assertEqual(self.test_image.x, 'x')
        self.assertEqual(self.test_image.y, 'y')
        self.assertEqual(self.test_image.dw, 'dw')
        self.assertEqual(self.test_image.dh, 'dh')
        self.assertEqual(self.test_image.__view_model__, 'image')

    def test_to_glyphspec(self):
        self.assertEqual(self.test_image.to_glyphspec(), 
                         {'dh': {'units': 'data', 'field': 'dh'}, 
                          'image': {'units': 'data', 'field': 'image'}, 
                          'dw': {'units': 'data', 'field': 'dw'}, 
                          'y': {'units': 'data', 'field': 'y'}, 
                          'x': {'units': 'data', 'field': 'x'}, 
                          'palette': {'field': 'palette', 'units': 'data'}, 
                          'reserve_color':{'default': 0xffffff, 'field':None, 'units':'data'},
                          'type': 'image'})
        self.test_image.image = 'image image image'
        self.test_image.width = 500
        self.test_image.height = 600
        self.test_image.x = 50
        self.test_image.y = 51
        self.test_image.dw = 53
        self.test_image.dh = 54
        self.assertEqual(self.test_image.to_glyphspec(), 
                         {'dh': {'units': 'data', 'value': 54}, 
                          'image': {'units': 'data', 'field': 'image image image'}, 
                          'x': {'units': 'data', 'value': 50}, 
                          'y': {'units': 'data', 'value': 51}, 
                          'dw': {'units': 'data', 'value': 53}, 
                          'palette': {'field': 'palette', 'units': 'data'}, 
                          'reserve_color':{'default': 0xffffff, 'field':None, 'units':'data'},
                          'type': 'image'})


class TestImageRGBA(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import ImageRGBA
        self.test_imagergba = ImageRGBA()

    def test_expected_properties(self):
        expected_properties = set(['image', 'x', 'y', 'dw', 'dh', ])
        actual_properties = get_prop_set(type(self.test_imagergba))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_imagergba.image, 'image')
        self.assertEqual(self.test_imagergba.x, 'x')
        self.assertEqual(self.test_imagergba.y, 'y')
        self.assertEqual(self.test_imagergba.dw, 'dw')
        self.assertEqual(self.test_imagergba.dh, 'dh')
        self.assertEqual(self.test_imagergba.__view_model__, 'image_rgba')

    def test_to_glyphspec(self):
        self.assertEqual(self.test_imagergba.to_glyphspec(), {'dh': {'units': 'data', 'field': 'dh'}, 'image': {'units': 'data', 'field': 'image'}, 'dw': {'units': 'data', 'field': 'dw'}, 'y': {'units': 'data', 'field': 'y'}, 'x': {'units': 'data', 'field': 'x'}, 'type': 'image_rgba'})
        self.test_imagergba.image = 'image image image'
        self.test_imagergba.width = 500
        self.test_imagergba.height = 600
        self.test_imagergba.x = 50
        self.test_imagergba.y = 51
        self.test_imagergba.dw = 53
        self.test_imagergba.dh = 54
        self.assertEqual(self.test_imagergba.to_glyphspec(), {'dh': {'units': 'data', 'value': 54}, 'image': {'units': 'data', 'field': 'image image image'}, 'x': {'units': 'data', 'value': 50}, 'y': {'units': 'data', 'value': 51}, 'dw': {'units': 'data', 'value': 53}, 'type': 'image_rgba'})


class TestLine(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Line
        self.test_line = Line()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y'])
        actual_properties = get_prop_set(type(self.test_line))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_line.x, 'x')
        self.assertEqual(self.test_line.y, 'y')
        self.assertEqual(self.test_line.__view_model__, 'line')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_XY_DICT)
        expected.update(GENERIC_LINE_DICT)
        expected['type'] = 'line'
        self.assertEqual(self.test_line.to_glyphspec(), expected)
        self.test_line.x = [50]
        self.test_line.y = [51]
        expected.update({
            'x':  {'units': 'data', 'value': [50]},
            'y':  {'units': 'data', 'value': [51]},
        })
        self.assertEqual(self.test_line.to_glyphspec(), expected)


class TestMultiLine(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import MultiLine
        self.test_multiline = MultiLine()

    def test_expected_properties(self):
        expected_properties = set(['xs', 'ys'])
        actual_properties = get_prop_set(type(self.test_multiline))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_multiline.xs, 'xs')
        self.assertEqual(self.test_multiline.ys, 'ys')
        self.assertEqual(self.test_multiline.__view_model__, 'multi_line')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_LINE_DICT)
        expected['type'] = 'multi_line'
        expected.update({
            'xs':  {'units': 'data', 'field': 'xs'},
            'ys':  {'units': 'data', 'field': 'ys'},
        })
        self.assertEqual(self.test_multiline.to_glyphspec(), expected)
        self.test_multiline.xs = [50]
        self.test_multiline.ys = [51]
        expected.update({
            'xs':  {'units': 'data', 'value': [50]},
            'ys':  {'units': 'data', 'value': [51]},
        })
        self.assertEqual(self.test_multiline.to_glyphspec(), expected)


class TestOval(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Oval
        self.test_oval = Oval()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'width', 'height', 'angle'])
        actual_properties = get_prop_set(type(self.test_oval))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_oval.x, 'x')
        self.assertEqual(self.test_oval.y, 'y')
        self.assertEqual(self.test_oval.width, 'width')
        self.assertEqual(self.test_oval.height, 'height')
        self.assertEqual(self.test_oval.angle, 'angle')
        self.assertEqual(self.test_oval.__view_model__, 'oval')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'oval'
        expected.update({
            'angle':  {'units': 'data', 'field': 'angle'},
            'height': {'units': 'data', 'field': 'height'},
            'width':  {'units': 'data', 'field': 'width'},
        })
        self.assertEqual(self.test_oval.to_glyphspec(), expected)
        self.test_oval.x = 50
        self.test_oval.y = 51
        self.test_oval.width = 500
        self.test_oval.height = 501
        self.test_oval.angle = 90
        expected.update({
            'x':      {'units': 'data', 'value': 50},
            'y':      {'units': 'data', 'value': 51},
            'angle':  {'units': 'data', 'value': 90},
            'height': {'units': 'data', 'value': 501},
            'width':  {'units': 'data', 'value': 500},
        })
        self.assertEqual(self.test_oval.to_glyphspec(), expected)


class TestPatch(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Patch
        self.test_patch = Patch()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y'])
        actual_properties = get_prop_set(type(self.test_patch))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_patch.x, 'x')
        self.assertEqual(self.test_patch.y, 'y')
        self.assertEqual(self.test_patch.__view_model__, 'patch')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'patch'
        self.assertEqual(self.test_patch.to_glyphspec(), expected)
        self.test_patch.x = [50]
        self.test_patch.y = [51]
        expected.update({
            'x':  {'units': 'data', 'value': [50]},
            'y':  {'units': 'data', 'value': [51]},
        })
        self.assertEqual(self.test_patch.to_glyphspec(), expected)


class TestPatches(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Patches
        self.test_patches = Patches()

    def test_expected_properties(self):
        expected_properties = set(['xs', 'ys'])
        actual_properties = get_prop_set(type(self.test_patches))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_patches.xs, 'xs')
        self.assertEqual(self.test_patches.ys, 'ys')
        self.assertEqual(self.test_patches.__view_model__, 'patches')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_FILL_DICT)
        expected.update(GENERIC_LINE_DICT)
        expected['type'] = 'patches'
        expected.update({
            'xs':   {'units': 'data', 'field': 'xs'},
            'ys':  {'units': 'data', 'field': 'ys'},
        })
        self.assertEqual(self.test_patches.to_glyphspec(), expected)
        self.test_patches.xs = [50]
        self.test_patches.ys = [51]
        expected.update({
            'xs':   {'units': 'data', 'value': [50]},
            'ys':  {'units': 'data', 'value': [51]},
        })
        self.assertEqual(self.test_patches.to_glyphspec(), expected)


class TestQuad(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Quad
        self.test_quad = Quad()

    def test_expected_properties(self):
        expected_properties = set(['left', 'right', 'bottom', 'top'])
        actual_properties = get_prop_set(type(self.test_quad))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_quad.left, 'left')
        self.assertEqual(self.test_quad.right, 'right')
        self.assertEqual(self.test_quad.bottom, 'bottom')
        self.assertEqual(self.test_quad.top, 'top')
        self.assertEqual(self.test_quad.__view_model__, 'quad')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_FILL_DICT)
        expected.update(GENERIC_LINE_DICT)
        expected['type'] = 'quad'
        expected.update({
            'left':   {'units': 'data', 'field': 'left'},
            'right':  {'units': 'data', 'field': 'right'},
            'top':    {'units': 'data', 'field': 'top'},
            'bottom': {'units': 'data', 'field': 'bottom'},
        })
        self.assertEqual(self.test_quad.to_glyphspec(), expected)
        self.test_quad.left = 50
        self.test_quad.right = 51
        self.test_quad.bottom = 52
        self.test_quad.top = 53
        expected.update({
            'left':   {'units': 'data', 'value': 50},
            'right':  {'units': 'data', 'value': 51},
            'bottom': {'units': 'data', 'value': 52},
            'top':    {'units': 'data', 'value': 53},
        })
        self.assertEqual(self.test_quad.to_glyphspec(), expected)


class TestQuadratic(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Quadratic
        self.test_quadratic = Quadratic()

    def test_expected_properties(self):
        expected_properties = set(['x0', 'y0', 'x1', 'y1', 'cx', 'cy'])
        actual_properties = get_prop_set(type(self.test_quadratic))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_quadratic.x0, 'x0')
        self.assertEqual(self.test_quadratic.y0, 'y0')
        self.assertEqual(self.test_quadratic.x1, 'x1')
        self.assertEqual(self.test_quadratic.y1, 'y1')
        self.assertEqual(self.test_quadratic.cx, 'cx')
        self.assertEqual(self.test_quadratic.cy, 'cy')
        self.assertEqual(self.test_quadratic.__view_model__, 'quadratic')

    def test_to_glyphspec(self):
        expected = {}
        expected['type'] = 'quadratic'
        expected.update(GENERIC_LINE_DICT)
        expected.update({
            'x0': {'units': 'data', 'field': 'x0'},
            'x1': {'units': 'data', 'field': 'x1'},
            'y0': {'units': 'data', 'field': 'y0'},
            'y1': {'units': 'data', 'field': 'y1'},
            'cx': {'units': 'data', 'field': 'cx'},
            'cy': {'units': 'data', 'field': 'cy'},
        })
        self.assertEqual(self.test_quadratic.to_glyphspec(), expected)
        self.test_quadratic.x0 = 1
        self.test_quadratic.x1 = 2
        self.test_quadratic.cx = 3
        self.test_quadratic.y0 = 4
        self.test_quadratic.y1 = 5
        self.test_quadratic.cy = 6
        expected.update({
            'x0': {'units': 'data', 'value': 1},
            'x1': {'units': 'data', 'value': 2},
            'y0': {'units': 'data', 'value': 4},
            'y1': {'units': 'data', 'value': 5},
            'cx': {'units': 'data', 'value': 3},
            'cy': {'units': 'data', 'value': 6},
        })
        self.assertEqual(self.test_quadratic.to_glyphspec(), expected)


class TestRay(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Ray
        self.test_ray = Ray()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'angle', 'length'])
        actual_properties = get_prop_set(type(self.test_ray))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_ray.x, 'x')
        self.assertEqual(self.test_ray.y, 'y')
        self.assertEqual(self.test_ray.angle, 'angle')
        self.assertEqual(self.test_ray.length, 'length')
        self.assertEqual(self.test_ray.__view_model__, 'ray')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        del expected['fill_color']  # only line props
        del expected['fill_alpha']  # only line props
        expected['type'] = 'ray'
        expected.update({
            'angle':  {'units': 'data', 'field': 'angle'},
            'length': {'units': 'data', 'field': 'length'},
        })
        self.assertEqual(self.test_ray.to_glyphspec(), expected)
        self.test_ray.x = 50
        self.test_ray.y = 51
        self.test_ray.angle = 90
        self.test_ray.length = 100
        expected.update({
            'x':      {'units': 'data', 'value': 50},
            'y':      {'units': 'data', 'value': 51},
            'angle':  {'units': 'data', 'value': 90},
            'length':  {'units': 'data', 'value': 100},
        })
        self.assertEqual(self.test_ray.to_glyphspec(), expected)


class TestRect(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Rect
        self.test_rect = Rect()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'width', 'height', 'angle'])
        actual_properties = get_prop_set(type(self.test_rect))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_rect.x, 'x')
        self.assertEqual(self.test_rect.y, 'y')
        self.assertEqual(self.test_rect.width, 'width')
        self.assertEqual(self.test_rect.height, 'height')
        self.assertEqual(self.test_rect.angle, 'angle')
        self.assertEqual(self.test_rect.__view_model__, 'rect')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'rect'
        expected.update({
            'angle':  {'units': 'data', 'field': 'angle'},
            'height': {'units': 'data', 'field': 'height'},
            'width':  {'units': 'data', 'field': 'width'},
        })
        self.assertEqual(self.test_rect.to_glyphspec(), expected)
        self.test_rect.x = 50
        self.test_rect.y = 51
        self.test_rect.width = 100
        self.test_rect.height = 200
        self.test_rect.angle = 90
        expected.update({
            'x':      {'units': 'data', 'value': 50},
            'y':      {'units': 'data', 'value': 51},
            'angle':  {'units': 'data', 'value': 90},
            'height': {'units': 'data', 'value': 200},
            'width':  {'units': 'data', 'value': 100},
        })
        self.assertEqual(self.test_rect.to_glyphspec(), expected)


class TestSegment(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Segment
        self.test_segment = Segment()

    def test_expected_properties(self):
        expected_properties = set(['x0', 'y0', 'x1', 'y1'])
        actual_properties = get_prop_set(type(self.test_segment))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_segment.x0, 'x0')
        self.assertEqual(self.test_segment.y0, 'y0')
        self.assertEqual(self.test_segment.x1, 'x1')
        self.assertEqual(self.test_segment.y1, 'y1')
        self.assertEqual(self.test_segment.__view_model__, 'segment')

    def test_to_glyphspec(self):
        expected = {}
        expected['type'] = 'segment'
        expected.update(GENERIC_LINE_DICT)
        expected.update({
            'x0': {'units': 'data', 'field': 'x0'},
            'x1': {'units': 'data', 'field': 'x1'},
            'y0': {'units': 'data', 'field': 'y0'},
            'y1': {'units': 'data', 'field': 'y1'},
        })
        self.assertEqual(self.test_segment.to_glyphspec(), expected)
        self.test_segment.x0 = 1
        self.test_segment.y0 = 2
        self.test_segment.x1 = 3
        self.test_segment.y1 = 4
        expected.update({
            'x0': {'units': 'data', 'value': 1},
            'x1': {'units': 'data', 'value': 3},
            'y0': {'units': 'data', 'value': 2},
            'y1': {'units': 'data', 'value': 4},
        })
        self.assertEqual(self.test_segment.to_glyphspec(), expected)


class TestText(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Text
        self.test_text = Text()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'text', 'angle'])
        actual_properties = get_prop_set(type(self.test_text))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_text.x, 'x')
        self.assertEqual(self.test_text.y, 'y')
        self.assertEqual(self.test_text.text, 'text')
        self.assertEqual(self.test_text.angle, 'angle')
        self.assertEqual(self.test_text.__view_model__, 'text')

    def test_to_glyphspec(self):
        expected = dict(GENERIC_XY_DICT)
        expected['type'] = 'text'
        expected.update(GENERIC_TEXT_DICT)
        expected.update({
            'angle':  {'units': 'data', 'field': 'angle'},
        })
        self.assertEqual(self.test_text.to_glyphspec(), expected)
        self.test_text.x = 50
        self.test_text.y = 51
        self.test_text.angle = 90
        self.test_text.text = 'colourless green sheep sleep furiously'
        expected.update({
            'x':      {'units': 'data', 'value': 50},
            'y':      {'units': 'data', 'value': 51},
            'angle':  {'units': 'data', 'value': 90},
            'text':   {'field': 'colourless green sheep sleep furiously', 'units': 'data'}
        })
        self.assertEqual(self.test_text.to_glyphspec(), expected)


class TestWedge(unittest.TestCase):

    def setUp(self):
        from bokeh.glyphs import Wedge
        self.test_wedge = Wedge()

    def test_expected_properties(self):
        expected_properties = set(['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction'])
        actual_properties = get_prop_set(type(self.test_wedge))
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_expected_values(self):
        self.assertEqual(self.test_wedge.x, 'x')
        self.assertEqual(self.test_wedge.y, 'y')
        self.assertEqual(self.test_wedge.radius, None)
        self.assertEqual(self.test_wedge.start_angle, 'start_angle')
        self.assertEqual(self.test_wedge.end_angle, 'end_angle')
        self.assertEqual(self.test_wedge.__view_model__, 'wedge')

        self.assertEqual(self.test_wedge.direction, 'clock')
        self.test_wedge.direction = 'anticlock'

    def test_to_glyphspec(self):
        expected = dict(GENERIC_GLYPH_DICT)
        expected['type'] = 'wedge'
        expected.update({
            'start_angle':  {'units': 'data', 'field': 'start_angle'},
            'end_angle':    {'units': 'data', 'field': 'end_angle'},
            'radius':       {'units': 'data', 'field': None},
        })
        self.assertEqual(self.test_wedge.to_glyphspec(), expected)
        self.test_wedge.x = 50
        self.test_wedge.y = 51
        self.test_wedge.radius = 52
        self.test_wedge.start_angle = 53
        self.test_wedge.end_angle = 54
        self.test_wedge.direction = 'anticlock'
        expected.update({
            'x':            {'units': 'data', 'value': 50},
            'y':            {'units': 'data', 'value': 51},
            'start_angle':  {'units': 'data', 'value': 53},
            'end_angle':    {'units': 'data', 'value': 54},
            'radius':       {'units': 'data', 'value': 52},
            'direction':    'anticlock',
        })
        self.assertEqual(self.test_wedge.to_glyphspec(), expected)

if __name__ == "__main__":
    unittest.main()
