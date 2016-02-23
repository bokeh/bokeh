import os
import pytest
import subprocess
import sys

from os.path import split

from tests.utils.utils import write

from .collect_examples import (
    get_file_examples,
    get_server_examples,
    get_notebook_examples,
    example_dir,
)


def pytest_generate_tests(metafunc):
    if 'file_example' in metafunc.fixturenames:
        examples = get_file_examples()
        metafunc.parametrize('file_example', examples)
    if 'server_example' in metafunc.fixturenames:
        examples = get_server_examples()
        metafunc.parametrize('server_example', examples)
    if 'notebook_example' in metafunc.fixturenames:
        examples = get_notebook_examples()
        metafunc.parametrize('notebook_example', examples)


@pytest.fixture(scope="session")
def jupyter_notebook_examples(request, jupyter_custom_js, log_file):
    notebook_port = pytest.config.option.notebook_port

    env = os.environ.copy()
    env['BOKEH_RESOURCES'] = 'inline'

    notebook_dir = split(example_dir)[0]

    cmd = ["jupyter", "notebook"]
    argv = ["--no-browser", "--port=%s" % notebook_port,
            "--notebook-dir=%s" % notebook_dir]

    try:
        proc = subprocess.Popen(cmd + argv, env=env, stdout=log_file, stderr=log_file)
    except OSError:
        write("Failed to run: %s" % " ".join(cmd + argv))
        sys.exit(1)

    # Add in the clean-up code
    def stop_jupyter_notebook():
        write("Shutting down jupyter-notebook ...")
        proc.kill()

    request.addfinalizer(stop_jupyter_notebook)

    return proc
