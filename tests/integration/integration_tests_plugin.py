import os
import pytest

from tests.plugins.utils import write, red
from bokeh.io import output_file


@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    selenium.set_window_size(width=1200, height=600)
    return selenium


@pytest.fixture(scope='session')
def base_url(request, file_server):
    return file_server.where_is('')


@pytest.fixture
def output_file_url(request, file_server):

    filename = request.function.__name__ + '.html'
    file_obj = request.fspath.dirpath().join(filename)
    file_path = file_obj.strpath

    output_file(file_path, mode='inline')

    def tearDown():
        if file_obj.isfile():
            file_obj.remove()
    request.addfinalizer(tearDown)

    return file_server.where_is(file_path)


def pytest_addoption(parser):
    parser.addoption("--cross-browser", action="store_true", default=False, help="Run tests against cross browser configuration")


def pytest_generate_tests(metafunc):
    if metafunc.config.option.cross_browser:
        if metafunc.config.option.driver != "SauceLabs":
            raise ValueError("--cross-browser only valid when used with --driver=SauceLabs")

        cross_browser_list = [
            {
                "browserName": "firefox",
                "platform": "Linux",
                "version": None
            },
            {
                "browserName": "chrome",
                "platform": "Linux",
                "version": None
            },
        ]
        metafunc.parametrize('cross_browser', cross_browser_list, scope="session")


@pytest.fixture(scope="session")
def cross_browser():
    # If version is None, latest will be used
    return {"browserName": "firefox", "platform": "Linux", "version": None}


@pytest.fixture(scope="session")
def capabilities(capabilities, cross_browser):
    capabilities["browserName"] = cross_browser["browserName"]
    capabilities["platform"] = cross_browser["platform"]
    if cross_browser["version"]:
        capabilities["version"] = cross_browser["version"]
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities
