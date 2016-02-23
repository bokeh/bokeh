import os
import pytest
import requests
import subprocess
import signal

from os.path import (
    abspath,
    basename,
    dirname,
    exists,
    join,
    relpath,
    split,
    splitext,
)

from tests.plugins.upload_to_s3 import S3_URL
from tests.plugins.utils import (
    info,
    ok,
    warn,
    write,
)
from tests.plugins.image_diff import process_image_diff
from tests.plugins.selenium_screenshot import get_selenium_screenshot

from .collect_examples import example_dir
from .utils import (
    deal_with_output_cells,
    get_example_pngs,
    no_ext,
)


@pytest.mark.examples
def test_server_examples(selenium, server_example, bokeh_server, diff):
    # Note this is currently broken - server uses random sessions but we're
    # calling for "default" here - this has been broken for a while.
    # https://github.com/bokeh/bokeh/issues/3897
    url = '%s/?bokeh-session-id=%s' % (bokeh_server, basename(no_ext(server_example)))
    assert _run_example(server_example) == 0, 'Example did not run'
    _assert_snapshot(selenium, server_example, url, 'server', diff)
    if diff:
        _get_pdiff(server_example, diff)


@pytest.mark.examples
def test_notebook_examples(selenium, notebook_example, jupyter_notebook, diff):
    notebook_port = pytest.config.option.notebook_port
    url_path = join(*_get_path_parts(abspath(notebook_example)))
    url = 'http://localhost:%d/notebooks/%s' % (notebook_port, url_path)
    assert deal_with_output_cells(notebook_example), 'Notebook failed'
    _assert_snapshot(selenium, notebook_example, url, 'notebook', diff)
    if diff:
        _get_pdiff(notebook_example, diff)


@pytest.mark.examples
def test_file_examples(selenium, file_example, diff):
    html_file = "%s.html" % no_ext(file_example)
    url = 'file://' + html_file
    assert _run_example(file_example) == 0, 'Example did not run'
    _assert_snapshot(selenium, file_example, url, 'file', diff)
    if diff:
        _get_pdiff(file_example, diff)


def _get_pdiff(example, diff):
    test_png, ref_png, diff_png = get_example_pngs(example, diff)
    info("generated image: " + test_png)

    retrieved_reference_image = _get_reference_image_from_s3(example, diff)

    if retrieved_reference_image:
        ref_png_path = dirname(ref_png)
        if not exists(ref_png_path):
            os.makedirs(ref_png_path)

        with open(ref_png, "wb") as f:
            f.write(retrieved_reference_image)

        info("saved reference: " + ref_png)

        code = process_image_diff(diff_png, test_png, ref_png)
        if code != 0:
            warn("generated and reference images differ")
            warn("diff: " + diff_png)
        else:
            ok("generated and reference images match")


def _get_path_parts(path):
    parts = []
    while True:
        newpath, tail = split(path)
        parts.append(tail)
        path = newpath
        if tail == 'examples':
            break
    parts.reverse()
    return parts


def _assert_snapshot(selenium, example, url, example_type, diff):
    # Get setup datapoints

    screenshot_path, _, _ = get_example_pngs(example, diff)

    if example_type == 'notebook':
        wait = pytest.config.option.notebook_phantom_wait
        height = 2000
    else:
        wait = 1
        height = 1000

    get_selenium_screenshot(selenium, url, screenshot_path, wait, height=height)

    return True


def _get_reference_image_from_s3(example, diff):
    example_path = relpath(splitext(example)[0], example_dir)
    ref_loc = join(diff, example_path + ".png")
    ref_url = join(S3_URL, ref_loc)
    response = requests.get(ref_url)

    if not response.ok:
        info("reference image %s doesn't exist" % ref_url)
        return None
    return response.content


def _run_example(example):
    example_path = join(example_dir, example)

    code = """\
filename = '%s'

import random
random.seed(1)

import numpy as np
np.random.seed(1)

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
""" % example_path

    cmd = ["python", "-c", code]
    cwd = dirname(example_path)

    env = os.environ.copy()
    env['BOKEH_RESOURCES'] = 'relative'
    env['BOKEH_BROWSER'] = 'none'

    class Timeout(Exception):
        pass

    def alarm_handler(sig, frame):
        raise Timeout

    signal.signal(signal.SIGALRM, alarm_handler)
    signal.alarm(10)

    try:
        proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        try:
            def dump(f):
                for line in iter(f.readline, b""):
                    write(line.decode("utf-8"), end="")

            dump(proc.stdout)
            dump(proc.stderr)

            return proc.wait()
        except KeyboardInterrupt:
            proc.kill()
            raise
    except Timeout:
        warn("Timeout - Example timed out when attempting to run")
        proc.kill()
        return 0
    finally:
        signal.alarm(0)
