# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .system import System

__all__ = (
    "publish_conda_package",
    "publish_documentation",
    "publish_pip_package",
    "unpack_deployment_tarball",
)

CLOUDFRONT_ID = "E2OC6Q27H5UQ63"


def publish_conda_package(config: Config, system: System) -> ActionReturn:
    version = config.version
    path = f"deployment-{version}/bokeh-{version}-py_0.tar.bz"
    token = config.secrets["ANACONDA_TOKEN"]
    main_channel = "" if config.prerelease else "-l main"
    try:
        system.run(f"anaconda -t {token} upload -u bokeh {path} {main_channel} -l dev --force --no-progress")
        return PASSED("Publish to anaconda.org succeeded")
    except RuntimeError as e:
        return FAILED("Could NOT publish to anaconda.org", details=e.args)


def publish_documentation(config: Config, system: System) -> ActionReturn:
    version = config.version
    path = f"deployment-{version}/sphinx/build/html"
    flags = "--acl bucket-owner-full-control --cache-control max-age=31536000,public"
    try:
        if config.prerelease:
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/dev/ {flags}")
            system.run('aws cloudfront create-invalidation --distribution-id {CLOUDFRONT_ID} --paths "/en/dev*"')
        else:
            version = config.version
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/latest/ {flags}")
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/{version}/ {flags}")
            system.run(f'aws cloudfront create-invalidation --distribution-id {CLOUDFRONT_ID} --paths "/en/latest*" "/en/{version}*')
        return PASSED("Publish to documentation site succeeded")
    except RuntimeError as e:
        return FAILED("Could NOT publish to documentation site", details=e.args)


def publish_pip_package(config: Config, system: System) -> ActionReturn:
    version = config.version
    path = f"deployment-{version}/bokeh-{version}.tar.gz"
    token = config.secrets["ANACONDA_TOKEN"]
    try:
        system.run(f"twine upload -u __token__ -p {token} {path}")
        return PASSED("Publish to pypi.org succeeded")
    except RuntimeError as e:
        return FAILED("Could NOT publish to pypi.org", details=e.args)


def unpack_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        filename = f"deployment-{config.version}.tgz"
        system.run(f"tar xvf {filename}")
        return PASSED(f"Unpacked deployment tarball {filename!r}")
    except RuntimeError as e:
        return FAILED("Could NOT unpack deployment tarball", details=e.args)
