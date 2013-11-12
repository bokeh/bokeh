
test('basic test', function() {
  expect(1);
  ok(0, 'this had better work.');
});


test('can access the DOM', function() {
  expect(1);
  var fixture = document.getElementById('qunit-fixture');
  equal(fixture.innerText, 'this had better work.', 'should be able to access the DOM.');
});
