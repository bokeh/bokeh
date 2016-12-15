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


class TestPanel(unittest.TestCase):

    def setUp(self):
        from bokeh.models.widgets.panels import Panel
        self.panelCls = Panel

    def test_expectedprops(self):
        expected_properties = set(['title', 'child', 'closable'])
        actual_properties = get_prop_set(self.panelCls)
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_prop_defaults(self):
        p1 = self.panelCls()
        p2 = self.panelCls()
        self.assertEqual(p1.title, "")
        self.assertEqual(p2.title, "")
        self.assertEqual(p1.child, None)
        self.assertFalse(p1.closable)


class TestTabs(unittest.TestCase):

    def setUp(self):
        from bokeh.models.widgets.panels import Tabs, Panel
        self.tabsCls = Tabs
        self.panelCls = Panel

    def test_expected_props(self):
        expected_properties = set(['tabs', 'active'])
        actual_properties = get_prop_set(self.tabsCls)
        self.assertTrue(expected_properties.issubset(actual_properties))

    def test_props_defaults(self):
        tab = self.tabsCls()
        self.assertEqual(tab.tabs, [])
        self.assertEqual(tab.active, 0)


if __name__ == "__main__":
    unittest.main()
