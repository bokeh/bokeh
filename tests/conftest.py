from __future__ import print_function

import os
import boto
import pytest
from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from os.path import join, isfile

s3_bucket = "bokeh-travis"
s3 = "https://s3.amazonaws.com/%s" % s3_bucket
build_id = os.environ.get("TRAVIS_BUILD_ID")
# Can we make this not hard coded and read in the report location from pytest?
pytest_report = "tests/pytest-report.html"


def pytest_sessionfinish(session, exitstatus):
    try_upload = os.environ.get("UPLOAD_PYTEST_HTML", "False") == "True"
    report_ready = isfile(pytest_report)
    if try_upload and report_ready:
        try:
            conn = boto.connect_s3()
            bucket = conn.get_bucket(s3_bucket)
            upload = True
        except NoAuthHandlerFound:
            print("Upload was requested but could not connect to S3.")
            upload = False

        if upload is True:
            with open(pytest_report, "r") as f:
                html = f.read()
            filename = join(build_id, "report.html")
            key = S3Key(bucket, filename)
            key.set_metadata("Content-Type", "text/html")
            key.set_contents_from_string(html, policy="public-read")
            print("\n%s Access report at: %s" % ("---", join(s3, filename)))


@pytest.fixture(scope="session")
def capabilities(capabilities):
    capabilities["browserName"] = "firefox"
    capabilities["tunnel-identifier"] = os.environ.get("TRAVIS_JOB_NUMBER")
    return capabilities
