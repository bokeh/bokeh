var path = require('path'),
    sys = require('util'),
    url = require('url'),
    request,
    fs = require('fs');

var less = {
    version: [1, 4, 2],
    Parser: require('./parser').Parser,
    importer: require('./parser').importer,
    tree: require('./tree'),
    render: function (input, options, callback) {
        options = options || {};

        if (typeof(options) === 'function') {
            callback = options, options = {};
        }

        var parser = new(less.Parser)(options),
            ee;

        if (callback) {
            parser.parse(input, function (e, root) {
                callback(e, root && root.toCSS && root.toCSS(options));
            });
        } else {
            ee = new(require('events').EventEmitter);

            process.nextTick(function () {
                parser.parse(input, function (e, root) {
                    if (e) { ee.emit('error', e) }
                    else   { ee.emit('success', root.toCSS(options)) }
                });
            });
            return ee;
        }
    },
    formatError: function(ctx, options) {
        options = options || {};

        var message = "";
        var extract = ctx.extract;
        var error = [];
        var stylize = options.color ? require('./lessc_helper').stylize : function (str) { return str };

        // only output a stack if it isn't a less error
        if (ctx.stack && !ctx.type) { return stylize(ctx.stack, 'red') }

        if (!ctx.hasOwnProperty('index') || !extract) {
            return ctx.stack || ctx.message;
        }

        if (typeof(extract[0]) === 'string') {
            error.push(stylize((ctx.line - 1) + ' ' + extract[0], 'grey'));
        }

        if (typeof(extract[1]) === 'string') {
            var errorTxt = ctx.line + ' ';
            if (extract[1]) {
                errorTxt += extract[1].slice(0, ctx.column) +
                                stylize(stylize(stylize(extract[1][ctx.column], 'bold') +
                                extract[1].slice(ctx.column + 1), 'red'), 'inverse');
            }
            error.push(errorTxt);
        }

        if (typeof(extract[2]) === 'string') {
            error.push(stylize((ctx.line + 1) + ' ' + extract[2], 'grey'));
        }
        error = error.join('\n') + stylize('', 'reset') + '\n';

        message += stylize(ctx.type + 'Error: ' + ctx.message, 'red');
        ctx.filename && (message += stylize(' in ', 'red') + ctx.filename +
                stylize(' on line ' + ctx.line + ', column ' + (ctx.column + 1) + ':', 'grey'));

        message += '\n' + error;

        if (ctx.callLine) {
            message += stylize('from ', 'red') + (ctx.filename || '') + '/n';
            message += stylize(ctx.callLine, 'grey') + ' ' + ctx.callExtract + '/n';
        }

        return message;
    },
    writeError: function (ctx, options) {
        options = options || {};
        if (options.silent) { return }
        sys.error(less.formatError(ctx, options));
    }
};

['color',      'directive',  'operation',          'dimension',
 'keyword',    'variable',   'ruleset',            'element',
 'selector',   'quoted',     'expression',         'rule',
 'call',       'url',        'alpha',              'import',
 'mixin',      'comment',    'anonymous',          'value',
 'javascript', 'assignment', 'condition',          'paren',
 'media',      'unicode-descriptor', 'negative',   'extend'
].forEach(function (n) {
    require('./tree/' + n);
});


var isUrlRe = /^(?:https?:)?\/\//i;

less.Parser.importer = function (file, currentFileInfo, callback, env) {
    var pathname, dirname, data,
        newFileInfo = {
            relativeUrls: env.relativeUrls,
            entryPath: currentFileInfo.entryPath,
            rootpath: currentFileInfo.rootpath,
            rootFilename: currentFileInfo.rootFilename
        };

    function parseFile(e, data) {
        if (e) { return callback(e); }

        env = new less.tree.parseEnv(env);
        env.processImports = false;
        
        var j = file.lastIndexOf('/');

        // Pass on an updated rootpath if path of imported file is relative and file 
        // is in a (sub|sup) directory
        // 
        // Examples: 
        // - If path of imported file is 'module/nav/nav.less' and rootpath is 'less/',
        //   then rootpath should become 'less/module/nav/'
        // - If path of imported file is '../mixins.less' and rootpath is 'less/', 
        //   then rootpath should become 'less/../'
        if(newFileInfo.relativeUrls && !/^(?:[a-z-]+:|\/)/.test(file) && j != -1) {
            var relativeSubDirectory = file.slice(0, j+1);
            newFileInfo.rootpath = newFileInfo.rootpath + relativeSubDirectory; // append (sub|sup) directory path of imported file
        }
        newFileInfo.currentDirectory = pathname.replace(/[^\\\/]*$/, "");
        newFileInfo.filename = pathname;

        env.contents[pathname] = data;      // Updating top importing parser content cache.
        env.currentFileInfo = newFileInfo;
        new(less.Parser)(env).parse(data, function (e, root) {
            callback(e, root, pathname);
        });
    };
    
    var isUrl = isUrlRe.test( file );
    if (isUrl || isUrlRe.test(currentFileInfo.currentDirectory)) {
        if (request === undefined) {
            try { request = require('request'); }
            catch(e) { request = null; }
        }
        if (!request) {
            callback({ type: 'File', message: "optional dependency 'request' required to import over http(s)\n" });
            return;
        }

        var urlStr = isUrl ? file : url.resolve(currentFileInfo.currentDirectory, file),
            urlObj = url.parse(urlStr),
            req = {
                host:   urlObj.hostname,
                port:   urlObj.port || 80,
                path:   urlObj.pathname + (urlObj.search||'')
            };

        request.get(urlStr, function (error, res, body) {
            if (res.statusCode === 404) {
                callback({ type: 'File', message: "resource '" + urlStr + "' was not found\n" });
                return;
            }
            if (!body) {
                sys.error( 'Warning: Empty body (HTTP '+ res.statusCode + ') returned by "' + urlStr +'"' );
            }
            if (error) {
                callback({ type: 'File', message: "resource '" + urlStr + "' gave this Error:\n  "+ error +"\n" });
            }
            pathname = urlStr;
            dirname = urlObj.protocol +'//'+ urlObj.host + urlObj.pathname.replace(/[^\/]*$/, '');
            parseFile(null, body);
        });
    } else {

        var paths = [currentFileInfo.currentDirectory].concat(env.paths);
        paths.push('.');

        for (var i = 0; i < paths.length; i++) {
            try {
                pathname = path.join(paths[i], file);
                fs.statSync(pathname);
                break;
            } catch (e) {
                pathname = null;
            }
        }
        
        if (!pathname) {

            callback({ type: 'File', message: "'" + file + "' wasn't found" });
            return;
        }
        
        dirname = path.dirname(pathname);

        if (env.syncImport) {
            try {
                data = fs.readFileSync(pathname, 'utf-8');
                parseFile(null, data);
            } catch (e) {
                parseFile(e);
            }
        } else {
            fs.readFile(pathname, 'utf-8', parseFile);
        }
    }
}

require('./env');
require('./functions');
require('./colors');
require('./visitor.js');
require('./import-visitor.js');
require('./extend-visitor.js');
require('./join-selector-visitor.js');

for (var k in less) { exports[k] = less[k]; }
