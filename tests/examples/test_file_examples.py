import json
import os
import pytest
import requests
import subprocess
import sys

from os.path import dirname, abspath, join, pardir, splitext, relpath, exists

from .utils import (
    get_version_from_git,
    run_example,
)


from ..conftest import s3
from ..utils import (
    fail,
    info,
    ok,
    red,
    warn,
    write,
    yellow,
)

__version__ = get_version_from_git()
base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))
default_diff = os.environ.get("BOKEH_DEFAULT_DIFF", None)


@pytest.mark.examples_new
@pytest.mark.parametrize("path", [
    "plotting/file/airports_map.py",
    "plotting/file/bollinger.py",
    "plotting/file/box_annotation.py",
    "plotting/file/boxplot.py",
    "plotting/file/brewer.py",
    "plotting/file/burtin.py",
    "plotting/file/candlestick.py",
    "plotting/file/categorical.py",
    "plotting/file/clustering.py",
    "plotting/file/color_scatter.py",
    "plotting/file/color_sliders.py",
    "plotting/file/custom_datetime_axis.py",
    "plotting/file/dynamic_map.py",
    "plotting/file/elements.py",
    "plotting/file/geojson_points.py",
    "plotting/file/glyphs.py",
    "plotting/file/grid.py",
    "plotting/file/histogram.py",
])
def test_color_scatter(path):
    example_path = join(example_dir, path)
    if run_example(example_path) == 0:
        result = _test_example(example_path)
        assert result
    else:
        assert False


def _test_example(example_path):
    no_ext = splitext(example_path)[0]

    html_file = "%s.html" % no_ext
    url = 'file://' + html_file

    png_file = "%s-%s.png" % (no_ext, __version__)

    cmd = ["phantomjs", join(base_dir, "test.js"), "file", url, png_file, "10"]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    result = json.loads(proc.stdout.read().decode("utf-8"))

    status = result['status']
    errors = result['errors']
    resources = result['resources']

    if status == 'fail':
        fail("failed to load %s" % url)
    else:
        resource_errors = False

        for resource in resources:
            url = resource['url']

            if url.endswith(".png"):
                fn, color = warn, yellow
            else:
                fn, color, resource_errors = fail, red, True

            fn("%s: %s (%s)" % (url, color(resource['status']), resource['statusText']))

        for error in errors:
            write(error['msg'])

            for item in error['trace']:
                write("    %s: %d" % (item['file'], item['line']))

        if resource_errors or errors:
            fail(example_path)
        else:
            if default_diff:
                example_path = relpath(splitext(example_path)[0], example_dir)
                ref_loc = join(default_diff, example_path + ".png")
                ref_url = join(s3, ref_loc)
                response = requests.get(ref_url)

                if not response.ok:
                    info("referece image %s doesn't exist" % ref_url)
                else:
                    ref_png_file = abspath(join(dirname(__file__), "refs", ref_loc))
                    diff_png_file = splitext(png_file)[0] + "-diff.png"

                    ref_png_path = dirname(ref_png_file)
                    if not exists(ref_png_path):
                        os.makedirs(ref_png_path)

                    with open(ref_png_file, "wb") as f:
                        f.write(response.content)

                    cmd = ["perceptualdiff", "-output", diff_png_file, png_file, ref_png_file]

                    try:
                        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                        code = proc.wait()
                    except OSError:
                        write("Failed to run: %s" % " ".join(cmd))
                        sys.exit(1)

                    if code != 0:
                        warn("generated and reference images differ")
                        warn("generated: " + png_file)
                        warn("reference: " + ref_png_file)
                        warn("diff: " + diff_png_file)

            ok(example_path)
            return True

    return False
