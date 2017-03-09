import os
import pytest

from bokeh.io import output_file
from .screenshot import Screenshot, ScreenshotMismatchError


def pytest_addoption(parser):
    parser.addoption(
        "--set-new-base-screenshot", dest="set_new_base_screenshot", action="store_true", default=False,
        help="Use to set a new screenshot for imagediff testing. Be sure to only set for the tests you want by usign the -k pytest option to select your test.")


@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    selenium.set_window_size(width=1200, height=600)
    return selenium


@pytest.fixture
def output_file_url(request, file_server):
    filename = request.function.__name__ + '.html'
    file_obj = request.fspath.dirpath().join(filename)
    file_path = file_obj.strpath
    url = file_path.replace('\\', '/')  # Windows-proof

    output_file(file_path, mode='inline')

    def tearDown():
        if file_obj.isfile():
            file_obj.remove()
    request.addfinalizer(tearDown)

    return file_server.where_is(url)


def pytest_generate_tests(metafunc):
    # hasattr(metafunc.function, "foo") is like doing item.get_marker("foo")
    # This is ugly, but unfortunately there's not currently a better interface
    # https://github.com/pytest-dev/pytest/issues/1425
    if hasattr(metafunc.function, "cross_browser"):
        if metafunc.config.option.driver == "SauceLabs":
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
            metafunc.fixturenames.append('test_browser')
            metafunc.parametrize('test_browser', cross_browser_list, ids=["firefox", "chrome"])


@pytest.fixture()
def test_browser():
    # If version is None, latest will be used
    # Latest is Firefox 45 as of Dec 13, 2016
    return {"browserName": "firefox", "platform": "Linux", "version": None}


@pytest.fixture()
def capabilities(capabilities, test_browser):
    capabilities["browserName"] = test_browser["browserName"]
    capabilities["platform"] = test_browser["platform"]
    if test_browser["version"]:
        capabilities["version"] = test_browser["version"]
    return capabilities


@pytest.fixture(scope="session")
def session_capabilities(session_capabilities):
    session_capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return session_capabilities


@pytest.fixture
def screenshot(request):
    # Screenshot tests can only be run under the following circumstances:
    # - driver: SauceLabs
    # - capabilities: browserName: firefox
    # - capabilities: platform: linux
    # This helps ensure that screenshots are comparable.

    if request.config.option.driver != 'SauceLabs':
        pytest.skip('Screenshot tests can only be run with --driver=SauceLabs')

    capabilities = request.getfixturevalue('capabilities')
    if capabilities['browserName'] != 'firefox':
        pytest.skip('Screenshot tests can only be run with browserName firefox. Capabilties are: %s' % capabilities)
    if capabilities['platform'] != 'Linux':
        pytest.skip('Screenshot tests can only be run with platform linux. Capabilities are: %s' % capabilities)

    if request.config.option.set_new_base_screenshot:
        screenshot = Screenshot(request=request, set_new_base=True)
    else:
        screenshot = Screenshot(request=request, set_new_base=False)
    return screenshot


#
# Hook into the pytest report to add the screenshot diff
#


@pytest.mark.hookwrapper
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    # When executing the test failed for some reason
    if report.when == "call" and report.failed:

        if 'screenshot' in item.fixturenames and isinstance(call.excinfo.value, ScreenshotMismatchError):
            screenshot = Screenshot(item=item)
            pytest_html = item.config.pluginmanager.getplugin('html')
            diff = pytest_html.extras.image(screenshot.get_diff_as_base64(), '')
            base = pytest_html.extras.image(screenshot.get_base_as_base64(), '')
            test = pytest_html.extras.image(screenshot.get_current_as_base64(), '')
            # Override existing extra screenshot attr to add image reports
            report.extra = [test, diff, base]
