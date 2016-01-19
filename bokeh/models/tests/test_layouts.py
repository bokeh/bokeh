from __future__ import absolute_import

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

class TestLayout(unittest.TestCase):

    def setUp(self):
        from bokeh.models.layouts import Layout
        self.layoutCls = Layout

    def test_expected_props(self):
        expected_properties = set(['width', 'height'])
        actual_properties = get_prop_set(self.layoutCls)
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_props_defaults(self):
        layout = self.layoutCls()
        self.assertEqual(layout.width, None)
        self.assertEqual(layout.height, None)


if __name__ == "__main__":
    unittest.main()
