#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Export-only processing for Bokeh notebook artifacts.'''

from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

# Standard library imports
import base64
import io
import math
import os
import re
import threading
import time
from contextvars import ContextVar, Token
from html.parser import HTMLParser
from typing import Any, TypeGuard, cast

# External imports
from nbconvert.exporters import HTMLExporter
from nbconvert.preprocessors import Preprocessor
from nbformat.sign import NotebookNotary
from traitlets import Bool, Enum, Integer

# Bokeh imports
from ..embed.artifact import ArtifactValidationError, EmbedArtifact
from .export import ExportBackendType, _get_screenshot_as_png_from_html
from .jupyter import DISPLAY_MIME_TYPE, RESOURCES_MIME_TYPE
from .notebook import STATIC_FALLBACK_ATTRIBUTE, _static_fallback

_FALLBACK_RE = re.compile(
    rf'<div\b(?=[^>]*\b{STATIC_FALLBACK_ATTRIBUTE}(?:=(?:""|\'\'))?)[^>]*>.*?</div>',
    re.DOTALL,
)
_EXPORT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{16,128}$")


class _PngUnavailable(Exception):
    pass


class _ArtifactPayloadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.payload: list[str] | None = None
        self._collecting = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script" and any(name == "data-bokeh-artifact-payload" for name, _value in attrs):
            self.payload = []
            self._collecting = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._collecting = False

    def handle_data(self, data: str) -> None:
        if self._collecting and self.payload is not None:
            self.payload.append(data)


def _artifact_payload(html: str) -> str | None:
    parser = _ArtifactPayloadParser()
    parser.feed(html)
    return None if parser.payload is None else "".join(parser.payload)


_TRANSIENT_EXPORT_LOCK = threading.Lock()
_TRANSIENT_EXPORT_TTL = 60.0
_TRANSIENT_EXPORT_LIMIT = 32
_TRANSIENT_EXPORTS: list[tuple[float, set[str], str, dict[str, dict[str, Any]]]] = []
_EXPORT_CORRELATION_ID: ContextVar[str | None] = ContextVar("bokeh_notebook_export_id", default=None)


def _alias(path: str) -> str:
    return os.path.normcase(os.path.normpath(path))


def _valid_export_id(value: Any) -> TypeGuard[str]:
    return isinstance(value, str) and _EXPORT_ID_RE.fullmatch(value) is not None


def _set_export_correlation(export_id: str) -> Token[str | None]:
    if not _valid_export_id(export_id):
        raise ValueError("export_id must be a 16-128 character URL-safe correlation ID")
    return _EXPORT_CORRELATION_ID.set(export_id)


def _reset_export_correlation(token: Token[str | None]) -> None:
    _EXPORT_CORRELATION_ID.reset(token)


def _store_export_snapshots(path: str, export_id: str, snapshots: list[dict[str, Any]], *,
        os_path: str | None = None) -> None:
    '''Store bounded frontend state for exactly one correlated export request.'''
    if not _valid_export_id(export_id):
        raise ValueError("export_id must be a 16-128 character URL-safe correlation ID")
    aliases = {_alias(path)}
    if os_path is not None:
        aliases.add(_alias(os.path.abspath(os_path)))
    else:
        aliases.add(_alias(os.path.basename(path)))
    accepted: dict[str, dict[str, Any]] = {}
    for snapshot in snapshots:
        view_id = snapshot.get("view_id")
        artifact_json = snapshot.get("artifact_json")
        error = snapshot.get("error")
        if not isinstance(view_id, str) or not view_id:
            continue
        width = snapshot.get("width")
        if isinstance(artifact_json, str):
            record: dict[str, Any] = {"artifact_json": artifact_json}
            if isinstance(width, (int, float)) and math.isfinite(width) and 1 <= width <= 10000:
                record["width"] = round(width)
            accepted[view_id] = record
        elif isinstance(error, str):
            accepted[view_id] = {"error": error[:500]}

    now = time.monotonic()
    with _TRANSIENT_EXPORT_LOCK:
        _TRANSIENT_EXPORTS[:] = [
            entry for entry in _TRANSIENT_EXPORTS
            if now - entry[0] <= _TRANSIENT_EXPORT_TTL and entry[2] != export_id
        ]
        _TRANSIENT_EXPORTS.append((now, aliases, export_id, accepted))
        del _TRANSIENT_EXPORTS[:-_TRANSIENT_EXPORT_LIMIT]


def _take_export_snapshots(resources: dict[str, Any], export_id: str | None = None) -> dict[str, dict[str, Any]]:
    metadata = resources.get("metadata", {})
    name = metadata.get("name") if isinstance(metadata, dict) else None
    directory = metadata.get("path") if isinstance(metadata, dict) else None
    correlation = export_id or _EXPORT_CORRELATION_ID.get()
    if not isinstance(name, str) or not _valid_export_id(correlation):
        return {}
    filename = name if name.endswith(".ipynb") else f"{name}.ipynb"
    aliases = {_alias(filename)}
    if isinstance(directory, str):
        aliases.add(_alias(os.path.abspath(os.path.join(directory, filename))))

    now = time.monotonic()
    with _TRANSIENT_EXPORT_LOCK:
        _TRANSIENT_EXPORTS[:] = [entry for entry in _TRANSIENT_EXPORTS if now - entry[0] <= _TRANSIENT_EXPORT_TTL]
        for index in range(len(_TRANSIENT_EXPORTS) - 1, -1, -1):
            _created, entry_aliases, entry_id, snapshots = _TRANSIENT_EXPORTS[index]
            if entry_id == correlation and not entry_aliases.isdisjoint(aliases):
                del _TRANSIENT_EXPORTS[index]
                return snapshots
    return {}


class BokehPNGPreprocessor(Preprocessor):
    '''Replace trusted Bokeh artifact outputs with export-time PNG captures.'''

    require_trusted = Bool(
        True,
        config=True,
        help="Only execute Bokeh output from a notebook with a valid Jupyter trust signature.",
    )
    timeout = Integer(10, min=1, config=True, help="Seconds allowed for each PNG capture.")
    backend = Enum(
        values=["playwright"],
        default_value="playwright",
        config=True,
        help="Browser backend used for export-time PNG capture (Playwright only).",
    )
    max_bytes = Integer(10 * 1024 * 1024, min=1, config=True, help="Maximum embedded PNG size.")

    _trusted: bool
    _transient: dict[str, dict[str, Any]]

    def preprocess(self, nb: Any, resources: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
        # nbconvert does not guarantee that output_extension is populated
        # before exporter preprocessors run. This preprocessor is registered
        # only on HTML exporters, but retain the guard for explicit non-HTML
        # embedding by third-party callers.
        if resources.get("output_extension") not in {None, "", ".html", ".htm"}:
            return nb, resources
        self._trusted = (
            not self.require_trusted
            or self._server_marked_trusted(nb, resources)
            or self._check_signature(nb)
        )
        self._transient = _take_export_snapshots(resources)
        try:
            return super().preprocess(nb, resources)  # type: ignore[no-untyped-call]
        finally:
            del self._trusted
            del self._transient

    def preprocess_cell(self, cell: Any, resources: dict[str, Any], index: int) -> tuple[Any, dict[str, Any]]:
        del index
        if cell.get("cell_type") != "code":
            return cell, resources

        outputs = cell.get("outputs", [])
        remove: set[int] = set()
        for output_index, output in enumerate(outputs):
            data = output.get("data")
            if not isinstance(data, dict):
                continue
            if RESOURCES_MIME_TYPE in data:
                remove.add(output_index)
                continue

            metadata = output.get("metadata", {})
            payload = data.get(DISPLAY_MIME_TYPE)
            if not isinstance(payload, dict) and isinstance(metadata, dict):
                payload = metadata.get(DISPLAY_MIME_TYPE)
            if not isinstance(payload, dict) or payload.get("kind") != "artifact":
                continue
            view_id = payload.get("view_id")
            html = data.get("text/html")
            if not self._trusted:
                replacement = _static_fallback(
                    "This Bokeh output was not converted to PNG because the notebook is untrusted. "
                    "Trust and save the notebook, then export it again.",
                )
            elif payload.get("source_kind") == "server" and not (
                isinstance(view_id, str) and view_id in self._transient
            ):
                replacement = self._fallback_only(
                    html,
                    "This Bokeh application requires its running Python server for an offline export. "
                    "Export from the open notebook to capture its current frontend state.",
                )
            else:
                try:
                    replacement = self._capture(html, view_id)
                except _PngUnavailable as error:
                    self.log.warning("Bokeh PNG export unavailable: %s", error)
                    replacement = _static_fallback(str(error))
                except Exception as error:
                    self.log.warning("Bokeh PNG export failed", exc_info=True)
                    replacement = self._capture_failed(error)
            output["data"] = {"text/html": replacement}

        if remove:
            cell["outputs"] = [output for output_index, output in enumerate(outputs) if output_index not in remove]
        return cell, resources

    @staticmethod
    def _capture_failed(error: Exception) -> str:
        return _static_fallback(
            "This Bokeh output could not be converted to PNG during notebook export. "
            "Install Playwright and its Chromium browser, then export again. "
            f"The exporter reported {type(error).__name__}.",
        )

    def _capture(self, html: Any, view_id: Any) -> str:
        transient = self._transient.get(view_id) if isinstance(view_id, str) else None
        if transient is not None and "error" in transient:
            raise _PngUnavailable(
                "This Bokeh output's current frontend state could not be serialized for notebook export. "
                f"The frontend reported: {transient['error']}",
            )
        if transient is not None:
            artifact_json = transient.get("artifact_json")
            width = transient.get("width")
            source = "current-frontend"
        else:
            if not isinstance(html, str):
                raise _PngUnavailable("This Bokeh output has no embedding artifact available for PNG export.")
            artifact_json = _artifact_payload(html)
            if artifact_json is None:
                raise _PngUnavailable("This Bokeh output has no embedding artifact available for PNG export.")
            width = None
            source = "saved-notebook"
        if not isinstance(artifact_json, str):
            raise _PngUnavailable("This Bokeh output has no embedding artifact available for PNG export.")
        try:
            artifact = EmbedArtifact.from_json(
                artifact_json, _verify_fingerprint=source != "current-frontend",
            )
        except ArtifactValidationError as error:
            raise _PngUnavailable(f"This Bokeh output has an invalid embedding artifact: {error}") from error
        if artifact.source.get("kind") != "standalone":
            raise _PngUnavailable(
                "This Bokeh application has no current standalone frontend snapshot. "
                "Export from the open notebook while the application is connected.",
            )
        if not artifact.roots:
            raise _PngUnavailable("This Bokeh output has no rendered roots to capture during notebook export.")

        page = artifact.page(resources="inline")
        if isinstance(width, (int, float)) and 1 <= width <= 10000:
            page = page.replace("<body>", f'<body style="width:{round(width)}px">', 1)
        image = _get_screenshot_as_png_from_html(
            page, timeout=self.timeout, backend=cast(ExportBackendType, self.backend),
        )
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        png = buffer.getvalue()
        if not png or len(png) > self.max_bytes:
            raise _PngUnavailable(
                f"This Bokeh output's PNG exceeds the {self.max_bytes // (1024 * 1024)} MiB export limit.",
            )
        encoded = base64.b64encode(png).decode("ascii")
        return (
            f'<img data-bokeh-notebook-png-fallback="" data-bokeh-notebook-export-state="{source}" '
            f'src="data:image/png;base64,{encoded}" '
            f'width="{image.width}" height="{image.height}" alt="Static image of Bokeh output" '
            'style="display:block;max-width:100%;height:auto">'
        )

    def _check_signature(self, nb: Any) -> bool:
        notary: NotebookNotary | None = None
        try:
            notary = NotebookNotary(parent=self)  # type: ignore[no-untyped-call]
            return notary.check_signature(nb)  # type: ignore[no-untyped-call]
        except Exception:
            self.log.warning("Could not verify the notebook trust signature", exc_info=True)
            return False
        finally:
            if notary is not None:
                notary.close()  # type: ignore[no-untyped-call]

    @staticmethod
    def _server_marked_trusted(nb: Any, resources: dict[str, Any]) -> bool:
        if "config_dir" not in resources:
            return False
        output_cells = [
            cell for cell in nb.get("cells", [])
            if cell.get("cell_type") == "code" and cell.get("outputs")
        ]
        return bool(output_cells) and all(cell.get("metadata", {}).get("trusted") is True for cell in output_cells)

    @staticmethod
    def _fallback_only(html: Any, default: str) -> str:
        if isinstance(html, str):
            fallback = _FALLBACK_RE.search(html)
            if fallback is not None:
                return fallback.group(0)
        return _static_fallback(default)


class BokehHTMLExporter(HTMLExporter):
    '''HTML exporter with export-only Bokeh PNG capture enabled.'''

    export_from_notebook = "Bokeh static HTML"

    def _init_preprocessors(self) -> None:
        super()._init_preprocessors()  # type: ignore[no-untyped-call]
        self.register_preprocessor(BokehPNGPreprocessor, enabled=True)  # type: ignore[no-untyped-call]
