const crypto = require("crypto")
const fs = require("fs")

function write_hash(file) {
  const hash = crypto.createHash("sha256")
                     .update(fs.readFileSync(file))
                     .digest("hex")

  fs.writeFileSync("." + file, hash)
}

write_hash("package.json")
