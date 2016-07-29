from __future__ import absolute_import, print_function

import unittest

import os
import tempfile

from bokeh.document import Document
from bokeh.model import Model
from bokeh.core.property_mixins import FillProps, LineProps, TextProps
from bokeh.core.properties import Int, String
from bokeh.themes import Theme

class ThemedModel(Model):
    number = Int(42)
    string = String("hello")

class SubOfThemedModel(ThemedModel):
    another_string = String("world")

FILE_CONTENTS = """
attrs:
    ThemedModel:
        number: 57
    SubOfThemedModel:
        another_string: "boo"
""".encode('utf-8')

class TestThemes(unittest.TestCase):

    def test_construct_empty_theme_from_file(self):
        # windows will throw permissions error with auto-delete
        with (tempfile.NamedTemporaryFile(delete=False)) as file:
            # create and apply empty theme with no exception thrown
            file.file.write("".encode('utf-8'))
            file.file.flush()
            theme = Theme(filename=file.name)
            theme.apply_to_model(ThemedModel())
        file.close()
        os.remove(file.name)

    def test_construct_empty_theme_from_json(self):
        # create and apply empty theme with no exception thrown
        theme = Theme(json=dict())
        theme.apply_to_model(ThemedModel())

    def test_construct_no_json_or_filename(self):
        with self.assertRaises(ValueError) as manager:
            Theme()
        self.assertTrue("requires json or a filename" in repr(manager.exception))

    def test_construct_json_and_filename(self):
        with self.assertRaises(ValueError) as manager:
            # we check "" and {} as falsey values, to try to trick
            # our code into thinking they weren't provided.
            Theme(filename="", json={})
        self.assertTrue("not both" in repr(manager.exception))

    def test_construct_bad_attrs(self):
        with self.assertRaises(ValueError) as manager:
            Theme(json=dict(attrs=42))
        self.assertTrue("should be a dictionary of class names" in repr(manager.exception))

    def test_construct_bad_class_props(self):
        with self.assertRaises(ValueError) as manager:
            Theme(json=dict(attrs=dict(SomeClass=42)))
        self.assertTrue("should be a dictionary of properties" in repr(manager.exception))

    def test_construct_nonempty_theme_from_file(self):
        # windows will throw permissions error with auto-delete
        with (tempfile.NamedTemporaryFile(delete=False)) as file:
            # create and apply empty theme with no exception thrown
            file.file.write(FILE_CONTENTS)
            file.file.flush()
            theme = Theme(filename=file.name)
            self.assertDictEqual(dict(number=57), theme._for_class(ThemedModel))
            self.assertDictEqual(dict(number=57, another_string="boo"), theme._for_class(SubOfThemedModel))
        file.close()
        os.remove(file.name)

    def test_theming_a_model(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        changes = dict(calls=[])
        self.assertEqual('hello', obj.string)
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        theme.apply_to_model(obj)
        self.assertEqual('w00t', obj.string)
        self.assertEqual([('string', 'hello', 'w00t')], changes['calls'])

    def test_theming_a_model_via_base(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = SubOfThemedModel()
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        self.assertEqual('hello', obj.string)
        theme.apply_to_model(obj)
        self.assertEqual('w00t', obj.string)
        self.assertEqual([('string', 'hello', 'w00t')], changes['calls'])

    def test_subclass_theme_used_rather_than_base(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                },
                'SubOfThemedModel' : {
                    'string' : 'bar'
                }
            }
        })
        obj = SubOfThemedModel()
        self.assertEqual('hello', obj.string)
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        theme.apply_to_model(obj)
        self.assertEqual('bar', obj.string)
        self.assertEqual([('string', 'hello', 'bar')], changes['calls'])

    def test_theming_a_document_after_adding_root(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        doc = Document()
        doc.add_root(obj)
        self.assertEqual('hello', obj.string)
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        doc.theme = theme
        self.assertIs(doc.theme, theme)
        self.assertEqual('w00t', obj.string)
        doc.remove_root(obj)
        self.assertEqual('hello', obj.string)
        self.assertEqual([('string', 'hello', 'w00t'),
                          ('string', 'w00t', 'hello')], changes['calls'])

    def test_theming_a_document_before_adding_root(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        doc = Document()
        self.assertEqual('hello', obj.string)
        doc.theme = theme
        self.assertIs(doc.theme, theme)
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        doc.add_root(obj)
        self.assertEqual('w00t', obj.string)
        doc.remove_root(obj)
        self.assertEqual('hello', obj.string)
        self.assertEqual([('string', 'hello', 'w00t'),
                          ('string', 'w00t', 'hello')], changes['calls'])

    def test_setting_document_theme_to_none(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        doc = Document()
        doc.add_root(obj)
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        doc.theme = theme
        self.assertEqual('w00t', obj.string)
        # setting to None reverts to default theme
        doc.theme = None
        self.assertIsNot(doc.theme, None)
        self.assertEqual('hello', obj.string)
        self.assertEqual([('string', 'hello', 'w00t'),
                          ('string', 'w00t', 'hello')], changes['calls'])

    def _compare_dict_to_model_class_defaults(self, props, model_class):
        model = model_class()
        for name, value in props.items():
            property = model.lookup(name)
            if property is None:
                raise RuntimeError("Model %r has no property %s" % (model, name))
            default = property.class_default(model_class)
            if default != value:
                print("%s.%s differs default %r theme %r" % (model_class.__name__, name, default, value))
            else:
                print("%s.%s default %r is identical in the theme" % (model_class.__name__, name, default))

    def _compare_dict_to_model_defaults(self, props, model_name):
        import bokeh.models as models
        import bokeh.models.widgets as widgets

        if hasattr(models, model_name):
            self._compare_dict_to_model_class_defaults(props, getattr(models, model_name))
        elif hasattr(widgets, model_name):
            self._compare_dict_to_model_class_defaults(props, getattr(widgets, model_name))
        else:
            raise RuntimeError("Could not find class for " + model_name)

    def test_default_theme_is_empty(self):
        # this is kind of a silly test once we fix default.yaml to be empty :-)
        # the point is to list all the things to fix.
        doc = Document()

        # before each assertion, we print out why it's going to fail.
        for class_name, props in doc.theme._json['attrs'].items():
            self._compare_dict_to_model_defaults(props, class_name)
        self.assertEqual(0, len(doc.theme._json['attrs']))

        self._compare_dict_to_model_class_defaults(doc.theme._fill_defaults, FillProps)
        self.assertEqual(0, len(doc.theme._fill_defaults))

        self._compare_dict_to_model_class_defaults(doc.theme._text_defaults, TextProps)
        self.assertEqual(0, len(doc.theme._text_defaults))

        self._compare_dict_to_model_class_defaults(doc.theme._line_defaults, LineProps)
        self.assertEqual(0, len(doc.theme._line_defaults))
