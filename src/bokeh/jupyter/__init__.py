''' Packaged frontend assets for Bokeh notebook integration. '''

from __future__ import annotations

# Standard library imports
from collections.abc import Awaitable
from typing import Any, cast

# External imports
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.nbconvert.handlers import NbconvertFileHandler
from jupyter_server.utils import url_path_join
from tornado import web

# Bokeh imports
from ..io.jupyter_export import (
    _reset_export_correlation,
    _set_export_correlation,
    _store_export_snapshots,
    _valid_export_id,
)

_PNG_PREPROCESSOR = "bokeh.io.jupyter_export.BokehPNGPreprocessor"
_MAX_TRANSIENT_EXPORT_BYTES = 50 * 1024 * 1024

class _ExportSnapshotsHandler(JupyterHandler):
    '''Receive in-memory BokehJS state for one UI-initiated export.'''

    @web.authenticated
    async def post(self) -> None:
        if len(self.request.body) > _MAX_TRANSIENT_EXPORT_BYTES:
            raise web.HTTPError(413, "Bokeh frontend export state exceeds the 50 MiB limit")
        body = self.get_json_body()
        if not isinstance(body, dict):
            raise web.HTTPError(400, "Expected a JSON object")
        path = body.get("path")
        export_id = body.get("export_id")
        snapshots = body.get("snapshots")
        if not isinstance(path, str) or not path.endswith(".ipynb"):
            raise web.HTTPError(400, "A notebook path ending in .ipynb is required")
        if not isinstance(snapshots, list) or len(snapshots) > 512:
            raise web.HTTPError(400, "snapshots must be an array with at most 512 entries")
        if not _valid_export_id(export_id):
            raise web.HTTPError(400, "A valid export_id correlation value is required")
        if any(not isinstance(snapshot, dict) for snapshot in snapshots):
            raise web.HTTPError(400, "Every snapshot must be an object")
        size = sum(
            len(value.encode("utf-8"))
            for snapshot in snapshots
            for key in ("artifact_json", "error")
            if isinstance((value := snapshot.get(key)), str)
        )
        if size > _MAX_TRANSIENT_EXPORT_BYTES:
            raise web.HTTPError(413, "Bokeh frontend export state exceeds the 50 MiB limit")

        os_path = None
        resolve_os_path = getattr(self.contents_manager, "_get_os_path", None)
        if callable(resolve_os_path):
            resolved_path = resolve_os_path(path)
            if isinstance(resolved_path, str):
                os_path = resolved_path
        _store_export_snapshots(path, export_id, snapshots, os_path=os_path)
        self.set_header("Cache-Control", "no-store")
        self.finish({"accepted": len(snapshots)})


class _CorrelatedNbconvertFileHandler(NbconvertFileHandler):
    '''Run nbconvert with the exact frontend snapshot correlation in context.'''

    async def get(self, format: str, path: str) -> None:
        export_id = self.get_argument("export_id", None)
        if not _valid_export_id(export_id):
            raise web.HTTPError(400, "A valid export_id correlation value is required")
        token = _set_export_correlation(export_id)
        try:
            await cast(Awaitable[Any], super().get(format, path))
        finally:
            _reset_export_correlation(token)

def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "labextension", "dest": "@bokeh/bokeh-jupyter"}]

def _jupyter_server_extension_points() -> list[dict[str, str]]:
    return [{"module": "bokeh.jupyter"}]

def _load_jupyter_server_extension(serverapp: Any) -> None:
    '''Enable export-only PNG capture for the server's HTML nbconvert route.'''
    configured = serverapp.config.HTMLExporter.preprocessors
    if isinstance(configured, list):
        if _PNG_PREPROCESSOR not in configured:
            configured.append(_PNG_PREPROCESSOR)
    else:
        configured = configured.get_value([])
        if _PNG_PREPROCESSOR not in configured:
            serverapp.config.HTMLExporter.preprocessors = [*configured, _PNG_PREPROCESSOR]
    web_app = getattr(serverapp, "web_app", None)
    if web_app is not None:
        route = url_path_join(web_app.settings.get("base_url", "/"), "bokeh-notebook", "export-snapshots")
        export_route = url_path_join(
            web_app.settings.get("base_url", "/"), "bokeh-notebook", "export", "(?P<format>[^/]+)", "(?P<path>.*)",
        )
        web_app.add_handlers(".*$", [
            (route, _ExportSnapshotsHandler),
            (export_route, _CorrelatedNbconvertFileHandler),
        ])
    serverapp.log.info("Bokeh HTML notebook export support enabled")
