from __future__ import annotations

# Standard library imports
from typing import Any

# External imports
import pytest
from release import credentials
from release.action import ActionReturn
from release.config import Config
from release.enums import ActionResult
from release.pipeline import StepType
from release.system import System

# Bokeh imports
# Bokeh test imports
from tests.codebase._release_support import RecordingSystem


@pytest.mark.parametrize("value", [None, ""])
def test_collect_credential_requires_nonempty_environment_variable(
    monkeypatch: pytest.MonkeyPatch,
    value: str | None,
) -> None:
    if value is None:
        monkeypatch.delenv("TEST_TOKEN", raising=False)
    else:
        monkeypatch.setenv("TEST_TOKEN", value)

    @credentials.collect_credential(token="TEST_TOKEN")
    def verify_service(config: Config, system: System, *, token: str) -> None:
        pytest.fail("credential verifier was called")

    config = Config("4.0.0")
    result = verify_service(config, RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Credential TEST_TOKEN is not set"
    assert config.secrets == {}


def test_collect_credential_registers_secret_before_verification(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TEST_TOKEN", "secret")
    observed: dict[str, object] = {}

    @credentials.collect_credential(token="TEST_TOKEN")
    def verify_service(config: Config, system: System, *, token: str) -> None:
        observed["token"] = token
        observed["registered"] = dict(config.secrets)

    config = Config("4.0.0")
    result = verify_service(config, RecordingSystem())

    assert result.kind is ActionResult.PASS
    assert observed == {"registered": {"TEST_TOKEN": "secret"}, "token": "secret"}


def test_collect_credential_converts_verification_error_to_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TEST_TOKEN", "secret")

    @credentials.collect_credential(token="TEST_TOKEN")
    def verify_service(config: Config, system: System, *, token: str) -> None:
        raise RuntimeError("bad token", "try again")

    result = verify_service(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.details == ("bad token", "try again")


def test_collect_credential_preserves_function_metadata() -> None:
    @credentials.collect_credential(token="TEST_TOKEN")
    def verify_service(config: Config, system: System, *, token: str) -> None:
        """Verifier documentation."""

    assert verify_service.__name__ == "verify_service"
    assert verify_service.__doc__ == "Verifier documentation."


@pytest.mark.parametrize(
    ("output", "expected"),
    [("Using Anaconda API: api.anaconda.org\nUsername: bokeh\n", ActionResult.PASS), ("Username: other\n", ActionResult.FAIL)],
)
def test_verify_anaconda_credentials(
    monkeypatch: pytest.MonkeyPatch,
    output: str,
    expected: ActionResult,
) -> None:
    monkeypatch.setenv("ANACONDA_TOKEN", "token")
    system = RecordingSystem(outputs={"anaconda -t token whoami": output})

    result = credentials.verify_anaconda_credentials(Config("4.0.0"), system)

    assert result.kind is expected
    assert system.commands == ["anaconda -t token whoami"]


@pytest.mark.parametrize(
    ("func", "environment"),
    [
        (credentials.verify_pypi_credentials, {"PYPI_TOKEN": "token"}),
        (credentials.verify_google_credentials, {"GOOGLE_API_KEY": "token"}),
    ],
)
def test_placeholder_credential_checks_only_require_token(
    monkeypatch: pytest.MonkeyPatch,
    func: StepType,
    environment: dict[str, str],
) -> None:
    for name, value in environment.items():
        monkeypatch.setenv(name, value)

    result = func(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.PASS


def test_verify_npm_credentials_is_explicitly_unsupported(config: Config) -> None:
    system = RecordingSystem()

    result = credentials.verify_npm_credentials(config, system)

    assert result.kind is ActionResult.PASS
    assert "not currently supported" in result.message
    assert system.calls == []


def test_verify_aws_credentials_checks_every_bucket(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "access")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "secret")
    observed: list[tuple[str, str]] = []

    class Client:
        def __init__(self, region: str) -> None:
            self.region = region

        def head_bucket(self, *, Bucket: str) -> None:
            observed.append((self.region, Bucket))

    def client(service: str, **kw: Any) -> Client:
        assert service == "s3"
        assert kw["aws_access_key_id"] == "access"
        assert kw["aws_secret_access_key"] == "secret"
        return Client(kw["region_name"])

    monkeypatch.setattr(credentials.boto3, "client", client)

    result = credentials.verify_aws_credentials(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.PASS
    assert observed == [("us-east-1", "cdn.bokeh.org"), ("us-west-2", "cdn-backup.bokeh.org")]


def test_verify_aws_credentials_reports_client_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "access")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "secret")

    class Client:
        def head_bucket(self, *, Bucket: str) -> None:
            raise RuntimeError("denied")

    monkeypatch.setattr(credentials.boto3, "client", lambda *args, **kw: Client())

    result = credentials.verify_aws_credentials(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.details == ("denied",)


def test_all_public_verifiers_return_action_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PYPI_TOKEN", "pypi")
    monkeypatch.setenv("GOOGLE_API_KEY", "google")

    for func in [credentials.verify_pypi_credentials, credentials.verify_google_credentials, credentials.verify_npm_credentials]:
        assert isinstance(func(Config("4.0.0"), RecordingSystem()), ActionReturn)
