from __future__ import absolute_import

import unittest

import bokeh.colors as colors

class TestColor(unittest.TestCase):

    def test_basic(self):
        c = colors.Color()
        assert c

    def test_abstract(self):
        c = colors.Color()
        self.assertRaises(NotImplementedError, c.to_css)
        self.assertRaises(NotImplementedError, c.to_rgb)
        self.assertRaises(NotImplementedError, c.to_hsl)
        self.assertRaises(NotImplementedError, c.from_rgb, "foo")
        self.assertRaises(NotImplementedError, c.from_hsl,"foo")

    def test_repr(self):
        c = colors.Color()
        self.assertRaises(NotImplementedError, repr, c)

    def test_clamp(self):
        self.assertEqual(colors.Color.clamp(10), 10)
        self.assertEqual(colors.Color.clamp(10, 20), 10)
        self.assertEqual(colors.Color.clamp(10, 5), 5)
        self.assertEqual(colors.Color.clamp(-10), 0)

    def test_lighten(self):
        c = colors.HSL(10, 0.2, 0.2, 0.2)
        c1 = c.lighten(0.2)
        self.assertEqual(c1.a, 0.2)
        self.assertEqual(c1.h, 10)
        self.assertEqual(c1.s, 0.2)
        self.assertEqual(c1.l, 0.4)

    def test_darken(self):
        c = colors.HSL(10, 0.2, 0.2, 0.2)
        c1 = c.darken(0.1)
        self.assertEqual(c1.a, 0.2)
        self.assertEqual(c1.h, 10)
        self.assertEqual(c1.s, 0.2)
        self.assertEqual(c1.l, 0.1)
        c2 = c.darken(0.3)
        self.assertEqual(c2.a, 0.2)
        self.assertEqual(c2.h, 10)
        self.assertEqual(c2.s, 0.2)
        self.assertEqual(c2.l, 0)

class TestRGB(unittest.TestCase):

    def test_basic(self):
        c = colors.RGB(10, 20, 30)
        assert c
        c = colors.RGB(10, 20, 30, 0.3)
        assert c

    def test_repr(self):
        c = colors.RGB(10, 20, 30)
        self.assertEqual(repr(c), c.to_css())
        c = colors.RGB(10, 20, 30, 0.3)
        self.assertEqual(repr(c), c.to_css())

    def test_to_css(self):
        c = colors.RGB(10, 20, 30)
        self.assertEqual(c.to_css(), "rgb(10, 20, 30)")
        c = colors.RGB(10, 20, 30, 0.3)
        self.assertEqual(c.to_css(), "rgba(10, 20, 30, 0.3)")

    def test_to_hex(self):
        c = colors.RGB(10, 20, 30)
        self.assertEqual(c.to_hex(), "#%02X%02X%02X" % (c.r, c.g, c.b))

    def test_to_rgb(self):
        c = colors.RGB(10, 20, 30)
        c2 = c.to_rgb()
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.r, c2.r)
        self.assertEqual(c.g, c2.g)
        self.assertEqual(c.b, c2.b)

        c = colors.RGB(10, 20, 30, 0.1)
        c2 = c.to_rgb()
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.r, c2.r)
        self.assertEqual(c.g, c2.g)
        self.assertEqual(c.b, c2.b)

    def test_from_rgb(self):
        c = colors.RGB(10, 20, 30)
        c2 = c.from_rgb(c)
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.r, c2.r)
        self.assertEqual(c.g, c2.g)
        self.assertEqual(c.b, c2.b)

        c = colors.RGB(10, 20, 30, 0.1)
        c2 = c.from_rgb(c)
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.r, c2.r)
        self.assertEqual(c.g, c2.g)
        self.assertEqual(c.b, c2.b)

class TestHSL(unittest.TestCase):

    def test_basic(self):
        c = colors.HSL(10, 0.2, 0.3)
        assert c
        c = colors.HSL(10, 0.2, 0.3, 0.3)
        assert c

    def test_repr(self):
        c = colors.HSL(10, 0.2, 0.3)
        self.assertEqual(repr(c), c.to_css())
        c = colors.HSL(10, 0.2, 0.3, 0.3)
        self.assertEqual(repr(c), c.to_css())

    def test_to_css(self):
        c = colors.HSL(10, 0.2, 0.3)
        self.assertEqual(c.to_css(), "hsl(10, 20.0%, 30.0%)")
        c = colors.HSL(10, 0.2, 0.3, 0.3)
        self.assertEqual(c.to_css(), "hsla(10, 20.0%, 30.0%, 0.3)")

    def test_to_hsl(self):
        c = colors.HSL(10, 0.2, 0.3)
        c2 = c.to_hsl()
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.h, c2.h)
        self.assertEqual(c.s, c2.s)
        self.assertEqual(c.l, c2.l)

        c = colors.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.to_hsl()
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.h, c2.h)
        self.assertEqual(c.s, c2.s)
        self.assertEqual(c.l, c2.l)

    def test_from_hsl(self):
        c = colors.HSL(10, 0.2, 0.3)
        c2 = c.from_hsl(c)
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.h, c2.h)
        self.assertEqual(c.s, c2.s)
        self.assertEqual(c.l, c2.l)

        c = colors.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.from_hsl(c)
        self.assertTrue(c is not c2)
        self.assertEqual(c.a, c2.a)
        self.assertEqual(c.h, c2.h)
        self.assertEqual(c.s, c2.s)
        self.assertEqual(c.l, c2.l)

class TestNamedColor(unittest.TestCase):

    def test_basic(self):
        c = colors.NamedColor("aliceblue", 240,  248,  255)
        self.assertEqual(c.name, "aliceblue")

    def test_to_css(self):
        c = colors.NamedColor("aliceblue", 240,  248,  255)
        self.assertEqual(c.to_css(), "aliceblue")

    def test_repr(self):
        c = colors.NamedColor("aliceblue", 240,  248,  255)
        self.assertEqual(repr(c), c.to_css())
