import pytest

from tests.plugins.upload_to_s3 import upload_file_to_s3_by_job_id

pytest_plugins = (
    "tests.examples.examples_report_plugin",
    "tests.integration.integration_tests_plugin",
    "tests.plugins.bokeh_server",
    "tests.plugins.jupyter_notebook",
    "tests.plugins.phantomjs_screenshot",
    "tests.plugins.image_diff",
    "tests.plugins.file_server",
)


def pytest_addoption(parser):
    parser.addoption(
        "--upload", dest="upload", action="store_true", default=False, help="upload test artefacts to S3"
    )
    parser.addoption(
        "--log-file", dest="log_file", metavar="path", action="store", default='examples.log', help="where to write the complete log"
    )


def pytest_sessionfinish(session, exitstatus):
    try_upload = session.config.option.upload
    seleniumreport = session.config.option.htmlpath
    is_slave = hasattr(session.config, 'slaveinput')
    if try_upload and seleniumreport and not is_slave:
        upload_file_to_s3_by_job_id(seleniumreport)


@pytest.yield_fixture(scope="session")
def log_file(request):
    is_slave = hasattr(request.config, 'slaveinput')
    if not is_slave:
        with open(request.config.option.log_file, 'w') as f:
            # Clean-out any existing log-file
            f.write("")
    with open(pytest.config.option.log_file, 'a') as f:
        yield f
