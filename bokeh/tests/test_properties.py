from __future__ import absolute_import
import unittest
import numpy as np

from bokeh.properties import (
    HasProps, NumberSpec, ColorSpec, Bool, Int, Float, Complex, String,
    Regex, List, Dict, Tuple, Array, Instance, Any, Interval, Either,
    Enum, Color, Align, DashPattern, Size, Percent, Angle)


class Basictest(unittest.TestCase):

    def test_simple_class(self):
        class Foo(HasProps):
            x = Int(12)
            y = String("hello")
            z = Array(Int, np.array([1, 2, 3]))
            s = String(None)

        f = Foo()
        self.assertEqual(f.x, 12)
        self.assertEqual(f.y, "hello")
        self.assert_(np.array_equal(np.array([1, 2, 3]), f.z))
        self.assertEqual(f.s, None)

        f.x = 18
        self.assertEqual(f.x, 18)

        f.y = "bar"
        self.assertEqual(f.y, "bar")

    def test_enum(self):
        class Foo(HasProps):
            x = Enum("blue", "red", "green")     # the first item is the default
            y = Enum("small", "medium", "large", default="large")

        f = Foo()
        self.assertEqual(f.x, "blue")
        self.assertEqual(f.y, "large")

        f.x = "red"
        self.assertEqual(f.x, "red")

        with self.assertRaises(ValueError):
            f.x = "yellow"

        f.y = "small"
        self.assertEqual(f.y, "small")

        with self.assertRaises(ValueError):
            f.y = "yellow"

    def test_inheritance(self):
        class Base(HasProps):
            x = Int(12)
            y = String("hello")

        class Child(Base):
            z = Float(3.14)

        c = Child()
        self.assertEqual(frozenset(['x', 'y', 'z']), frozenset(c.properties()))
        self.assertEqual(c.y, "hello")

    def test_set(self):
        class Foo(HasProps):
            x = Int(12)
            y = Enum("red", "blue", "green")
            z = String("blah")

        f = Foo()
        self.assertEqual(f.x, 12)
        self.assertEqual(f.y, "red")
        self.assertEqual(f.z, "blah")
        f.set(**dict(x=20, y="green", z="hello"))
        self.assertEqual(f.x, 20)
        self.assertEqual(f.y, "green")
        self.assertEqual(f.z, "hello")
        with self.assertRaises(ValueError):
            f.set(y="orange")

    def test_no_parens(self):
        class Foo(HasProps):
            x = Int
            y = Int()
        f = Foo()
        self.assertEqual(f.x, f.y)
        f.x = 13
        self.assertEqual(f.x, 13)

    # def test_kwargs_init(self):
    #     class Foo(HasProps):
    #         x = String
    #         y = Int
    #         z = Float
    #     f = Foo(x = "hello", y = 14)
    #     self.assertEqual(f.x, "hello")
    #     self.assertEqual(f.y, 14)

    #     with self.assertRaises(TypeError):
    #         # This should raise a TypeError: object.__init__() takes no parameters
    #         g = Foo(z = 3.14, q = "blah")

class TestNumberSpec(unittest.TestCase):

    def test_field(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        self.assertEqual(f.x, "xfield")
        self.assertDictEqual(Foo.__dict__["x"].to_dict(f), {"field": "xfield"})
        f.x = "my_x"
        self.assertEqual(f.x, "my_x")
        self.assertDictEqual(Foo.__dict__["x"].to_dict(f), {"field": "my_x"})

    def test_value(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        self.assertEqual(f.x, "xfield")
        f.x = 12
        self.assertEqual(f.x, 12)
        self.assertDictEqual(Foo.__dict__["x"].to_dict(f), {"value": 12})
        f.x = 15
        self.assertEqual(f.x, 15)
        self.assertDictEqual(Foo.__dict__["x"].to_dict(f), {"value": 15})
        f.x = dict(value=32)
        self.assertDictEqual(Foo.__dict__["x"].to_dict(f), {"value": 32})

    def test_default(self):
        class Foo(HasProps):
            y = NumberSpec(default=12)
        f = Foo()
        self.assertEqual(f.y, 12)
        self.assertDictEqual(Foo.__dict__["y"].to_dict(f), {"value": 12})
        f.y = "y1"
        self.assertEqual(f.y, "y1")
        # Once we set a concrete value, the default is ignored, because it is unused
        f.y = 32
        self.assertEqual(f.y, 32)
        self.assertDictEqual(Foo.__dict__["y"].to_dict(f), {"value": 32})

    def test_multiple_instances(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")

        a = Foo()
        b = Foo()
        a.x = 13
        b.x = 14
        self.assertEqual(a.x, 13)
        self.assertEqual(b.x, 14)
        self.assertDictEqual(Foo.__dict__["x"].to_dict(a), {"value": 13})
        self.assertDictEqual(Foo.__dict__["x"].to_dict(b), {"value": 14})
        b.x = {"field": "x3"}
        self.assertDictEqual(Foo.__dict__["x"].to_dict(a), {"value": 13})
        self.assertDictEqual(Foo.__dict__["x"].to_dict(b), {"field": "x3"})


class TestColorSpec(unittest.TestCase):

    def test_field(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "colorfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "colorfield"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "myfield"})

    def test_field_default(self):
        class Foo(HasProps):
            col = ColorSpec(default="red")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "red")
        self.assertDictEqual(desc.to_dict(f), {"value": "red"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "myfield"})

    def test_default_tuple(self):
        class Foo(HasProps):
            col = ColorSpec(default=(128, 255, 124))
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, (128, 255, 124))
        self.assertDictEqual(desc.to_dict(f), {"value": "rgb(128, 255, 124)"})

    def test_fixed_value(self):
        class Foo(HasProps):
            col = ColorSpec("gray")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "gray")
        self.assertDictEqual(desc.to_dict(f), {"value": "gray"})

    def test_named_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()

        f.col = "red"
        self.assertEqual(f.col, "red")
        self.assertDictEqual(desc.to_dict(f), {"value": "red"})
        f.col = "forestgreen"
        self.assertEqual(f.col, "forestgreen")
        self.assertDictEqual(desc.to_dict(f), {"value": "forestgreen"})

    def test_named_value_set_none(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = None
        self.assertDictEqual(desc.to_dict(f), {"value": None})

    def test_named_value_unset(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertDictEqual(desc.to_dict(f), {"field": "colorfield"})

    def test_named_color_overriding_default(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "forestgreen"
        self.assertEqual(f.col, "forestgreen")
        self.assertDictEqual(desc.to_dict(f), {"value": "forestgreen"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "myfield"})

    def test_hex_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "#FF004A"
        self.assertEqual(f.col, "#FF004A")
        self.assertDictEqual(desc.to_dict(f), {"value": "#FF004A"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "myfield"})

    def test_tuple_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = (128, 200, 255)
        self.assertEqual(f.col, (128, 200, 255))
        self.assertDictEqual(desc.to_dict(f), {"value": "rgb(128, 200, 255)"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.to_dict(f), {"field": "myfield"})
        f.col = (100, 150, 200, 0.5)
        self.assertEqual(f.col, (100, 150, 200, 0.5))
        self.assertDictEqual(desc.to_dict(f), {"value": "rgba(100, 150, 200, 0.5)"})

    def test_set_dict(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = {"field": "myfield"}
        self.assertDictEqual(f.col, {"field": "myfield"})

        f.col = "field2"
        self.assertEqual(f.col, "field2")
        self.assertDictEqual(desc.to_dict(f), {"field": "field2"})

class TestDashPattern(unittest.TestCase):

    def test_named(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        self.assertEqual(f.pat, [])
        f.pat = "solid"
        self.assertEqual(f.pat, [])
        f.pat = "dashed"
        self.assertEqual(f.pat, [6])
        f.pat = "dotted"
        self.assertEqual(f.pat, [2, 4])
        f.pat = "dotdash"
        self.assertEqual(f.pat, [2, 4, 6, 4])
        f.pat = "dashdot"
        self.assertEqual(f.pat, [6, 4, 2, 4])

    def test_string(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ""
        self.assertEqual(f.pat, [])
        f.pat = "2"
        self.assertEqual(f.pat, [2])
        f.pat = "2 4"
        self.assertEqual(f.pat, [2, 4])
        f.pat = "2 4 6"
        self.assertEqual(f.pat, [2, 4, 6])

        with self.assertRaises(ValueError):
            f.pat = "abc 6"

    def test_list(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ()
        self.assertEqual(f.pat, ())
        f.pat = (2,)
        self.assertEqual(f.pat, (2,))
        f.pat = (2, 4)
        self.assertEqual(f.pat, (2, 4))
        f.pat = (2, 4, 6)
        self.assertEqual(f.pat, (2, 4, 6))

        with self.assertRaises(ValueError):
            f.pat = (2, 4.2)
        with self.assertRaises(ValueError):
            f.pat = (2, "a")

    def test_invalid(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        with self.assertRaises(ValueError):
            f.pat = 10
        with self.assertRaises(ValueError):
            f.pat = 10.1
        with self.assertRaises(ValueError):
            f.pat = {}


class Foo(HasProps):
    pass

class Bar(HasProps):
    pass

class Baz(HasProps):
    pass

class TestProperties(unittest.TestCase):

    def test_Any(self):
        prop = Any()

        self.assertTrue(prop.is_valid(None))
        self.assertTrue(prop.is_valid(False))
        self.assertTrue(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertTrue(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertTrue(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertTrue(prop.is_valid({}))
        self.assertTrue(prop.is_valid(Foo()))

    def test_Bool(self):
        prop = Bool()

        self.assertTrue(prop.is_valid(None))
        self.assertTrue(prop.is_valid(False))
        self.assertTrue(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Int(self):
        prop = Int()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Float(self):
        prop = Float()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Complex(self):
        prop = Complex()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertTrue(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_String(self):
        prop = String()

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Regex(self):
        with self.assertRaises(TypeError):
            prop = Regex()

        prop = Regex("^x*$")

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_List(self):
        with self.assertRaises(TypeError):
            prop = List()

        prop = List(Int)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Dict(self):
        with self.assertRaises(TypeError):
            prop = Dict()

        prop = Dict(String, List(Int))

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertTrue(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Tuple(self):
        with self.assertRaises(TypeError):
            prop = Tuple()

        with self.assertRaises(TypeError):
            prop = Tuple(Int)

        prop = Tuple(Int, String, List(Int))

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid((1, "", [1, 2, 3])))
        self.assertFalse(prop.is_valid((1.0, "", [1, 2, 3])))
        self.assertFalse(prop.is_valid((1, True, [1, 2, 3])))
        self.assertFalse(prop.is_valid((1, "", (1, 2, 3))))
        self.assertFalse(prop.is_valid((1, "", [1, 2, "xyz"])))

    def test_Instance(self):
        with self.assertRaises(TypeError):
            prop = Instance()

        prop = Instance(Foo)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertTrue(prop.is_valid(Foo()))

        self.assertFalse(prop.is_valid(Bar()))
        self.assertFalse(prop.is_valid(Baz()))

    def test_Interval(self):
        with self.assertRaises(TypeError):
            prop = Interval()

        with self.assertRaises(ValueError):
            prop = Interval(Int, 0.0, 1.0)

        prop = Interval(Int, 0, 255)

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(127))
        self.assertFalse(prop.is_valid(-1))
        self.assertFalse(prop.is_valid(256))

        prop = Interval(Float, 0.0, 1.0)

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(0.5))
        self.assertFalse(prop.is_valid(-0.001))
        self.assertFalse(prop.is_valid( 1.001))

    def test_Either(self):
        with self.assertRaises(TypeError):
            prop = Either()

        prop = Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(100))
        self.assertFalse(prop.is_valid(-100))
        self.assertTrue(prop.is_valid("xxx"))
        self.assertFalse(prop.is_valid("yyy"))
        self.assertTrue(prop.is_valid([1, 2, 3]))
        self.assertFalse(prop.is_valid([1, 2, ""]))

    def test_Enum(self):
        with self.assertRaises(TypeError):
            prop = Enum()

        with self.assertRaises(TypeError):
            prop = Enum("red", "green", 1)

        with self.assertRaises(TypeError):
            prop = Enum("red", "green", "red")

        prop = Enum("red", "green", "blue")

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("red"))
        self.assertTrue(prop.is_valid("green"))
        self.assertTrue(prop.is_valid("blue"))

        self.assertFalse(prop.is_valid("RED"))
        self.assertFalse(prop.is_valid("GREEN"))
        self.assertFalse(prop.is_valid("BLUE"))

        self.assertFalse(prop.is_valid(" red"))
        self.assertFalse(prop.is_valid(" green"))
        self.assertFalse(prop.is_valid(" blue"))

        from bokeh.enums import LineJoin
        prop = Enum(LineJoin)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("miter"))
        self.assertTrue(prop.is_valid("round"))
        self.assertTrue(prop.is_valid("bevel"))

        self.assertFalse(prop.is_valid("MITER"))
        self.assertFalse(prop.is_valid("ROUND"))
        self.assertFalse(prop.is_valid("BEVEL"))

        self.assertFalse(prop.is_valid(" miter"))
        self.assertFalse(prop.is_valid(" round"))
        self.assertFalse(prop.is_valid(" bevel"))

    def test_Color(self):
        prop = Color()

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid((0, 127, 255)))
        self.assertFalse(prop.is_valid((0, -127, 255)))
        self.assertFalse(prop.is_valid((0, 127)))
        self.assertFalse(prop.is_valid((0, 127, 1.0)))
        self.assertFalse(prop.is_valid((0, 127, 255, 255)))
        self.assertTrue(prop.is_valid((0, 127, 255, 1.0)))

        self.assertTrue(prop.is_valid("#00aaff"))
        self.assertTrue(prop.is_valid("#00AAFF"))
        self.assertTrue(prop.is_valid("#00AaFf"))
        self.assertFalse(prop.is_valid("00aaff"))
        self.assertFalse(prop.is_valid("00AAFF"))
        self.assertFalse(prop.is_valid("00AaFf"))
        self.assertFalse(prop.is_valid("#00AaFg"))
        self.assertFalse(prop.is_valid("#00AaFff"))

        self.assertTrue(prop.is_valid("blue"))
        self.assertFalse(prop.is_valid("BLUE"))
        self.assertFalse(prop.is_valid("foobar"))

    def test_Align(self):
        prop = Align() # TODO
        assert prop

    def test_DashPattern(self):
        prop = DashPattern()

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertTrue(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("solid"))
        self.assertTrue(prop.is_valid("dashed"))
        self.assertTrue(prop.is_valid("dotted"))
        self.assertTrue(prop.is_valid("dotdash"))
        self.assertTrue(prop.is_valid("dashdot"))
        self.assertFalse(prop.is_valid("DASHDOT"))

        self.assertTrue(prop.is_valid([1, 2, 3]))
        self.assertFalse(prop.is_valid([1, 2, 3.0]))

        self.assertTrue(prop.is_valid("1 2 3"))
        self.assertFalse(prop.is_valid("1 2 x"))

    def test_Size(self):
        prop = Size()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(100))
        self.assertTrue(prop.is_valid(100.1))
        self.assertFalse(prop.is_valid(-100))
        self.assertFalse(prop.is_valid(-0.001))

    def test_Percent(self):
        prop = Percent()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(0.5))
        self.assertFalse(prop.is_valid(-0.001))
        self.assertFalse(prop.is_valid( 1.001))

    def test_Angle(self):
        prop = Angle()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

def test_HasProps_clone():
    from bokeh.models import Plot
    p1 = Plot(plot_width=1000)
    c1 = p1.changed_properties()
    p2 = p1.clone()
    c2 = p2.changed_properties()
    assert c1 == c2

if __name__ == "__main__":
    unittest.main()
