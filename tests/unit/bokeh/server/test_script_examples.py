#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import asyncio
import inspect
from pathlib import Path

import pytest

from bokeh.server.asgi import BokehASGI

EXAMPLES = Path(__file__).parents[4] / 'examples/server/script_apps'
SCRIPTS = sorted([*EXAMPLES.glob('*.py'), *(path.parent for path in EXAMPLES.glob('*/main.py'))])


@pytest.mark.parametrize('path', SCRIPTS, ids=lambda path: path.stem)
async def test_script_example_builds_independent_sessions(path, caplog):
    if path.name in ('display_live_audio', 'track_stocks'):
        pytest.importorskip('scipy' if path.name == 'display_live_audio' else 'bokeh_sampledata')
    app = BokehASGI(path)
    await app.core.start()
    producers = []
    try:
        context = app.core.applications['/']
        first, second = await asyncio.wait_for(asyncio.gather(
            context.create_session_if_needed('first'),
            context.create_session_if_needed('second'),
        ), 30)
        assert first.document.roots
        assert second.document.roots
        assert not set(first.document.models) & set(second.document.models)
        assert not context.application._handlers[0].failed
        if path.stem == 'lock_document_callbacks':
            async def producer_for(session):
                # LockedCallback registers its own cleanup hook in this unordered set.
                while True:
                    for callback in tuple(session.document.session_destroyed_callbacks):
                        state = inspect.getclosurevars(callback).nonlocals
                        if (thread := state.get('thread')) is not None and thread.is_alive():
                            return thread
                    await asyncio.sleep(0.01)

            producers = await asyncio.wait_for(asyncio.gather(
                producer_for(first), producer_for(second),
            ), 5)
            assert all(thread.is_alive() for thread in producers)
    finally:
        await app.core.stop()
    assert all(not thread.is_alive() for thread in producers)
    assert 'DocumentLifeCycleHandler on_session_destroyed' not in caplog.text
