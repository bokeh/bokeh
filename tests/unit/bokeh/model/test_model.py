#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from inspect import Parameter, Signature, signature

import pytest

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
from bokeh.model import Committed, Debounce, Model, Throttle # isort:skip

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
            assert m._js_property_callbacks == {f"change:{name}": [cb]}

    def test_with_non_propname(self) -> None:
        cb = CustomJS(code="")
        m1 = SomeModel()
        m1.js_on_change('foo', cb)
        assert m1._js_property_callbacks == {"foo": [cb]}

        m2 = SomeModel()
        m2.js_on_change('change:b', cb)
        assert m2._js_property_callbacks == {"change:b": [cb]}

    def test_with_multple_callbacks(self) -> None:
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1, cb2)
        assert m._js_property_callbacks == {"foo": [cb1, cb2]}

    def test_with_multple_callbacks_separately(self) -> None:
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1)
        assert m._js_property_callbacks == {"foo": [cb1]}
        m.js_on_change('foo', cb2)
        assert m._js_property_callbacks == {"foo": [cb1, cb2]}

    def test_ignores_dupe_callbacks(self) -> None:
        cb = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb, cb)
        assert m._js_property_callbacks == {"foo": [cb]}

    def test_remove_callbacks_and_policies(self) -> None:
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change("a", cb1, policy=Throttle(100))
        m.js_on_change("a", cb2)

        m.js_remove_on_change("a", cb1)
        assert m._js_property_callbacks == {"change:a": [cb2]}
        assert m._js_property_callback_policies == {}

        m.js_remove_on_change("change:a", cb2)
        assert m._js_property_callbacks == {}

    def test_remove_requires_registered_callback(self) -> None:
        m = SomeModel()
        with pytest.raises(ValueError):
            m.js_remove_on_change("a", CustomJS(code=""))

class Test_callback_policies:
    @staticmethod
    def callback(attr: str, old: object, new: object) -> None:
        pass

    def test_on_change_does_not_record_immediate_subscription(self) -> None:
        m = SomeModel()
        m.on_change("a", self.callback)
        assert m._subscribed_changes == {}
        assert "_subscribed_changes" not in m.properties_with_values(include_defaults=False)

    def test_on_change_immediate_does_not_read_unset_property(self) -> None:
        from bokeh.models import Slider
        slider = Slider()
        slider.on_change("value", self.callback)

        assert slider._subscribed_changes == {}

    def test_callback_policy_state_is_initialized_for_deserialized_models(self) -> None:
        doc = document.Document()
        doc.add_root(SomeModel(a=1))
        [m] = document.Document.from_json(doc.to_json()).roots
        calls: list[tuple[int, int]] = []

        m.on_change("a", lambda attr, old, new: calls.append((old, new)), policy=Throttle(100))
        m.a = 2

        assert calls == [(1, 2)]
        assert m._subscribed_changes == {"a": [("throttle", 100)]}

    def test_on_change_records_distinct_policies(self) -> None:
        def throttled(attr: str, old: object, new: object) -> None:
            pass

        def debounced(attr: str, old: object, new: object) -> None:
            pass

        m = SomeModel()
        m.on_change("a", self.callback)
        m.on_change("a", throttled, policy=Throttle(100))
        m.on_change("a", debounced, policy=Debounce(250))
        assert m._subscribed_changes == {
            "a": [("immediate", None), ("throttle", 100), ("debounce", 250)],
        }

        from bokeh.document import Document
        doc = Document()
        doc.add_root(m)
        [root] = doc.to_json(deferred=False)["roots"]
        assert root["attributes"]["_subscribed_changes"] == {
            "type": "map",
            "entries": [("a", [["immediate", None], ["throttle", 100], ["debounce", 250]])],
        }

    def test_remove_on_change_updates_subscriptions(self) -> None:
        def throttled(attr: str, old: object, new: object) -> None:
            pass

        m = SomeModel()
        m.on_change("a", self.callback)
        m.on_change("a", throttled, policy=Throttle(100))
        m.remove_on_change("a", self.callback)
        assert m._subscribed_changes == {"a": [("throttle", 100)]}
        m.remove_on_change("a", throttled)
        assert m._subscribed_changes == {}

    def test_js_callbacks_can_have_distinct_policies(self) -> None:
        immediate = CustomJS(code="")
        committed = CustomJS(code="")
        from bokeh.models import Slider
        slider = Slider(start=0, end=10, value=0)
        slider.js_on_change("value", immediate)
        slider.js_on_change("value", committed, policy=Committed())
        assert slider._js_property_callbacks == {"change:value": [immediate, committed]}
        assert slider._js_property_callback_policies == {
            "change:value": {committed.id: [("committed", None)]},
        }

    def test_same_js_callback_can_have_immediate_and_committed_policies(self) -> None:
        callback = CustomJS(code="")
        from bokeh.models import Slider
        slider = Slider(start=0, end=10, value=0)
        slider.js_on_change("value", callback)
        slider.js_on_change("value", callback, policy=Committed())
        assert slider._js_property_callbacks == {"change:value": [callback]}
        assert slider._js_property_callback_policies == {
            "change:value": {callback.id: [("immediate", None), ("committed", None)]},
        }

    def test_python_callbacks_can_have_immediate_and_committed_policies(self) -> None:
        from bokeh.models import Slider
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", self.callback)
        slider.on_change("value", lambda attr, old, new: None, policy=Committed())
        assert slider._subscribed_changes == {
            "value": [("immediate", None), ("committed", None)],
        }

    def test_same_python_callback_can_have_immediate_and_committed_policies(self) -> None:
        from bokeh.models import Slider
        calls: list[tuple[int, int]] = []

        def callback(attr: str, old: int, new: int) -> None:
            calls.append((old, new))

        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", callback)
        slider.on_change("value", callback, policy=Committed())
        assert slider._subscribed_changes == {
            "value": [("immediate", None), ("committed", None)],
        }
        slider._set_from_json_with_callback_policy("value", 1, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 1, ("committed", None))
        assert calls == [(0, 1), (0, 1)]

        calls.clear()
        slider.value = 2
        assert calls == [(1, 2)]

        slider.remove_on_change("value", callback)
        assert slider._subscribed_changes == {}

    def test_local_changes_invoke_all_callback_policies(self) -> None:
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())
        slider.value = 5
        assert calls == [("immediate", 0, 5), ("committed", 0, 5)]

    def test_local_changes_advance_each_browser_stream_old_value(self) -> None:
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())

        slider.value = 5
        calls.clear()
        slider._set_from_json_with_callback_policy("value", 6, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 6, ("committed", None))

        assert calls == [
            ("immediate", 5, 6),
            ("committed", 5, 6),
        ]

    def test_browser_streams_dispatch_only_matching_callbacks(self) -> None:
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())

        slider._set_from_json_with_callback_policy("value", 1, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 2, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 2, ("committed", None))

        assert calls == [
            ("immediate", 0, 1),
            ("immediate", 1, 2),
            ("committed", 0, 2),
        ]

    def test_unchanged_policy_stream_does_not_dispatch_callback(self) -> None:
        from bokeh.document import Document
        from bokeh.models import Slider
        events: list[object] = []
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())
        doc = Document()
        doc.add_root(slider)
        doc.on_change(events.append)

        slider._set_from_json_with_callback_policy("value", 1, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 0, ("immediate", None))
        events.clear()
        slider._set_from_json_with_callback_policy("value", 0, ("committed", None))

        assert events == []
        assert calls == [
            ("immediate", 0, 1),
            ("immediate", 1, 0),
        ]

    def test_callback_policy_is_applied_from_document_patch(self) -> None:
        from bokeh.document import Document
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())
        doc = Document()
        doc.add_root(slider)

        def patch(value: int, policy: str) -> None:
            doc.apply_json_patch({
                "events": [{
                    "kind": "ModelChanged",
                    "model": {"id": slider.id},
                    "attr": "value",
                    "new": value,
                    "callback_policy": [policy, None],
                }],
            })

        patch(1, "immediate")
        patch(2, "immediate")
        patch(2, "committed")

        assert calls == [
            ("immediate", 0, 1),
            ("immediate", 1, 2),
            ("committed", 0, 2),
        ]

    def test_equal_valued_policy_streams_respect_document_hold(self) -> None:
        from bokeh.document import Document
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)
        slider.on_change("value", lambda attr, old, new: calls.append(("immediate", old, new)))
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())
        doc = Document()
        doc.add_root(slider)
        doc.hold()

        slider._set_from_json_with_callback_policy("value", 1, ("immediate", None))
        slider._set_from_json_with_callback_policy("value", 1, ("committed", None))
        assert calls == []

        doc.unhold()
        assert calls == [
            ("immediate", 0, 1),
            ("committed", 0, 1),
        ]

    def test_callback_changes_are_dispatched_to_every_policy(self) -> None:
        from bokeh.models import Slider
        calls: list[tuple[str, int, int]] = []
        slider = Slider(start=0, end=10, value=0)

        def immediate(attr: str, old: int, new: int) -> None:
            calls.append(("immediate", old, new))
            if new == 1:
                slider.value = 2

        slider.on_change("value", immediate)
        slider.on_change("value", lambda attr, old, new: calls.append(("committed", old, new)), policy=Committed())
        slider._set_from_json_with_callback_policy("value", 1, ("immediate", None))

        assert calls == [
            ("immediate", 0, 1),
            ("immediate", 1, 2),
            ("committed", 1, 2),
        ]
        assert slider._callback_policy_values == {
            ("value", ("immediate", None)): 2,
            ("value", ("committed", None)): 2,
        }

    def test_rejects_unsupported_committed(self) -> None:
        m = SomeModel()
        with pytest.raises(ValueError, match="committed callbacks are not supported"):
            m.on_change("a", self.callback, policy=Committed())

    @pytest.mark.parametrize("policy", ["committed", ("throttle", 100), ("debounce", 100)])
    def test_rejects_raw_policy_values(self, policy: object) -> None:
        m = SomeModel()
        with pytest.raises(ValueError, match="Throttle, Debounce, or Committed"):
            m.on_change("a", self.callback, policy=policy)  # type: ignore[arg-type]

    @pytest.mark.parametrize("wait", [True, 0, -1, float("inf"), float("nan")])
    def test_rejects_invalid_wait(self, wait: object) -> None:
        for policy_type in (Throttle, Debounce):
            with pytest.raises(ValueError):
                policy_type(wait)  # type: ignore[arg-type]

    def test_rejects_properties_with_model_references(self) -> None:
        m = SomeModel()
        with pytest.raises(ValueError, match="containing Bokeh models"):
            m.on_change("_js_property_callbacks", self.callback, policy=Throttle(100))

    def test_rejects_column_data_properties(self) -> None:
        source = ColumnDataSource(data={"x": [1]})
        with pytest.raises(ValueError, match="column data property 'data'"):
            source.on_change("data", self.callback, policy=Debounce(100))

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
        assert m._js_event_callbacks == {"document_ready": [cb1, cb2]}

    def test_with_multple_callbacks_separately(self) -> None:
        cb1 = CustomJS(code="foo")
        cb2 = CustomJS(code="bar")
        m = SomeModel()
        m.js_on_event("document_ready", cb1)
        assert m._js_event_callbacks == {"document_ready": [cb1]}
        m.js_on_event("document_ready", cb2)
        assert m._js_event_callbacks == {"document_ready": [cb1, cb2]}

    def test_ignores_dupe_callbacks(self) -> None:
        cb = CustomJS(code="foo")
        m = SomeModel()
        m.js_on_event("document_ready", cb, cb)
        assert m._js_event_callbacks == {"document_ready": [cb]}

    def test_ignores_dupe_callbacks_separately(self) -> None:
        cb = CustomJS(code="foo")
        m = SomeModel()
        m.js_on_event("document_ready", cb)
        assert m._js_event_callbacks == {"document_ready": [cb]}
        m.js_on_event("document_ready", cb)
        assert m._js_event_callbacks == {"document_ready": [cb]}

    def test_remove_callbacks(self) -> None:
        cb1 = CustomJS(code="foo")
        cb2 = CustomJS(code="bar")
        m = SomeModel()
        m.js_on_event("document_ready", cb1, cb2)

        m.js_remove_on_event("document_ready", cb1)
        assert m._js_event_callbacks == {"document_ready": [cb2]}

        m.js_remove_on_event("document_ready", cb2)
        assert m._js_event_callbacks == {}

    def test_remove_requires_registered_callback(self) -> None:
        m = SomeModel()
        with pytest.raises(ValueError):
            m.js_remove_on_event("document_ready", CustomJS(code=""))

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
        assert len(m1._js_property_callbacks) == 0
        m1.js_link('a', m2, 'b')
        assert len(m1._js_property_callbacks) == 1
        assert "change:a" in m1._js_property_callbacks
        cbs = m1._js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a"

    def test_attr_selector_creates_customjs_int(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1._js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', 1)
        assert len(m1._js_property_callbacks) == 1
        assert "change:a" in m1._js_property_callbacks
        cbs = m1._js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a[1]"

    def test_attr_selector_creates_customjs_with_zero(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1._js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', 0)
        assert len(m1._js_property_callbacks) == 1
        assert "change:a" in m1._js_property_callbacks
        cbs = m1._js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a[0]"

    def test_attr_selector_creates_customjs_str(self) -> None:
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1._js_property_callbacks) == 0
        m1.js_link('a', m2, 'b', "test")
        assert len(m1._js_property_callbacks) == 1
        assert "change:a" in m1._js_property_callbacks
        cbs = m1._js_property_callbacks["change:a"]
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
