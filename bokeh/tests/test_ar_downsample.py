import unittest
import bokeh.transforms.ar_downsample as ar_downsample
from bokeh.transforms.ar_downsample import *
from bokeh.objects import Range1d
import types
from .test_utils import skipIfPy3
from ..utils import is_py3

# Only import in python 2...
try:
    import abstract_rendering.numeric as numeric
    import abstract_rendering.categories as categories
    import abstract_rendering.contour as contour
    import abstract_rendering.general as general
    import abstract_rendering.glyphset as glyphset
    import abstract_rendering.core as ar
    import abstract_rendering.numpyglyphs as npg
    import abstract_rendering.infos as infos
except:
    if not is_py3():
        raise


def sort_init_first(_, a, b):
    if "_init_" in a: return -1
    elif "_init_" in b: return 1
    elif a > b: return -1
    elif a < b: return 1
    else: return 0

unittest.TestLoader.sortTestMethodsUsing = sort_init_first


class _SourceShim(object):
    defVal = 'value'

    def __init__(self, t, *k):
        self.transform = {'shader': t}
        self.data = dict(zip(k, [self.defVal]*len(k)))


class _FailsProxyReify(object):
    """Tests the test machinery.  Intentionally fails reification
       to check that the test suite will register exceptions as failures."""

    def reify(self):
        raise NotImplementedError


@skipIfPy3("AR does not run in python 3")
class Test_AR(unittest.TestCase):
    # -------------- Process and Utility Tests ----------
    def test_replot(self):
        pass

    def test_source(self):
        pass

    def test_downsample(self):
        pass

    def test_init_AR(self):
        self.assertRaises(NameError, Id().reify)
        ar_downsample._loadAR()
        self.assertIsNotNone(Id().reify())

    def test_span(self):
        self.assertEquals(0, ar_downsample._span(Range1d(start=0, end=0)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=0, end=2)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=-2, end=0)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=-2, end=2)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=2, end=-2)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=None, end=3)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=3, end=None)))
        self.assertEquals(0, ar_downsample._span(Range1d(start=None, end=None)))

    def test_size(self):
        self.assertEquals(10, ar_downsample._size({'size': {'default': 10}}))
        self.assertEquals(1, ar_downsample._size({'size': {'other': 10}}))

    def test_datacolumn(self):
        self.assertEquals('state', ar_downsample._datacolumn({'type': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'fill_color': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'fill_alpha': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'line_color': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'line_alpha': {'field': 'state'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'type': {'field': 'state1'}, 'fill_color': {'field': 'state2'}}))
        self.assertEquals('state2', ar_downsample._datacolumn({'fill_alpha': {'field': 'state1'}, 'fill_color': {'field': 'state2'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'fill_alpha': {'field': 'state1'}, 'line_color': {'field': 'state2'}}))
        self.assertEquals('state2', ar_downsample._datacolumn({'line_alpha': {'field': 'state1'}, 'line_color': {'field': 'state2'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'line_alpha': {'field': 'state1'}, 'other': {'field': 'state2'}}))

    # ------------ Glyphset creation tests --------------
    def test_shaper_create(self):
        ar_downsample._loadAR()
        self.assertIsInstance(ar_downsample._shaper("square", 3, False), glyphset.ToRect)
        self.assertIsInstance(ar_downsample._shaper("square", 3, True), glyphset.ToPoint)
        self.assertIsInstance(ar_downsample._shaper("circle", 3, True), glyphset.ToPoint)

    def test_shaper_fail(self):
        ar_downsample._loadAR()
        with self.assertRaises(ValueError):
            ar_downsample._shaper("circle", 3, False)
            ar_downsample._shaper("blah", 3, False)

    def test_make_glyphset(self):
        glyphspec = {'type': 'square', 'size': {'default': 1}}
        transform = {'points': True}
        glyphs = make_glyphset([], [], [], glyphspec, transform)
        self.assertIsInstance(glyphs, npg.Glyphset, "Point-optimized numpy version")

        transform= {'points': False}
        glyphs = make_glyphset([], [], [], glyphspec, transform)
        self.assertIsInstance(glyphs, glyphset.Glyphset, "Generic glyphset")



    # -------------- Mapping tests ----------
    def test_Image(self):
        source = _SourceShim(ar_downsample.Interpolate)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.Interpolate, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

    def test_ImageRGB(self):
        source = _SourceShim(ar_downsample.InterpolateColor)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.InterpolateColor, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

    def test_PolyLine(self):
        source = _SourceShim(ar_downsample.Contour)
        result = ar_downsample.mapping(source)
        expected = {}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.Contour, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))


    # -------------------- Proxy object tests --------------
    def _reify_tester(self, proxy, reifyBase, kwargs):
        ar_downsample._loadAR()
        op = proxy.reify(**kwargs)
        self.assertIsNotNone(op, "Empty reification on %s" % type(proxy))
        self.assertIsInstance(op, reifyBase, "Reify to unexpected type (%s) for %s" % (type(op), type(proxy)))

    def _shader_tester(self, proxy, reifyBase, kwargs):
        self.assertIn(proxy.out, ["image", "image_rgb", "poly_line"],
                      "Unknown output type.")

        self.assertIsNotNone(self.proxy.reformat(None),
                             "No reformat provided")

        op2 = self.proxy + Id()
        self.assertIsNotNone(op2)
        self.assertIsInstance(op2, Seq, "Unexpected result from sequencing")

        self._reify_tester(proxy, reify_base, kwargs)

    def test_infos(self):
        configs = [(AutoEncode(), infos.AutoEncode, {}),
                   (Const(val=3), types.FunctionType, {}),
                   (Encode(cats=[10,20,30]), types.FunctionType, {})]

        for (proxy, target, kwargs) in configs:
            self._reify_tester(proxy, target, kwargs)

    def test_aggregators(self):
        aggregators = [(Sum(), numeric.Sum, {}),
                       (Count(), numeric.Count, {}),
                       (CountCategories(), categories.CountCategories, {})
                      ]

        for (agg, target, kwargs) in aggregators:
            self._reify_tester(agg, target, kwargs)

    def test_reify_tester(self):
        self.assertRaises(NotImplementedError, self._reify_tester, *(_FailsProxyReify(), object, {}))


    def test_shaders(self):
        shaders = [(BinarySegment(low=1, high=2, divider=10), numeric.BinarySegment, {}),
                   (Contour(), contour.Contour, {}),
                   (Cuberoot(), numeric.Cuberoot, {}),
                   (Id(), general.Id, {}),
                   (Interpolate(low=0, high=10), numeric.Interpolate, {}),
                   (InterpolateColor(low=(10, 10, 10), high=(200, 200, 200), reserve=(0, 0, 0), empty=-1), numeric.InterpolateColors, {}),
                   (NonZeros(), categories.NonZeros, {}),
                   (Seq(first=Id(), second=Sqrt()), ar.Seq, {}),
                   (Spread(factor=2), npg.Spread, {}),
                   (Sqrt(), numeric.Sqrt, {}),
                   (ToCounts(), categories.ToCounts, {}),
                   ]

        for (shader, target, kwargs) in shaders:
            self._reify_tester(shader, target, kwargs)
