from __future__ import annotations

# Standard library imports
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from urllib.request import urlopen

# External imports
import nbformat
import pytest
from nbclient import NotebookClient
from traitlets.config import Config

# Bokeh imports
import bokeh
from bokeh.embed import embed
from bokeh.io.jupyter import (
    DISPLAY_MIME_TYPE,
    PROTOCOL_VERSION,
    RESOURCES_MIME_TYPE,
    display_payload,
)
from bokeh.io.jupyter_export import BokehHTMLExporter
from bokeh.plotting import figure
from tests.support.util.env import envset

pytestmark = pytest.mark.skipif(shutil.which("jupyter") is None, reason="Jupyter is not installed")
ROOT = Path(__file__).parents[2]


def _artifact_path(name: str) -> Path | None:
    directory = os.environ.get("BOKEH_NOTEBOOK_ARTIFACT_DIR")
    if not directory:
        return None
    path = Path(directory)
    if not path.is_absolute():
        path = ROOT / path
    path.mkdir(parents=True, exist_ok=True)
    return path / name


def _write_artifact(name: str, contents: str) -> None:
    if (path := _artifact_path(name)) is not None:
        path.write_text(contents)


def _screenshot_artifact(locator: Any, name: str) -> None:
    if (path := _artifact_path(name)) is not None:
        locator.screenshot(path=str(path))


def _project_environment() -> dict[str, str]:
    env = os.environ.copy()
    env.pop("JUPYTER_BOKEH_EXTERNAL_URL", None)
    env["BOKEH_DEV"] = "true"
    env["BOKEH_RESOURCES"] = "inline"
    source = ROOT / "src"
    if (source / "bokeh").is_dir():
        env["PYTHONPATH"] = str(source) + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
    return env


@pytest.mark.parametrize("relative", [
    "examples/output/jupyter/automatic_mime.ipynb",
    "examples/output/jupyter/static_resources.ipynb",
    "examples/output/jupyter/execution_order.ipynb",
    "examples/output/jupyter/diagnostics.ipynb",
])
def test_first_party_notebook_examples_execute(relative: str, tmp_path: Path) -> None:
    notebook = nbformat.read(str(Path(__file__).parents[2] / relative), as_version=4)
    NotebookClient(
        notebook,
        timeout=60,
        kernel_name="python3",
        resources={"metadata": {"path": str(tmp_path)}},
    ).execute(env=_project_environment())
    assert [
        output
        for cell in notebook.cells
        for output in cell.get("outputs", [])
        if output.get("output_type") == "error"
    ] == []


def test_executed_notebook_persists_artifact_protocol_without_legacy_records(tmp_path: Path) -> None:
    notebook = nbformat.v4.new_notebook(
        metadata={"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}},
        cells=[nbformat.v4.new_code_cell('''
from bokeh.plotting import figure
p = figure(width=280, height=180)
p.line([1, 2, 3], [3, 1, 2])
p
''')],
    )
    NotebookClient(
        notebook, timeout=60, kernel_name="python3", resources={"metadata": {"path": str(tmp_path)}},
    ).execute(env=_project_environment())
    outputs = notebook.cells[0].outputs
    display = next(output for output in outputs if DISPLAY_MIME_TYPE in output.get("data", {}))
    payload = display.data[DISPLAY_MIME_TYPE]
    html = display.data["text/html"]

    assert payload["protocol_version"] == PROTOCOL_VERSION
    assert payload["kind"] == "artifact"
    assert payload["source_kind"] == "standalone"
    assert html.count("data-bokeh-embed-payload") == 1
    assert "docs_json" not in html
    assert "render_items" not in payload
    assert all("application/vnd.bokeh.document+json" not in output.get("data", {}) for output in outputs)


def test_multi_display_embeds_resources_and_safe_saved_file_protocol(tmp_path: Path) -> None:
    notebook = nbformat.v4.new_notebook(
        metadata={"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}},
        cells=[
            nbformat.v4.new_code_cell('''
from bokeh.plotting import figure
p = figure(width=220, height=140); p.scatter([1, 2], [2, 1]); p
'''),
            nbformat.v4.new_code_cell('''
q = figure(width=220, height=140); q.line([1, 2], [1, 2]); q
'''),
            nbformat.v4.new_code_cell('''
from bokeh.io import save
save(q, "safe-output.html")
'''),
        ],
    )
    NotebookClient(
        notebook, timeout=60, kernel_name="python3", resources={"metadata": {"path": str(tmp_path)}},
    ).execute(env=_project_environment())
    outputs = [output for cell in notebook.cells for output in cell.outputs]
    resources = [output.data[RESOURCES_MIME_TYPE] for output in outputs if RESOURCES_MIME_TYPE in output.get("data", {})]
    display_outputs = [output for output in outputs if DISPLAY_MIME_TYPE in output.get("data", {})]
    displays = [output.data[DISPLAY_MIME_TYPE] for output in display_outputs]

    assert resources == []
    assert len(displays) == 2
    assert len({payload["resource_id"] for payload in displays}) == 1
    assert all(payload["resource_records"][-1]["payload"]["resource_id"] == payload["resource_id"] for payload in displays)
    assert all(
        all("javascript" not in record for record in payload["resource_records"])
        for payload in displays
    )
    assert all(
        output.data["text/html"].count("data-bokeh-notebook-resource-record") == len(payload["resource_records"])
        for output, payload in zip(display_outputs, displays)
    )
    file_output = notebook.cells[2].outputs[-1].data
    assert file_output["application/vnd.bokeh.file+json"]["path"] == "safe-output.html"


def test_nbconvert_export_captures_saved_artifact_with_real_playwright() -> None:
    pytest.importorskip("playwright.sync_api")
    artifact = embed(figure(width=260, height=160, title="exported-notebook-artifact"))
    output = nbformat.v4.new_output(
        "display_data",
        data={
            "text/html": artifact.fragment(resources="none").html,
            DISPLAY_MIME_TYPE: display_payload(artifact, "resources", "export-view"),
        },
    )
    cell = nbformat.v4.new_code_cell("plot", outputs=[output])
    cell.metadata["trusted"] = True
    notebook = nbformat.v4.new_notebook(cells=[cell])
    exporter = BokehHTMLExporter(config=Config({
        "BokehPNGPreprocessor": {"require_trusted": False, "timeout": 20},
    }))

    with envset(BOKEH_DEV="true"):
        html, _ = exporter.from_notebook_node(
            notebook, resources={"metadata": {"name": "export"}},
        )

    assert "<!DOCTYPE html>" in html
    assert 'data-bokeh-notebook-export-state="saved-notebook"' in html
    assert "data:image/png;base64,iVBOR" in html
    _write_artifact("notebook-export.html", html)


def _wait_for_server(base_url: str, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout is not None else ""
            raise AssertionError(f"Jupyter exited before startup:\n{output}")
        try:
            with urlopen(base_url, timeout=1):
                return
        except Exception:
            time.sleep(0.1)
    raise AssertionError("Jupyter did not start")


def _start_jupyter(tmp_path: Path, *, extension: bool, base_path: str = "/",
        allow_remote_access: bool = False, proxy: bool = True,
        resource_mode: str = "inline") -> tuple[subprocess.Popen[str], str, dict[str, str]]:
    env = _project_environment()
    env["BOKEH_RESOURCES"] = resource_mode
    data_dir = tmp_path / "jupyter-data"
    runtime_dir = tmp_path / "jupyter-runtime"
    config_dir = tmp_path / "jupyter-config"
    data_dir.mkdir()
    runtime_dir.mkdir()
    config_dir.mkdir()
    if extension:
        package = Path(bokeh.__file__).parent / "jupyter"
        target = data_dir / "labextensions" / "@bokeh" / "bokeh-jupyter"
        target.parent.mkdir(parents=True)
        shutil.copytree(package / "labextension", target)
        server_config = config_dir / "jupyter_server_config.d"
        server_config.mkdir()
        shutil.copy2(
            package / "jupyter-config" / "jupyter_server_config.d" / "bokeh-jupyter.json",
            server_config,
        )
    else:
        lab_config = data_dir / "labconfig"
        lab_config.mkdir()
        (lab_config / "page_config.json").write_text(json.dumps({
            "disabledExtensions": {"@bokeh/bokeh-jupyter": True},
        }))
        server_config = config_dir / "jupyter_server_config.d"
        server_config.mkdir()
        (server_config / "bokeh-jupyter.json").write_text(json.dumps({
            "ServerApp": {"jpserver_extensions": {"bokeh.jupyter": False}},
        }))
    if not proxy:
        (server_config / "jupyter-server-proxy.json").write_text(json.dumps({
            "ServerApp": {"jpserver_extensions": {"jupyter_server_proxy": False}},
        }))
    env.update({
        "IPYTHONDIR": str(tmp_path / "ipython"),
        "JUPYTER_CONFIG_DIR": str(config_dir),
        "JUPYTER_DATA_DIR": str(data_dir),
        "JUPYTER_RUNTIME_DIR": str(runtime_dir),
    })
    command = [
        sys.executable, "-m", "jupyterlab", "--no-browser",
        "--ServerApp.port=0", "--ServerApp.port_retries=0",
        "--ServerApp.token=", "--ServerApp.password=",
        f"--ServerApp.base_url={base_path}",
        f"--ServerApp.root_dir={tmp_path}",
    ]
    if allow_remote_access:
        command.append("--ServerApp.allow_remote_access=True")
    if not extension:
        command.append("--LabApp.core_mode=True")
    process = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout is not None else ""
            raise AssertionError(f"Jupyter exited before publishing its runtime file:\n{output}")
        for runtime_file in runtime_dir.glob("*.json"):
            try:
                port = json.loads(runtime_file.read_text()).get("port")
            except (OSError, ValueError):
                continue
            if isinstance(port, int) and port > 0:
                base_url = f"http://127.0.0.1:{port}{base_path.rstrip('/')}"
                _wait_for_server(f"{base_url}/", process)
                return process, base_url, env
        time.sleep(0.05)
    process.terminate()
    raise AssertionError("Jupyter did not publish a usable runtime file")


def _stop(process: subprocess.Popen[str]) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
    if process.stdout is not None:
        process.stdout.close()


def _execute_cell_once(page: Any, editors: Any, index: int, *, timeout: int = 30_000) -> None:
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

    cell = page.locator(".jp-CodeCell").nth(index)
    prompt = cell.locator(".jp-InputPrompt")
    previous = prompt.inner_text().strip()
    editors.nth(index).click()
    try:
        page.wait_for_function(
            """
            (index) => document.querySelectorAll(".jp-CodeCell")[index]?.classList.contains("jp-mod-active") === true
            """,
            arg=index,
            timeout=timeout,
        )
        page.wait_for_function(
            """
            () => document.querySelector(".jp-Notebook-ExecutionIndicator")?.textContent?.includes("Kernel status: Idle") === true
            """,
            timeout=timeout,
        )
        page.get_by_role("button", name="Run this cell and advance", exact=False).click(timeout=timeout)
        page.wait_for_function(
            """
            ({index, previous}) => {
              const cell = document.querySelectorAll(".jp-CodeCell")[index]
              const current = cell?.querySelector(".jp-InputPrompt")?.textContent?.trim()
              return current != null && current !== previous && !current.includes("*") && current !== "[ ]:"
            }
            """,
            arg={"index": index, "previous": previous},
            timeout=timeout,
        )
    except PlaywrightTimeoutError as error:
        state = cell.evaluate(
            """
            (cell) => ({
              prompt: cell.querySelector(".jp-InputPrompt")?.textContent?.trim() ?? null,
              classes: cell.className,
              output: cell.querySelector(".jp-OutputArea")?.textContent?.trim() ?? null,
            })
            """,
        )
        raise AssertionError(f"Jupyter cell {index} did not finish. State={state!r}") from error


def _wait_for_mounted_figure(page: Any) -> None:
    page.locator(
        ".bk-Figure, .bk-notebook-diagnostic, [data-bokeh-notebook-static-fallback]",
    ).first.wait_for(state="attached", timeout=30_000)
    diagnostics = page.locator(".bk-notebook-diagnostic")
    technical = diagnostics.first.locator("pre").text_content() if diagnostics.count() else ""
    assert diagnostics.count() == 0, f"{diagnostics.first.inner_text()}\n{technical}"
    assert page.locator(".bk-Figure").count() > 0, page.locator(".jp-OutputArea").first.inner_text()


def _wait_for_named_model(page: Any, name: str, *, title: str | None = None,
        server_session: bool | None = None) -> None:
    page.wait_for_function(
        """
        async ({name, title, serverSession}) => {
          for (const target of document.querySelectorAll("[data-bokeh-root]")) {
            const direct = target.bokehMount
            if (direct?.state !== "ready")
              continue
            const mount = await window.Bokeh.when_mounted(target)
            if (mount !== direct || mount.view_lookup == null)
              continue
            const model = mount.document.get_model_by_name(name)
            const ownsServerSession = mount.session != null
            if (model != null && (title == null || model.title?.text === title) &&
                (serverSession == null || ownsServerSession === serverSession))
              return true
          }
          return false
        }
        """,
        arg={"name": name, "title": title, "serverSession": server_session},
        timeout=30_000,
    )


def _wait_for_saved_output(path: Path, cell_index: int, mime_type: str) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            notebook = nbformat.read(path, as_version=4)
            if any(mime_type in output.get("data", {}) for output in notebook.cells[cell_index].get("outputs", [])):
                return
        except (OSError, ValueError):
            pass
        time.sleep(0.05)
    raise AssertionError(f"Jupyter did not save cell {cell_index} output containing {mime_type}")


def _browser_notebook() -> Any:
    return nbformat.v4.new_notebook(
        metadata={"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}},
        cells=[
            nbformat.v4.new_code_cell('''
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, DataTable, Slider, TableColumn
from bokeh.plotting import figure
p = figure(width=300, height=180); p.line([1, 2, 3], [3, 1, 2])
source = ColumnDataSource(data=dict(x=[1, 2], y=[3, 4]))
column(p, Slider(start=0, end=10, value=5), DataTable(source=source, columns=[TableColumn(field="x")]))
'''),
            nbformat.v4.new_code_cell('''
from bokeh.io import show
live = figure(width=300, height=180, name="notebook-live-plot"); live.line([1, 2], [1, 2]); handle = show(live)
print("live-ready")
'''),
            nbformat.v4.new_code_cell('''
live.title.text = "updated-once"
print("live-updated")
'''),
            nbformat.v4.new_code_cell('''
from bokeh.io import serve, show
from bokeh.models import Div
def modify_document(doc):
    doc.add_root(Div(text="application-mounted", name="notebook-app-root"))
app = serve(modify_document)
app_view = show(app)
print("application-view-ready")
'''),
            nbformat.v4.new_code_cell('''
print(f"application-sessions:{len(app.sessions)}")
'''),
        ],
    )


def _route_local_bokehjs(route: Any, *, delay_additive: bool = False) -> None:
    name = Path(urlsplit(route.request.url).path).name
    components = ("bokeh-widgets", "bokeh-tables", "bokeh")
    component = next((candidate for candidate in components if name.startswith(f"{candidate}-")), None)
    if component is None:
        route.abort()
        return
    if delay_additive and component != "bokeh":
        time.sleep(0.25)
    route.fulfill(
        path=str(Path(bokeh.__file__).parent / "server" / "static" / "js" / f"{component}.min.js"),
        content_type="application/javascript",
    )


def _fallback_recovery_notebook() -> Any:
    return nbformat.v4.new_notebook(
        metadata={"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}},
        cells=[
            nbformat.v4.new_code_cell('''
from bokeh.layouts import column
from bokeh.io import show
from bokeh.models import ColumnDataSource, DataTable, TableColumn
from bokeh.plotting import figure
source = ColumnDataSource(data=dict(x=[1], y=[2]))
table = DataTable(source=source, columns=[TableColumn(field="x")])
show(column(figure(width=240, height=140), table), resources="cdn")
'''),
            nbformat.v4.new_code_cell('''
show(figure(width=240, height=140), resources="inline")
'''),
        ],
    )


def test_jupyterlab_mount_lifecycle_live_update_rerun_and_reopen(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    extension = Path(bokeh.__file__).parent / "jupyter" / "labextension" / "package.json"
    if not extension.is_file():
        pytest.skip("the first-party Jupyter extension must be built")
    path = tmp_path / "lifecycle.ipynb"
    nbformat.write(_browser_notebook(), path)
    process, base_url, _env = _start_jupyter(tmp_path, extension=True)
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch()
            # Keep the application output attached while the following cell
            # observes its server session. A smaller default viewport lets
            # Jupyter virtualize the output and correctly dispose that view.
            page = browser.new_page(viewport={"width": 1440, "height": 1050})
            page.goto(f"{base_url}/lab/tree/lifecycle.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(3).wait_for(timeout=30_000)

            _execute_cell_once(page, editors, 0)
            _wait_for_mounted_figure(page)
            _execute_cell_once(page, editors, 1)
            page.get_by_text("live-ready", exact=True).wait_for(timeout=30_000)
            _execute_cell_once(page, editors, 2)
            page.get_by_text("live-updated", exact=True).wait_for(timeout=30_000)
            _wait_for_named_model(page, "notebook-live-plot", title="updated-once")
            _execute_cell_once(page, editors, 3)
            page.get_by_text("application-view-ready", exact=True).wait_for(timeout=30_000)
            _wait_for_named_model(page, "notebook-app-root", server_session=True)
            _execute_cell_once(page, editors, 4)
            page.get_by_text("application-sessions:1", exact=True).wait_for(timeout=30_000)

            # One intentional rerun replaces the cell output. The observation
            # wait never re-executes a cell as a retry.
            _execute_cell_once(page, editors, 0)
            _wait_for_mounted_figure(page)
            page.keyboard.press("ControlOrMeta+S")
            _wait_for_saved_output(path, 0, DISPLAY_MIME_TYPE)
            page.reload()
            _wait_for_mounted_figure(page)
            _wait_for_named_model(page, "notebook-live-plot", title="updated-once")
            _wait_for_named_model(page, "notebook-app-root", server_session=True)
            assert page.locator(".bk-notebook-diagnostic").count() == 0
            _screenshot_artifact(
                page.locator(".jp-CodeCell").nth(0).locator(".bk-Column"),
                "jupyterlab-static.png",
            )
            _screenshot_artifact(
                page.locator(".jp-CodeCell").nth(1).locator(".bk-Figure"),
                "jupyterlab-live.png",
            )
            _screenshot_artifact(
                page.locator(".jp-CodeCell").nth(3).locator(".bk-Div"),
                "jupyterlab-application.png",
            )
            browser.close()
    finally:
        _stop(process)


def test_jupyterlab_remote_application_discovers_proxy_without_notebook_url(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    pytest.importorskip("jupyter_server_proxy")
    extension = Path(bokeh.__file__).parent / "jupyter" / "labextension" / "package.json"
    if not extension.is_file():
        pytest.skip("the first-party Jupyter extension must be built")
    path = tmp_path / "proxied.ipynb"
    nbformat.write(_browser_notebook(), path)
    process, base_url, _env = _start_jupyter(
        tmp_path,
        extension=True,
        base_path="/user/test/",
        allow_remote_access=True,
    )
    remote_base_url = base_url.replace("127.0.0.1", "jupyter.test", 1)
    expected = urlsplit(remote_base_url)
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch(args=["--host-resolver-rules=MAP jupyter.test 127.0.0.1"])
            page = browser.new_page(viewport={"width": 1440, "height": 1050})
            page.goto(f"{remote_base_url}/lab/tree/proxied.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(3).wait_for(timeout=30_000)

            with page.expect_websocket(
                lambda websocket: "/bokeh-notebook/" in websocket.url,
                timeout=60_000,
            ) as websocket_info:
                _execute_cell_once(page, editors, 3, timeout=60_000)
                page.get_by_text("application-view-ready", exact=True).wait_for(timeout=30_000)
                _wait_for_named_model(page, "notebook-app-root", server_session=True)

            proxied = urlsplit(websocket_info.value.url)
            assert proxied.hostname == expected.hostname and proxied.port == expected.port
            assert proxied.path.startswith("/user/test/proxy/")
            browser.close()
    finally:
        _stop(process)


def test_extension_disabled_output_uses_portable_static_fallback(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    path = tmp_path / "disabled.ipynb"
    nbformat.write(_browser_notebook(), path)
    process, base_url, _env = _start_jupyter(tmp_path, extension=False, resource_mode="cdn")
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch()
            page = browser.new_page()
            page.route("https://cdn.bokeh.org/**", lambda route: _route_local_bokehjs(route, delay_additive=True))
            page.goto(f"{base_url}/lab/tree/disabled.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(3).wait_for(timeout=30_000)
            _execute_cell_once(page, editors, 0)
            output = page.locator(".jp-OutputArea").first
            output.locator(".jp-OutputArea-output").first.wait_for(state="attached", timeout=30_000)
            assert output.locator("[data-bokeh-notebook-static-fallback]").count() == 1, output.inner_html()
            output.get_by_text("Python-connected Bokeh output unavailable", exact=True).wait_for()
            output.get_by_text(
                "This notebook frontend is showing a standalone Bokeh view because it has not connected to "
                "Bokeh's notebook integration (as can happen in VS Code or when viewing static notebook output). "
                "Python-driven updates require a frontend with Bokeh's notebook integration enabled.",
                exact=True,
            ).wait_for()
            page.locator(".bk-DataTable").wait_for(timeout=30_000)
            assert page.locator(".bk-Figure").count() == 1
            assert page.locator(".bk-Slider").count() == 1
            assert page.locator(".bk-DataTable").count() == 1
            assert page.locator(".bk-notebook-diagnostic").count() == 0
            browser.close()
    finally:
        _stop(process)


def test_failed_portable_resources_do_not_block_later_outputs(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    path = tmp_path / "failed-resources.ipynb"
    nbformat.write(_fallback_recovery_notebook(), path)
    process, base_url, _env = _start_jupyter(tmp_path, extension=False)
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch()
            page = browser.new_page()
            blocked: list[Any] = []

            def route_resources(route: Any) -> None:
                name = Path(urlsplit(route.request.url).path).name
                if name.startswith("bokeh-tables-"):
                    blocked.append(route)
                else:
                    _route_local_bokehjs(route)

            page.route("https://cdn.bokeh.org/**", route_resources)
            page.goto(f"{base_url}/lab/tree/failed-resources.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(1).wait_for(timeout=30_000)

            with page.expect_request(
                lambda request: Path(urlsplit(request.url).path).name.startswith("bokeh-tables-"),
                timeout=30_000,
            ):
                _execute_cell_once(page, editors, 0)
            deadline = time.monotonic() + 30
            while not blocked and time.monotonic() < deadline:
                page.wait_for_timeout(50)
            assert len(blocked) == 1
            _execute_cell_once(page, editors, 1)
            first = page.locator(".jp-OutputArea").nth(0)
            second = page.locator(".jp-OutputArea").nth(1)
            first_fallback = first.locator("[data-bokeh-notebook-static-fallback]")
            first_fallback.wait_for(state="attached", timeout=30_000)
            second.locator("[data-bokeh-notebook-static-fallback]").wait_for(state="attached", timeout=30_000)
            page.wait_for_function(
                """
                () => {
                  const owners = [...document.querySelectorAll("meta[data-bokeh-notebook-resource]")]
                  return owners.length === 2 &&
                    owners.some((owner) => owner.dataset.bokehResourceState === "loading") &&
                    owners.some((owner) => owner.dataset.bokehResourceState === "loaded")
                }
                """,
                timeout=30_000,
            )
            page.wait_for_timeout(200)
            assert second.locator(".bk-Figure").count() == 0
            assert first_fallback.get_attribute("data-bokeh-resource-error") is None
            blocked[0].abort()
            page.wait_for_function(
                """
                () => document.querySelector(
                  ".jp-OutputArea [data-bokeh-notebook-static-fallback]",
                )?.dataset.bokehResourceError != null
                """,
                timeout=30_000,
            )
            error = first_fallback.get_attribute("data-bokeh-resource-error")
            assert error is not None and "bokeh-tables" in error
            assert first_fallback.get_by_text("Bokeh resources failed to load", exact=True).count() == 1
            second.locator(".bk-Figure").wait_for(timeout=30_000)
            browser.close()
    finally:
        _stop(process)


def test_local_application_connects_without_jupyter_server_proxy(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    extension = Path(bokeh.__file__).parent / "jupyter" / "labextension" / "package.json"
    if not extension.is_file():
        pytest.skip("the first-party Jupyter extension must be built")
    path = tmp_path / "direct-application.ipynb"
    nbformat.write(_browser_notebook(), path)
    process, base_url, _env = _start_jupyter(tmp_path, extension=True, proxy=False)
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1050})
            page.goto(f"{base_url}/lab/tree/direct-application.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(3).wait_for(timeout=30_000)

            _execute_cell_once(page, editors, 3, timeout=60_000)
            page.get_by_text("application-view-ready", exact=True).wait_for(timeout=30_000)
            _wait_for_named_model(page, "notebook-app-root", server_session=True)
            assert page.locator(".bk-notebook-diagnostic").count() == 0
            browser.close()
    finally:
        _stop(process)
