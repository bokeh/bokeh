import argparse
from os.path import join
import re
from subprocess import CalledProcessError, check_output, STDOUT
import sys
from packaging.version import Version as V

try:
    import colorama
    def bright(text): return "%s%s%s" % (colorama.Style.BRIGHT, text, colorama.Style.RESET_ALL)
    def dim(text):    return "%s%s%s" % (colorama.Style.DIM, text, colorama.Style.RESET_ALL)
    def white(text):  return "%s%s%s" % (colorama.Fore.WHITE, text, colorama.Style.RESET_ALL)
    def blue(text):   return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)
    def red(text):    return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)
    def green(text):  return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)
    def yellow(text): return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)
    sys.platform == "win32" and colorama.init()
except ImportError:
    def bright(text): return text
    def dim(text):    return text
    def white(text):  return text
    def blue(text):   return text
    def red(text):    return text
    def green(text):  return text
    def yellow(text): return text


class config(object):
    ANY_VERSION = re.compile(r"^(\d+\.\d+\.\d+)((?:dev|rc)\d+)?$")
    FULL_VERSION = re.compile(r"^(\d+\.\d+\.\d+)?$")

    def __init__(self):
        self._new_version = None
        self._last_any_version = None
        self._last_full_version = None
        self._problems = []

    @property
    def new_version(self): return self._new_version

    @new_version.setter
    def new_version(self, v):
        m =  self.ANY_VERSION.match(v)
        if not m: raise ValueError("Invalid Bokeh version %r" % v)
        self._new_version = v

    @property
    def last_any_version(self): return self._last_any_version

    @last_any_version.setter
    def last_any_version(self, v):
        m =  self.ANY_VERSION.match(v)
        if not m: raise ValueError("Invalid Bokeh version %r" % v)
        self._last_any_version = v

    @property
    def last_full_version(self): return self._last_full_version

    @last_full_version.setter
    def last_full_version(self, v):
        m =  self.FULL_VERSION.match(v)
        if not m: raise ValueError("Invalid Bokeh version %r" % v)
        self._last_full_version = v

    @property
    def version_type(self):
        if   "rc"  in self._new_version: return "RELEASE CANDIDATE"
        elif "dev" in self._new_version: return "DEV BUILD"
        else: return "FULL RELEASE"

    @property
    def release_branch(self):
        return "release_%s" % self.new_version

    @property
    def problems(self):
        return self._problems

    @property
    def top_dir(self):
        return run("git rev-parse --show-toplevel")

CONFIG = config()


#--------------------------------------
#
# Utility functions
#
#--------------------------------------

def run(cmd):
    if isinstance(cmd, str):
        cmd = cmd.split()
    return check_output(cmd, stderr=STDOUT).decode('utf-8').strip()

#--------------------------------------
#
# UI functions
#
#--------------------------------------

def banner(color, msg):
    print()
    print(color('='*80))
    print(color("{:^80}".format(msg)))
    print(color('='*80 + "\n"))

def passed(msg):
    print(dim(green("[PASS] ")) + msg)

def failed(msg, details=None):
    print((red("[FAIL] ")) + msg)
    if details:
        print()
        for line in details:
            print("     " + dim(red(line)))
        print()
    CONFIG.problems.append(msg)

def abort(checkout_master=True):
    print()
    print(bright(red("!!! The deploy has been aborted.")))
    print()
    print(bright(red("!!! NO REMOTE ACTIONS have been taken --- local checkout may be dirty")))
    print()
    run("git checkout master")
    sys.exit(1)

def confirm(msg):
    resp = "foo"
    while resp not in "yn" or resp=='':
        resp = input(bright(yellow(msg)) + bright(" (y/n): "))
    if resp == "n":
        run("git checkout master")
        abort()

#--------------------------------------
#
# Check functions
#
#--------------------------------------

def check_py3():
    if sys.version_info.major == 3:
        passed("Running Python 3.x")
    else:
        failed("This script requires Python 3.x")


def check_git():
    try:
        run("which git")
        passed("Command 'git' is available")
    except CalledProcessError:
        failed("Command 'git' is missing")
        abort(checkout_master=False)


def check_maintainers():
    try:
        email = run("git config --get user.email")
    except CalledProcessError:
        failed("Could not determine Git config user.email")
        abort()
    filename = join(CONFIG.top_dir, "MAINTAINERS")
    if any(email == line.strip() for line in open(filename)):
        passed("Git config user.email %r found in MAINTAINERS file" % email)
    else:
        failed("User config user.email %r NOT found in MAINTAINERS file" % email)
        print()
        print(bright(yellow("       This probably means you should not try to run this script")))
        abort()


def check_repo():
    try:
        run("git status")
    except CalledProcessError:
        failed("Executing outside of a git repository")
        abort()

    try:
        remote = run("git config --get remote.origin.url")
        if "bokeh/bokeh" in remote:
            passed("Executing inside the the bokeh/bokeh repository")
        else:
            failed("Executing OUTSIDE the bokeh/bokeh repository")
            abort()
    except CalledProcessError:
        failed("Could not determine Git config remote.origin.url")
        abort()


def check_checkout():
    try:
        branch = run("git rev-parse --abbrev-ref HEAD")
        if branch == "master":
            passed("Working on master branch")
        else:
            failed("NOT working on master branch %r" % branch)
            abort()

        extras = run("git status --porcelain").split("\n")
        extras = [x for x in extras if x != '']
        if extras:
            failed("Local checkout is NOT clean", extras)
        else:
            passed("Local checkout is clean")

        try:
            run("git remote update")
            local = run("git rev-parse @")
            remote = run("git rev-parse @{u}")
            base = run("git merge-base @ @{u}")
            if local == remote:
                passed("Checkout is up to date with GitHub")
            else:
                if   local  == base: status = "NEED TO PULL"
                elif remote == base: status = "NEED TO PUSH"
                else: status = "DIVERGED"
                failed("Checkout is NOT up to date with GitHub (%s)" % status)
        except CalledProcessError:
            failed("Could not check whether local and GitHub are up to date")
            abort()

    except CalledProcessError:
        failed("Could not check the checkout state")
        abort()


def check_tags():
    try:
        out = run("git for-each-ref --sort=-taggerdate --format '%(tag)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        if CONFIG.new_version in tags:
            failed("There is already an existing tag for new version %r" % CONFIG.new_version)
            abort()
        else:
            passed("New version %r does not already have a tag" % CONFIG.new_version)

        try:
            CONFIG.last_any_version = tags[0]
            passed("Detected valid last dev/rc/full version %r" % CONFIG.last_any_version)
        except ValueError:
            failed("Last dev/rc/full version %r is not a valid Bokeh version!" % CONFIG.last_any_version)
            abort()

        try:
            CONFIG.last_full_version = [tag for tag in tags if ('rc' not in tag and 'dev' not in tag)][0]
            passed("Detected valid last full release version %r" % CONFIG.last_full_version)
        except ValueError:
            failed("Last full release version %r is not a valid Bokeh version!" % CONFIG.last_full_version)
            abort()

    except CalledProcessError:
        failed("Could not detect last version tags")
        abort()


def check_version_order():
    if V(CONFIG.new_version) > V(CONFIG.last_any_version):
        passed("New version %r is newer than last version %r" % (CONFIG.new_version, CONFIG.last_any_version))
    else:
        failed("New version %r is NOT newer than last version %r" % (CONFIG.new_version, CONFIG.last_any_version))


def check_release_branch():
    out = run("git branch --list %s" % CONFIG.release_branch)
    if out:
        failed("Release branch %r ALREADY exists" % CONFIG.release_branch)
    else:
        passed("Release branch %r does not already exist" % CONFIG.release_branch)

def check_issues():
    try:
        out = run("python issues.py -c -p %s" % CONFIG.last_full_version)
        passed("Issue labels are BEP-1 compliant")
    except CalledProcessError as e:
        out = e.output.decode('utf-8')
        if "HTTP Error 403: Forbidden" in out:
            failed("Issues cannot be checked right now due to GitHub rate limiting")
        else:
            failed("Issue labels are NOT BEP-1 compliant", out.split("\n"))

#--------------------------------------
#
# Update functions
#
#--------------------------------------

def commit(filename, version):
    path = join(CONFIG.top_dir, filename)
    try:
        run("git add %s" % path)
    except CalledProcessError as e:
        failed("Could not git add %r" % filename, str(e).split("/n"))
        return
    try:
        run(["git", "commit", "-m", "'Updating for version %s'" % version])
    except CalledProcessError as e:
        failed("Could not git commit %r" % filename, str(e).split("/n"))
        return
    passed("Committed file %r" % filename)

def update_bokehjs_versions():

    filenames = [
        'bokehjs/src/coffee/version.coffee',
        'bokehjs/package.json',
    ]

    pat = r"(release|version)([\" ][:=] [\"\'])" + CONFIG.last_any_version + "([\"\'])"

    for filename in filenames:
        path = join(CONFIG.top_dir, filename)
        with open(path) as f:
            text = f.read()
            match = re.search(pat, text)

        if not match:
            failed("Unable to find version string for %r in file %r" % (CONFIG.last_any_version, filename))
            continue

        text = re.sub(pat, r'\g<1>\g<2>%s\g<3>' % CONFIG.new_version, text)

        try:
            with open(path, 'w') as f:
                f.write(text)
        except Exception as e:
            failed("Unable to write new version to file %r" % filename, str(e).split("\n"))
        else:
            passed("Updated version from %r to %r in file %r" % (CONFIG.last_any_version, CONFIG.new_version, filename))
            commit(filename, CONFIG.new_version)

def update_docs_versions():

    # Update all_versions.txt

    filename = 'sphinx/source/all_versions.txt'
    path = join(CONFIG.top_dir, filename)
    try:
        with open(path, 'a') as f:
            f.write("{version}\n".format(version=CONFIG.new_version))
    except Exception as e:
        failed("Could not write new version to file %r" % filename, str(e).split("\n"))
    else:
        passed("Appended version %r to %r" % (CONFIG.new_version, filename))
        commit(filename, CONFIG.new_version)

def update_changelog():
    try:
        out = run("python issues.py -p %s -r %s" % (CONFIG.last_full_version, CONFIG.new_version))
        passed("Updated CHANGELOG with new closed issues")
        filename = join(CONFIG.top_dir, "CHANGELOG")
        commit(filename, CONFIG.new_version)
    except CalledProcessError as e:
        out = e.output.decode('utf-8')
        if "HTTP Error 403: Forbidden" in out:
            failed("CHANGELOG cannot be updated right now due to GitHub rate limiting")
        else:
            failed("CHANGELOG update failed", out.split("\n"))

def merge_and_push():
    try:
        run("git checkout master")
        passed("Checked out master branch")
    except Exception as e:
        failed("[FATAL] COULD NOT CHECK OUT MASTER BRANCH: %s" % e)
        return False

    try:
        run(["git", "merge", "--no-ff", CONFIG.release_branch, "-m", "'Merge branch %s'" % CONFIG.release_branch])
        passed("Merged release branch into master branch")
    except Exception as e:
        failed("[FATAL] COULD NOT MERGE RELEASE BRANCH TO MASTER: %s" % e)
        return False

    try:
        # use --no-verify to prevent git hook that might ask for confirmation
        run("git push --no-verify origin master")
        passed("Pushed master branch to GitHub")
    except Exception as e:
        failed("[FATAL] COULD NOT PUSH MASTER TO ORIGIN: %s" % e)
        return False

    try:
        out = run(["git", "branch", "-d", CONFIG.release_branch])
        passed("Deleted release branch")
    except Exception:
        failed("[NON-FATAL] Could not delete release branch", out.split("\n"))

    try:
        run(["git", "tag", "-a", CONFIG.new_version, "-m", "Release %s" % CONFIG.new_version])
        passed("Tagged release %r" % CONFIG.new_version)
    except Exception as e:
        failed("[FATAL] COULD NOT TAG RELEASE: %s" % e)
        return False

    try:
        # use --no-verify to prevent git hook that might ask for confirmation
        run(["git", "push", "--no-verify", "origin", CONFIG.new_version])
        passed("Pushed tag %r to GitHub" % CONFIG.new_version)
    except Exception as e:
        failed("[FATAL] COULD NOT PUSH MASTER TO ORIGIN: %s" % e)
        return False

    try:
        out = run("git checkout master")
        passed("Returned to master branch")
    except Exception as e:
        failed("[NON-FATAL] Could not return to master branch", out.split("\n"))

    return True

def show_updates():
    print()
    print("!!! Here is a diff of the changes made on the release branch:")
    print()

    diff = run("git diff --minimal master").split("\n")
    for line in diff:
        print(blue("    %s" % line))

    print()

#--------------------------------------
#
# Main
#
#--------------------------------------

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Deploy a Bokeh release.')
    parser.add_argument('version',
                        type=str,
                        nargs=1,
                        help='The new version number for this release')
    args = parser.parse_args()

    new_version = args.version[0]

    banner(blue, "{:^80}".format("You are starting a Bokeh release deployment for %r" % new_version))

    # pre-checks ------------------------------------------------------------

    print("!!! Running pre-checks for release deploy\n")

    check_py3()
    check_git()
    check_maintainers()
    check_repo()
    check_checkout()

    try:
        CONFIG.new_version = args.version[0]
        passed("New version %r is a valid Bokeh version (%s)" % (CONFIG.new_version, bright(CONFIG.version_type)))
    except ValueError:
        failed("Version %r is NOT a valid Bokeh version" % CONFIG.new_version)
        abort()

    check_tags()
    check_version_order()
    check_release_branch()

    if V(CONFIG.new_version).is_prerelease:
        print(blue("[SKIP] ") + "Not checking issues for BEP-1 compliance for pre-releases")
    else:
        check_issues()

    if CONFIG.problems:
        print(red("\n!!! Some pre-checks have failed:\n"))
        for p in CONFIG.problems:
            print("    - " + yellow(p))
        abort()

    print(green("\n!!! All pre-checks have passed\n"))

    confirm("Would you like to continue to file modifications?")

    print(blue("\n" + '-'*80 + "\n"))

    # modifications ---------------------------------------------------------

    try:
        run("git checkout -b %s" % CONFIG.release_branch)
        passed("Checked out release branch %r" % CONFIG.release_branch)
    except CalledProcessError as e:
        failed("Could not check out release branch %r" % CONFIG.release_branch, str(e).split("/n"))
        abort()

    update_bokehjs_versions()

    if V(CONFIG.new_version).is_prerelease:
        print(blue("[SKIP] ") + "Not updating docs version or change log for pre-releases")
    else:
        update_docs_versions()
        update_changelog()

    if CONFIG.problems:
        print(red("\n!!! Some updates have failed:\n"))
        for p in CONFIG.problems:
            print("    - " + yellow(p))
        abort()

    # confirmation ----------------------------------------------------------

    show_updates()

    confirm("Merge release branch and push these changes? [LAST CHANCE TO ABORT]")

    success = merge_and_push()
    if success:
        if CONFIG.problems:
            print(blue("\n!!! Some NON-FATAL problems occurred:\n"))
            for p in CONFIG.problems:
                print("    - " + yellow(p))
        print()
        banner(blue, "{:^80}".format("Bokeh %r release deployment: SUCCESS" % CONFIG.new_version))
    else:
        if CONFIG.problems:
            print(red("\n!!! Some FATAL problems occurred:\n"))
            for p in CONFIG.problems:
                print("    - " + yellow(p))
        print()
        print(bright(red("!!! REMOTE ACTIONS MAY HAVE BEEN TAKEN --- local AND remote branches may be dirty")))
        print()
        banner(red, "{:^80}".format("Bokeh %r release deployment: FAILURE" % CONFIG.new_version))
        sys.exit(1)
