import os
import re
import sys


def check_input(new_ver):
    """ Ensure that user input matches the format X.X.X """

    pat = r'\d+.\d+.\d+'
    if not re.match(pat, new_ver):
        print("The new version must be in the format X.X.X (ex. '0.6.0')")
        return True


def version_update(new_ver, file_array):
    """ Replace existing version/release number in an array of files
        with a user-supplied version number (new_ver)"""

    pat = r"""(release|version)([\" ][:=] [\"\'])(\d+.\d+.\d+)([\"\'])"""

    # List that will contain any files where the version number was successfully replaced
    replaced = []

    # Set as false until a match is found and replaced in the loop below
    early_ver = False

    for ver_file in file_array:
        f = open(ver_file)
        text = f.read()
        matchObj = re.search(pat, text)
        f.close()

        if matchObj:
            early_ver = matchObj.group(3)
            f = open(ver_file, 'w')
            text = re.sub(pat, r'\g<1>\g<2>%s\g<4>' % new_ver, text)
            f.write(text)
            replaced.append(ver_file)
        else:
            print("Unable to find version number matching expected format 'X.X.X' in %s" % ver_file)

    if early_ver:
        print("Version number changed from %s to %s in \n%s" % (early_ver, new_ver, replaced))


if __name__ == '__main__':
    if not len(sys.argv) == 2:
        print("Please provide a version number.")
        sys.exit(1)

    os.chdir('../')

    files = ['bokehjs/src/coffee/main.coffee', 'bokehjs/package.json']
    updated_version = sys.argv[1]

    if check_input(updated_version):
        sys.exit(1)

    version_update(updated_version, files)
