/// <reference path="d3parts.ts"/>
/// <reference path="typescriptMode.ts"/>
/// <reference path="../TypeScript/typescript.d.ts"/>
/// <reference path="../TypeScript/typescriptServices.d.ts"/>
/// <reference path="../TypeScript/typescript_internal.d.ts"/>
/// <reference path="codemirror.d.ts"/>

declare var d3Graph: Function;

var myEditor;
var myChart: d3Parts.AstGraph;

window.addEventListener('load', function () {
    //myChart = d3Graph('#bindingGraph');
    var astGraph = document.querySelector('#bindingGraph');
    myChart = new d3Parts.AstGraph(astGraph, 600, 600);
    var editorDiv = document.getElementById('editor');
    myEditor = CodeMirror(editorDiv, {
        value: "// TODO: Write some TypeScript",
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

interface AstNode {
    id: number;
    text: string;
    pos: number;
    end: number;
    width: number;
    isLeaf: boolean;
    kind: ts.SyntaxKind;
    children: AstNode[];
    isLexicalScope?: boolean;
    isBlockScoped?: boolean;
    classes?: string;
}

var nodeId = 0;
function buildAstFromNode(node: ts.Node): AstNode {
    // Set node defaults
    var thisNode: AstNode = {
        id: ++nodeId, text: "", pos: node.pos, end: node.end, width: 0, isLeaf: true, kind: node.kind, children: null
    };

    var looseTs: any = ts; // HACK until internal.d.ts is fixed
    switch (node.kind) {
        case ts.SyntaxKind.SourceFile:
            thisNode.text = (<ts.SourceFile>node).fileName;
            break;
        case ts.SyntaxKind.Block:
            thisNode.text = "Block"
            break;
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NullKeyword:
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:
        case ts.SyntaxKind.FirstLiteralToken:
        case ts.SyntaxKind.PublicKeyword:
        case ts.SyntaxKind.StringKeyword:
            thisNode.text = node.getText();
            break;
        case ts.SyntaxKind.Identifier:
            thisNode.text = "id '" + node.getText() + "'";
            break;
        case ts.SyntaxKind.ClassDeclaration:
            thisNode.text = "class decl";
            break;
        case ts.SyntaxKind.Constructor:
            thisNode.text = "constructor";
            break;
        case ts.SyntaxKind.FunctionDeclaration:
            thisNode.text = "fn decl";
            break;
        case ts.SyntaxKind.FunctionExpression:
            var name = (<ts.FunctionExpression>node).name && (<ts.FunctionExpression>node).name.text || "<anon>";
            thisNode.text = "fn expr '" + name + "'";
            break;
        case ts.SyntaxKind.Parameter:
            thisNode.text = "param";
            break;
        case ts.SyntaxKind.VariableDeclaration:
            thisNode.text = "var decl";
            if (looseTs.isLet(node)) {
                thisNode.text = "let decl";
            }
            if (looseTs.isConst(node)) {
                thisNode.text = "const decl";
            }
            if (looseTs.isCatchClauseVariableDeclaration(<any>node)) {
                thisNode.text = "catch decl";
            }
            break;
        case ts.SyntaxKind.PropertyDeclaration:
            thisNode.text = "prop decl";
            break;
        case ts.SyntaxKind.PropertyAccessExpression:
            thisNode.text = "prop access";
            break;
        case ts.SyntaxKind.CallExpression:
            thisNode.text = "call expr";
            break;
        case ts.SyntaxKind.DotToken:
            thisNode.text = "'.'";
            break;
        case ts.SyntaxKind.IfStatement:
            thisNode.text = "if";
            break;
        case ts.SyntaxKind.VariableStatement:
            thisNode.text = "var";
            break;
        case ts.SyntaxKind.WhileStatement:
            thisNode.text = "while";
            break;
        case ts.SyntaxKind.TryStatement:
            thisNode.text = "try";
            break;
        case ts.SyntaxKind.TryKeyword:
            thisNode.text = "'try'";
            break;
        case ts.SyntaxKind.ThrowStatement:
            thisNode.text = "throw";
            break;
        case ts.SyntaxKind.CatchClause:
            thisNode.text = "catch";
            break;
        case ts.SyntaxKind.BreakStatement:
            thisNode.text = "break";
            break;
        case ts.SyntaxKind.ReturnStatement:
            thisNode.text = "return";
            break;
        case ts.SyntaxKind.VariableDeclarationList:
            thisNode.text = "var decl list";
            break;
        case ts.SyntaxKind.BinaryExpression:
            thisNode.text = "binExpr";
            break;
        case ts.SyntaxKind.EqualsEqualsToken:
            thisNode.text = "==";
            break;
        case ts.SyntaxKind.EndOfFileToken:
            thisNode.text = "<EOF>";
            break;
        default:
            //throw "Unrecognized token kind: " + node.kind;
            var nodeKind = looseTs.SyntaxKind[node.kind];
            var looseNode: any = node;
            if (looseNode.name && looseNode.name.text) nodeKind += (": " + looseNode.name.text);
            console.log("Unrecognized token kind: " + nodeKind + ". getText() = " + node.getText());
            thisNode.text = nodeKind;
            break;
    }

    // Recurse for each child
    ts.forEachChild(node, (childNode) => {
        (thisNode.children || (thisNode.children = [])).push(buildAstFromNode(childNode));
    })

    thisNode.width = thisNode.text.length * 10;

    if (thisNode.children) thisNode.isLeaf = false;
    if (looseTs.nodeStartsNewLexicalEnvironment(node)) thisNode.isLexicalScope = true;
    if (looseTs.isBlockOrCatchScoped(<any>node)) thisNode.isBlockScoped = true;

    return thisNode;
}
