from __future__ import absolute_import, print_function

import unittest

import tempfile

from bokeh.document import Document
from bokeh.model import Model
from bokeh.properties import Int, Instance, String
from bokeh.themes import default as default_theme
from bokeh.themes import Theme

class ThemedModel(Model):
    number = Int(42)
    string = String("hello")

class SubOfThemedModel(ThemedModel):
    another_string = String("world")

class TestThemes(unittest.TestCase):

    def test_construct_empty_theme_from_file(self):
        with (tempfile.NamedTemporaryFile()) as file:
            # create and apply empty theme with no exception thrown
            file.file.write("".encode('utf-8'))
            file.file.flush()
            theme = Theme(filename=file.name)
            theme.apply_to_model(ThemedModel())

    def test_construct_empty_theme_from_json(self):
        # create and apply empty theme with no exception thrown
        theme = Theme(json=dict())
        theme.apply_to_model(ThemedModel())

    def test_construct_nonempty_theme_from_file(self):
        with (tempfile.NamedTemporaryFile()) as file:
            # create and apply empty theme with no exception thrown
            file.file.write("""
attrs:
    ThemedModel:
        number: 57
    SubOfThemedModel:
        another_string: "boo"
            """.encode('utf-8'))
            file.file.flush()
            theme = Theme(filename=file.name)
            self.assertDictEqual(dict(number=57), theme._for_class(ThemedModel))
            self.assertDictEqual(dict(number=57, another_string="boo"), theme._for_class(SubOfThemedModel))

    def test_theming_a_model(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        self.assertEqual('hello', obj.string)
        theme.apply_to_model(obj)
        self.assertEqual('w00t', obj.string)

    def test_theming_a_model_via_base(self):
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = SubOfThemedModel()
        self.assertEqual('hello', obj.string)
        theme.apply_to_model(obj)
        self.assertEqual('w00t', obj.string)

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
        theme.apply_to_model(obj)
        self.assertEqual('bar', obj.string)

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
        doc.theme = theme
        self.assertIs(doc.theme, theme)
        self.assertEqual('w00t', obj.string)
        doc.remove_root(obj)
        self.assertEqual('hello', obj.string)

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
        doc.add_root(obj)
        self.assertEqual('w00t', obj.string)
        doc.remove_root(obj)
        self.assertEqual('hello', obj.string)

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
        doc.theme = theme
        self.assertEqual('w00t', obj.string)
        # setting to None reverts to default theme
        doc.theme = None
        self.assertIsNot(doc.theme, None)
        self.assertEqual('hello', obj.string)
