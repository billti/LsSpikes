/// <reference path="d3.d.ts"/>
/// <reference path="../TypeScript/typescriptServices.d.ts"/>

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

        constructor(container: Element, private width: number, height: number) {
            this.svg_g = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .call(
                    d3.behavior.zoom()
                        .scaleExtent([-10, 10])
                        .on("zoom", () => {
                            this.svg_g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
                        })
                )
                .append('g');

            this.treeLayout = d3.layout.tree().nodeSize([200, 100]);
        }

        public render(data) {
            // TODO: D3 typing is wrong here.  Doesn't require a GraphNode as input.
            var graphNodes = this.treeLayout.nodes(data); 
            var graphLinks = this.treeLayout.links(graphNodes);
            var diagonal = d3.svg.diagonal().projection((d) => [d.x + this.width / 2, d.y + 25]);

            var links = this.svg_g.selectAll('path.link')
                .data(graphLinks);
            links.enter().append('path').classed('link', true)
            links.attr('d', diagonal);
            links.exit().remove();

            // TODO: Can the typing make the 'key' callback generic off the first arg to 'data'?
            var selection = this.svg_g.selectAll('g').data(graphNodes, (d, i) => d.id);

            var enterGroup = selection.enter().append('g').classed('astNode', true);

            enterGroup.append('rect')
                .attr('x', (d, i) => d.x + this.width / 2 - d.width / 2 - 5)
                .attr('y', (d, i) => d.y)
                .attr('rx', 20).attr('ry', 20)
                .attr('width', d => d.width + 10)
                .attr('height', 50)
                .classed('isLeaf',(d) => d.isLeaf)
                .classed('isLexical',(d) => d.isLexicalScope)
                .classed('isBlockScoped',(d) => d.isBlockScoped);

            enterGroup.on('mouseover',(d) => tsls.highlightRegion(d.pos, d.end));

            enterGroup.append('text')
                .attr('x', (d, i) => d.x + this.width / 2 )
                .attr('y', (d, i) => d.y + 25 )
                .text((d) => d.text);

            selection.exit().remove();
        }
    }
}