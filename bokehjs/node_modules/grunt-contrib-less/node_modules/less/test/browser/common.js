/*if not async then phantomjs fails to run the webserver and the test concurrently*/
var less = { async: true, strictMath: true };

/* record log messages for testing */
var logMessages = [],
    realConsoleLog = console.log;
console.log = function(msg) {
    logMessages.push(msg);
    realConsoleLog.call(console, msg);
};

var testLessEqualsInDocument = function() {
    testLessInDocument(testSheet);
};

var testLessErrorsInDocument = function() {
    testLessInDocument(testErrorSheet);
};

var testLessInDocument = function(testFunc) {
    var links = document.getElementsByTagName('link'),
        typePattern = /^text\/(x-)?less$/;

    for (var i = 0; i < links.length; i++) {
        if (links[i].rel === 'stylesheet/less' || (links[i].rel.match(/stylesheet/) &&
           (links[i].type.match(typePattern)))) {
            testFunc(links[i]);
        }
    }
};

var testSheet = function(sheet) {
    it(sheet.id + " should match the expected output", function() {
        var lessOutputId =  sheet.id.replace("original-", ""),
            expectedOutputId = "expected-" + lessOutputId,
            lessOutput = document.getElementById(lessOutputId).innerText,
            expectedOutputHref = document.getElementById(expectedOutputId).href,
            expectedOutput = loadFile(expectedOutputHref);

        waitsFor(function() {
            return expectedOutput.loaded;
        }, "failed to load expected outout", 10000);
        
        runs(function() {
            // use sheet to do testing
            expect(lessOutput).toEqual(expectedOutput.text);
        });
    });
};

var testErrorSheet = function(sheet) {
    it(sheet.id + " should match an error", function() {
        var lessHref =  sheet.href,
            id = sheet.id.replace(/^original-less:/, "less-error-message:"),
            errorHref = lessHref.replace(/.less$/, ".txt"),
            errorFile = loadFile(errorHref),
            actualErrorElement = document.getElementById(id),
            actualErrorMsg;

        describe("the error", function() {
            expect(actualErrorElement).not.toBe(null);
        });
            
        actualErrorMsg = actualErrorElement.innerText
                .replace(/\n\d+/g, function(lineNo) { return lineNo + " "; })
                .replace(/\n\s*in /g, " in ")
                .replace("\n\n", "\n");

        waitsFor(function() {
            return errorFile.loaded;
        }, "failed to load expected outout", 10000);
        
        runs(function() {
            var errorTxt = errorFile.text
                .replace("{path}", "")
                .replace("{pathrel}", "")
                .replace("{pathhref}", "http://localhost:8081/less/errors/")
                .replace("{404status}", " (404)");
            expect(actualErrorMsg).toEqual(errorTxt);
            if (errorTxt == actualErrorMsg) {
                actualErrorElement.style.display = "none";
            }
        });
    });
};

var loadFile = function(href) {
    var request = new XMLHttpRequest(),
        response = { loaded: false, text: ""};
    request.open('GET', href, true);
    request.onload = function(e) {
        response.text = request.response.replace(/\r/g, "");
        response.loaded = true;
    }
    request.send();
    return response;
};

(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var htmlReporter = new jasmine.HtmlReporter();

  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  var currentWindowOnload = window.onload;

  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }
    execJasmine();
  };

  function execJasmine() {
    setTimeout(function() {
        jasmineEnv.execute();
    }, 3000);
  }

})();