# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Prepare canonical metadata for each documentation publication destination."""
from __future__ import annotations

# Standard library imports
import json
import re
from dataclasses import dataclass
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from shlex import join
from shutil import copytree
from tempfile import TemporaryDirectory
from typing import Any
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET

# External imports
from packaging.version import Version

# Bokeh imports
from .config import Config
from .system import System

SITE = "https://docs.bokeh.org/"
BUCKET = "docs.bokeh.org"
REGION = "us-east-1"
CLOUDFRONT_ID = "E2OC6Q27H5UQ63"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def is_page(relative: str) -> bool:
    return relative.endswith(".html") and relative.split("/")[0] not in ("_static", "_sources", "_downloads")


def page_url(prefix: str, relative: str) -> str:
    if relative == "index.html" or relative.endswith("/index.html"):
        relative = relative.removesuffix("index.html")
    return f"{SITE}{prefix}{relative}"


def patch_html(data: bytes, prefix: str, relative: str) -> bytes:
    """Replace canonical/og:url tags only, preserving the rest of the HTML."""
    text = data.decode("utf-8")
    lines = text.splitlines(keepends=True)
    offsets = [0]
    for line in lines:
        offsets.append(offsets[-1] + len(line))
    spans: list[tuple[int, int]] = []

    class Tags(HTMLParser):
        def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
            fields = dict(attrs)
            if (tag == "link" and "canonical" in (fields.get("rel") or "").split()) or (
                tag == "meta" and fields.get("property") == "og:url"
            ):
                line, column = self.getpos()
                start = offsets[line - 1] + column
                tag_text = self.get_starttag_text()
                assert tag_text is not None
                spans.append((start, start + len(tag_text)))

    head = re.search(r"</head\s*>", text, re.IGNORECASE)
    if head is None:
        raise ValueError(f"Missing HTML head in {relative}")
    Tags().feed(text[:head.start()])
    url = escape(page_url(prefix, relative), quote=True)
    replacement = f'<link rel="canonical" href="{url}">\n<meta property="og:url" content="{url}">'
    for start, end in reversed(spans):
        text = text[:start] + text[end:]
    head = re.search(r"</head\s*>", text, re.IGNORECASE)
    assert head is not None
    # Insert at a fixed location so repeated preparation is byte-for-byte stable.
    text = text[:head.start()].rstrip("\n") + "\n" + replacement + "\n" + text[head.start():]
    return text.encode("utf-8")


def sitemap(data: bytes, prefix: str) -> bytes:
    root = ET.fromstring(data)
    if root.tag != f"{{{SITEMAP_NS}}}urlset":
        raise ValueError("Expected sitemap URL set")
    urls = []
    for loc in root.findall(f"{{{SITEMAP_NS}}}url/{{{SITEMAP_NS}}}loc"):
        parsed = urlsplit(loc.text or "")
        if parsed.hostname != "docs.bokeh.org" or parsed.scheme not in ("http", "https") or parsed.query or parsed.fragment:
            raise ValueError(f"Unexpected sitemap URL: {loc.text}")
        path = parsed.path
        match = re.fullmatch(r"/en/[^/]+/(.*)", path)
        if match is None:
            raise ValueError(f"Unexpected sitemap URL: {loc.text}")
        relative = match[1]
        if not relative or relative.endswith("/"):
            relative += "index.html"
        if is_page(relative):
            urls.append(page_url(prefix, relative))
    return xml_urls("urlset", "url", sorted(set(urls)))


def xml_urls(root_tag: str, entry_tag: str, urls: list[str]) -> bytes:
    ET.register_namespace("", SITEMAP_NS)
    root = ET.Element(f"{{{SITEMAP_NS}}}{root_tag}")
    for url in urls:
        item = ET.SubElement(root, f"{{{SITEMAP_NS}}}{entry_tag}")
        ET.SubElement(item, f"{{{SITEMAP_NS}}}loc").text = url
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def prepare_tree(path: Path, prefix: str) -> None:
    """Prepare a release artifact locally, without executing any examples."""
    for page in sorted(path.rglob("*.html")):
        relative = page.relative_to(path).as_posix()
        if is_page(relative):
            page.write_bytes(patch_html(page.read_bytes(), prefix, relative))
    path.joinpath("sitemap.xml").write_bytes(sitemap(path.joinpath("sitemap.xml").read_bytes(), prefix))


class DocsBucket:
    """AWS CLI boundary that callers can replace in offline tests."""
    def __init__(self, system: System) -> None:
        self.system = system

    def call(self, *args: str) -> dict[str, Any]:
        output = self.system.run(join(["aws", "s3api", *args, "--region", REGION, "--output", "json"]), capture_stdout_only=True)
        return json.loads(output or "{}")

    def get(self, key: str, path: Path) -> dict[str, Any]:
        path.parent.mkdir(parents=True, exist_ok=True)
        return self.call("get-object", "--bucket", BUCKET, "--key", key, str(path))

    def check_current(self, key: str, metadata: dict[str, Any]) -> None:
        self.call("head-object", "--bucket", BUCKET, "--key", key, "--if-match", metadata["ETag"])

    def put(self, key: str, path: Path, metadata: dict[str, Any], content_type: str) -> None:
        request = {
            "Bucket": BUCKET,
            "Key": key,
            "IfMatch": metadata["ETag"],
            "ContentType": content_type,
            "CacheControl": "no-cache,max-age=0,must-revalidate",
        }
        self.call("put-object", "--cli-input-json", json.dumps(request), "--body", str(path))


def stable_version(switcher: bytes) -> str:
    entries = json.loads(switcher)
    preferred = [entry["version"] for entry in entries if entry.get("preferred") and not Version(entry["version"]).is_prerelease]
    if len(preferred) != 1:
        raise ValueError("Expected one preferred stable release in switcher.json")
    return preferred[0]


@dataclass(frozen=True)
class Publication:
    artifact_root: Path
    update_latest: bool
    release_prefix: str
    switcher_metadata: dict[str, Any]


def _update_sitemap_index(data: bytes, config: Config) -> bytes:
    """Align root sitemap discovery with the release's canonical URLs."""
    version = config.version
    index_root = ET.fromstring(data)
    if index_root.tag != f"{{{SITEMAP_NS}}}sitemapindex":
        raise ValueError("Expected root sitemap index")

    index_urls = set()
    for loc in index_root.findall(f"{{{SITEMAP_NS}}}sitemap/{{{SITEMAP_NS}}}loc"):
        parsed = urlsplit(loc.text or "")
        if parsed.hostname != "docs.bokeh.org" or not re.fullmatch(r"/en/[^/]+/sitemap.xml", parsed.path):
            raise ValueError(f"Unexpected sitemap index URL: {loc.text}")
        index_urls.add(SITE.rstrip("/") + parsed.path)

    if not config.prerelease:
        index_urls.add(SITE + "en/latest/sitemap.xml")
        index_urls.add(SITE + f"en/{version}/sitemap.xml")

    return xml_urls("sitemapindex", "sitemap", sorted(index_urls))


def _read_publication(config: Config, bucket: DocsBucket, work: Path) -> Publication:
    artifact_root = Path(f"deployment-{config.version}/docs/bokeh")
    switcher_metadata = bucket.get("switcher.json", work / "switcher.json")
    built_switcher = (artifact_root / "switcher.json").read_bytes()
    built_stable_version = stable_version(built_switcher)
    update_latest = not config.prerelease and Version(config.version) >= Version(built_stable_version)

    if config.prerelease:
        release_prefix = f"en/dev-{config.release_level}/"
    else:
        release_prefix = f"en/{config.version}/"

    return Publication(
        artifact_root=artifact_root,
        update_latest=update_latest,
        release_prefix=release_prefix,
        switcher_metadata=switcher_metadata,
    )


def prepare_release_artifact(publication: Publication, work: Path) -> Path | None:
    source = publication.artifact_root / "build/html"
    prepare_tree(source, publication.release_prefix)

    latest_source = None
    if publication.update_latest:
        latest_source = work / "latest"
        copytree(source, latest_source)
        prepare_tree(latest_source, "en/latest/")

    return latest_source


def prepare_root_sitemap(config: Config, bucket: DocsBucket, work: Path) -> tuple[Path, dict[str, Any]]:
    path = work / "sitemap_index.xml"
    metadata = bucket.get("sitemap_index.xml", path)
    path.write_bytes(_update_sitemap_index(path.read_bytes(), config))
    return path, metadata


def upload_release_artifact(config: Config, publication: Publication, system: System, latest_source: Path | None) -> None:
    source = publication.artifact_root / "build/html"
    flags = f"--only-show-errors --region {REGION}"
    cache = "--cache-control max-age=31536000,public"
    delete = "--delete " if config.prerelease else ""
    system.run(f"aws s3 sync {source} s3://{BUCKET}/{publication.release_prefix} {delete}{flags} {cache}")

    if latest_source is not None:
        system.run(f"aws s3 sync {latest_source} s3://{BUCKET}/en/latest/ --delete {flags} --cache-control max-age=604800,public")


def publish_release_metadata(config: Config, publication: Publication, bucket: DocsBucket, index_path: Path, index_metadata: dict[str, Any]) -> None:
    bucket.put("switcher.json", publication.artifact_root / "switcher.json", publication.switcher_metadata, "application/json")

    if not config.prerelease:
        bucket.put("sitemap_index.xml", index_path, index_metadata, "application/xml")


def invalidate_cdn(publication: Publication, system: System) -> None:
    paths = [f"/{publication.release_prefix}*", "/switcher.json", "/sitemap_index.xml"]
    if publication.update_latest:
        paths.append("/en/latest*")

    system.run(join([
        "aws", "cloudfront", "create-invalidation",
        "--distribution-id", CLOUDFRONT_ID,
        "--paths", *paths,
        "--region", REGION,
    ]))


def check_publication_state(config: Config, publication: Publication, bucket: DocsBucket, index_metadata: dict[str, Any]) -> None:
    """Reject stale control objects before starting any uploads."""
    bucket.check_current("switcher.json", publication.switcher_metadata)
    if not config.prerelease:
        bucket.check_current("sitemap_index.xml", index_metadata)


def publish_docs(config: Config, system: System) -> None:
    """Prepare self-canonical documentation, publish, and invalidate the CDN."""
    if system.dry_run:
        raise RuntimeError("Docs publishing requires published release state. Use preparation helpers for previews.")

    bucket = DocsBucket(system)
    with TemporaryDirectory(prefix="bokeh-docs-publication-") as directory:
        work = Path(directory)
        publication = _read_publication(config, bucket, work)
        latest_source = prepare_release_artifact(publication, work)
        index_path, index_metadata = prepare_root_sitemap(config, bucket, work)
        check_publication_state(config, publication, bucket, index_metadata)

        try:
            upload_release_artifact(config, publication, system, latest_source)
            publish_release_metadata(config, publication, bucket, index_path, index_metadata)
        except (OSError, RuntimeError, ValueError, KeyError) as error:
            # Uploads may have succeeded even when metadata publication failed.
            try:
                invalidate_cdn(publication, system)
            except RuntimeError as invalidation_error:
                raise RuntimeError(f"Publication failed: {error}. Invalidation also failed: {invalidation_error}. Rerun publish-docs.") from error
            raise RuntimeError(f"Publication may be partial: {error}. Rerun publish-docs to complete it.") from error

        invalidate_cdn(publication, system)
