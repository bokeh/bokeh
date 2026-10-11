from __future__ import annotations

# Standard library imports
import json
from pathlib import Path
from unittest.mock import MagicMock

# External imports
import pytest

# Bokeh imports
from tools import dev_install


def test_install_jupyter_copies_built_assets(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    source = tmp_path / "source"
    labextension = source / "labextension"
    static = labextension / "static"
    static.mkdir(parents=True)
    (labextension / "package.json").write_text(json.dumps({"name": "@bokeh/bokeh-jupyter"}))
    (labextension / "install.json").write_text(json.dumps({"packageManager": "python"}))
    (static / "remoteEntry.hash.js").write_text("extension")
    server_config = source / "bokeh-jupyter.json"
    server_config.write_text(json.dumps({"ServerApp": {"jpserver_extensions": {"bokeh.jupyter": True}}}))
    monkeypatch.setattr(dev_install, "ROOT", source)
    monkeypatch.setattr(dev_install, "JUPYTER_LABEXTENSION", labextension)
    monkeypatch.setattr(dev_install, "JUPYTER_SERVER_CONFIG", server_config)

    data_root = tmp_path / "environment"
    destination = data_root / "share/jupyter/labextensions/@bokeh/bokeh-jupyter"
    destination.mkdir(parents=True)
    (destination / "stale.js").write_text("stale")

    dev_install._install_jupyter(data_root)

    assert json.loads((destination / "package.json").read_text()) == {"name": "@bokeh/bokeh-jupyter"}
    assert (destination / "static/remoteEntry.hash.js").read_text() == "extension"
    assert not (destination / "stale.js").exists()
    installed_config = data_root / "etc/jupyter/jupyter_server_config.d/bokeh-jupyter.json"
    assert json.loads(installed_config.read_text()) == {
        "ServerApp": {"jpserver_extensions": {"bokeh.jupyter": True}},
    }


def test_install_jupyter_requires_built_assets(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    source = tmp_path / "source"
    monkeypatch.setattr(dev_install, "ROOT", source)
    monkeypatch.setattr(dev_install, "JUPYTER_LABEXTENSION", source / "labextension")
    monkeypatch.setattr(dev_install, "JUPYTER_SERVER_CONFIG", source / "bokeh-jupyter.json")

    with pytest.raises(RuntimeError, match="has not been built"):
        dev_install._install_jupyter(tmp_path / "environment")


def test_main_installs_editable_before_jupyter(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    run = MagicMock()
    install_jupyter = MagicMock()
    monkeypatch.setattr(dev_install.subprocess, "run", run)
    monkeypatch.setattr(dev_install.sysconfig, "get_path", lambda _name: str(tmp_path))
    monkeypatch.setattr(dev_install, "_install_jupyter", install_jupyter)

    dev_install.main()

    run.assert_called_once_with(
        [dev_install.sys.executable, "-m", "pip", "install", "--no-deps", "-e", "."],
        cwd=dev_install.ROOT,
        check=True,
    )
    install_jupyter.assert_called_once_with(tmp_path)
