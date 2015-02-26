/// <reference path="../public/scripts/typescriptServices.d.ts"/>

//interface Scope {
//    name: string;
//    members: Array<string>;
//    childScopes: Array<Scope>;
//}

//function getScopeForNode(node: ts.Node): Scope {
//    if (!node.symbol) return null;

//    var result: Scope = {
//        name: node.symbol.name,
//        members: [],
//        childScopes: undefined
//    };

//    if (node.locals) {
//        for (var sym in node.locals) {
//            result.members.push(node.locals[sym].name);
//        }
//    }

//    if (node.symbol.flags & ts.SymbolFlags.IsContainer) {
//        result.childScopes = [];
//        ts.forEachChild(node,(n) => {
//            if (n.symbol.flags & ts.SymbolFlags.IsContainer) {
//                result.childScopes.push(getScopeForNode(n));
//            }
//        });
//    }
//    return result;
//}

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
                    newChildren = newChildren.concat.apply(newChildren, elem.children);
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
                return "Param: " + (<ts.ParameterDeclaration>node).name.getText(ts.getSourceFileOfNode(node));
            case ts.SyntaxKind.VariableDeclaration:
                return "Var: " + (<ts.VariableDeclaration>node).name.getText(ts.getSourceFileOfNode(node));
            case ts.SyntaxKind.PropertyDeclaration:
                return "Property: " + (<ts.PropertyDeclaration>node).name.getText(ts.getSourceFileOfNode(node));
            default:
                //throw "Unrecognized token kind: " + node.kind;
                console.log("Unrecognized token kind: " + eval("ts.SyntaxKind[node.kind]"));
                return undefined;
        }
    }
}