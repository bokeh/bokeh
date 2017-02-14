from __future__ import absolute_import, print_function

import colorama
import subprocess
import sys

#
# Output to stdout
#
colorama.init()


def trace(*values, **kwargs):
    pass


def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def red(text):
    return "%s%s%s%s" % (colorama.Fore.RED, colorama.Style.NORMAL, text, colorama.Style.RESET_ALL)


def yellow(text):
    return "%s%s%s%s" % (colorama.Fore.YELLOW, colorama.Style.NORMAL, text, colorama.Style.RESET_ALL)


def blue(text):
    return "%s%s%s%s" % (colorama.Fore.BLUE, colorama.Style.NORMAL, text, colorama.Style.RESET_ALL)


def green(text):
    return "%s%s%s%s" % (colorama.Fore.GREEN, colorama.Style.NORMAL, text, colorama.Style.RESET_ALL)


def white(text):
    return "%s%s%s%s" % (colorama.Fore.WHITE, colorama.Style.BRIGHT, text, colorama.Style.RESET_ALL)


def fail(msg=None, label="FAIL"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (red("[%s]" % label), msg))


def warn(msg=None, label="WARN"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[%s]" % label), msg))


def info(msg=None, label="INFO"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (white("[%s]" % label), msg))


def ok(msg=None, label="OK"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (green("[%s]" % label), msg))


def get_version_from_git(ref):
    """Get git-version of a specific ref, e.g. HEAD, origin/master. """
    cmd = ["git", "describe", "--tags", "--always", ref]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        write("Failed to get version for %s" % ref)
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        # git-version = tag-num-gSHA1
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])
