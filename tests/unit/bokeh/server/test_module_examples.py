#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import asyncio
import importlib
from pathlib import Path

# External imports
import pytest

# Bokeh imports
from bokeh.models import ColumnDataSource, Slider
from bokeh.server.asgi import BokehASGI

ROOT = Path(__file__).parents[4]
EXAMPLES = ROOT / 'examples/server/module_apps'
MODULES = sorted(
    '.'.join(path.relative_to(ROOT).with_suffix('').parts)
    for path in EXAMPLES.rglob('*.py')
    if path.name in ('app.py', 'server.py')
    and (path.name == 'server.py' or not path.with_name('server.py').exists())
    and 'frameworks' not in path.relative_to(EXAMPLES).parts
    and path.parent.name != 'embed_without_a_framework'
)
DEPENDENCIES = {
    'clustering': ['sklearn'], 'crossfilter': ['bokeh_sampledata', 'pandas'],
    'dashboard': ['bokeh_sampledata', 'pandas'], 'opencv_faces': ['cv2', 'bokeh_sampledata'],
    'gapminder': ['bokeh_sampledata', 'pandas'], 'process_images': ['scipy'],
    'movies': ['bokeh_sampledata', 'pandas'], 'population': ['bokeh_sampledata'],
    'hdf5': ['h5py', 'scipy'], 'taylor': ['sympy'], 'weather': ['scipy', 'pandas'],
    'track_stocks': ['bokeh_sampledata', 'pandas'], 'display_live_audio': ['scipy'],
    'export_csv': ['pandas'],
}


@pytest.mark.parametrize('module_name', MODULES, ids=lambda name: '.'.join(name.split('.')[-3:-1]))
async def test_module_app_builds_independent_sessions(module_name, monkeypatch):
    example = module_name.split('.')[-2]
    for dependency in DEPENDENCIES.get(example, []):
        pytest.importorskip(dependency)
    if '.opencv_faces.' in module_name:
        cv2 = pytest.importorskip('cv2')
        if not hasattr(cv2, 'CascadeClassifier'):
            pytest.skip('requires OpenCV 4 object detection')
    monkeypatch.setenv('APP_ACCESS_TOKEN', 'test-only-token')
    monkeypatch.delenv('BOKEH_EXAMPLE_CAMERA', raising=False)
    module = importlib.import_module(module_name)
    app = getattr(module, 'bokeh_application', module.app)
    assert isinstance(app, BokehASGI)
    await app.core.start()
    try:
        context = app.core.applications['/']
        first = await asyncio.wait_for(context.create_session_if_needed('first'), 30)
        second = await asyncio.wait_for(context.create_session_if_needed('second'), 30)
        assert first.document.roots
        assert second.document.roots
        assert not set(first.document.models) & set(second.document.models)
        if example == 'adjust_plot_with_sliders':
            amplitude = first.document.select_one({'type': Slider, 'title': 'amplitude'})
            source = next(iter(first.document.select({'type': ColumnDataSource})))
            before = list(source.data['y'])
            await first.with_document_locked(lambda: setattr(amplitude, 'value', 2))
            assert list(source.data['y']) != before
            assert second.document.select_one({'type': Slider, 'title': 'amplitude'}).value == 1
    finally:
        await app.core.stop()


@pytest.mark.parametrize('form', ['script_apps', 'module_apps.hosting'])
async def test_auth_examples_reject_non_ascii_credentials(form, monkeypatch):
    from bokeh.server.request import Headers, ServerRequest

    monkeypatch.setenv('APP_ACCESS_TOKEN', 'test-only-token')
    module = importlib.import_module(f'examples.server.{form}.authenticate_users.auth')
    request = ServerRequest(method='GET', uri='/', path='/', headers=Headers({'Authorization': 'Bearer invalid-\u00e9'}))
    assert await module.policy.authenticate(request) is None
    request.headers = Headers({'Authorization': 'Bearer test-only-token'})
    assert await module.policy.authenticate(request) == 'engineer'


@pytest.mark.parametrize('size', [1, 3, 5])
def test_image_processing_preserves_original_blur(size):
    np = pytest.importorskip('numpy')
    pytest.importorskip('scipy')
    from examples.server.module_apps.applications.process_images.app import blur

    image = np.random.default_rng(19).integers(0, 255, size=(20, 21), dtype=np.int32)
    expected = image.copy()
    for i in range(size, image.shape[0]-size):
        for j in range(size, image.shape[1]-size):
            total = sum(float(image[i+di, j+dj])
                        for di in range(-size//2, size//2)
                        for dj in range(-size//2, size//2))
            expected[i, j] = total / (size*size)
    np.testing.assert_array_equal(blur(image, size), expected)


@pytest.mark.parametrize('form', ['script_apps/display_live_audio', 'module_apps/lifecycle/display_live_audio'])
def test_audio_input_decodes_bytes_and_closes_devices(form, monkeypatch):
    import runpy
    import sys
    from threading import Event
    from types import SimpleNamespace

    np = pytest.importorskip('numpy')
    pytest.importorskip('scipy')
    stop = Event()
    closed = []

    class Stream:

        def read(self, count):
            stop.set()
            return np.arange(count, dtype=np.int16).tobytes()

        def stop_stream(self):
            closed.append('stop')

        def close(self):
            closed.append('close')

    class Audio:

        def open(self, **kwargs):
            return Stream()

        def terminate(self):
            closed.append('terminate')

    monkeypatch.setitem(sys.modules, 'pyaudio', SimpleNamespace(PyAudio=Audio, paInt16=8))
    namespace = runpy.run_path(str(ROOT / 'examples/server' / form / 'audio.py'))
    namespace['update_audio_data'](stop)
    assert namespace['data']['values'] is not None
    assert closed == ['stop', 'close', 'terminate']


async def test_shared_producer_failure_still_stops_bokeh(monkeypatch):
    module = importlib.import_module('examples.server.module_apps.lifecycle.share_data_with_asgi.server')

    async def fail(app):
        raise RuntimeError('producer failed')

    events = iter([{'type': 'lifespan.startup'}, {'type': 'lifespan.shutdown'}])

    async def receive():
        event = next(events)
        if event['type'] == 'lifespan.shutdown':
            await asyncio.sleep(0)
        return event

    messages = []

    async def send(event):
        messages.append(event)

    monkeypatch.setattr(module, 'produce', fail)
    await module.app({'type': 'lifespan'}, receive, send)
    assert messages[-1] == {'type': 'lifespan.shutdown.failed', 'message': 'producer failed'}
    assert not module.bokeh_application.core._started


async def test_shared_producer_shutdown_without_startup():
    module = importlib.import_module('examples.server.module_apps.lifecycle.share_data_with_asgi.server')
    messages = []

    async def receive():
        return {'type': 'lifespan.shutdown'}

    async def send(event):
        messages.append(event)

    await module.app({'type': 'lifespan'}, receive, send)
    assert messages == [{'type': 'lifespan.shutdown.complete'}]


def test_clustering_can_select_agglomerative_algorithm():
    pytest.importorskip('sklearn')
    from bokeh.document import Document
    from bokeh.models import Plot, Select
    from examples.server.module_apps.applications.clustering.app import modify_document

    document = Document()
    modify_document(document)
    selector = document.select_one({'type': Select, 'title': 'Select algorithm:'})
    selector.value = 'AgglomerativeClustering'
    assert any(plot.title.text == 'AgglomerativeClustering' for plot in document.select({'type': Plot}))


async def test_shared_producer_reports_core_shutdown_failure(monkeypatch):
    module = importlib.import_module('examples.server.module_apps.lifecycle.share_data_with_asgi.server')
    messages = []

    async def fail():
        raise RuntimeError('core shutdown failed')

    async def receive():
        return {'type': 'lifespan.shutdown'}

    async def send(event):
        messages.append(event)

    monkeypatch.setattr(module.bokeh_application.core, 'stop', fail)
    await module.app({'type': 'lifespan'}, receive, send)
    assert messages == [{'type': 'lifespan.shutdown.failed', 'message': 'core shutdown failed'}]


async def test_application_shared_data_updates_sessions_and_stops_producer():
    module = importlib.import_module('examples.server.module_apps.updating_data.share_data_between_sessions.server')
    app = module.app
    await app.core.start()
    application = app.core.applications['/'].application
    producer = application.producer
    try:
        context = app.core.applications['/']
        first = await context.create_session_if_needed('shared-first')
        second = await context.create_session_if_needed('shared-second')
        first_source = first.document.select_one({'name': 'shared-source'})
        second_source = second.document.select_one({'name': 'shared-source'})
        before = list(first_source.data['y'])

        async def wait_for_updates():
            while list(first_source.data['y']) == before or list(second_source.data['y']) == before:
                await asyncio.sleep(0.02)

        await asyncio.wait_for(wait_for_updates(), 5)
        assert producer.is_alive()
        assert first_source is not second_source
        assert application.producer is producer
    finally:
        await app.core.stop()
    assert not producer.is_alive()
