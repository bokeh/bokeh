from __future__ import annotations

# Standard library imports
import json
import shlex
from collections.abc import Callable
from pathlib import Path
from subprocess import PIPE
from types import SimpleNamespace
from typing import Any
from xml.etree import ElementTree as ET

# External imports
import pytest
from release import build, docs
from release.config import Config
from release.system import System

# Bokeh imports
from tests.codebase._release_support import RecordingSystem

HTML = (
    b'<html><head><title>Keep me</title><link rel="canonical" href="old"><meta property="og:url" content="old">'
    b'</head><body>Untouched plot and script</body></html>'
)


def test_html_metadata_is_normalized_without_changing_content() -> None:
    result = docs.patch_html(HTML, "en/latest/", "index.html")
    assert b'<title>Keep me</title>' in result
    assert result.split(b"</head>")[1] == HTML.split(b"</head>")[1]
    assert result.count(b'https://docs.bokeh.org/en/latest/') == 2
    assert result.count(b'rel="canonical"') == 1
    assert docs.patch_html(result, "en/latest/", "index.html") == result
    assert docs.page_url("en/4.0.0/", "myindex.html").endswith("/myindex.html")


def test_sitemap_uses_same_https_directory_urls_as_html() -> None:
    data = docs.xml_urls("urlset", "url", ["http://docs.bokeh.org/en/4.0.0/index.html", "http://docs.bokeh.org/en/4.0.0/docs/index.html"])
    result = docs.sitemap(data, "en/latest/")
    urls = [loc.text for loc in ET.fromstring(result).iter(f"{{{docs.SITEMAP_NS}}}loc")]
    assert urls == ["https://docs.bokeh.org/en/latest/", "https://docs.bokeh.org/en/latest/docs/"]
    assert docs.sitemap(result, "en/latest/") == result
    with pytest.raises(ValueError, match="Unexpected sitemap URL"):
        docs.sitemap(data.replace(b"docs.bokeh.org", b"other.example"), "en/latest/")


def test_preparation_leaves_asset_html_untouched(tmp_path: Path) -> None:
    (tmp_path / "_static").mkdir()
    macro = tmp_path / "_static/webpack-macros.html"
    macro.write_bytes(b"{% macro js() %}template{% endmacro %}")
    (tmp_path / "index.html").write_bytes(HTML)
    (tmp_path / "sitemap.xml").write_bytes(docs.xml_urls("urlset", "url", [
        "http://docs.bokeh.org/en/4.0.0/index.html", "http://docs.bokeh.org/en/4.0.0/_static/webpack-macros.html",
    ]))
    docs.prepare_tree(tmp_path, "en/latest/")
    assert macro.read_bytes() == b"{% macro js() %}template{% endmacro %}"
    assert b"webpack" not in (tmp_path / "sitemap.xml").read_bytes()


class FakeDocsBucket:
    published_stable_version = "3.10.1"
    gets: list[str] = []
    puts: list[tuple[str, bytes, dict[str, Any], str]] = []
    checks: list[str] = []
    conflict: str | None = None
    failure: str | None = None
    older_patch = "3.9.2"
    development = "4.0.0.dev8"

    def __init__(self, system: System) -> None:
        self.system = system

    def get(self, key: str, path: Path) -> dict[str, Any]:
        self.gets.append(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        if key == "switcher.json":
            dev_prefix = "dev-" + ".".join(self.development.split(".")[:2])
            data = json.dumps([
                {
                    "name": f"{self.published_stable_version} (latest)",
                    "version": self.published_stable_version,
                    "preferred": True,
                    "url": docs.SITE + "en/latest/",
                },
                {"version": self.older_patch, "url": docs.SITE + f"en/{self.older_patch}/"},
                {"name": f"dev ({self.development})", "version": dev_prefix, "url": docs.SITE + f"en/{dev_prefix}/"},
            ]).encode()
        else:
            assert key == "sitemap_index.xml", "Publication must not read historical docs"
            data = docs.xml_urls("sitemapindex", "sitemap", ["http://docs.bokeh.org/en/1.0.0/sitemap.xml"])
        path.write_bytes(data)
        return {"ETag": '"original"'}

    def check_current(self, key: str, metadata: dict[str, Any]) -> None:
        self.checks.append(key)
        if key == self.conflict:
            raise RuntimeError("PreconditionFailed")

    def put(self, key: str, path: Path, metadata: dict[str, Any], content_type: str) -> None:
        if key == self.failure:
            raise RuntimeError("PreconditionFailed")
        self.puts.append((key, path.read_bytes(), metadata, content_type))


class ArtifactSystem(RecordingSystem):
    """Capture the artifact at each upload, before temporary files disappear."""
    def __init__(self) -> None:
        super().__init__()
        self.uploads: dict[str, dict[str, bytes]] = {}

    def run(self, cmd: str, **kwargs: Any) -> str:
        # Preserve backslashes in Windows artifact paths.
        args = shlex.split(cmd, posix=False)
        if args[:3] == ["aws", "s3", "sync"]:
            source = Path(args[3])
            self.uploads[args[4]] = {path.relative_to(source).as_posix(): path.read_bytes() for path in source.rglob("*") if path.is_file()}
        return super().run(cmd, **kwargs)


@pytest.fixture
def publication(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Callable[[str], Path]:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(docs, "DocsBucket", FakeDocsBucket)
    monkeypatch.setattr(FakeDocsBucket, "puts", [])
    monkeypatch.setattr(FakeDocsBucket, "gets", [])
    monkeypatch.setattr(FakeDocsBucket, "published_stable_version", "3.10.1")
    monkeypatch.setattr(FakeDocsBucket, "checks", [])
    monkeypatch.setattr(FakeDocsBucket, "conflict", None)
    monkeypatch.setattr(FakeDocsBucket, "failure", None)
    monkeypatch.setattr(FakeDocsBucket, "older_patch", "3.9.2")
    monkeypatch.setattr(FakeDocsBucket, "development", "4.0.0.dev8")

    def prepare(version: str) -> Path:
        artifact_root = Path(f"deployment-{version}/docs/bokeh")
        source = artifact_root / "build/html"
        (source / "docs").mkdir(parents=True)
        (source / "index.html").write_bytes(HTML)
        (source / "docs/index.html").write_bytes(HTML)
        (source / "asset.js").write_bytes(b"unchanged JavaScript")
        (source / "sitemap.xml").write_bytes(docs.xml_urls("urlset", "url", [
            f"http://docs.bokeh.org/en/{version}/index.html", f"http://docs.bokeh.org/en/{version}/docs/index.html",
        ]))
        release_dir = tmp_path / "release"
        release_dir.mkdir(parents=True, exist_ok=True)
        monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
        monkeypatch.setattr(build, "get_tags", lambda config, system: [
            FakeDocsBucket.published_stable_version, FakeDocsBucket.older_patch, FakeDocsBucket.development,
        ])
        switcher_dir = tmp_path / "docs/bokeh"
        switcher_dir.mkdir(parents=True, exist_ok=True)
        build.update_switcher_json(Config(version), RecordingSystem())
        (artifact_root / "switcher.json").write_bytes((switcher_dir / "switcher.json").read_bytes())
        return source
    return prepare


def assert_self_canonical(artifact: dict[str, bytes], prefix: str) -> None:
    assert artifact["index.html"].count(f'https://docs.bokeh.org/{prefix}'.encode()) == 2
    assert artifact["docs/index.html"].count(f'https://docs.bokeh.org/{prefix}docs/'.encode()) == 2
    assert artifact["index.html"].split(b"</head>")[1] == HTML.split(b"</head>")[1]
    assert artifact["asset.js"] == b"unchanged JavaScript"
    urls = [loc.text for loc in ET.fromstring(artifact["sitemap.xml"]).iter(f"{{{docs.SITEMAP_NS}}}loc")]
    assert urls == [f"https://docs.bokeh.org/{prefix}", f"https://docs.bokeh.org/{prefix}docs/"]


@pytest.mark.parametrize("version", ["4.0.0", "3.10.1"])
def test_stable_uploads_separate_self_canonical_copies_without_touching_history(publication: Callable[[str], Path], version: str) -> None:
    source = publication(version)
    built_switcher = (source.parents[1] / "switcher.json").read_bytes()
    system = ArtifactSystem()
    docs.publish_docs(Config(version), system)

    assert set(system.uploads) == {f"s3://docs.bokeh.org/en/{version}/", "s3://docs.bokeh.org/en/latest/"}
    assert_self_canonical(system.uploads[f"s3://docs.bokeh.org/en/{version}/"], f"en/{version}/")
    assert_self_canonical(system.uploads["s3://docs.bokeh.org/en/latest/"], "en/latest/")
    assert (source / "index.html").read_bytes() == system.uploads[f"s3://docs.bokeh.org/en/{version}/"]["index.html"]
    assert FakeDocsBucket.gets == ["switcher.json", "sitemap_index.xml"]
    assert [key for key, *_ in FakeDocsBucket.puts] == ["switcher.json", "sitemap_index.xml"]
    assert not (source.parents[1] / "metadata-rollback.json").exists()
    invalidation = shlex.split(system.commands[-1])
    assert "/en/latest*" in invalidation
    assert "/en/3.10.1*" not in invalidation or version == "3.10.1"
    index = FakeDocsBucket.puts[-1][1]
    assert b"https://docs.bokeh.org/en/latest/sitemap.xml" in index
    assert f"https://docs.bokeh.org/en/{version}/sitemap.xml".encode() in index
    assert b"https://docs.bokeh.org/en/3.10.1/sitemap.xml" not in index or version == "3.10.1"
    assert FakeDocsBucket.puts[0][1] == built_switcher
    switcher = json.loads(FakeDocsBucket.puts[0][1])
    assert any(entry["version"] == "dev-4.0" for entry in switcher) == (version != "4.0.0")
    syncs = [shlex.split(command) for command in system.commands if "s3 sync" in command]
    assert "--delete" not in syncs[0]
    assert "--delete" in syncs[1]


def test_maintenance_release_cannot_downgrade_latest(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(FakeDocsBucket, "published_stable_version", "4.0.0")
    publication("3.10.2")
    system = ArtifactSystem()
    docs.publish_docs(Config("3.10.2"), system)

    assert set(system.uploads) == {"s3://docs.bokeh.org/en/3.10.2/"}
    assert_self_canonical(system.uploads["s3://docs.bokeh.org/en/3.10.2/"], "en/3.10.2/")
    switcher = FakeDocsBucket.puts[0][1]
    assert docs.stable_version(switcher) == "4.0.0"
    assert any(entry["version"] == "3.10.2" for entry in json.loads(switcher))
    assert b"https://docs.bokeh.org/en/3.10.2/sitemap.xml" in FakeDocsBucket.puts[1][1]
    assert "/en/latest*" not in shlex.split(system.commands[-1])


@pytest.mark.parametrize("version", ["4.0.0rc1", "4.0.0.dev9"])
def test_prerelease_is_self_canonical_within_dev_prefix(publication: Callable[[str], Path], version: str) -> None:
    publication(version)
    system = ArtifactSystem()
    docs.publish_docs(Config(version), system)

    assert set(system.uploads) == {"s3://docs.bokeh.org/en/dev-4.0/"}
    assert_self_canonical(system.uploads["s3://docs.bokeh.org/en/dev-4.0/"], "en/dev-4.0/")
    assert [key for key, *_ in FakeDocsBucket.puts] == ["switcher.json"]
    assert "/en/latest*" not in shlex.split(system.commands[-1])


def test_invalid_root_sitemap_fails_before_uploads(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch) -> None:
    publication("4.0.0")
    original = FakeDocsBucket.get

    def invalid(self: FakeDocsBucket, key: str, path: Path) -> dict[str, Any]:
        metadata = original(self, key, path)
        if key == "sitemap_index.xml":
            path.write_bytes(b"<wrong-root/>")
        return metadata
    monkeypatch.setattr(FakeDocsBucket, "get", invalid)
    system = ArtifactSystem()
    with pytest.raises(ValueError, match="root sitemap index"):
        docs.publish_docs(Config("4.0.0"), system)
    assert system.commands == []
    assert FakeDocsBucket.puts == []


@pytest.mark.parametrize(("key", "content_type"), [("switcher.json", "application/json"), ("sitemap_index.xml", "application/xml")])
def test_control_object_updates_check_etag_and_set_cache_headers(tmp_path: Path, key: str, content_type: str) -> None:
    path = tmp_path / key
    path.write_text("new contents")
    system = RecordingSystem()
    docs.DocsBucket(system).put(key, path, {"ETag": "original"}, content_type)
    args = shlex.split(system.commands[0])
    request = json.loads(args[args.index("--cli-input-json") + 1])
    assert request["IfMatch"] == "original"
    assert request["ContentType"] == content_type
    assert request["CacheControl"] == "no-cache,max-age=0,must-revalidate"


@pytest.mark.parametrize("key", ["switcher.json", "sitemap_index.xml"])
def test_stale_control_objects_are_rejected_before_uploads(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch, key: str) -> None:
    publication("4.0.0")
    monkeypatch.setattr(FakeDocsBucket, "conflict", key)
    system = ArtifactSystem()
    with pytest.raises(RuntimeError, match="PreconditionFailed"):
        docs.publish_docs(Config("4.0.0"), system)
    assert system.commands == []
    assert FakeDocsBucket.puts == []


@pytest.mark.parametrize("key", ["switcher.json", "sitemap_index.xml"])
def test_failed_metadata_write_invalidates_uploaded_docs_and_can_be_retried(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch, key: str) -> None:
    publication("4.0.0")
    monkeypatch.setattr(FakeDocsBucket, "failure", key)
    system = ArtifactSystem()
    with pytest.raises(RuntimeError, match=r"may be partial.*Rerun publish-docs"):
        docs.publish_docs(Config("4.0.0"), system)
    assert len(system.uploads) == 2
    assert "create-invalidation" in system.commands[-1]
    assert "/en/latest*" in system.commands[-1]

    monkeypatch.setattr(FakeDocsBucket, "failure", None)
    retry = ArtifactSystem()
    docs.publish_docs(Config("4.0.0"), retry)
    assert len(retry.uploads) == 2
    assert docs.stable_version(FakeDocsBucket.puts[-2][1]) == "4.0.0"


def test_aws_json_output_is_not_contaminated_by_stderr_warnings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture) -> None:
    def run(command: str, **kwargs: Any) -> SimpleNamespace:
        assert kwargs["stderr"] is PIPE
        assert shlex.split(command)[1:3] == ["s3api", "get-object"]
        return SimpleNamespace(returncode=0, stdout='{"ETag":"original"}', stderr="AWS CLI warning")
    monkeypatch.setattr("release.system.stdlib_run", run)
    metadata = docs.DocsBucket(System()).get("switcher.json", tmp_path / "switcher.json")
    assert metadata == {"ETag": "original"}
    assert "AWS CLI warning" in caplog.text


def test_root_sitemap_preserves_existing_maps_and_adds_only_this_release() -> None:
    original = docs.xml_urls("sitemapindex", "sitemap", [
        "http://docs.bokeh.org/en/1.0.0/sitemap.xml", "https://docs.bokeh.org/en/3.9.2/sitemap.xml",
    ])
    updated = docs._update_sitemap_index(original, Config("4.0.0"))
    urls = {loc.text for loc in ET.fromstring(updated).iter(f"{{{docs.SITEMAP_NS}}}loc")}
    assert urls == {
        docs.SITE + "en/1.0.0/sitemap.xml", docs.SITE + "en/3.9.2/sitemap.xml",
        docs.SITE + "en/4.0.0/sitemap.xml", docs.SITE + "en/latest/sitemap.xml",
    }


def test_stable_release_preserves_a_newer_development_series(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(FakeDocsBucket, "development", "4.1.0.dev2")
    publication("4.0.0")
    docs.publish_docs(Config("4.0.0"), ArtifactSystem())
    entries = json.loads(FakeDocsBucket.puts[0][1])
    assert entries[-1]["version"] == "dev-4.1"
    assert docs.stable_version(FakeDocsBucket.puts[0][1]) == "4.0.0"


def test_publication_and_invalidation_failure_reports_both_causes(publication: Callable[[str], Path], monkeypatch: pytest.MonkeyPatch) -> None:
    publication("4.0.0")
    monkeypatch.setattr(FakeDocsBucket, "failure", "switcher.json")

    class FailedInvalidation(ArtifactSystem):
        def run(self, cmd: str, **kwargs: Any) -> str:
            if "create-invalidation" in cmd:
                raise RuntimeError("invalidation unavailable")
            return super().run(cmd, **kwargs)

    with pytest.raises(RuntimeError, match=r"PreconditionFailed.*Invalidation also failed.*invalidation unavailable.*Rerun"):
        docs.publish_docs(Config("4.0.0"), FailedInvalidation())


@pytest.mark.parametrize("built_switcher", [None, "not valid JSON"])
def test_invalid_build_switcher_fails_before_uploads(publication: Callable[[str], Path], built_switcher: str | None) -> None:
    source = publication("4.0.0")
    path = source.parents[1] / "switcher.json"
    if built_switcher is None:
        path.unlink()
    else:
        path.write_text(built_switcher)
    system = ArtifactSystem()

    with pytest.raises((OSError, ValueError)):
        docs.publish_docs(Config("4.0.0"), system)

    assert system.commands == []
    assert FakeDocsBucket.puts == []
