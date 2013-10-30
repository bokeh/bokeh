import unittest
import numpy as np

from bokeh.properties import HasProps, Int, Array, String, Enum, Float

class Basictest(unittest.TestCase):

    def test_simple_class(self):
        class Foo(HasProps):
            x = Int(12)
            y = String("hello")
            z = Array([1,2,3])
            s = String(None)

        f = Foo()
        self.assertEqual(f.x, 12)
        self.assertEqual(f.y, "hello")
        self.assert_(np.array_equal(np.array([1,2,3]), f.z))
        self.assertEqual(f.s, None)

        f.x = 18
        self.assertEqual(f.x, 18)

        f.y = "bar"
        self.assertEqual(f.y, "bar")

    def test_enum(self):
        class Foo(HasProps):
            x = Enum("blue", "red", "green")
            y = Enum("small", "medium", "large", default="tiny")

        f = Foo()
        self.assertEqual(f.x, "blue")
        self.assertEqual(f.y, "tiny")
        f.x = "red"
        with self.assertRaises(ValueError):
            f.x = "yellow"
        f.y = "small"
        with self.assertRaises(ValueError):
            # Even though this is the default, it is not a valid value
            # for the Enum.
            f.y = "tiny"

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

    def test_kwargs_init(self):
        class Foo(HasProps):
            x = String
            y = Int
            z = Float
        f = Foo(x = "hello", y = 14)
        self.assertEqual(f.x, "hello")
        self.assertEqual(f.y, 14)

        with self.assertRaises(TypeError):
            # This should raise a TypeError: object.__init__() takes no parameters
            g = Foo(z = 3.14, q = "blah")


if __name__ == "__main__":
    unittest.main()
