from __future__ import annotations

# Standard library imports
import shutil
import subprocess
import sys
import sysconfig
from pathlib import Path

ROOT = Path(__file__).parents[1]
JUPYTER_ROOT = ROOT / "src" / "bokeh" / "jupyter"
JUPYTER_LABEXTENSION = JUPYTER_ROOT / "labextension"
JUPYTER_SERVER_CONFIG = JUPYTER_ROOT / "jupyter-config" / "jupyter_server_config.d" / "bokeh-jupyter.json"


def _install_jupyter(data_root: Path) -> None:
    '''Install the built Jupyter assets in a development environment.'''
    remote_entries = tuple((JUPYTER_LABEXTENSION / "static").glob("remoteEntry.*.js"))
    required = (
        JUPYTER_LABEXTENSION / "package.json",
        JUPYTER_LABEXTENSION / "install.json",
        JUPYTER_SERVER_CONFIG,
    )
    missing = [path for path in required if not path.is_file()]
    if not remote_entries:
        missing.append(JUPYTER_LABEXTENSION / "static" / "remoteEntry.*.js")
    if missing:
        paths = ", ".join(str(path.relative_to(ROOT)) for path in missing)
        raise RuntimeError(f"The first-party Jupyter extension has not been built. Missing: {paths}")

    destination = data_root / "share" / "jupyter" / "labextensions" / "@bokeh" / "bokeh-jupyter"
    if destination.is_symlink() or destination.is_file():
        destination.unlink()
    elif destination.exists():
        shutil.rmtree(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(JUPYTER_LABEXTENSION, destination)

    config = data_root / "etc" / "jupyter" / "jupyter_server_config.d" / "bokeh-jupyter.json"
    config.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(JUPYTER_SERVER_CONFIG, config)


def main() -> None:
    '''Install an editable Bokeh checkout and its Jupyter integration.'''
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "--no-deps", "-e", "."],
        cwd=ROOT,
        check=True,
    )
    data_root = sysconfig.get_path("data")
    if data_root is None:
        raise RuntimeError("Python did not report an installation data directory")
    # Setuptools editable wheels omit ``data_files``, so install the Jupyter
    # discovery files explicitly after pip has removed the previous package.
    _install_jupyter(Path(data_root))


if __name__ == "__main__":
    main()
