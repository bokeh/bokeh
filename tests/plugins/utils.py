from __future__ import print_function

import colorama
import subprocess
import sys

#
# Output to stdout
#
colorama.init()


def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def red(text):
    return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)


def yellow(text):
    return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)


def blue(text):
    return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)


def green(text):
    return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)


def fail(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (red("[FAIL]"), msg))


def warn(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[WARN]"), msg))


def info(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % ("[INFO]", msg))


def ok(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (green("[OK]"), msg))


def get_version_from_git(ref=None):
    cmd = ["git", "describe", "--tags", "--always"]

    if ref is not None:
        cmd.append(ref)

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
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])
