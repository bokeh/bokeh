from __future__ import absolute_import, print_function

import pytest

from bokeh.io import output_file

from .webserver import SimpleWebServer
from .screenshot import Screenshot


#
# Fixtures for use in tests
#

@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    return selenium


@pytest.fixture(scope='session', autouse=True)
def server(request):
    server = SimpleWebServer()
    server.start()
    request.addfinalizer(server.stop)
    return server


@pytest.fixture(scope='session')
def base_url(request, server):
    return 'http://%s:%s' % (server.host, server.port)


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


@pytest.fixture
def screenshot(request):
    return Screenshot(request=request)


#
# Hook into the pytest report to add the screnshot diff
#

@pytest.mark.hookwrapper
def pytest_runtest_makereport(item, call):
    outcome = yield

    # Only run through this at the end of the test
    if call.when != 'call':
        return

    # Don't continue if this isn't a base_screenshot test
    if 'screenshot' not in item.fixturenames:
        return

    # Don't add screenshots if we can't create a screenshot
    try:
        screenshot = Screenshot(item=item)
    except AssertionError:
        return

    report = outcome.get_result()
    xfail = hasattr(report, 'wasxfail')
    failure = (report.skipped and xfail) or (report.failed and not xfail)
    pytest_html = item.config.pluginmanager.getplugin('html')
    extra = getattr(report, 'extra', [])

    # Don't add screenshots if test passed
    if not failure:
        return

    if screenshot.base_screenshot is not None:
        extra.append(pytest_html.extras.image(screenshot.get_diff(), 'Diff'))
        extra.append(pytest_html.extras.image(screenshot.base_screenshot_as_b64, 'Base'))
        report.extra = extra

    else:
        # Set a new base screenshot if it wasn't available
        screenshot.set_base_screenshot()
