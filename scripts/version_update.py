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

def version_add(new_ver, file_array):
    """Add last version number in an array of files
    with a user-supplied last version number"""
    for ver_file in file_array:
        with open(ver_file, "r") as f:
            flines = f.readlines()
            for i, line in enumerate(flines):
                if "ALL_VERSIONS" in line:
                    all_vers = flines[i]
                    begin, end = all_vers.split("[")
                    all_vers = begin + "['{}', ".format(new_ver) + end
                    flines[i] = all_vers
        with open(ver_file, "w") as f:
            f.writelines(flines)
        print("Version number {new_ver} added in {ver_file}".format(new_ver=new_ver, ver_file=ver_file))

if __name__ == '__main__':
    if not len(sys.argv) == 3:
        print("Please provide the new version number and the previous one.")
        sys.exit(1)

    os.chdir('../')

    files_to_update = ['bokehjs/src/coffee/version.coffee', 'bokehjs/package.json']
    files_to_add = ['sphinx/source/conf.py']
    updated_version = sys.argv[1]
    last_version = sys.argv[2]

    if check_input(updated_version):
        sys.exit(1)

    version_update(updated_version, files_to_update)
    version_add(updated_version, files_to_add)
