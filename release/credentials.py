# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import os
from typing import Callable, Tuple, Union

# External imports
import boto
import boto.s3.connection
import boto.s3.key

# Bokeh imports
from .config import Config, StepType
from .system import run
from .ui import failed, passed

__all__ = (
    "verify_anaconda_credentials",
    "verify_aws_credentials",
    "verify_npm_credentials",
    "verify_pypi_credentials",
)

ReturnStepType = Callable[[Config], Union[str, Tuple[str, str]]]


def collect_credential(func: ReturnStepType) -> StepType:
    service = func.__name__.split("_")[1].upper()

    def wrapper(config: Config) -> None:
        try:
            config.credentials[service] = func(config)
            passed(f"Verified {service} credentials")
        except Exception:
            failed(f"Could NOT verify {service} credentials")
            config.abort()

    return wrapper


@collect_credential
def verify_anaconda_credentials(config: Config) -> str:
    token = os.environ["ANACONDA_TOKEN"]
    out = run(f"anaconda -t {token} whoami", silent=True)
    if "Anonymous User" in out:
        raise ValueError()
    return token


@collect_credential
def verify_pypi_credentials(config: Config) -> str:
    # TODO is there a way to actually test that the creds work?
    token = os.environ["PYPI_TOKEN"]
    return token


@collect_credential
def verify_npm_credentials(config: Config) -> str:
    token = os.environ["NPM_TOKEN"]
    run("npm set registry 'https://registry.npmjs.org'")
    run(f"npm set //registry.npmjs.org/:_authToken {token}", silent=True)
    out = run(f"npm whoami")
    if out.strip() != "bokeh":
        raise ValueError()

    return token


@collect_credential
def verify_aws_credentials(config: Config) -> Tuple[str, str]:
    access_key_id = os.environ["AWS_ACCESS_KEY_ID"]
    secret_access_key = os.environ["AWS_SECRET_ACCESS_KEY"]

    for bucket_name, bucket_region in [("cdn.bokeh.org", "us-east-1"), ("cdn-backup.bokeh.org", "us-west-2")]:
        conn = boto.s3.connect_to_region(
            bucket_region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            calling_format=boto.s3.connection.OrdinaryCallingFormat(),
        )
        conn.get_bucket(bucket_name)

    return (access_key_id, secret_access_key)
