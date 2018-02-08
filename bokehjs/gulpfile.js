const crypto = require("crypto")
const fs = require("fs")

function is_up_to_date(file) {
  const hash_file = "." + file

  if (!fs.existsSync(hash_file))
    return false

  const old_hash = fs.readFileSync(hash_file)

  const new_hash = crypto.createHash("sha256")
                         .update(fs.readFileSync(file))
                         .digest("hex")

  return old_hash == new_hash
}

if (!is_up_to_date("package.json")) {
  console.log("package.json has changed. Run `npm install`.")
  process.exit(1)
}

require("./ts-node").register({project: "./gulp/tsconfig.json", cache: false});
require("./gulp");
