from __future__ import absolute_import, print_function
import base64
import pytest
from io import BytesIO
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFont

from bokeh.io import output_file

from .webserver import SimpleWebServer


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
def base_screenshot(request):
    base_screenshot_path = _get_screenshot_path(request)
    try:
        with open(base_screenshot_path.strpath, 'rb') as f:
            screenshot = f.read()
    except IOError:
        screenshot = None
    return screenshot


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
    if 'base_screenshot' not in item.fixturenames:
        return

    # Don't add screenshots if it's not a selenium test
    driver = getattr(item, '_driver', None)
    if driver is None:
        return

    report = outcome.get_result()
    xfail = hasattr(report, 'wasxfail')
    failure = (report.skipped and xfail) or (report.failed and not xfail)

    # Don't add screenshots if test passed
    if not failure:
        return

    base_screenshot_path = _get_screenshot_path(item)
    if base_screenshot_path.isfile():
        # Get diff
        base_screenshot = Image.open(base_screenshot_path.strpath)
        test_screenshot = Image.open(BytesIO(driver.get_screenshot_as_png()))
        diff = ImageChops.difference(
            base_screenshot.convert('RGB'),
            test_screenshot.convert('RGB')
        )
        # Pretty up the diff image and add a text note
        diff = ImageOps.invert(diff)
        diff = diff.convert('L')
        draw = ImageDraw.Draw(diff)
        font = ImageFont.truetype("Arial.ttf", 36)
        draw.text((20, 20), "Expected (left)  --- Diff ---  Actual (right)", (0, 0, 0), font=font)
        del draw

        # Add the diff and base image to report (note the result image is
        # already added to the report by pytest_selenium)
        _add_image_to_report(item, report, diff, 'Diff')
        _add_image_to_report(item, report, base_screenshot, 'Base')

    else:
        # Set a new base screenshot if it wasn't available
        driver.get_screenshot_as_file(base_screenshot_path.strpath)


#
# Utils for the screenshot diff tests
#

def _get_screenshot_path(item):
    # Get screenshot path
    screenshot_dir = item.fspath.dirpath().join('screenshots')
    screenshot_dir.ensure_dir()
    test_file = item.fspath.basename.split('.py')[0]
    test_name = item.function.__name__
    base_screenshot_path = screenshot_dir.join(test_file + '__' + test_name + '__base.png')
    return base_screenshot_path


def _add_image_to_report(item, report, image, label):
    pytest_html = item.config.pluginmanager.getplugin('html')
    extra = getattr(report, 'extra', [])
    b64 = base64.b64encode(image._repr_png_()).decode("utf-8")  # noqa
    extra.append(pytest_html.extras.image(b64, label))
    report.extra = extra
