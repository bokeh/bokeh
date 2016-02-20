from __future__ import absolute_import, print_function

import boto
import os
import pytest

from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from bokeh.io import output_file
from os.path import isfile, join
from .webserver import SimpleWebServer
from ..constants import s3, s3_bucket, build_id


def pytest_sessionfinish(session, exitstatus):
    report_file = session.config.option.htmlpath
    try_upload = os.environ.get("UPLOAD_PYTEST_HTML", "False") == "True"
    report_ready = isfile(report_file)
    if try_upload and report_ready:
        try:
            conn = boto.connect_s3()
            bucket = conn.get_bucket(s3_bucket)
            upload = True
        except NoAuthHandlerFound:
            print("Upload was requested but could not connect to S3.")
            upload = False

        if upload is True:
            with open(report_file, "r") as f:
                html = f.read()
            filename = join(build_id, "report.html")
            key = S3Key(bucket, filename)
            key.set_metadata("Content-Type", "text/html")
            key.set_contents_from_string(html, policy="public-read")
            print("\n%s Access report at: %s" % ("---", join(s3, filename)))


@pytest.fixture
def selenium(selenium):
    # Give items a chance to load
    selenium.implicitly_wait(10)
    selenium.set_window_size(width=600, height=600)
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


@pytest.fixture(scope="session")
def capabilities(capabilities):
    capabilities["browserName"] = "firefox"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities
