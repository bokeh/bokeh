# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
from typing import TYPE_CHECKING

# Bokeh imports
from .build import (
    build_bokehjs,
    build_conda_packages,
    build_docs,
    build_npm_packages,
    build_pip_packages,
    dev_install_bokehjs,
    install_bokehjs,
    npm_install,
    pack_deployment_tarball,
    update_bokehjs_versions,
    update_changelog,
    update_hash_manifest,
    verify_conda_install,
    verify_pip_install_from_sdist,
    verify_pip_install_using_sdist,
    verify_pip_install_using_wheel,
)
from .checks import (
    check_anaconda_present,
    check_aws_present,
    check_checkout_is_clean,
    check_checkout_matches_remote,
    check_checkout_on_base_branch,
    check_docs_version_config,
    check_git_present,
    check_milestone_labels,
    check_npm_present,
    check_release_notes_present,
    check_release_tag_is_available,
    check_repo_is_bokeh,
    check_staging_branch_is_available,
    check_twine_present,
    check_version_order,
)
from .credentials import (
    verify_anaconda_credentials,
    verify_aws_credentials,
    verify_google_credentials,
    verify_npm_credentials,
    verify_pypi_credentials,
)
from .deploy import (
    publish_conda_package,
    publish_documentation,
    publish_npm_package,
    publish_pip_packages,
    unpack_deployment_tarball,
)
from .git import (
    checkout_base_branch,
    checkout_staging_branch,
    clean_repo,
    commit_staging_branch,
    delete_staging_branch,
    merge_staging_branch,
    push_to_github,
    tag_release_version,
)
from .pipeline import StepType
from .remote import download_deployment_tarball, publish_bokehjs_to_cdn, upload_deployment_tarball

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

__all__ = (
    "BUILD_CHECKS",
    "BUILD_STEPS",
    "DEPLOY_CHECKS",
    "DEPLOY_STEPS",
)

StepListType: TypeAlias = tuple[StepType, ...]

BUILD_CHECKS: StepListType = (
    check_aws_present,
    check_git_present,
    check_repo_is_bokeh,
    check_checkout_is_clean,
    check_checkout_on_base_branch,
    check_checkout_matches_remote,
    check_docs_version_config,
    check_release_tag_is_available,
    check_version_order,
    check_release_notes_present,
    check_milestone_labels,
    check_staging_branch_is_available,
    verify_aws_credentials,
    verify_google_credentials,
)

BUILD_STEPS: StepListType = (
    clean_repo,
    checkout_staging_branch,
    update_bokehjs_versions,
    update_changelog,
    npm_install,
    build_bokehjs,
    dev_install_bokehjs,
    install_bokehjs,
    update_hash_manifest,
    commit_staging_branch,
    check_checkout_is_clean,
    tag_release_version,
    build_npm_packages,
    build_pip_packages,
    verify_pip_install_from_sdist,
    verify_pip_install_using_sdist,
    verify_pip_install_using_wheel,
    build_conda_packages,
    verify_conda_install,
    build_docs,
    pack_deployment_tarball,
    upload_deployment_tarball,
    publish_bokehjs_to_cdn,
    checkout_base_branch,
    merge_staging_branch,
    push_to_github,
    delete_staging_branch,
)

DEPLOY_CHECKS: StepListType = (
    check_aws_present,
    check_anaconda_present,
    check_git_present,
    check_npm_present,
    check_twine_present,
    check_checkout_on_base_branch,
    verify_anaconda_credentials,
    verify_aws_credentials,
    verify_npm_credentials,
    verify_pypi_credentials,
)

DEPLOY_STEPS: StepListType = (
    download_deployment_tarball,
    unpack_deployment_tarball,
    publish_npm_package,
    publish_conda_package,
    publish_pip_packages,
    publish_documentation,
)
