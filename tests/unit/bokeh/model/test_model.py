#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import Parameter, Signature, signature

# External imports
import pytest

# Bokeh imports
from bokeh.core.has_props import Local, is_abstract
from bokeh.core.properties import Int, List, String
from bokeh.core.types import ID
from bokeh.models import *  # noqa: F403
from bokeh.models import (
    CategoricalColorMapper,
    ColumnDataSource,
    CustomJS,
    Div,
    Range1d,
    Row,
    SetValue,
)
from bokeh.models.annotations.dimensional import Metric
from bokeh.models.dom import HTML
from bokeh.plotting import *  # noqa: F403
from bokeh.util.warnings import BokehDeprecationWarning

from bokeh.document import document # isort:skip

# Module under test
from bokeh.model import Model # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class SomeModel(Model):
    a = Int(12)
    b = String("hello")
    c = List(Int, default=[1, 2, 3])

class Test_Model___init__:

    def test_id_not_permitted(self) -> None:
        with pytest.raises(ValueError):
            SomeModel(id=ID("foo"))

    def test_generated_signatures_are_distinct(self) -> None:
        class SignatureParent(Model, Local):
            __module__ = "bokeh.models.test_model"
            parent_value = Int(1)

        parent_signature = signature(SignatureParent.__init__)

        class SignatureChild(SignatureParent):
            __module__ = "bokeh.models.test_model"
            child_value = String("child")

        class SignatureSibling(SignatureParent):
            __module__ = "bokeh.models.test_model"
            sibling_value = Int(2)

        assert SignatureChild.__init__ is not SignatureParent.__init__
        assert SignatureSibling.__init__ is not SignatureChild.__init__
        assert signature(SignatureParent.__init__) == parent_signature
        for cls, own_name in [(SignatureParent, "parent_value"), (SignatureChild, "child_value"), (SignatureSibling, "sibling_value")]:
            method_signature = signature(cls.__init__)
            assert method_signature.parameters["self"].kind == Parameter.POSITIONAL_ONLY
            assert signature(cls) == Signature(list(method_signature.parameters.values())[1:])
            assert own_name in signature(cls).parameters
        assert "child_value" not in parent_signature.parameters
        assert "sibling_value" not in signature(SignatureChild).parameters
        assert SignatureChild(parent_value=3, child_value="value").child_value == "value"

    def test_inherited_custom_constructor(self) -> None:
        calls = []

        class CustomParent(Model, Local):
            value = Int()

            def __init__(self, value, /, *, offset=1):
                calls.append(value)
                super().__init__(value=value + offset)

        original_init = CustomParent.__init__
        original_signature = signature(original_init)

        class CustomChild(CustomParent):
            pass

        class CustomGrandchild(CustomChild):
            pass

        assert CustomParent.__init__ is original_init
        assert CustomChild.__init__ is not original_init
        assert CustomGrandchild.__init__ is not CustomChild.__init__
        for cls in [CustomChild, CustomGrandchild]:
            assert signature(cls.__init__) == original_signature
            assert signature(cls) == signature(CustomParent)
            assert cls(5, offset=2).value == 7
        assert calls == [5, 5]

    def test_explicit_child_constructor(self) -> None:
        def custom_init(self, value, /):
            super(CustomChild, self).__init__(a=value)

        class CustomChild(SomeModel, Local):
            __init__ = custom_init

        assert CustomChild.__init__ is custom_init
        assert str(signature(CustomChild)) == "(value, /)"
        assert CustomChild(17).a == 17

    @pytest.mark.parametrize("builtin", [False, True])
    def test_cooperative_diamond_mro(self, builtin) -> None:
        calls = []

        class Root(Model, Local):
            def __init__(self, **kwargs):
                calls.append("root")
                super().__init__(**kwargs)

        class Left(Root):
            pass

        class Right(Root):
            def __init__(self, token, /, **kwargs):
                calls.append("right")
                super().__init__(**kwargs)

        class Diamond(Left, Right):
            if builtin:
                __module__ = "bokeh.models.test_model"

        signature(Diamond).bind("token", name="diamond")
        model = Diamond("token", name="diamond")
        signature(Diamond.__init__).bind(model, "token", name="diamond")
        signature(model.__init__).bind("token", name="diamond")
        assert calls == ["right", "root"]

    def test_mixin_constructor_precedes_model(self) -> None:
        calls = []

        class Mixin:
            def __init__(self, token, /, **kwargs):
                calls.append(token)
                super().__init__(**kwargs)

        class Mixed(Mixin, SomeModel, Local):
            pass

        assert str(signature(Mixed)) == "(token, /, **kwargs)"
        assert Mixed("token", a=4).a == 4
        assert calls == ["token"]

    def test_builtin_custom_constructor_is_inherited(self) -> None:
        class CustomRange(Range1d, Local):
            pass

        assert signature(CustomRange) == signature(Range1d)
        assert signature(CustomRange.__init__) == signature(Range1d.__init__)
        model = CustomRange(2, 8)
        assert (model.start, model.end) == (2, 8)

    def test_all_builtin_model_signatures(self) -> None:
        for cls in Model.model_class_reverse_map.values():
            if issubclass(cls, Model) and cls.__module__.startswith("bokeh.models"):
                method_signature = signature(cls.__init__)
                assert method_signature.parameters["self"].kind == Parameter.POSITIONAL_ONLY
                assert signature(cls) == Signature(list(method_signature.parameters.values())[1:])

        model = Range1d(2, 8)
        assert signature(model.__init__) == signature(Range1d)

    @pytest.mark.parametrize(("cls", "args"), [
        (Range1d, (0, 10)),
        (CategoricalColorMapper, (["red"],)),
        (Row, (Div(), Div())),
        (ColumnDataSource, ({"x": [1]},)),
        (SetValue, (Range1d(), "start", 1)),
        (HTML, ("text",)),
    ])
    def test_positional_constructor_signatures(self, cls, args) -> None:
        class Derived(cls, Local):
            pass

        for model_type in [cls, Derived]:
            model = model_type(*args)
            signature(model_type).bind(*args)
            signature(model_type.__init__).bind(model, *args)
            signature(model.__init__).bind(*args)

    @pytest.mark.parametrize("failure", ["invalid_signature", "wrapper_loop"])
    def test_uninspectable_inherited_constructor(self, failure) -> None:
        def initializer(self, **kwargs):
            super(Opaque, self).__init__(**kwargs)

        if failure == "invalid_signature":
            initializer.__signature__ = "opaque"
        else:
            initializer.__wrapped__ = initializer

        class Opaque(Model, Local):
            __init__ = initializer

        class Derived(Opaque):
            pass

        assert Derived(name="derived").name == "derived"

    def test_dimensional_positional_arguments(self) -> None:
        # Synthesized constructors reject positional inputs consistently with Model.
        with pytest.raises(ValueError, match="positional arguments are not allowed"):
            Metric("m")

    def test_variadic_property_keyword_signature(self) -> None:
        class Derived(HTML, Local):
            pass

        for cls in [HTML, Derived]:
            parameters = signature(cls).parameters
            assert parameters["html"].kind == Parameter.KEYWORD_ONLY
            assert parameters["args"].kind == Parameter.VAR_POSITIONAL
            assert not any(param.kind == Parameter.VAR_KEYWORD for param in parameters.values())
            signature(cls).bind("first", "second")
            signature(cls).bind(html=["text"])
            assert cls(html=["text"]).html == ["text"]

    def test_variadic_display_name_collision(self) -> None:
        class Collision(HTML, Local):
            __module__ = "bokeh.models.test_model"
            args = String()
            args_ = String()

        parameters = signature(Collision).parameters
        assert parameters["args__"].kind == Parameter.VAR_POSITIONAL
        for name in ["html", "args", "args_"]:
            assert parameters[name].kind == Parameter.KEYWORD_ONLY
        signature(Collision).bind("text", args="a", args_="b")
        model = Collision("text", args="a", args_="b")
        assert model.html == ["text"]
        assert model.args == "a"
        assert model.args_ == "b"

class Test_js_on_change:
    def test_exception_for_no_callbacks(self) -> None:
        m = SomeModel()
        with pytest.raises(ValueError):
            m.js_on_change('foo')

    def test_exception_for_bad_callbacks(self) -> None:
        m = SomeModel()
        for val in [10, "bar", None, [1], {}, 10.2]:
            with pytest.raises(ValueError):
                m.js_on_change('foo', val)

    def test_with_propname(self) -> None:
        cb = CustomJS(code="")
        m0 = SomeModel()
        for name in m0.properties():
            m = SomeModel()
            m.js_on_change(name, cb)
            assert m.js_property_callbacks == {f"change:{name}": [cb]}

    def test_with_non_propname(self) -> None:
        cb = CustomJS(code="")
        m1 = SomeModel()
        m1.js_on_change('foo', cb)
        assert m1.js_property_callbacks == {"foo": [cb]}

        m2 = SomeModel()
        m2.js_on_change('change:b', cb)
        assert m2.js_property_callbacks == {"change:b": [cb]}

    def test_with_multple_callbacks(self) -> None:
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1, cb2)
        assert m.js_property_callbacks == {"foo": [cb1, cb2]}

    def test_with_multple_callbacks_separately(self) -> None:
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1)
        assert m.js_property_callbacks == {"foo": [cb1]}
        m.js_on_change('foo', cb2)
        assert m.js_property_callbacks == {"foo": [cb1, cb2]}

    def test_ignores_dupe_callbacks(self) -> None:
        cb = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb, cb)
        assert m.js_property_callbacks == {"foo": [cb]}

class Test_js_on_event:

    def test_fails_with_unknown_event_name(self) -> None:
        cb = CustomJS(code="foo")
        m = SomeModel()
        with pytest.raises(ValueError):
            m.js_on_event("foo", cb)

    def test_with_multple_callbacks(self) -> None:
        cb1 = CustomJS(code="foo")
        cb2 = CustomJS(code="bar")
        m = SomeModel()
        m.js_on_event("document_ready", cb1, cb2)
        assert m.js_event_callbacks == {"document_ready": [cb1, cb2]}

    def test_with_multple_callbacks_separately(self) -> None:
        cb1 = CustomJS(code="foo")
        cb2 = CustomJS(code="bar")
        m = SomeModel()
        m.js_on_event("document_ready", cb1)
        assert m.js_event_callbacks == {"document_ready": [cb1]}
        m.js_on_event("document_ready", cb2)
        assert m.js_event_callbacks == {"document_ready": [cb1, cb2]}

    def test_ignores_dupe_callbacks(self) -> None:
        cb = CustomJS(code="foo")
        m = SomeModel()
        m.js_on_event("document_ready", cb, cb)
        assert m.js_event_callbacks == {"document_ready": [cb]}

    def test_ignores_dupe_callbacks_separately(self) -> None:
        cb = CustomJS(code="foo")
        m = SomeModel()
        m.js_on_event("document_ready", cb)
        assert m.js_event_callbacks == {"document_ready": [cb]}
        m.js_on_event("document_ready", cb)
        assert m.js_event_callbacks == {"document_ready": [cb]}

class Test_js_link:
    def test_value_error_on_bad_attr(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('junk', m2, 'b')
        assert str(e.value).endswith(f"'junk' is not a property of self ({m1!r})")

    def test_value_error_on_bad_other(self) -> None:
        m1 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('a', 'junk', 'b')
        assert str(e.value).endswith("'other' is not a Bokeh model: 'junk'")

    def test_value_error_on_bad_other_attr(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('a', m2, 'junk')
        assert str(e.value).endswith(f"'junk' is not a property of other ({m2!r})")

    def test_creates_customjs(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1.js_property_callbacks) == 0
        m1.js_link('a', m2, 'b')
        assert len(m1.js_property_callbacks) == 1
        assert "change:a" in m1.js_property_callbacks
        cbs = m1.js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a"

    def test_attr_selector_creates_customjs_int(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1.js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', 1)
        assert len(m1.js_property_callbacks) == 1
        assert "change:a" in m1.js_property_callbacks
        cbs = m1.js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a[1]"

    def test_attr_selector_creates_customjs_with_zero(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1.js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', 0)
        assert len(m1.js_property_callbacks) == 1
        assert "change:a" in m1.js_property_callbacks
        cbs = m1.js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a[0]"

    def test_attr_selector_creates_customjs_str(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1.js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', "test")
        assert len(m1.js_property_callbacks) == 1
        assert "change:a" in m1.js_property_callbacks
        cbs = m1.js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a['test']"

def test_all_builtin_models_default_constructible() -> None:
    bad = []
    for name, cls in Model.model_class_reverse_map.items():
        if is_abstract(cls):
            continue
        try:
            cls()
        except BokehDeprecationWarning:
            pass
        except Exception:
            bad.append(name)

    assert bad == []

def test_select() -> None:
    # we aren't trying to replace test_query here, only test
    # our wrappers around it, so no need to try every kind of
    # query
    d = document.Document()
    root1 = SomeModel(a=42, name='a')
    root2 = SomeModel(a=43, name='c')
    root3 = SomeModel(a=44, name='d')
    root4 = SomeModel(a=45, name='d')
    d.add_root(root1)
    d.add_root(root2)
    d.add_root(root3)
    d.add_root(root4)

    # select()
    assert {root1} == set(root1.select(dict(a=42)))
    assert {root1} == set(root1.select(dict(name="a")))
    assert {root2} == set(root2.select(dict(name="c")))
    assert set() == set(root1.select(dict(name="nope")))

    # select() on object
    assert set() == set(root3.select(dict(name='a')))
    assert {root3} == set(root3.select(dict(a=44)))

    # select_one()
    assert root3 == root3.select_one(dict(name='d'))
    assert root1.select_one(dict(name='nope')) is None

    with pytest.raises(ValueError) as e:
        d.select_one(dict(name='d'))
    assert 'Found more than one' in repr(e)

    # select_one() on object
    assert root3.select_one(dict(name='a')) is None
    assert root3.select_one(dict(name='c')) is None

    # set_select()
    root1.set_select(dict(a=42), dict(name="c", a=44))
    assert {root1} == set(root1.select(dict(name="c")))
    assert {root1} == set(root1.select(dict(a=44)))

    # set_select() on object
    root3.set_select(dict(name='d'), dict(a=57))
    assert {root3} == set(root3.select(dict(a=57)))

    # set_select() on class
    root2.set_select(SomeModel, dict(name='new_name'))
    assert {root2} == set(root2.select(dict(name="new_name")))

def test_args_pass_through():
    with pytest.raises(ValueError, match=r"positional arguments are not allowed"):
        SomeModel(1, b="a")

class Test_clear_extensions:
    def test_ext_with___css__(self):
        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        class Custom(Model):
            __css__ = "stuff"

        assert any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        Model.clear_extensions()

        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

    def test_ext_with___implementation__(self):
        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        class Custom(Model):
            __implementation__ = "stuff"

        assert any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        Model.clear_extensions()

        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

    def test_ext_with___javascript__(self):
        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        class Custom(Model):
            __javascript__ = "stuff"

        assert any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

        Model.clear_extensions()

        assert not any(x.endswith(".Custom") for x in Model.model_class_reverse_map)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
