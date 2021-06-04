#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import tempfile

# Bokeh imports
from bokeh.core.properties import Int, String
from bokeh.core.property_mixins import FillProps, LineProps, TextProps
from bokeh.document import Document
from bokeh.model import Model

# Module under test
from bokeh.themes import Theme, built_in_themes, DARK_MINIMAL, LIGHT_MINIMAL # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class SomeModel(Model):
    some = Int

class ThemedModel(Model):
    number = Int(42)
    string = String("hello")

class SubOfThemedModel(ThemedModel):
    another_string = String("world")

FILE_CONTENTS = b"""
attrs:
    ThemedModel:
        number: 57
    SubOfThemedModel:
        another_string: "boo"
"""


class TestThemes:
    def test_construct_empty_theme_from_file(self) -> None:
        # windows will throw permissions error with auto-delete
        with (tempfile.NamedTemporaryFile(delete=False)) as file:
            # create and apply empty theme with no exception thrown
            file.file.write(b"")
            file.file.flush()
            theme = Theme(filename=file.name)
            theme.apply_to_model(ThemedModel())
        file.close()
        os.remove(file.name)

    def test_construct_empty_theme_from_json(self) -> None:
        # create and apply empty theme with no exception thrown
        theme = Theme(json=dict())
        theme.apply_to_model(ThemedModel())

    def test_construct_no_json_or_filename(self) -> None:
        with pytest.raises(ValueError) as exc:
            Theme()
        assert "requires json or a filename" in repr(exc.value)

    def test_construct_json_and_filename(self) -> None:
        with pytest.raises(ValueError) as exc:
            # we check "" and {} as falsey values, to try to trick
            # our code into thinking they weren't provided.
            Theme(filename="", json={})
        assert "not both" in repr(exc.value)

    def test_construct_bad_attrs(self) -> None:
        with pytest.raises(ValueError) as exc:
            Theme(json=dict(attrs=42))
        assert "should be a dictionary of class names" in repr(exc.value)

    def test_construct_bad_class_props(self) -> None:
        with pytest.raises(ValueError) as exc:
            Theme(json=dict(attrs=dict(SomeClass=42)))
        assert "should be a dictionary of properties" in repr(exc.value)

    def test_construct_nonempty_theme_from_file(self) -> None:
        # windows will throw permissions error with auto-delete
        with (tempfile.NamedTemporaryFile(delete=False)) as file:
            # create and apply empty theme with no exception thrown
            file.file.write(FILE_CONTENTS)
            file.file.flush()
            theme = Theme(filename=file.name)
            assert dict(number=57) == theme._for_class(ThemedModel)
            assert dict(number=57, another_string="boo") == theme._for_class(SubOfThemedModel)
        file.close()
        os.remove(file.name)

    def test_theming_a_model(self) -> None:
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        changes = dict(calls=[])
        assert 'hello' == obj.string
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        theme.apply_to_model(obj)
        assert 'w00t' == obj.string
        assert [('string', 'hello', 'w00t')] == changes['calls']

    def test_theming_a_model_via_base(self) -> None:
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
        assert 'hello' == obj.string
        theme.apply_to_model(obj)
        assert 'w00t' == obj.string
        assert [('string', 'hello', 'w00t')] == changes['calls']

    def test_subclass_theme_used_rather_than_base(self) -> None:
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
        assert 'hello' == obj.string
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        theme.apply_to_model(obj)
        assert 'bar' == obj.string
        assert [('string', 'hello', 'bar')] == changes['calls']

    def test_theming_a_document_after_adding_root(self) -> None:
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
        assert 'hello' == obj.string
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        doc.theme = theme
        assert doc.theme is theme
        assert 'w00t' == obj.string
        doc.remove_root(obj)
        assert 'hello' == obj.string
        assert [('string', 'hello', 'w00t'), ('string', 'w00t', 'hello')] == changes['calls']

    def test_theming_a_document_before_adding_root(self) -> None:
        theme = Theme(json={
            'attrs' : {
                'ThemedModel' : {
                    'string' : 'w00t'
                }
            }
        })
        obj = ThemedModel()
        doc = Document()
        assert 'hello' == obj.string
        doc.theme = theme
        assert doc.theme is theme
        changes = dict(calls=[])
        def record_trigger(attr, old, new_):
            changes['calls'].append((attr, old, new_))
        obj.on_change('string', record_trigger)
        doc.add_root(obj)
        assert 'w00t' == obj.string
        doc.remove_root(obj)
        assert 'hello' == obj.string
        assert [('string', 'hello', 'w00t'), ('string', 'w00t', 'hello')] == changes['calls']

    def test_setting_document_theme_to_none(self) -> None:
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
        assert 'w00t' == obj.string
        # setting to None reverts to default theme
        doc.theme = None
        assert doc.theme is not None
        assert 'hello' == obj.string
        assert [('string', 'hello', 'w00t'), ('string', 'w00t', 'hello')] == changes['calls']

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

    def test_default_theme_is_empty(self) -> None:
        # this is kind of a silly test once we fix default.yaml to be empty :-)
        # the point is to list all the things to fix.
        doc = Document()

        # before each assertion, we print out why it's going to fail.
        for class_name, props in doc.theme._json['attrs'].items():
            self._compare_dict_to_model_defaults(props, class_name)
        assert 0 == len(doc.theme._json['attrs'])

        self._compare_dict_to_model_class_defaults(doc.theme._fill_defaults, FillProps)
        assert 0 == len(doc.theme._fill_defaults)

        self._compare_dict_to_model_class_defaults(doc.theme._text_defaults, TextProps)
        assert 0 == len(doc.theme._text_defaults)

        self._compare_dict_to_model_class_defaults(doc.theme._line_defaults, LineProps)
        assert 0 == len(doc.theme._line_defaults)

    def test_setting_built_in_theme_obj(self) -> None:
        obj = SomeModel()
        doc = Document()
        doc.add_root(obj)
        doc.theme = built_in_themes[LIGHT_MINIMAL]
        assert "#5B5B5B" == doc.theme._json['attrs']['ColorBar']['title_text_color']

    def test_setting_built_in_theme_str(self) -> None:
        obj = SomeModel()
        doc = Document()
        doc.add_root(obj)
        doc.theme = DARK_MINIMAL
        assert "#20262B" == doc.theme._json['attrs']['Figure']['background_fill_color']

    def test_setting_built_in_theme_missing(self) -> None:
        obj = SomeModel()
        doc = Document()
        doc.add_root(obj)
        with pytest.raises(ValueError):
            doc.theme = 'some_theme_i_guess'

    def test_setting_built_in_theme_error(self) -> None:
        obj = SomeModel()
        doc = Document()
        doc.add_root(obj)
        with pytest.raises(ValueError):
            doc.theme = 1337

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
