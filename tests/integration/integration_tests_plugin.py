import os
import pytest

from bokeh.io import output_file
from .screenshot import Screenshot


def pytest_addoption(parser):
    parser.addoption(
        "--set-new-base-screenshot", dest="set_new_base_screenshot", action="store_true", default=False, help="Use to set a new screenshot for imagediff testing. Be sure to only set for the tests you want by usign the -k pytest option to select your test."
    )


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


@pytest.fixture(scope="session")
def capabilities(capabilities):
    capabilities["browserName"] = "chrome"
    capabilities["platform"] = "Linux"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities


@pytest.fixture
def screenshot(request):
    # Screenshot tests can only be run under the following circumstances:
    # - driver: SauceLabs
    # - capabilities: browserName: firefox
    # - capabilities: platform: linux
    # This helps ensure that screenshots are comparable.

    if request.config.option.driver != 'SauceLabs':
        pytest.skip('Screenshot tests can only be run with --driver=SauceLabs')

    capabilities = request.getfuncargvalue('capabilities')
    if capabilities['browserName'] != 'firefox':
        pytest.skip('Screenshot tests can only be run with browserName firefox. Capabilties are: %s' % capabilities)
    if capabilities['platform'] != 'Linux':
        pytest.skip('Screenshot tests can only be run with platform linux. Capabilities are: %s' % capabilities)

    if request.config.option.set_new_base_screenshot:
        screenshot = Screenshot(request=request, set_new_base=True)
    else:
        screenshot = Screenshot(request=request, set_new_base=False)
    return screenshot
