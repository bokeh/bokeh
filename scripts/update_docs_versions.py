import os
import re
import sys

def check_input(version):
    pat = r'^\d+.\d+.\d+$'
    if not re.match(pat, version):
        print("New versions for docs must be in the format X.X.X (ex. '0.12.0')")
        return False
    return True

def update_all_versions_txt(version):
    filename = 'sphinx/source/all_versions.txt'
    with open(filename, 'a') as f:
        f.write("{version}\n".format(version=version))
    print("Edited {filename}: Version number '{version}' appended".format(version=version, filename=filename))

def update_toctree(version):
    filename = 'sphinx/source/index.rst'
    with open(filename, "r") as f:
        lines = f.readlines()
        ii = None
        for i, line in enumerate(lines):
            if line.startswith("    docs/releases"):
                ii = i
                break
        if ii is None:
            print("Error updating toctree")
            sys.exit(1)
        new_line = "    docs/releases/{version}\n".format(version=version)
        lines.insert(i, new_line)
    with open(filename, "w") as f:
        f.writelines(lines)
    print("Edited {filename}: Release line '{new_line}' inserted in toctree".format(new_line=new_line.strip(), filename=filename))

if __name__ == '__main__':
    if not len(sys.argv) == 2:
        print("Please provide the new version number to add to the documentation.")
        sys.exit(1)

    os.chdir('../')

    files_to_add = ['sphinx/source/conf.py']
    version = sys.argv[1]

    if not check_input(version):
        sys.exit(1)

    update_all_versions_txt(version)
    update_toctree(version)
