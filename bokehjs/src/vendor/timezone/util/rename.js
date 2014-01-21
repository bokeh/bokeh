var uglify = require('uglify-js')
  , jsp = uglify.parser
  , pro = uglify.uglify
  , fs = require('fs')
  , src = fs.readFileSync(process.argv[2], "utf8")
  , ast = jsp.parse(src)
  , seen = {}
  , exclude = 'Array|Date|Error|Math|Object|RegExp|String|arguments|define|definition|isNaN|module|null|this'.split('|')
  , base54alpha = "_$" + "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  , i = 0
  , replacements = {}
  ;

/* No joy. */

//console.log(JSON.stringify(ast, null, 1));
//process.exit(1);

function visit (node, visitor) {
  if (Array.isArray(node)) {
    visitor(node);
    node.forEach(function (node) { visit(node, visitor) });
  }
}

function base54 (number) {
  var rebased = "", chars = String(number);
  do {
    rebased = base54alpha[number % 54] + rebased;
    number = Math.floor(number / 54);
  } while (number != 0);
  return rebased;
}

visit(ast, function (node) {
  if (node[0] == 'name') seen[node[1]] = true;
  else if (node[0] == 'var') node[1].forEach(function (node) { seen[node[0]] = true })
  else if (node[0] == 'defun') {
    seen[node[1]] = true;
    node[2].forEach(function (name) { seen[name] = true })
  }
  else if (node[0] == 'function') {
    node[2].forEach(function (name) { seen[name] = true })
  }
});

if (process.argv[3]) {
  Object.keys(seen).sort().forEach(function (name) {
    if (!~exclude.indexOf(name)) {
      console.log(name, base54(i++));
    }
  });
} else {
  Object.keys(seen).sort().forEach(function (name) {
    if (!~exclude.indexOf(name)) {
      replacements[name] = base54(i++);
    }
  });
  visit(ast, function (node) {
    if (node[0] == 'name' && replacements[node[1]]) node[1] = replacements[node[1]];
    else if (node[0] == 'var') node[1].forEach(function (node) {
      if (replacements[node[0]]) node[0] = replacements[node[0]];
    })
    else if (node[0] == 'defun') {
      node[1] = replacements[node[1]];
      node[2] = node[2].map(function (name) { return replacements[name] });
    }
    else if (node[0] == 'function') {
      try {
        node[2] = node[2].map(function (name) {
          if (!replacements[name]) throw new Error(name);
          return replacements[name]
        });
      } catch (e) {
      }
    }
  });
/*console.log(JSON.stringify(ast, null, 1));
process.exit(1);*/
  console.log(pro.gen_code(ast, { beautify: true }));
}
