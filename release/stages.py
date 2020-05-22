# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from typing import Tuple

# Bokeh imports
from .build import (
    build_bokehjs,
    build_conda_packages,
    build_docs,
    build_sdist_packages,
    dev_install,
    install_bokehjs,
    npm_install,
)
from .checks import (
    check_checkout,
    check_git,
    check_issues,
    check_release_branch,
    check_repo,
    check_tags,
    check_version_order,
)
from .config import StepType
from .credentials import (
    verify_anaconda_credentials,
    verify_aws_credentials,
    verify_npm_credentials,
    verify_pypi_credentials,
)
from .git import (
    checkout_master,
    checkout_release_branch,
    delete_release_branch,
    merge_release_branch,
    push_to_github,
    tag_version,
    update_bokehjs_versions,
    update_changelog,
    update_hash_manifest,
)
from .publish import (
    publish_anaconda,
    publish_cdn,
    publish_docs,
    publish_npm,
    publish_pypi,
)

__all__ = (
    "BUILD_CHECKS",
    "BUILD_STEPS",
    "DEPLOY_CHECKS",
    "DEPLOY_STEPS",
)

StepListType = Tuple[StepType, ...]

BUILD_CHECKS: StepListType = (
    check_git,
    check_repo,
    check_checkout,
    check_tags,
    check_version_order,
    check_release_branch,
    check_issues,
    verify_aws_credentials,
)

BUILD_STEPS: StepListType = (
    # clean_repo,
    checkout_release_branch,
    update_bokehjs_versions,
    update_changelog,
    npm_install,
    build_bokehjs,
    install_bokehjs,
    dev_install,
    update_hash_manifest,
    tag_version,
    build_conda_packages,
    build_sdist_packages,
    build_docs,
    # pack_deployment,
    # upload_deployment,
    publish_cdn,
    checkout_master,
    merge_release_branch,
    push_to_github,
    delete_release_branch,
)

DEPLOY_CHECKS: StepListType = (
    # check_aws_cli,
    verify_anaconda_credentials,
    verify_pypi_credentials,
    verify_npm_credentials,
    verify_aws_credentials,
)

DEPLOY_STEPS: StepListType = (
    # download_deployment,
    # unpack_deployment,
    publish_docs,
    # update_versions_config,
    publish_anaconda,
    publish_pypi,
    publish_npm,
    # issue_cdn_invalidations,
)
