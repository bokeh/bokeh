import os
import re
import sys

def check_input(version):
    pat = r'^(\d+.\d+.\d+)((dev|rc)\d+)?$'
    if not re.match(pat, version):
        print("The new version must be in the format X.X.X([dev|rc]X) (ex. '0.12.0')")
        return False
    return True

def version_update(version, filename):
    pat = r"""(release|version)([\" ][:=] [\"\'])(\d+.\d+.\d+)((dev|rc)\d+)?([\"\'])"""

    with open(filename) as f:
        text = f.read()
        match = re.search(pat, text)

    if not match:
        print("ERROR: Unable to find version string to replace in %s" % filename)
        sys.exit(1)

    old_version = match.group(3)
    if match.group(4) is not None:
        old_version += match.group(4)

    text = re.sub(pat, r'\g<1>\g<2>%s\g<6>' % version, text)

    with open(filename, 'w') as f:
        f.write(text)

    print("Edited {filename}: Updated version string '{old_version}' to '{version}'".format(filename=filename, version=version, old_version=old_version))

if __name__ == '__main__':
    if not len(sys.argv) == 2:
        print("Please provide the new version number to update.")
        sys.exit(1)

    version = sys.argv[1]

    if not check_input(version):
        sys.exit(1)

    os.chdir('../')

    filenames = [
        'bokehjs/src/coffee/version.coffee',
        'bokehjs/package.json',
    ]

    for filename in filenames:
        version_update(version, filename)
