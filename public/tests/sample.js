// Simple set of example tests

describe("The environment", function () { 
  it("contains the TypeScript object", function () {
    expect(typeof ts.createProgram).toBe("function");
  });
  it("contains the CodeMirror object", function () {
    expect(typeof CodeMirror).toBe("function");
  });
  it("contains the d3 objects", function () {
    expect(typeof d3).toBe("object");
  });
});