/// <reference path="d3.d.ts"/>
/// <reference path="../TypeScript/built/local/typescriptServices.d.ts"/>

module d3Parts {
    export interface AstNode {
        id: number;
        text: string;
        kind: ts.SyntaxKind;
        children: AstNode[];
    }

    export class AstGraph {
        svg_g: D3.Selection;
        treeNodes: AstNode;
        treeLayout: D3.Layout.TreeLayout;

        private static scale = 125;

        constructor(container: HTMLDivElement, width: number, height: number) {
            this.svg_g = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .call(
                    d3.behavior.zoom()
                        .scaleExtent([1, 10])
                        .on("zoom", () => {
                            this.svg_g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
                        })
                )
                .append('g');

            // Mock data for now
            this.treeNodes = {
                id: 0,
                text: "file1.ts",
                kind: ts.SyntaxKind.SourceFile,
                children: [
                    {
                        id: 1,
                        text: "class",
                        kind: ts.SyntaxKind.ClassDeclaration,
                        children: null
                    }, {
                        id: 2,
                        text: "var",
                        kind: ts.SyntaxKind.VariableDeclaration,
                        children: null
                    }
                ]
            };

            this.treeLayout = d3.layout.tree();
        }

        public render() {
            // TODO: D3 typing is wrong here.  Doesn't require a GraphNode as input.
            var graphNodes = this.treeLayout.nodes(<any>(this.treeNodes)); 

            // TODO: Can the typing make the 'key' callback generic off the first arg to 'data'?
            var selection = this.svg_g.selectAll('g').data(graphNodes, (d, i) => d.id);

            var enterGroup = selection.enter().append('g').classed('astNode', true);

            enterGroup.append('rect')
                .attr('x', (d, i) => d.x * AstGraph.scale * 2)
                .attr('y', (d, i) => d.y * AstGraph.scale + 10)
                .attr('rx', 20).attr('ry', 20)
                .attr('width', 100).attr('height', 50);

            enterGroup.append('text')
                .style('fill', 'blue')
                .style('font-family', 'consolas')
                .style('font-size', '12px')
                .attr('x', (d, i) => d.x * AstGraph.scale * 2 + 45 )
                .attr('y', (d, i) => d.y * AstGraph.scale + 25 )
                .text( (d) => d.text );
        }
    }
}