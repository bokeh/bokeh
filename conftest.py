import pytest


@pytest.fixture(scope='session', autouse=True)
def _verify_base_url(request, base_url):
    # Override the default pytest-selenium behavior
    pass


@pytest.fixture(scope='session', autouse=True)
def _sensitive_skipping(request, base_url):
    # Override the default pytest-selenium behavior
    pass


@pytest.fixture(scope='session')
def base_url(request):
    # Override the default pytest-selenium behavior
    pass
