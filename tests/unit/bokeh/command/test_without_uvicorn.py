"""Non-serving functionality must work when the ASGI runtime is absent."""

from __future__ import annotations

# Standard library imports
import json
import subprocess
import sys

# External imports
import pytest

BLOCK_UVICORN = """
import importlib.abc
import sys

class WithoutUvicorn(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname == 'uvicorn' or fullname.startswith('uvicorn.'):
            raise ModuleNotFoundError('Uvicorn unavailable for this test', name=fullname)

sys.meta_path.insert(0, WithoutUvicorn())
"""


def run_without_uvicorn(code, tmp_path):
    result = subprocess.run([sys.executable, '-c', BLOCK_UVICORN + code], cwd=tmp_path,
                            capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout


def test_plotting_and_serialization_without_uvicorn(tmp_path):
    run_without_uvicorn("""
import json
from bokeh.embed import embed
from bokeh.plotting import figure

plot = figure()
plot.scatter([1, 2], [3, 4])
payload = embed(plot).to_dict()
assert payload['roots']
assert json.dumps(payload)
assert 'uvicorn' not in sys.modules
assert 'bokeh.server.host' not in sys.modules
""", tmp_path)


def test_asgi_http_without_uvicorn(tmp_path):
    run_without_uvicorn("""
import asyncio
from bokeh.models import Div
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    doc.add_root(Div(text='Independent ASGI app'))


async def check():
    app = BokehASGI(modify_document)
    messages = []

    async def receive():
        return {'type': 'http.request', 'body': b'', 'more_body': False}

    async def send(event):
        messages.append(event)

    try:
        await app({'type': 'http', 'method': 'GET', 'path': '/', 'query_string': b'',
                   'scheme': 'http', 'headers': [(b'host', b'localhost')]}, receive, send)
        assert messages[0]['status'] == 200
        assert app.core.get_sessions('/')[0].document.roots
    finally:
        await app.core.stop()

asyncio.run(check())
assert 'uvicorn' not in sys.modules
assert 'bokeh.server.host' not in sys.modules
""", tmp_path)


@pytest.mark.parametrize('args, expected', [
    (['info'], 'Uvicorn version'),
    (['secret'], None),
    (['--version'], None),
    (['--help'], 'Sub-commands'),
    (['serve', '--help'], '--port'),
    (['static', '--help'], '--port'),
])
def test_non_serving_cli_without_uvicorn(tmp_path, args, expected):
    output = run_without_uvicorn(f"""
from bokeh.command.bootstrap import main
try:
    main({['bokeh', *args]!r})
finally:
    assert 'uvicorn' not in sys.modules
    assert 'bokeh.server.host' not in sys.modules
""", tmp_path)
    if expected is not None:
        assert expected in output
    if args == ['info']:
        assert 'Uvicorn version       :  (not installed)' in output


def test_json_cli_without_uvicorn(tmp_path):
    (tmp_path / 'plot.py').write_text(
        "from bokeh.io import curdoc\nfrom bokeh.models import Div\ncurdoc().add_root(Div(text='hello'))\n",
    )
    run_without_uvicorn("""
from bokeh.command.bootstrap import main
main(['bokeh', 'json', 'plot.py', '-o', 'plot.json'])
assert 'uvicorn' not in sys.modules
assert 'bokeh.server.host' not in sys.modules
""", tmp_path)
    assert json.loads((tmp_path / 'plot.json').read_text())['roots']
