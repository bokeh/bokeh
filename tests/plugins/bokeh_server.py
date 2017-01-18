from __future__ import absolute_import, print_function

import pytest
import requests
import subprocess
import sys
import time


from requests.exceptions import ConnectionError

from .utils import write


def pytest_addoption(parser):
    parser.addoption(
        "--bokeh-port", dest="bokeh_port", type=int, default=5006, help="port on which Bokeh server resides"
    )


@pytest.fixture(scope='session')
def bokeh_server(request, log_file):
    bokeh_port = pytest.config.option.bokeh_port

    cmd = ["python", "-m", "bokeh", "serve"]
    argv = ["--port=%s" % bokeh_port]
    bokeh_server_url = 'http://localhost:%s' % bokeh_port

    try:
        proc = subprocess.Popen(cmd + argv, stdout=log_file, stderr=log_file)
    except OSError:
        write("Failed to run: %s" % " ".join(cmd + argv))
        sys.exit(1)
    else:
        # Add in the clean-up code
        def stop_bokeh_server():
            write("Shutting down bokeh-server ...")
            proc.kill()
        request.addfinalizer(stop_bokeh_server)

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
                    return requests.get(bokeh_server_url)
                except ConnectionError:
                    return False

            return wait_until(helper)

        if not wait_for_bokeh_server():
            write("Timeout when running: %s" % " ".join(cmd + argv))
            sys.exit(1)

        if proc.returncode is not None:
            write("bokeh server exited with code " + str(proc.returncode))
            sys.exit(1)

        return bokeh_server_url
