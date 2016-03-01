import os
import pytest

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
        metafunc.parametrize('browserName', ["firefox", "chrome", "internet explorer"], scope="session")


@pytest.fixture(scope="session")
def browserName():
    return "firefox"


@pytest.fixture(scope="session")
def capabilities(capabilities, browserName):
    capabilities["browserName"] = browserName
    capabilities["platform"] = "Windows 10"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities
