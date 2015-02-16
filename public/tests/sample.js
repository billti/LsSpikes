// Simple set of example tests

describe("The environment", function () { 
  it("contains the TypeScript objects", function () {
    expect(typeof ts.createProgram).toBe("function");
  });
  it("contains the CodeMirror objects", function () {
    expect(typeof CodeMirror).toBe("function");
  });
});