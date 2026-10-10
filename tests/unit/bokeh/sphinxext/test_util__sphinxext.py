from __future__ import annotations

# Standard library imports
from typing import Iterator

# External imports
import pytest

# Bokeh imports
from bokeh import __version__
from bokeh.embed.resources import ResourceRequirements
from bokeh.settings import PrioritizedSetting, settings
from bokeh.sphinxext._internal.util import get_sphinx_resources


@pytest.fixture
def docs_cdn_setting() -> Iterator[PrioritizedSetting[str | None]]:
    setting = settings.docs_cdn
    original_value = setting._user_value
    setting.unset_value()
    try:
        yield setting
    finally:
        setting._user_value = original_value


@pytest.mark.parametrize(("docs_cdn", "cdn_version", "mode", "root_url", "override_version"), [
    (None, None, "cdn", None, None),
    (None, "3.8.0", "cdn", None, "3.8.0"),
    ("local", "3.8.0", "server", "/en/latest/", None),
    ("test:preview", "3.8.0", "server", "/en/preview/", None),
    ("4.0.0.dev5", "3.8.0", "cdn", None, "4.0.0.dev5"),
    ("4.0.0rc1", "3.8.0", "cdn", None, "4.0.0rc1"),
    ("4.0.0", "3.8.0", "cdn", None, "4.0.0"),
    ("3.8.0+local", "99.0.0", "cdn", None, "3.8.0+local"),
])
def test_get_sphinx_resources_selects_docs_delivery(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
    docs_cdn_setting: PrioritizedSetting[str | None],
    docs_cdn: str | None, cdn_version: str | None, mode: str, root_url: str | None,
    override_version: str | None,
) -> None:
    monkeypatch.delenv("BOKEH_DOCS_CDN", raising=False)
    monkeypatch.delenv("BOKEH_CDN_VERSION", raising=False)
    if docs_cdn is not None:
        monkeypatch.setenv("BOKEH_DOCS_CDN", docs_cdn)
    if cdn_version is not None:
        monkeypatch.setenv("BOKEH_CDN_VERSION", cdn_version)

    policy = get_sphinx_resources()
    [asset] = policy.resolve(ResourceRequirements()).assets

    assert policy.mode == mode
    assert policy.root_url == root_url
    assert policy.override_version == override_version
    if root_url is not None:
        assert asset.url == f"{root_url}static/js/bokeh.min.js"
    else:
        version = (override_version or __version__).split("+", 1)[0]
        assert asset.url is not None
        assert asset.url.endswith(f"/bokeh-{version}.min.js")


def test_docs_cdn_takes_precedence_over_programmatic_cdn_version(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
    docs_cdn_setting: PrioritizedSetting[str | None],
) -> None:
    cdn_version_setting.set_value("3.8.0")
    monkeypatch.setenv("BOKEH_DOCS_CDN", "4.0.0rc1")

    policy = get_sphinx_resources()
    [asset] = policy.resolve(ResourceRequirements()).assets

    assert policy.override_version == "4.0.0rc1"
    assert asset.url == "https://cdn.bokeh.org/bokeh/dev/bokeh-4.0.0rc1.min.js"
