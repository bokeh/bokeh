from __future__ import print_function
import subprocess, shlex, os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.abspath("tests"))

from api_report import diff_versions
from plugins.upload_to_s3 import upload_file_to_s3_by_job_id

current = subprocess.check_output(shlex.split("git describe --tags")).decode("utf8")

tag = subprocess.Popen(shlex.split("git tag"), stdout=subprocess.PIPE)
grep = subprocess.Popen(shlex.split("sort -V -r"), stdin=tag.stdout, stdout=subprocess.PIPE)
previous = grep.communicate()[0].decode("utf8")

current = str.split(str(current), "\n")[0]
previous = str.split(str(previous), "\n")
previous = [x for x in previous if not any(y.isalpha() for y in x)][0]

filename = "%s_%s.txt" % (previous, current)
diff = diff_versions(previous, current)
with open(filename, "w") as f:
    f.write(diff)

file_path = os.path.abspath(filename)
upload_file_to_s3_by_job_id(file_path, filename)
