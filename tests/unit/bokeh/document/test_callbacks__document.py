#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import gc
import logging
from typing import Any

# External imports
from mock import MagicMock, patch

# Bokeh imports
from bokeh.core.enums import HoldPolicy, HoldPolicyType
from bokeh.core.types import ID
from bokeh.document import Document
from bokeh.document.events import DocumentChangedEvent, SessionCallbackAdded, SessionCallbackRemoved
from bokeh.document.locking import UnlockedDocumentProxy
from bokeh.events import ButtonClick, DocumentReady
from bokeh.io import curdoc
from bokeh.models import Button, Div
from bokeh.server.callbacks import SessionCallback
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.document.callbacks as bdc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestDocumentCallbackManager:

    def test_basic(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)

        # module manager should only hold a weak ref
        assert len(gc.get_referrers(d)) == 0

        assert len(cm._message_callbacks) == 1
        assert cm._message_callbacks == {"bokeh_event": [cm.trigger_event]}

    def test_session_callbacks(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        assert set(cm.session_callbacks) == set()
        s1 = SessionCallback(lambda: None, callback_id=ID("1"))
        cm._session_callbacks.add(s1)
        assert set(cm.session_callbacks) == {s1}
        s2 = SessionCallback(lambda: None, callback_id=ID("2"))
        cm._session_callbacks.add(s2)
        assert set(cm.session_callbacks) == {s1, s2}

    def test_session_destroyed_callbacks(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        assert cm.session_destroyed_callbacks == set()
        s1 = lambda x: None
        cm._session_destroyed_callbacks.add(s1)
        assert cm.session_destroyed_callbacks == {s1}
        s2 = lambda x: None
        cm._session_destroyed_callbacks.add(s2)
        assert cm.session_destroyed_callbacks == {s1, s2}

        cm.session_destroyed_callbacks = {s2}
        assert cm.session_destroyed_callbacks == {s2}

    def test_add_session_callback(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)

        events = []
        def listener(event: DocumentChangedEvent) -> None:
            events.append(event)
        cm.on_change(listener)

        assert len(cm.session_callbacks) == 0
        assert not events

        def cb() -> None: pass
        obj = SessionCallback(cb, callback_id=ID("1"))

        callback_obj = cm.add_session_callback(obj, cb, one_shot=False)
        assert len(cm.session_callbacks) == len(events) == 1
        assert isinstance(events[0], SessionCallbackAdded)
        assert callback_obj == cm.session_callbacks[0] == events[0].callback

    def test_destroy(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)

        cm._change_callbacks["foo"] = lambda x: None
        cm._event_callbacks["bar"] = []
        cm._message_callbacks["baz"] = []

        assert cm.destroy() is None  # type: ignore [func-returns-value]

        assert not hasattr(cm, "_change_callbacks")
        assert not hasattr(cm, "_event_callbacks")
        assert not hasattr(cm, "_messagecallbacks")

    @pytest.mark.parametrize('policy', HoldPolicy)
    def test_hold(self, policy: HoldPolicyType) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        assert cm.hold_value is None
        assert cm._held_events == []

        cm.hold(policy)
        assert cm.hold_value == policy

    def test_hold_bad_policy(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        with pytest.raises(ValueError):
            cm.hold("junk")  # type: ignore [arg-type]

    @pytest.mark.parametrize('first,second', [('combine', 'collect'), ('collect', 'combine')])
    def test_hold_rehold(self, first: HoldPolicyType, second: HoldPolicyType, caplog: pytest.LogCaptureFixture) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        with caplog.at_level(logging.WARN):
            cm.hold(first)
            assert caplog.text == ""
            assert len(caplog.records) == 0

            cm.hold(first)
            assert caplog.text == ""
            assert len(caplog.records) == 0

            cm.hold(second)
            assert caplog.text.strip().endswith(f"hold already active with {first!r}, ignoring {second!r}")
            assert len(caplog.records) == 1

            cm.unhold()

            cm.hold(second)
            assert len(caplog.records) == 1

    def test_notify_event(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        reported_curdoc = None
        reported_foo = None
        def invoker() -> None:
            nonlocal reported_curdoc
            nonlocal reported_foo
            reported_curdoc = curdoc()
            reported_foo = 10
        m = Button()
        cm.notify_event(m, ButtonClick(m), invoker)
        assert reported_curdoc is d
        assert reported_foo == 10

    def test_on_change(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def cb(x: Any) -> None:
            pass
        cm.on_change(cb)
        assert cm._change_callbacks == {cb: cb}  # XXX !!!?

    def test_on_change_dispatch_to(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        called = None
        class recv:
            def _document_changed(x: Any) -> None:
                nonlocal called
                called = x
        cm.on_change_dispatch_to(recv)
        assert recv in cm._change_callbacks
        evt = DocumentChangedEvent(d)
        cm._change_callbacks[recv](evt)
        assert called == evt

    def test_on_event_good_string(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def good(event: Any) -> None:
            pass
        cm.on_event("document_ready", good)
        assert cm._event_callbacks == {"document_ready": [good]}

    @pytest.mark.parametrize("evt", ("button_click", "junk"))
    def test_on_event_bad_string(self, evt: str) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def good(event: Any) -> None:
            pass
        with pytest.raises(ValueError):
            cm.on_event(evt, good)
        assert cm._event_callbacks == {}

    def test_on_event_good_event(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def good(event: Any) -> None:
            pass
        cm.on_event(DocumentReady, good)
        assert cm._event_callbacks == {"document_ready": [good]}

    def test_on_event_bad_event(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def good(event: Any) -> None:
            pass
        with pytest.raises(ValueError):
            cm.on_event(ButtonClick, good)
        assert cm._event_callbacks == {}

    def test_on_message(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def cb(x: Any) -> None:
            pass
        cm.on_message("foo", cb)
        assert cm._message_callbacks == {"foo": [cb], "bokeh_event": [cm.trigger_event]}

    def test_on_session_destroyed(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)

        def good(session_context: Any) -> None:
            pass
        cm.on_session_destroyed(good)
        assert cm.session_destroyed_callbacks == {good}

        def bad() -> None:  # wrong signature
            pass

        with pytest.raises(ValueError):
            cm.on_session_destroyed(bad) # type: ignore  [arg-type]  # want to test bad param

    def test_remove_on_change(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def cb(x: Any) -> None:
            pass
        cm.on_change(cb)
        cm.remove_on_change(cb)
        assert cm._change_callbacks == {}

    def test_remove_on_message(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        def cb(x: Any) -> None:
            pass
        cm.on_message("foo", cb)
        cm.remove_on_message("foo", cb)
        assert cm._message_callbacks == {"foo": [], "bokeh_event": [cm.trigger_event]}

    def test_remove_session_callback(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)

        events = []
        def listener(event: DocumentChangedEvent) -> None:
            events.append(event)
        cm.on_change(listener)

        assert len(cm.session_callbacks) == 0
        assert not events

        def cb() -> None: pass
        obj = SessionCallback(cb, callback_id=ID("1"))

        cm.add_session_callback(obj, cb, one_shot=False)

        cm.remove_session_callback(obj)
        assert len(cm.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], SessionCallbackAdded)
        assert isinstance(events[1], SessionCallbackRemoved)

    def test_subscribe(self) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        m = Div()
        assert cm._subscribed_models == {}
        cm.subscribe("foo", m)
        assert "foo" in cm._subscribed_models
        assert len(cm._subscribed_models["foo"]) == 1
        mref = cm._subscribed_models["foo"].pop()
        assert mref() is m

    # TODO (bev) def test_trigger_event
    # TODO (bev) def test_trigger_on_change

    @pytest.mark.parametrize('policy', HoldPolicy)
    def test_unhold(self, policy: HoldPolicyType) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        assert cm.hold_value is None
        assert cm._held_events == []

        cm.hold(policy)
        assert cm.hold_value == policy
        cm.unhold()
        assert cm.hold_value is None

    @patch("bokeh.document.callbacks.DocumentCallbackManager.trigger_on_change")
    def test_unhold_triggers_events(self, mock_trigger: MagicMock) -> None:
        d = Document()
        cm = bdc.DocumentCallbackManager(d)
        cm.hold('collect')
        last = DocumentChangedEvent(d, None)
        cm._held_events = [DocumentChangedEvent(d, None), DocumentChangedEvent(d, None), last]
        cm.unhold()
        assert mock_trigger.call_count == 3
        assert mock_trigger.call_args[0] == (last,)
        assert mock_trigger.call_args[1] == {}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_invoke_with_curdoc() -> None:
    reported_curdoc = None
    d = Document()
    def f() -> None:
        nonlocal reported_curdoc
        reported_curdoc = curdoc()
    bdc.invoke_with_curdoc(d, f)
    assert reported_curdoc == d

def test_invoke_with_curdoc_nolock() -> None:
    reported_curdoc: Document | UnlockedDocumentProxy | None = None
    d = Document()
    def f() -> None:
        nonlocal reported_curdoc
        reported_curdoc = curdoc()
    f.nolock = True  # type: ignore [attr-defined]
    bdc.invoke_with_curdoc(d, f)
    assert isinstance(reported_curdoc, UnlockedDocumentProxy)
    assert reported_curdoc._doc == d

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()
