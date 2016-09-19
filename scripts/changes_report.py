from __future__ import print_function
import subprocess, shlex, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.abspath("tests"))

from api_report import diff_versions
from plugins.upload_to_s3 import upload_file_to_s3

current = subprocess.check_output(shlex.split("git describe --tags")).decode("utf8")
previous = subprocess.check_output(shlex.split("git tag --sort=-version:refname")).decode("utf8")

current = str.split(str(current), "\n")[0]
previous = str.split(previous, "\n")
previous = [x for x in previous if not any(y.isalpha() for y in x)][0]

filename = "%s_%s.txt" % (previous, current)
diff = diff_versions(previous, current)
with open(filename, "w") as f:
    f.write(diff)

file_path = os.path.abspath(filename)
upload_file_to_s3(file_path, filename)
