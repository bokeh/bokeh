#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import importlib
import os
from pathlib import Path

# External imports
import pytest

# Bokeh imports
from tests.integration.server_e2e.test_examples import browser as browser_fixture
from tests.support.util.asgi import running_asgi

browser = browser_fixture

ROOT = Path(__file__).parents[3]
MODULES = sorted(
    '.'.join(path.relative_to(ROOT).with_suffix('').parts)
    for path in (ROOT / 'examples/server/module_apps').rglob('*.py')
    if path.name in ('app.py', 'server.py')
    and (path.name == 'server.py' or not path.with_name('server.py').exists())
    and 'frameworks' not in path.relative_to(ROOT).parts
    and path.parent.name != 'embed_without_a_framework'
)
pytestmark = pytest.mark.skipif(os.environ.get('BOKEH_SERVER_E2E') != '1', reason='explicit browser integration run')


@pytest.mark.parametrize('module_name', MODULES, ids=lambda name: '.'.join(name.split('.')[-3:-1]))
def test_converted_module_app_runs_in_browser(module_name, browser, monkeypatch):
    if '.opencv_faces.' in module_name:
        cv2 = pytest.importorskip('cv2')
        if not hasattr(cv2, 'CascadeClassifier'):
            pytest.skip('requires OpenCV 4 object detection')
    monkeypatch.setenv('APP_ACCESS_TOKEN', 'test-only-token')
    monkeypatch.delenv('BOKEH_EXAMPLE_CAMERA', raising=False)
    module = importlib.import_module(module_name)
    application = module.app
    headers = {'Authorization': 'Bearer test-only-token'} if '.authenticate_users.' in module_name else {}
    with running_asgi(application) as host:
        context = browser.new_context(extra_http_headers=headers)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        try:
            response = page.goto(host.url + '/', wait_until='domcontentloaded')
            assert response is not None and response.ok
            page.wait_for_function('''() => {
                const target = document.querySelector('[data-bokeh-document-target]')
                if (target?.bokehMountError != null)
                    throw new Error(target.bokehMountError.message)
                return target?.bokehMount?.state === 'ready'
            }''', timeout=30_000)
            assert page.evaluate('Bokeh.documents[0].roots().length') > 0
            if '.adjust_plot_with_sliders.' in module_name:
                page.evaluate("Bokeh.documents[0].get_model_by_name('amplitude').value = 2")
                page.wait_for_function("Math.abs(Bokeh.documents[0].get_model_by_name('signal').data.y[25]) > 1.9")
            assert errors == []
        finally:
            context.close()
