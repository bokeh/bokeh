(function() {
  var HelloWorld;

  HelloWorld = (function() {
    function HelloWorld() {}

    HelloWorld.test = 'test';

    return HelloWorld;

  })();

}).call(this);

(function() {
  console.log('hi');

}).call(this);

(function() {
  var sayHello;

  sayHello = function() {
    return console.log('hi');
  };

}).call(this);
