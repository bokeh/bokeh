# bower-logger [![Build Status](https://secure.travis-ci.org/bower/logger.png?branch=master)](http://travis-ci.org/bower/logger)

The logger used in the various architecture components of Bower.


## Usage

### .error(id, message, data)

Alias to `.log('error', id. message, data)`


### .conflict(id, message, data)

Alias to `.log('conflict', id. message, data)`


### .warn(id, message, data)

Alias to `.log('warn', id. message, data)`


### .action(id, message, data)

Alias to `.log('action', id. message, data)`


### .info(id, message, data)

Alias to `.log('info', id. message, data)`


### .debug(id, message, data)

Alias to `.log('debug', id. message, data)`


### .log(level, id, message, data)

Emits a `log` event, with an object like so:

```js
logger.log('warn', 'foo', 'bar', { dog: 'loves cat' })
{
    level: 'warn',
    id: 'foo',
    message: 'bar',
    data: {
        dog: 'loves cat'
    }
}
```


### .pipe(logger)

Pipes all logger events to another logger.   
Basically all events emitted with `.emit()` will get piped.


### .geminate()

Creates a new logger that pipes events to the parent logger.   
Alias for `(new Logger()).pipe(logger)`.


### .intercept(fn)

Intercepts `log` events, calling `fn` before listeners of the instance.


### #LEVELS

A static property that contains an object where keys are the recognized log levels and values their importance.   
The higher the importance, the more important the level is.


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
