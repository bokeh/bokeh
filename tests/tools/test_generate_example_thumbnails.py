from __future__ import annotations

from pathlib import Path

from PIL import Image

from tools import generate_example_thumbnails as thumbnails


def test_reuses_gallery_image_without_loading_payload(tmp_path: Path, monkeypatch) -> None:
    images = tmp_path / 'images'
    images.mkdir()
    Image.new('RGB', (300, 150), 'blue').save(images / 'example.png')
    (tmp_path / 'examples').mkdir()
    (tmp_path / 'examples/example.py').write_text('raise RuntimeError("Do not execute examples")')
    pages = tmp_path / 'build/html/docs/examples'
    pages.mkdir(parents=True)
    (pages / 'example.html').write_text('<div data-bokeh-payload-url="missing.json"></div>')
    monkeypatch.setattr(thumbnails, 'ROOT', tmp_path)
    monkeypatch.setattr(thumbnails, 'IMAGES', images)

    assert thumbnails.main(['--build-dir', str(tmp_path / 'build')]) == 0
    target = images / '_index/example.png'
    with Image.open(target) as image:
        assert image.size == (120, 60)
    before = target.stat().st_mtime_ns
    assert thumbnails.main(['--build-dir', str(tmp_path / 'build')]) == 0
    assert target.stat().st_mtime_ns == before


def test_inline_payload_starts_at_reference_target() -> None:
    payload = thumbnails.ExamplePayload('styled-sliders')
    payload.feed('''<div data-bokeh-payload-url="unrelated.json"></div>
        <span id="styled-sliders"></span>
        <div data-bokeh-payload-url="sliders.json"></div>
        <div data-bokeh-payload-url="another.json"></div>''')
    assert payload.filename == 'sliders.json'


def test_server_capture_without_documentation_build(tmp_path: Path, monkeypatch) -> None:
    images = tmp_path / 'images'
    monkeypatch.setattr(thumbnails, 'ROOT', tmp_path)
    monkeypatch.setattr(thumbnails, 'IMAGES', images)
    captured = []

    def capture(path):
        captured.append(path)
        return Image.new('RGBA', (240, 120), (0, 0, 255, 128))

    monkeypatch.setattr(thumbnails, 'server_thumbnail', capture)
    assert thumbnails.main(['--server', 'server/app/sliders.py']) == 0
    assert captured == [tmp_path / 'examples/server/app/sliders.py']
    with Image.open(images / '_index/server/app/sliders.png') as image:
        assert image.size == (120, 60)
        assert image.mode == 'RGB'
        assert image.getpixel((0, 0)) == (127, 127, 255)
