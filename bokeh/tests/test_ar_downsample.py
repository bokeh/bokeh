import unittest
import bokeh.transforms.ar_downsample as ar_downsample
from bokeh.transforms.ar_downsample import *
from bokeh.objects import Range1d
import abstract_rendering.glyphset as glyphset
import abstract_rendering.core as ar
import types


# -------------- Process and Utility Tests ----------
class TestReplot(unittest.TestCase):
    pass


class TestSource(unittest.TestCase):
    pass


class TestMapping(unittest.TestCase):
    pass


class TestDownsample(unittest.TestCase):
    pass

# Hack: The "AA" forces this test to run first 
# "Note that the order in which the various test cases will be run is determined by sorting the test function names with respect to the built-in ordering for strings" 
# https://docs.python.org/2/library/unittest.html
class AA_Test_loadAR(unittest.TestCase):
    def test(self):
        self.assertRaises(NameError, Id().reify)
        ar_downsample._loadAR()
        self.assertIsNotNone(Id().reify())

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
class _ProxyTester(object):
    proxy = None
    reifyBase = None

    def test_reify(self):
        ar_downsample._loadAR()
        op = self.proxy.reify()
        self.assertIsNotNone(op)
        self.assertIsInstance(op, self.reifyBase)


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


class _InfoTester(_ProxyTester):
    reifyBase = types.FunctionType


class _AggregatorTester(_ProxyTester):
    reifyBase = ar.Aggregator


# ----------- Shader Tests -------------------
class TestSeq(_ShaderTester, unittest.TestCase):
    proxy = Seq(first=Id(), second=Sqrt())


class TestId(_ShaderTester, unittest.TestCase):
    proxy = Id()


class TestBinarySegment(_ShaderTester, unittest.TestCase):
    proxy = BinarySegment(low=1, high=2, divider=10)


class TestInterpolate(_ShaderTester, unittest.TestCase):
    proxy = Interpolate(low=0, high=10)


class TestInterpolateColor(_ShaderTester, unittest.TestCase):
    proxy = InterpolateColor(low=(10, 10, 10),
                             high=(200, 200, 200),
                             reserve=(0, 0, 0),
                             empty=-1)


class TestSqrt(_ShaderTester, unittest.TestCase):
    proxy = Sqrt()


class TestCuberoot(_ShaderTester, unittest.TestCase):
    proxy = Cuberoot()


class TestSpread(_ShaderTester, unittest.TestCase):
    proxy = Spread(factor=2)


class TestContour(_ShaderTester, unittest.TestCase):
    proxy = Contour()


# ----------- Info and Aggregator Tests -------------------
class TestConst(_InfoTester, unittest.TestCase):
    proxy = Const(val=3)


class TestSum(_AggregatorTester, unittest.TestCase):
    proxy = Sum()


class TestCount(_AggregatorTester, unittest.TestCase):
    proxy = Count()
