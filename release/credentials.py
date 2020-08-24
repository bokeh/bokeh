# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
import os
from functools import wraps
from typing import Callable

# External imports
import boto
import boto.s3.connection
import boto.s3.key

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .pipeline import StepType
from .system import System

__all__ = (
    "verify_anaconda_credentials",
    "verify_aws_credentials",
    "verify_github_credentials",
    "verify_npm_credentials",
    "verify_pypi_credentials",
)


VerifyFunctionType = Callable[..., None]  # Unfortunately best current solution see https://github.com/python/typing/issues/696


def collect_credential(**kw: str) -> Callable[[VerifyFunctionType], StepType]:
    def decorator(func: VerifyFunctionType) -> StepType:
        service = func.__name__.split("_")[1].upper()

        @wraps(func)
        def wrapper(config: Config, system: System) -> ActionReturn:
            secrets = dict()
            for argname, envname in kw.items():
                if envname not in os.environ:
                    return FAILED(f"Credential {envname} is not set")
                secrets[argname] = os.environ[envname]

                # this must be added immediately before anything else so a scrubber is registered
                config.add_secret(envname, secrets[argname])

            try:
                func(config, system, **secrets)
                return PASSED(f"Verified {service} credentials")
            except Exception as e:
                return FAILED(f"Could NOT verify {service} credentials", details=e.args)

        return wrapper

    return decorator


@collect_credential(token="ANACONDA_TOKEN")
def verify_anaconda_credentials(config: Config, system: System, *, token: str) -> None:
    """

    """
    out = system.run(f"anaconda -t {token} whoami")
    if "Username: bokeh" not in out:
        raise RuntimeError(*out.strip().split("\n"))


@collect_credential(token="PYPI_TOKEN")
def verify_pypi_credentials(config: Config, system: System, *, token: str) -> None:
    """

    """
    # TODO is there a way to actually test that the creds work?
    pass


@collect_credential(token="GITHUB_TOKEN")
def verify_github_credentials(config: Config, system: System, *, token: str) -> None:
    """

    """
    out = system.run(f"curl -s -H 'Authorization: token {token}' https://api.github.com")
    if "Bad credentials" in out:
        raise RuntimeError(*out.strip().split("\n"))


@collect_credential(token="NPM_TOKEN")
def verify_npm_credentials(config: Config, system: System, *, token: str) -> None:
    """

    """
    system.run("npm set registry 'https://registry.npmjs.org'")
    system.run(f"npm set //registry.npmjs.org/:_authToken {token}")
    out = system.run("npm whoami")
    if out.strip() != "bokeh":
        raise RuntimeError(*out.strip().split("\n"))


@collect_credential(access_key_id="AWS_ACCESS_KEY_ID", secret_access_key="AWS_SECRET_ACCESS_KEY")
def verify_aws_credentials(config: Config, system: System, *, access_key_id: str, secret_access_key: str) -> None:
    """

    """
    calling_format = boto.s3.connection.OrdinaryCallingFormat()
    for bucket_name, bucket_region in [
        ("cdn.bokeh.org", "us-east-1"),
        ("cdn-backup.bokeh.org", "us-west-2"),
    ]:
        conn = boto.s3.connect_to_region(
            bucket_region, aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key, calling_format=calling_format,
        )
        conn.get_bucket(bucket_name)
