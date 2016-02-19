import argparse
import os
from os.path import join, dirname, pardir, abspath
from .utils import detect_examples


def pytest_addoption(parser):
    default_timeout = int(os.environ.get("BOKEH_DEFAULT_TIMEOUT", 10))
    default_diff = os.environ.get("BOKEH_DEFAULT_DIFF", None)
    default_upload = default_diff is not None

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
        "--log-file", type=argparse.FileType('w'), default='examples.log', help="where to write the complete log"
    )
    parser.addoption(
        "--diff", type=str, default=default_diff, help="compare generated images against this ref"
    )
    parser.addoption(
        "--upload", dest="upload", action="store_true", default=default_upload, help="upload generated images as reference images to S3"
    )


base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))


def pytest_generate_tests(metafunc):
    print(metafunc.config.option)
    if 'example' in metafunc.fixturenames:
        all_notebooks = metafunc.config.option.all_notebooks
        all_examples = detect_examples(example_dir, all_notebooks)
        metafunc.parametrize("example", all_examples)
