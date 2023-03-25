const crypto = require("crypto")
const fs = require("fs")
const {join, dirname, basename} = require("path")

function write_hash(file) {
  const hash = crypto.createHash("sha256")
                     .update(fs.readFileSync(file))
                     .digest("hex")

  const path = join(dirname(file), `.${basename(file)}`)
  fs.writeFileSync(path, hash)
}

const {workspaces} = require("./package.json")

for (const workspace of ["", ...workspaces]) {
  const path = join(workspace, "package.json")
  write_hash(path)
}
