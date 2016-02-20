import os
import pytest
import requests
import subprocess
import sys
import time

from os.path import split, join, exists
from requests.exceptions import ConnectionError

from .constants import example_dir, default_timeout, default_diff, default_upload
from .collect_examples import get_file_examples, get_server_examples, get_notebook_examples
from ..utils import write


def pytest_generate_tests(metafunc):
    all_notebooks = metafunc.config.option.all_notebooks
    if 'file_example' in metafunc.fixturenames:
        examples = get_file_examples(all_notebooks)
        metafunc.parametrize('file_example', examples)
    if 'server_example' in metafunc.fixturenames:
        examples = get_server_examples(all_notebooks)
        metafunc.parametrize('server_example', examples)
    if 'notebook_example' in metafunc.fixturenames:
        examples = get_notebook_examples(all_notebooks)
        metafunc.parametrize('notebook_example', examples)


@pytest.fixture(scope='session')
def patterns(request):
    return request.config.getoption("--patterns")


@pytest.fixture(scope='session')
def timeout(request):
    return request.config.getoption("--timeout")


@pytest.fixture(scope='session')
def notebook_port(request):
    return request.config.getoption("--notebook-port")


@pytest.fixture(scope='session')
def bokeh_port(request):
    return request.config.getoption("--bokeh-port")


@pytest.fixture(scope='session')
def phantomjs(request):
    return request.config.getoption("--phantomjs")


@pytest.fixture(scope='session')
def output_cells(request):
    return request.config.getoption("--output-cells")


@pytest.yield_fixture(scope='session')
def log_file(request):
    file_name = request.config.getoption("--log-file")
    with open(file_name, 'w') as f:
        yield f


@pytest.fixture(scope='session')
def diff(request):
    return request.config.getoption("--diff")


@pytest.fixture(scope='session')
def upload(request):
    return request.config.getoption("--upload")


@pytest.fixture(scope='session')
def verbose(request):
    return request.config.getoption("--verbose")


def pytest_addoption(parser):

    parser.addoption(
        "--patterns", type=str, nargs="*", help="select a subset of examples to test"
    )
    parser.addoption(
        "--bokeh-port", type=int, default=5006, help="port on which Bokeh server resides"
    )
    parser.addoption(
        "--notebook-port", type=int, default=6007, help="port on which Jupyter Notebook server resides"
    )
    parser.addoption(
        "--phantomjs", type=str, default="phantomjs", help="phantomjs executable"
    )
    parser.addoption(
        "--timeout", type=int, default=default_timeout, help="how long can an example run (in seconds)"
    )
    parser.addoption(
        "--all-notebooks", action="store_true", default=False, help="test all the notebooks inside examples/plotting/notebook folder."
    )
    parser.addoption(
        "--output-cells", type=str, choices=['complain', 'remove', 'ignore'], default='complain', help="what to do with notebooks' output cells"
    )
    parser.addoption(
        "--log-file", default='examples.log', help="where to write the complete log"
    )
    parser.addoption(
        "--diff", type=str, default=default_diff, help="compare generated images against this ref"
    )
    parser.addoption(
        "--upload", dest="upload", action="store_true", default=default_upload, help="upload generated images as reference images to S3"
    )


@pytest.fixture(scope='session')
def bokeh_server(request, bokeh_port, log_file):
    cmd = ["bin/bokeh", "serve"]
    argv = ["--port=%s" % bokeh_port]

    try:
        proc = subprocess.Popen(cmd + argv, stdout=log_file, stderr=log_file)
    except OSError:
        write("Failed to run: %s" % " ".join(cmd + argv))
        sys.exit(1)

    else:
        def wait_until(func, timeout=5.0, interval=0.01):
            start = time.time()

            while True:
                if func():
                    return True
                if time.time() - start > timeout:
                    return False
                time.sleep(interval)

        def wait_for_bokeh_server():
            def helper():
                if proc.returncode is not None:
                    return True
                try:
                    return requests.get('http://localhost:%s/' % bokeh_port)
                except ConnectionError:
                    return False

            return wait_until(helper)

        if not wait_for_bokeh_server():
            write("Timeout when running: %s" % " ".join(cmd + argv))
            sys.exit(1)

        if proc.returncode is not None:
            write("bokeh server exited with code " + str(proc.returncode))
            sys.exit(1)

        # Add in the clean-up code
        def stop_bokeh_server():
            write("Shutting down bokeh-server ...")
            proc.kill()

        request.addfinalizer(stop_bokeh_server)

        return proc


def create_custom_js():
    from jupyter_core import paths
    config_dir = paths.jupyter_config_dir()

    body = """
require(["base/js/namespace", "base/js/events"], function (IPython, events) {
    events.on("kernel_ready.Kernel", function () {
        IPython.notebook.execute_all_cells();
    });
});
"""

    custom = join(config_dir, "custom")
    if not exists(custom):
        os.makedirs(custom)

    customjs = join(custom, "custom.js")
    with open(customjs, "w") as f:
        f.write(body)


@pytest.fixture(scope="session")
def jupyter_notebook(request, notebook_port, log_file):
    #First create the customjs to run the notebook
    create_custom_js()

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
