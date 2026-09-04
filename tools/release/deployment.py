# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .npm import NPM_PACKAGES
from .system import System

__all__ = (
    "download_deployment_tarball",
    "pack_deployment_tarball",
    "unpack_deployment_tarball",
    "upload_deployment_tarball",
)


def pack_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        dirname = f"deployment-{config.version}"
        filename = f"{dirname}.tgz"
        system.run(f"mkdir {dirname}")
        for _workspace, tarball in NPM_PACKAGES:
            system.run(f"cp bokehjs/{tarball}-{config.js_version}.tgz {dirname}")
        system.run(f"cp dist/conda/noarch/bokeh-{config.version}-py_0.tar.bz2 {dirname}")
        system.run(f"cp dist/bokeh-{config.version}.tar.gz {dirname}")
        system.run(f"cp dist/bokeh-{config.version}-py3-none-any.whl {dirname}")
        system.run(f"mkdir {dirname}/bokehjs")
        system.run(f"cp -r bokehjs/build {dirname}/bokehjs")
        system.run(f"mkdir -p {dirname}/docs/bokeh/build")
        system.run(f"cp -r docs/bokeh/build/html {dirname}/docs/bokeh/build")
        system.run(f"cp -r docs/bokeh/switcher.json {dirname}/docs/bokeh")
        system.run(f"tar czvf {filename} {dirname}")
        return PASSED(f"Packed deployment tarball {filename!r}")
    except RuntimeError as e:
        return FAILED("Could NOT pack deployment tarball", details=e.args)


def upload_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"aws s3 cp deployment-{config.version}.tgz s3://bokeh-deployments/ --region us-east-1")
        return PASSED("Uploaded deployment tarball")
    except RuntimeError as e:
        return FAILED(f"Could NOT upload deployment tarball: {e}", details=e.args)


def download_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"aws s3 cp s3://bokeh-deployments/deployment-{config.version}.tgz . --region us-east-1")
        return PASSED("Downloaded deployment tarball")
    except RuntimeError as e:
        return FAILED("Could NOT download deployment tarball", details=e.args)


def unpack_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        filename = f"deployment-{config.version}.tgz"
        system.run(f"tar xvf {filename}")
        return PASSED(f"Unpacked deployment tarball {filename!r}")
    except RuntimeError as e:
        return FAILED("Could NOT unpack deployment tarball", details=e.args)
