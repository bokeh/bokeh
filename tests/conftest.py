from __future__ import absolute_import, print_function

import boto
import os
import pytest
import requests
import subprocess
import sys
import time

from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from bokeh.io import output_file


from os.path import split, join, exists, isfile
from requests.exceptions import ConnectionError

from .constants import (
    example_dir, default_upload, s3, s3_bucket, build_id
)
from .utils import write  # , green, human_bytes
from .webserver import SimpleWebServer

pytest_plugins = "tests.examples.examples_report_plugin"


def pytest_addoption(parser):
    parser.addoption(
        "--upload", dest="upload", action="store_true", default=default_upload, help="upload test artefacts to S3"
    )


def pytest_sessionfinish(session, exitstatus):
    report_file = session.config.option.htmlpath
    if report_file:
        try_upload = session.config.option.upload
        report_ready = isfile(report_file)
        if try_upload and report_ready:
            try:
                conn = boto.connect_s3()
                bucket = conn.get_bucket(s3_bucket)
                upload = True
            except NoAuthHandlerFound:
                print("Upload was requested but could not connect to S3.")
                upload = False

            if upload is True:
                with open(report_file, "r") as f:
                    html = f.read()
                filename = join(build_id, report_file)
                key = S3Key(bucket, filename)
                key.set_metadata("Content-Type", "text/html")
                key.set_contents_from_string(html, policy="public-read")
                print("\n%s Access report at: %s" % ("---", join(s3, filename)))


@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    selenium.set_window_size(width=600, height=600)
    return selenium


@pytest.fixture(scope='session', autouse=True)
def file_server(request):
    server = SimpleWebServer()
    server.start()
    request.addfinalizer(server.stop)
    return server


@pytest.fixture(scope='session')
def base_url(request, file_server):
    return 'http://%s:%s' % (file_server.host, file_server.port)


@pytest.fixture
def output_file_url(request, base_url):

    filename = request.function.__name__ + '.html'
    file_obj = request.fspath.dirpath().join(filename)
    file_path = file_obj.strpath

    output_file(file_path, mode='inline')

    def tearDown():
        if file_obj.isfile():
            file_obj.remove()
    request.addfinalizer(tearDown)

    return '%s/%s' % (base_url, file_path)


@pytest.fixture(scope="session")
def capabilities(capabilities):
    capabilities["browserName"] = "firefox"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities


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
