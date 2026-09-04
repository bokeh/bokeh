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
from urllib.request import urlopen

# External imports
import nbformat
import pytest
from nbclient import NotebookClient

# Bokeh imports
import bokeh
from bokeh.io.jupyter import DISPLAY_MIME_TYPE, PROTOCOL_VERSION, RESOURCES_MIME_TYPE

pytestmark = pytest.mark.skipif(shutil.which("jupyter") is None, reason="Jupyter is not installed")
ROOT = Path(__file__).parents[2]


def _project_environment() -> dict[str, str]:
    env = os.environ.copy()
    env["BOKEH_RESOURCES"] = "inline"
    source = ROOT / "src"
    if source.is_dir():
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
    assert html.count("data-bokeh-artifact-payload") == 1
    assert "docs_json" not in html
    assert "render_items" not in json.dumps(payload)
    assert all("application/vnd.bokeh.document+json" not in output.get("data", {}) for output in outputs)


def test_multi_display_resource_dedup_and_safe_saved_file_protocol(tmp_path: Path) -> None:
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
    displays = [output.data[DISPLAY_MIME_TYPE] for output in outputs if DISPLAY_MIME_TYPE in output.get("data", {})]

    assert len(resources) == 1
    assert len(displays) == 2
    assert len({payload["resource_id"] for payload in displays}) == 1
    file_output = notebook.cells[2].outputs[-1].data
    assert file_output["application/vnd.bokeh.file+json"]["path"] == "safe-output.html"


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


def _start_jupyter(tmp_path: Path, *, extension: bool) -> tuple[subprocess.Popen[str], str, dict[str, str]]:
    env = _project_environment()
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
        f"--ServerApp.root_dir={tmp_path}",
    ]
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
                base_url = f"http://127.0.0.1:{port}"
                _wait_for_server(base_url, process)
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


def _execute_cell_once(page: Any, editors: Any, index: int) -> None:
    cell = page.locator(".jp-CodeCell").nth(index)
    prompt = cell.locator(".jp-InputPrompt")
    previous = prompt.inner_text().strip()
    editors.nth(index).click()
    page.keyboard.press("Shift+Enter")
    page.wait_for_function(
        """
        ({index, previous}) => {
          const cell = document.querySelectorAll(".jp-CodeCell")[index]
          const current = cell?.querySelector(".jp-InputPrompt")?.textContent?.trim()
          return current != null && current !== previous && !current.includes("*") && current !== "[ ]:"
        }
        """,
        arg={"index": index, "previous": previous},
        timeout=30_000,
    )


def _wait_for_mounted_figure(page: Any) -> None:
    page.locator(
        ".bk-Figure, .bk-notebook-diagnostic, [data-bokeh-notebook-static-fallback]",
    ).first.wait_for(state="attached", timeout=30_000)
    diagnostics = page.locator(".bk-notebook-diagnostic")
    assert diagnostics.count() == 0, diagnostics.first.inner_text()
    assert page.locator(".bk-Figure").count() > 0, page.locator(".jp-OutputArea").first.inner_text()


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
from bokeh.plotting import figure
p = figure(width=300, height=180); p.line([1, 2, 3], [3, 1, 2]); p
'''),
            nbformat.v4.new_code_cell('''
from bokeh.io import show
live = figure(width=300, height=180); live.line([1, 2], [1, 2]); handle = show(live)
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
            page = browser.new_page()
            page.goto(f"{base_url}/lab/tree/lifecycle.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(4).wait_for(timeout=30_000)

            _execute_cell_once(page, editors, 0)
            _wait_for_mounted_figure(page)
            _execute_cell_once(page, editors, 1)
            page.get_by_text("live-ready", exact=True).wait_for(timeout=30_000)
            _execute_cell_once(page, editors, 2)
            page.get_by_text("live-updated", exact=True).wait_for(timeout=30_000)
            page.wait_for_function("""
                () => Object.values(window.Bokeh?.index ?? {}).some((view) => view.model?.title?.text === "updated-once")
            """, timeout=30_000)
            _execute_cell_once(page, editors, 3)
            page.get_by_text("application-view-ready", exact=True).wait_for(timeout=30_000)
            page.wait_for_function("""
                () => Object.values(window.Bokeh?.index ?? {}).some((view) => view.model?.name === "notebook-app-root")
            """, timeout=30_000)
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
            page.wait_for_function("""
                () => Object.values(window.Bokeh?.index ?? {}).some((view) => view.model?.title?.text === "updated-once")
            """, timeout=30_000)
            page.wait_for_function("""
                () => Object.values(window.Bokeh?.index ?? {}).some((view) => view.model?.name === "notebook-app-root")
            """, timeout=30_000)
            assert page.locator(".bk-notebook-diagnostic").count() == 0
            browser.close()
    finally:
        _stop(process)


def test_extension_disabled_output_uses_portable_static_fallback(tmp_path: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    path = tmp_path / "disabled.ipynb"
    nbformat.write(_browser_notebook(), path)
    process, base_url, _env = _start_jupyter(tmp_path, extension=False)
    try:
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch()
            page = browser.new_page()
            page.goto(f"{base_url}/lab/tree/disabled.ipynb")
            editors = page.locator(".jp-CodeCell .cm-content")
            editors.nth(4).wait_for(timeout=30_000)
            _execute_cell_once(page, editors, 0)
            output = page.locator(".jp-OutputArea").first
            output.locator(".jp-OutputArea-output").first.wait_for(state="attached", timeout=30_000)
            assert output.locator("[data-bokeh-notebook-static-fallback]").count() == 1, output.inner_html()
            assert page.locator(".bk-Figure").count() == 1
            assert page.locator(".bk-notebook-diagnostic").count() == 0
            browser.close()
    finally:
        _stop(process)
