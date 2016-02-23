import os
import pytest

from bokeh.io import output_file


@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    selenium.set_window_size(width=600, height=600)
    return selenium


@pytest.fixture(scope='session')
def base_url(request, file_server):
    return 'http://localhost:%s' % file_server.port


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


@pytest.fixture(scope="session")
def capabilities(capabilities):
    capabilities["browserName"] = "firefox"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities
