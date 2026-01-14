import crypto from "node:crypto"
import fs from "node:fs"
import {join, dirname, basename} from "node:path"

function write_hash(file) {
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex")

  const path = join(dirname(file), `.${basename(file)}`)
  fs.writeFileSync(path, hash)
}

import pkg_json from "./package.json" with {type: "json"}

for (const workspace of ["", ...pkg_json.workspaces]) {
  const path = join(workspace, "package.json")
  write_hash(path)
}
