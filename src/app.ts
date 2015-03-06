/// <reference path="typescriptMode.ts"/>
/// <reference path="../TypeScript/built/local/typescriptServices.d.ts"/>
/// <reference path="codemirror.d.ts"/>

declare var d3Graph: Function;

var myEditor;
var myChart;

window.addEventListener('load', function () {
    myChart = d3Graph('#bindingGraph');
    var editorDiv = document.getElementById('editor');
    myEditor = CodeMirror(editorDiv, {
        value: "class Foo { \
  public age = 42;\
  constructor(public name: string){\
  }\
}\
\
function foo(){\
  if(true){\
    let x = null;\
  }\
  var y = function(){\
    const name = \"test\";\
  }\
}",
        mode: "typescript",
        extraKeys: { "Ctrl-Space": "autocomplete" },
        lineNumbers: true
    });
    tsls.bindEditor(myEditor);
});

interface Graph {
    "name": string;
    "size"?: number;
    "children"?: Array<Graph>;
}

function buildTree(node: ts.Node): Graph {
    var result: Graph = undefined;
    
    var name = getNameForNodesOfInterest(node);

    result = { name: name };

    // Add each child of interest
    ts.forEachChild(node,(child) => {
        var childNode = buildTree(child);
        if (childNode) {
            if (!result.children) result.children = [];
            result.children.push(childNode);
        }
    });

     // Collapse the unnamed nodes.  As this is at the tail end of construction, only one deep is needed (or indeed, possible)
     // When doing forEach over the array, the element and it's index are a snapshot, however the view of the array itself is mutated.
     // Thus, create a new children array to attach to the parent.
    if (result.children) {
        var newChildren = [];
        result.children.forEach((elem, idx, arr) => {
            if (elem.name === undefined) {
                // Replace it with it's children (if they exist), else just drop it.
                if (elem.children) {
                    elem.children.forEach(item => newChildren.push(item));
                }
            } else {
                // Just move it over
                newChildren.push(elem);
            }
        });
        if (newChildren.length > 0) {
            result.children = newChildren;
        } else {
            delete result.children;
        }
    }

    return result;

    function getNameForNodesOfInterest(node: ts.Node): string {
        var looseTs: any = ts; // HACK until internal.d.ts is fixed

        switch (node.kind) {
            case ts.SyntaxKind.AnyKeyword:
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.VariableStatement:
            case ts.SyntaxKind.ExpressionStatement:
            case ts.SyntaxKind.PublicKeyword:
            case ts.SyntaxKind.FirstLiteralToken:
            case ts.SyntaxKind.EndOfFileToken:
                return undefined;
            case ts.SyntaxKind.SourceFile:
                return "File: " + (<ts.SourceFile>node).fileName;
            case ts.SyntaxKind.Block:
                return "Block: ";// + (<ts.SourceFile>node).fileName;
            case ts.SyntaxKind.ClassDeclaration:
                return "Class: " + (<ts.ClassDeclaration>node).name.text;
            case ts.SyntaxKind.Constructor:
                return "constructor: ";
            case ts.SyntaxKind.FunctionDeclaration:
                return "Function: " + (<ts.FunctionDeclaration>node).name.text;
            case ts.SyntaxKind.FunctionExpression:
                var name = (<ts.FunctionExpression>node).name && (<ts.FunctionExpression>node).name.text || "[anon]";
                return "Function: " + name;
            case ts.SyntaxKind.Parameter:
                return "Param: " + (<ts.ParameterDeclaration>node).name.getText(looseTs.getSourceFileOfNode(node));
            case ts.SyntaxKind.VariableDeclaration:
                return "Var: " + (<ts.VariableDeclaration>node).name.getText(looseTs.getSourceFileOfNode(node));
            case ts.SyntaxKind.PropertyDeclaration:
                return "Property: " + (<ts.PropertyDeclaration>node).name.getText(looseTs.getSourceFileOfNode(node));
            default:
                //throw "Unrecognized token kind: " + node.kind;
                console.log("Unrecognized token kind: " + eval("ts.SyntaxKind[node.kind]"));
                return undefined;
        }
    }
}