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
    import abstract_rendering.contour as contour
    import abstract_rendering.general as general
    import abstract_rendering.glyphset as glyphset
    import abstract_rendering.core as ar
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

    # ------------ Shaper tests --------------
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

    # -------------- Mapping tests ----------
    def test_Image(self):
        source = _SourceShim(ar_downsample.Interpolate)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(expected.keys(), result.keys())

        source = _SourceShim(ar_downsample.Interpolate, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(expected.keys(), result.keys())

    def test_ImageRGB(self):
        source = _SourceShim(ar_downsample.InterpolateColor)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(expected.keys(), result.keys())

        source = _SourceShim(ar_downsample.InterpolateColor, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(expected.keys(), result.keys())

    def test_PolyLine(self):
        source = _SourceShim(ar_downsample.Contour)
        result = ar_downsample.mapping(source)
        expected = {}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(expected.keys(), result.keys())

        source = _SourceShim(ar_downsample.Contour, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(expected.keys(), result.keys())

    def _reify_tester(self, proxy, reifyBase):
        ar_downsample._loadAR()
        op = proxy.reify()
        self.assertIsNotNone(op, "Empty reification on %s" % type(proxy))
        self.assertIsInstance(op, reifyBase, "Reify to unexpected type (%s) for %s" % (type(op), type(proxy)))

    def _shader_tester(self, proxy, reifyBase):
        self.assertIn(proxy.out, ["image", "image_rgb", "poly_line"],
                      "Unknown output type.")

        self.assertIsNotNone(self.proxy.reformat(None),
                             "No reformat provided")

        op2 = self.proxy + Id()
        self.assertIsNotNone(op2)
        self.assertIsInstance(op2, Seq, "Unexpected result from sequencing")

        self._reify_tester(proxy, reify_base)

    def test_infos(self):
        infos = [Const(val=3)]
        for info in infos:
            self._reify_tester(info, types.FunctionType)

    def test_aggregators(self):
        aggregators = [Sum(), Count()]
        targets = [numeric.Sum, numeric.Count]
        for (agg, target) in zip(aggregators, targets):
            self._reify_tester(agg, target)

    def test_shaders(self):
        shaders = [(Seq(first=Id(), second=Sqrt()), ar.Seq),
                   (Id(), general.Id),
                   (BinarySegment(low=1, high=2, divider=10), numeric.BinarySegment),
                   (Interpolate(low=0, high=10), numeric.Interpolate),
                   (InterpolateColor(low=(10, 10, 10), high=(200, 200, 200), reserve=(0, 0, 0), empty=-1), numeric.InterpolateColors),
                   (Sqrt(), numeric.Sqrt),
                   (Cuberoot(), numeric.Cuberoot),
                   (Spread(factor=2), numeric.Spread),
                   (Contour(), contour.Contour)]

        for (shader, target) in shaders:
            self._reify_tester(shader, target)
