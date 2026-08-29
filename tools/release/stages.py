# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Bokeh imports
from .build import (
    build_bokehjs,
    build_conda_package,
    build_docs,
    build_npm_packages,
    build_pip_packages,
    dev_install_bokehjs,
    install_bokehjs,
    npm_install,
    update_bokehjs_versions,
    update_changelog,
    update_hash_manifest,
    update_switcher_json,
    verify_conda_package,
    verify_pip_install_from_sdist,
    verify_pip_install_using_sdist,
    verify_pip_install_using_wheel,
)
from .checks import (
    check_aws_present,
    check_checkout_is_clean,
    check_checkout_matches_remote,
    check_checkout_on_base_branch,
    check_docs_version_config,
    check_git_present,
    check_milestone_labels,
    check_release_notes_present,
    check_release_tag_is_available,
    check_repo_is_bokeh,
    check_staging_branch_is_available,
    check_version_order,
)
from .deployment import (
    download_deployment_tarball,
    pack_deployment_tarball,
    unpack_deployment_tarball,
    upload_deployment_tarball,
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
from .publishing import publish_bokehjs_to_cdn, publish_documentation

__all__ = (
    "BUILD_ARTIFACT_STEPS",
    "BUILD_CHECKS",
    "BUILD_STEPS",
    "DOCS_STEPS",
    "PREPARE_DEPLOYMENT_CHECKS",
    "PREPARE_DEPLOYMENT_STEPS",
    "UPLOAD_DEPLOYMENT_STEPS",
    "UPDATE_RELEASE_REPOSITORY_STEPS",
)

type StepListType = tuple[StepType, ...]

BUILD_CHECKS: StepListType = (
    check_aws_present,
    check_git_present,
    check_repo_is_bokeh,
    check_checkout_is_clean,
    check_checkout_on_base_branch,
    check_checkout_matches_remote,
    check_release_tag_is_available,
    check_version_order,
    check_release_notes_present,
    check_milestone_labels,
    check_staging_branch_is_available,
)

BUILD_ARTIFACT_STEPS: StepListType = (
    clean_repo,
    checkout_staging_branch,
    update_bokehjs_versions,
    update_changelog,
    npm_install,
    build_bokehjs,
    dev_install_bokehjs,
    install_bokehjs,
    update_hash_manifest,
    update_switcher_json,
    check_docs_version_config,
    commit_staging_branch,
    check_checkout_is_clean,
    tag_release_version,
    build_npm_packages,
    build_pip_packages,
    verify_pip_install_from_sdist,
    verify_pip_install_using_sdist,
    verify_pip_install_using_wheel,
    build_conda_package,
    verify_conda_package,
    build_docs,
    pack_deployment_tarball,
)

UPLOAD_DEPLOYMENT_STEPS: StepListType = (
    upload_deployment_tarball,
    publish_bokehjs_to_cdn,
)

UPDATE_RELEASE_REPOSITORY_STEPS: StepListType = (
    checkout_base_branch,
    merge_staging_branch,
    push_to_github,
    delete_staging_branch,
)

BUILD_STEPS: StepListType = BUILD_ARTIFACT_STEPS + UPLOAD_DEPLOYMENT_STEPS + UPDATE_RELEASE_REPOSITORY_STEPS

PREPARE_DEPLOYMENT_CHECKS: StepListType = (
    check_git_present,
    check_checkout_on_base_branch,
)

PREPARE_DEPLOYMENT_STEPS: StepListType = (
    download_deployment_tarball,
    unpack_deployment_tarball,
)

DOCS_STEPS: StepListType = (publish_documentation,)
