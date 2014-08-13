import unittest
import bokeh.transforms.ar_downsample as ar_downsample
from bokeh.transforms.ar_downsample import *
from bokeh.objects import Range1d
import types
from .test_utils import skipIfPy3

# Only import in python 2...
try:
    import abstract_rendering.glyphset as glyphset
    import abstract_rendering.core as ar
except:
    import sys
    if sys.version[0] == '2':
        raise


# -------------- Process and Utility Tests ----------
@skipIfPy3("AR does not run in python 3")
class TestReplot(unittest.TestCase):
    pass


@skipIfPy3("AR does not run in python 3")
class TestSource(unittest.TestCase):
    pass


@skipIfPy3("AR does not run in python 3")
class _SourceShim(object):
    defVal = 'value'

    def __init__(self, t, *k):
        self.transform = {'shader': t}
        self.data = dict(zip(k, [self.defVal]*len(k)))


@skipIfPy3("AR does not run in python 3")
class TestMapping(unittest.TestCase):
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


@skipIfPy3("AR does not run in python 3")
class TestDownsample(unittest.TestCase):
    pass


# Hack: The "AA" forces this test to run first
# "Note that the order in which the various test cases will be run is determined by sorting the test function names with respect to the built-in ordering for strings"
# https://docs.python.org/2/library/unittest.html
@skipIfPy3("AR does not run in python 3")
class AA_Test_loadAR(unittest.TestCase):
    def test(self):
        self.assertRaises(NameError, Id().reify)
        ar_downsample._loadAR()
        self.assertIsNotNone(Id().reify())


@skipIfPy3("AR does not run in python 3")
class Test_span(unittest.TestCase):
    def test(self):
        self.assertEquals(0, ar_downsample._span(Range1d(start=0, end=0)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=0, end=2)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=-2, end=0)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=-2, end=2)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=2, end=-2)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=None, end=3)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=3, end=None)))
        self.assertEquals(0, ar_downsample._span(Range1d(start=None, end=None)))


@skipIfPy3("AR does not run in python 3")
class Test_shaper(unittest.TestCase):
    def testCreate(self):
        self.assertIsInstance(ar_downsample._shaper("square", 3, False), glyphset.ToRect)
        self.assertIsInstance(ar_downsample._shaper("square", 3, True), glyphset.ToPoint)
        self.assertIsInstance(ar_downsample._shaper("circle", 3, True), glyphset.ToPoint)

    def testFail(self):
        with self.assertRaises(ValueError):
            ar_downsample._shaper("circle", 3, False)
            ar_downsample._shaper("blah", 3, False)


# ----------- Testing utilities ------------
@skipIfPy3("AR does not run in python 3")
class _ProxyTester(object):
    proxy = None
    reifyBase = None

    def test_reify(self):
        ar_downsample._loadAR()
        op = self.proxy.reify()
        self.assertIsNotNone(op)
        self.assertIsInstance(op, self.reifyBase)


@skipIfPy3("AR does not run in python 3")
class _ShaderTester(_ProxyTester):
    reifyBase = ar.Shader

    def test_out(self):
        self.assertIn(self.proxy.out, ["image", "image_rgb", "poly_line"])

    def test_reformat_None(self):
        self.assertIsNotNone(self.proxy.reformat(None))

    def test_extend(self):
        op2 = self.proxy + Id()
        self.assertIsNotNone(op2)
        self.assertIsInstance(op2, Seq)


@skipIfPy3("AR does not run in python 3")
class _InfoTester(_ProxyTester):
    reifyBase = types.FunctionType


@skipIfPy3("AR does not run in python 3")
class _AggregatorTester(_ProxyTester):
    reifyBase = ar.Aggregator


# ----------- Shader Tests -------------------
@skipIfPy3("AR does not run in python 3")
class TestSeq(_ShaderTester, unittest.TestCase):
    proxy = Seq(first=Id(), second=Sqrt())


@skipIfPy3("AR does not run in python 3")
class TestId(_ShaderTester, unittest.TestCase):
    proxy = Id()


@skipIfPy3("AR does not run in python 3")
class TestBinarySegment(_ShaderTester, unittest.TestCase):
    proxy = BinarySegment(low=1, high=2, divider=10)


@skipIfPy3("AR does not run in python 3")
class TestInterpolate(_ShaderTester, unittest.TestCase):
    proxy = Interpolate(low=0, high=10)


@skipIfPy3("AR does not run in python 3")
class TestInterpolateColor(_ShaderTester, unittest.TestCase):
    proxy = InterpolateColor(low=(10, 10, 10),
                             high=(200, 200, 200),
                             reserve=(0, 0, 0),
                             empty=-1)


@skipIfPy3("AR does not run in python 3")
class TestSqrt(_ShaderTester, unittest.TestCase):
    proxy = Sqrt()


@skipIfPy3("AR does not run in python 3")
class TestCuberoot(_ShaderTester, unittest.TestCase):
    proxy = Cuberoot()


@skipIfPy3("AR does not run in python 3")
class TestSpread(_ShaderTester, unittest.TestCase):
    proxy = Spread(factor=2)


@skipIfPy3("AR does not run in python 3")
class TestContour(_ShaderTester, unittest.TestCase):
    proxy = Contour()


# ----------- Info and Aggregator Tests -------------------
@skipIfPy3("AR does not run in python 3")
class TestConst(_InfoTester, unittest.TestCase):
    proxy = Const(val=3)


@skipIfPy3("AR does not run in python 3")
class TestSum(_AggregatorTester, unittest.TestCase):
    proxy = Sum()


@skipIfPy3("AR does not run in python 3")
class TestCount(_AggregatorTester, unittest.TestCase):
    proxy = Count()
