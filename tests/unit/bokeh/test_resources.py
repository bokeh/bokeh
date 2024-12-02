# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest  # isort:skip

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import os
import re
import subprocess
import sys

# External imports
import bs4
from packaging.version import Version as V

# Bokeh imports
import bokeh.util.version as buv
from bokeh.models import Model
from bokeh.resources import RuntimeMessage, _get_cdn_urls
from bokeh.settings import LogLevel, settings
from tests.support.util.env import envset

# Module under test
import bokeh.resources as resources  # isort:skip

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------

# if BOKEH_RESOURCES is set many tests in this file fail
if os.environ.get("BOKEH_RESOURCES"):
    raise RuntimeError("Cannot run the unit tests with BOKEH_RESOURCES set")

LOG_LEVELS: list[LogLevel] = ["trace", "debug", "info", "warn", "error", "fatal"]

DEFAULT_LOG_JS_RAW = 'Bokeh.set_log_level("info");'

def teardown_module() -> None:
    Model.clear_extensions()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)$")

ALL_VERSIONS = resources.get_all_sri_versions()

# very old Bokeh versions are inconsistent and have to be handled specially
STANDARD_VERSIONS = {v for v in ALL_VERSIONS if V(v) >= V("0.4.1")}
WIERD_VERSIONS = ALL_VERSIONS - STANDARD_VERSIONS

class TestSRIHashes:
    def test_get_all_sri_versions_valid_format(self) -> None:
        versions = resources.get_all_sri_versions()
        for v in versions:
            assert VERSION_PAT.match(v), f"{v} is not a valid version for the SRI hashes store"

    @pytest.mark.parametrize("v", STANDARD_VERSIONS)
    def test_get_sri_hashes_for_standard_versions(self, v) -> None:

        h = resources.get_sri_hashes_for_version(v)
        assert f"bokeh-{v}.js" in h
        assert f"bokeh-{v}.min.js" in h
        if v >= "1":
            assert f"bokeh-widgets-{v}.js" in h
            assert f"bokeh-widgets-{v}.min.js" in h

    @pytest.mark.parametrize("v", WIERD_VERSIONS)
    def test_get_sri_hashes_for_weird_versions(self, v) -> None:

        h = resources.get_sri_hashes_for_version(v)
        # 0.1.0 and 0.0.2 are tagged but untestable
        if v <= "0.2.0":
            return

        # other early versions omitted trailing .0 in filenames
        v = v.rstrip(".0")
        assert f"bokeh-{v}.js" in h
        assert f"bokeh-{v}.min.js" in h

    def test_get_sri_hashes_for_version_bad(self) -> None:
        with pytest.raises(ValueError):
            resources.get_sri_hashes_for_version("junk")


class TestResources:
    def test_basic(self) -> None:
        r = resources.Resources()
        assert r.mode == "cdn"

    def test_clone(self) -> None:
        r = resources.Resources(mode="server-dev")
        assert r.mode == "server"
        assert r.dev is True
        assert r.components == ["bokeh", "bokeh-gl", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax"]

        c = r.clone(components=["bokeh", "bokeh-gl"])
        assert c.mode == "server"
        assert c.dev is True
        assert c.components == ["bokeh", "bokeh-gl"]

    def test_str(self) -> None:
        r0 = resources.Resources(mode="cdn")
        assert str(r0) == "Resources(mode='cdn')"

        r1 = resources.Resources(mode="inline")
        assert str(r1) == "Resources(mode='inline')"

        r2 = resources.Resources(mode="server-dev")
        assert str(r2) == "Resources(mode='server', dev=True)"

        r3 = resources.Resources(mode="server-dev", components=["bokeh", "bokeh-gl"])
        assert str(r3) == "Resources(mode='server', dev=True, components=['bokeh', 'bokeh-gl'])"

    def test_build(self) -> None:
        r0 = resources.Resources(mode="cdn")
        settings.resources = "inline"
        try:
            r = resources.Resources.build(r0)
            assert r is r0
        finally:
            del settings.resources

        r1 = "cdn"
        settings.resources = "inline"
        try:
            r = resources.Resources.build(r1)
            assert r.mode == "cdn"
        finally:
            del settings.resources

        r2 = None
        settings.resources = "inline"
        try:
            r = resources.Resources.build(r2)
            assert r.mode == "inline"
        finally:
            del settings.resources

    def test_log_level(self) -> None:
        r = resources.Resources()
        for level in LOG_LEVELS:
            r.log_level = level
            assert r.log_level == level
            if not r.dev:
                assert r.js_raw[-1] == f'Bokeh.set_log_level("{level}");'
        with pytest.raises(ValueError):
            setattr(r, "log_level", "foo")

    def test_module_attrs(self) -> None:
        assert resources.CDN.mode == "cdn"
        assert resources.INLINE.mode == "inline"

    def test_inline(self) -> None:
        r = resources.Resources(mode="inline")
        assert r.mode == "inline"
        assert r.dev is False

        assert len(r.js_raw) == 6
        assert r.js_raw[-1] == DEFAULT_LOG_JS_RAW
        assert len(r.css_raw) == 0
        assert r.messages == []

    def test__get_cdn_urls_full(self) -> None:
        result = _get_cdn_urls(version="2.4.2")
        url = result.urls(["bokeh"], "js")[0]
        assert "bokeh/" in url
        assert "2.4.2" in url
        assert "dev" not in url
        assert "rc" not in url

    @pytest.mark.parametrize('v', ("2.3.4.dev2", "3.0.1rc2"))
    def test__get_cdn_urls_dev(self, v) -> None:
        result = _get_cdn_urls(version=v)
        url = result.urls(["bokeh"], "js")[0]
        assert "bokeh/dev" in url
        assert v in url

    def test_cdn(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(resources, "__version__", "1.0")
        r = resources.Resources(mode="cdn", version="1.0")
        assert r.mode == "cdn"
        assert r.dev is False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        resources.__version__ = "1.0+1.abc"
        r = resources.Resources(mode="cdn", version="1.0")
        assert r.messages == [
            RuntimeMessage(
                text="Requesting CDN BokehJS version '1.0' from local development version '1.0+1.abc'. This configuration is unsupported and may not work!",
                type="warn",
            ),
        ]

    def test_server_default(self) -> None:
        r = resources.Resources(mode="server")
        assert r.mode == "server"
        assert r.dev is False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == [
            "http://localhost:5006/static/js/bokeh.min.js",
            "http://localhost:5006/static/js/bokeh-gl.min.js",
            "http://localhost:5006/static/js/bokeh-widgets.min.js",
            "http://localhost:5006/static/js/bokeh-tables.min.js",
            "http://localhost:5006/static/js/bokeh-mathjax.min.js",
        ]

    def test_server_root_url(self) -> None:
        r = resources.Resources(mode="server", root_url="http://foo/")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == [
            "http://foo/static/js/bokeh.min.js",
            "http://foo/static/js/bokeh-gl.min.js",
            "http://foo/static/js/bokeh-widgets.min.js",
            "http://foo/static/js/bokeh-tables.min.js",
            "http://foo/static/js/bokeh-mathjax.min.js",
        ]

    def test_server_root_url_empty(self) -> None:
        r = resources.Resources(mode="server", root_url="")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == [
            "static/js/bokeh.min.js",
            "static/js/bokeh-gl.min.js",
            "static/js/bokeh-widgets.min.js",
            "static/js/bokeh-tables.min.js",
            "static/js/bokeh-mathjax.min.js",
        ]

    def test_server_with_versioner(self) -> None:
        def versioner(path: str) -> str:
            return path + "?v=VERSIONED"

        r = resources.Resources(mode="server", root_url="http://foo/", path_versioner=versioner)

        assert r.js_files == [
            "http://foo/static/js/bokeh.min.js?v=VERSIONED",
            "http://foo/static/js/bokeh-gl.min.js?v=VERSIONED",
            "http://foo/static/js/bokeh-widgets.min.js?v=VERSIONED",
            "http://foo/static/js/bokeh-tables.min.js?v=VERSIONED",
            "http://foo/static/js/bokeh-mathjax.min.js?v=VERSIONED",
        ]

    def test_server_dev(self) -> None:
        r = resources.Resources(mode="server-dev")
        assert r.mode == "server"
        assert r.dev is True

        assert len(r.js_raw) == 2
        assert r.css_raw == []
        assert r.messages == []

        r = resources.Resources(mode="server-dev", root_url="http://foo/")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    @pytest.mark.skipif(sys.platform == "win32", reason="tests/package on different drives")
    def test_relative(self) -> None:
        r = resources.Resources(mode="relative")
        assert r.mode == "relative"
        assert r.dev is False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

    @pytest.mark.skipif(sys.platform == "win32", reason="tests/package on different drives")
    def test_relative_dev(self) -> None:
        r = resources.Resources(mode="relative-dev")
        assert r.mode == "relative"
        assert r.dev is True

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    def test_absolute(self) -> None:
        r = resources.Resources(mode="absolute")
        assert r.mode == "absolute"
        assert r.dev is False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

    def test_absolute_dev(self) -> None:
        r = resources.Resources(mode="absolute-dev")
        assert r.mode == "absolute"
        assert r.dev is True

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    def test_argument_checks(self) -> None:
        with pytest.raises(ValueError):
            resources.Resources("foo")

        for mode in ("inline", "cdn", "server", "server-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, root_dir="foo")

        for mode in ("inline", "server", "server-dev", "relative", "relative-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, version="foo")

        for mode in ("inline", "cdn", "relative", "relative-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, root_url="foo")

    @pytest.mark.parametrize('env', ["BOKEH_CDN_VERSION", "BOKEH_ROOTDIR"])
    def test_builtin_importable_with_env(self, monkeypatch: pytest.MonkeyPatch, env) -> None:
        cmd = [sys.executable, "-c", "import bokeh.resources"]
        monkeypatch.setenv(env, "foo")
        try:
            subprocess.check_call(cmd, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError:
            pytest.fail(f"resources import failed with {env} set")

    def test_render_js_cdn_release(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(buv, "__version__", "2.0.0")
        monkeypatch.setattr(resources, "__version__", "2.0.0")
        r = resources.CDN.clone()
        # Skip bokeh-mathjax for older versions
        r.components.remove("bokeh-mathjax")
        out = r.render_js()
        html = bs4.BeautifulSoup(out, "html.parser")
        scripts = html.findAll(name='script')
        for script in scripts:
            if "src" not in script.attrs:
                continue
            assert "crossorigin" not in script.attrs
            assert "integrity" not in script.attrs

    @pytest.mark.parametrize('v', ["1.8.0.rc1", "1.8.0.dev6"])
    def test_render_js_cdn_dev_release(self, v: str, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(buv, "__version__", v)
        monkeypatch.setattr(resources, "__version__", v)
        out = resources.CDN.render_js()
        html = bs4.BeautifulSoup(out, "html.parser")
        scripts = html.findAll(name='script')
        for script in scripts:
            assert "crossorigin" not in script.attrs
            assert "integrity" not in script.attrs

    def test_render_js_cdn_dev_local(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(buv, "__version__", "2.0.0+foo")
        monkeypatch.setattr(resources, "__version__", "2.0.0+foo")
        r = resources.CDN.clone()
        # Skip bokeh-mathjax for older versions
        r.components.remove("bokeh-mathjax")
        out = r.render_js()
        html = bs4.BeautifulSoup(out, "html.parser")
        scripts = html.findAll(name='script')
        for script in scripts:
            if "src" not in script.attrs:
                continue
            assert "crossorigin" not in script.attrs
            assert "integrity" not in script.attrs

    @pytest.mark.parametrize('v', ["2.0.0", "2.0.0+foo", "1.8.0.rc1", "1.8.0.dev6"])
    def test_render_js_inline(self, v, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(buv, "__version__", v)
        monkeypatch.setattr(resources, "__version__", v)
        out = resources.INLINE.render_js()
        html = bs4.BeautifulSoup(out, "html.parser")
        scripts = html.findAll(name='script')
        for script in scripts:
            assert "crossorigin" not in script.attrs
            assert "integrity" not in script.attrs


## Test external resources


def test_external_js_and_css_resource_embedding() -> None:
    """ This test method has to be at the end of the test modules because
    subclassing a Model causes the CustomModel to be added as a Model and
    messes up the Resources state for the other tests.
    """

    # External resources can be defined as a string or list of strings
    class CustomModel1(Model):
        __javascript__ = "external_js_1"
        __css__ = "external_css_1"

    class CustomModel2(Model):
        __javascript__ = ["external_js_2", "external_js_3"]
        __css__ = ["external_css_2", "external_css_3"]

    class CustomModel3(Model):
        __javascript__ = ["external_js_1", "external_js_3"]
        __css__ = ["external_css_1", "external_css_2"]

    r = resources.Resources()

    assert "external_js_1" in r.js_files
    assert "external_css_1" in r.css_files

    assert "external_js_2" in r.js_files
    assert "external_js_3" in r.js_files
    assert "external_css_2" in r.css_files
    assert "external_css_3" in r.css_files

    # Deduplication should keep the first instance of every file
    assert r.css_files.count("external_css_1") == 1
    assert r.css_files.count("external_css_2") == 1
    assert r.js_files.count("external_js_3") == 1
    assert r.js_files.count("external_js_1") == 1


def test_external_js_and_css_resource_ordering() -> None:
    class ZClass(Model):
        __javascript__ = "z_class"

    class AClass(Model):
        __javascript__ = "a_class"

    r = resources.Resources()

    # a_class is before z_class because they're sorted alphabetically
    assert r.js_files.index("a_class") < r.js_files.index("z_class")

    # The files should be in the order defined by the lists in CustomModel2 and CustomModel3
    assert r.css_files.index("external_css_3") > r.css_files.index("external_css_2")
    assert r.js_files.index("external_js_3") > r.js_files.index("external_js_2")


@pytest.mark.parametrize("mode", ["cdn", "inline"])
def test_Resources_with_BOKEH_MINIFIED(mode: resources.ResourcesMode) -> None:
    with envset(BOKEH_MINIFIED="yes"):
        r = resources.Resources(mode=mode)
        assert r.minified is True

    with envset(BOKEH_MINIFIED="no"):
        r = resources.Resources(mode=mode)
        assert r.minified is False

    with envset(BOKEH_DEV="yes"):
        r = resources.Resources(mode=mode, minified=True)
        assert r.minified is True

    with envset(BOKEH_DEV="yes"):
        r = resources.Resources(mode=mode, minified=False)
        assert r.minified is False

    with envset(BOKEH_DEV="no"):
        r = resources.Resources(mode=mode, minified=True)
        assert r.minified is True

    with envset(BOKEH_DEV="no"):
        r = resources.Resources(mode=mode, minified=False)
        assert r.minified is False

    with envset(BOKEH_MINIFIED="yes", BOKEH_DEV="yes"):
        r = resources.Resources(mode=mode)
        assert r.minified is False

    with envset(BOKEH_MINIFIED="yes", BOKEH_DEV="no"):
        r = resources.Resources(mode=mode)
        assert r.minified is True

    with envset(BOKEH_MINIFIED="no", BOKEH_DEV="yes"):
        r = resources.Resources(mode=mode)
        assert r.minified is False

    with envset(BOKEH_MINIFIED="no", BOKEH_DEV="no"):
        r = resources.Resources(mode=mode)
        assert r.minified is False

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
