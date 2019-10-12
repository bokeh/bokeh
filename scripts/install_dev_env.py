"""This module handles the development environment setup for conda and python
packages.

"""

import os
import sys
import shutil
import subprocess


def conda_install(packages):
    """Helper function to install packages via conda while taking care of
    correct conda channels, conda path and environment variables.

    """

    args_conda_path = [shutil.which("conda"), "install"]  # required for windows
    args_channel = ["-y", "-c", "bokeh", "-c", "conda-forge"]
    args = args_conda_path + args_channel + packages
    subprocess.run(args, env=os.environ)


def install_prerequisites():
    """Installs required packages to bootstrap the rest of install
     instructions.

     """

    conda_install(["jinja2", "pyyaml"])


def install_packages():
    """Install required package dependencies.

    """

    sys.path.append(os.path.dirname(__file__))
    from deps import get_package_list

    packages = get_package_list(["all"])
    conda_install(packages)


if __name__ == "__main__":
    install_prerequisites()
    install_packages()
