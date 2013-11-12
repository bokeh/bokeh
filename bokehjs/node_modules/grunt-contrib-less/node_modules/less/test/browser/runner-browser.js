describe("less.js browser behaviour", function() {
    testLessEqualsInDocument();
    
    it("has some log messages", function() {
        expect(logMessages.length).toBeGreaterThan(0);
    });
});