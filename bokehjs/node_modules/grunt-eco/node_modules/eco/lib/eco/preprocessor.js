(function() {
  var Preprocessor, Scanner, repeat, sys;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Scanner = require("./scanner").Scanner;
  repeat = require("./util").repeat;
  sys = require("sys");
  exports.preprocess = function(source) {
    var preprocessor;
    preprocessor = new Preprocessor(source);
    return preprocessor.preprocess();
  };
  exports.Preprocessor = Preprocessor = (function() {
    function Preprocessor(source) {
      this.scanner = new Scanner(source);
      this.output = "";
      this.level = 0;
      this.options = {};
      this.captures = [];
    }
    Preprocessor.prototype.preprocess = function() {
      while (!this.scanner.done) {
        this.scanner.scan(__bind(function(token) {
          return this[token[0]].apply(this, token.slice(1));
        }, this));
      }
      return this.output;
    };
    Preprocessor.prototype.record = function(line) {
      this.output += repeat("  ", this.level);
      return this.output += line + "\n";
    };
    Preprocessor.prototype.printString = function(string) {
      if (string.length) {
        return this.record("_print _safe " + (sys.inspect(string)));
      }
    };
    Preprocessor.prototype.beginCode = function(options) {
      return this.options = options;
    };
    Preprocessor.prototype.recordCode = function(code) {
      if (code !== "end") {
        if (this.options.print) {
          if (this.options.safe) {
            return this.record("_print _safe " + code);
          } else {
            return this.record("_print " + code);
          }
        } else {
          return this.record(code);
        }
      }
    };
    Preprocessor.prototype.indent = function(capture) {
      this.level++;
      if (capture) {
        this.record("_capture " + capture);
        this.captures.unshift(this.level);
        return this.indent();
      }
    };
    Preprocessor.prototype.dedent = function() {
      this.level--;
      if (this.level < 0) {
        this.fail("unexpected dedent");
      }
      if (this.captures[0] === this.level) {
        this.captures.shift();
        return this.dedent();
      }
    };
    Preprocessor.prototype.fail = function(message) {
      throw "Parse error on line " + this.scanner.lineNo + ": " + message;
    };
    return Preprocessor;
  })();
}).call(this);
