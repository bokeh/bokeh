#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.ipython",
    "bokeh._testing.plugins.managed_server_loop",
    "bokeh._testing.plugins.networkx",
    "bokeh._testing.plugins.pandas",
)

# Standard library imports
from inspect import iscoroutinefunction
from typing import List

# External imports
import _pytest
import pytest


def pytest_collection_modifyitems(items: List[_pytest.nodes.Item]) -> None:
    for item in items:
        if iscoroutinefunction(item.obj):
            item.add_marker(pytest.mark.asyncio)

# Unfortunately these seem to all need to be centrally defined at the top level
def pytest_addoption(parser: _pytest.config.argparsing.Parser) -> None:

    # plugins/selenium
    parser.addoption(
        "--driver", choices=('chrome', 'firefox', 'safari'), default='chrome', help='webdriver implementation')

    # plugins/bokeh_server
    parser.addoption(
        "--bokeh-port", dest="bokeh_port", type=int, default=5006, help="port on which Bokeh server resides"
    )

    # plugins/jupyter_notebook
    parser.addoption(
        "--notebook-port", type=int, default=6007, help="port on which Jupyter Notebook server resides"
    )

    parser.addoption(
        "--examples-log-file", dest="log_file", metavar="path", action="store", default='examples.log', help="where to write the complete log"
    )
    parser.addoption(
        "--no-js", action="store_true", default=False,
        help="only run python code and skip js")
