class Node {
    constructor(nodeName, fullPath, type, children = []) {
    this.nodeName = nodeName;
    this.fullPath = fullPath;
    this.type = type;
    this.children = children;
    this.id = fullPath; 
    }
}

let nodesData = [];
let linksData = [];
let svg, simulation;
let selectedFiles = new Set();

let nodeStrokeColor = '#ffffff';
let linkStrokeColor = '#999999';
let selectedNodeColor = '#000000';

function updateColorVariables(theme) {
    if (theme === 'dark') {
        nodeStrokeColor = '#1a1a1a';
        linkStrokeColor = '#ffffff';
        selectedNodeColor = '#ffffff';
    } else {
        nodeStrokeColor = '#ffffff';
        linkStrokeColor = '#999999';
        selectedNodeColor = '#000000';
    }
}

function initializeGraph() {
    svg = d3.select('#graph')
        .append('svg')
        .attr('viewBox', '0 0 1200 900')
        .style('font', '12px sans-serif');

    simulation = d3.forceSimulation(nodesData)
        .force('link', d3.forceLink(linksData).id(d => d.id).distance(50).strength(1))
        .force('charge', d3.forceManyBody().strength(-1000)) 
        .force('collide', d3.forceCollide(40)) 
        .force('x', d3.forceX(600)) 
        .force('y', d3.forceY(450)) 
        .on('tick', ticked);

    loadBaseNode();
}

function loadBaseNode() {
    fetch('/api/base')
        .then(response => response.json())
        .then(baseFolderPath => {
            const baseFolderName = baseFolderPath.split(/[/\\]/).pop();
            const baseNode = new Node(baseFolderName, baseFolderPath, 'folder');
            nodesData.push(baseNode);
            updateGraph();
        })
        .catch(error => console.error('Error fetching base folder:', error));
}

function updateGraph() {

    const links = svg.selectAll('line.link')
        .data(linksData, d => `${d.source.id}-${d.target.id}`)
        .join('line')
        .classed('link', true)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1)
        .lower(); 

    const nodes = svg.selectAll('circle.node')
        .data(nodesData, d => d.id)
        .join(enter => enter.append('circle').classed('node', true)
                            .attr('r', 10)
                            .style('stroke', nodeStrokeColor)
                            .style('stroke-width', 1)
                            .call(dragHandler)  
                            .on('click', nodeClicked),
              update => update,
              exit => exit.remove());

    const labels = svg.selectAll('text.label')
        .data(nodesData, d => d.id)
        .join(
            enter => enter.append('text')
                           .classed('label', true)
                           .attr('x', 15)
                           .attr('y', 5)
                           .text(d => d.nodeName)
                           .style('user-select', 'none')  
                           .style('-moz-user-select', 'none')
                           .style('-webkit-user-select', 'none')
                           .style('-ms-user-select', 'none')
                           .style('pointer-events', 'none')  
                           .style('paint-order', 'stroke')  
                           .style('stroke', nodeStrokeColor)
                           .style('fill', selectedNodeColor)
                           .style('stroke-width', '1px')  
                           .style('stroke-linecap', 'butt')
                           .style('stroke-linejoin', 'miter')
                           .style('font', d => (d.selected) ? 'bold 14px sans-serif' : '12px sans-serif'),
            update => update
                      .attr('x', d => d.x + 15)
                      .attr('y', d => d.y + 5)
                      .style('font', d => (d.selected) ? 'bold 14px sans-serif' : '12px sans-serif'),
            exit => exit.remove()
        );

    updateLinkColors()
    updateNodeColors();
    simulation.nodes(nodesData);
    simulation.force('link').links(linksData);
    simulation.alpha(0.3).restart();
}

const dragHandler = d3.drag()
    .on("start", dragStart)
    .on("drag", dragging)
    .on("end", dragEnd);

function nodeClicked(event, d) {
    if (d.type === 'folder') {
        d.selected = !d.selected; 

        if (!d.selected) deselectChildren(d);

        toggleFolder(d); 

    } else if (d.type === 'file') {

        if (selectedFiles.has(d.id)) {
            selectedFiles.delete(d.id);
            d.selected = false; 
        } else {
            selectedFiles.add(d.id);
            d.selected = true; 
        }
    }
    updateLinkColors();
    updateNodeColors(); 
}

function updateNodeColors() {
    svg.selectAll('circle.node')
        .style('fill', d => {

            if (d.type === 'folder') {
                return d.selected ? '#ffa000' : '#ffca28';
            }

            else if (d.type === 'file') {
                return d.selected ? '#32CD32' : 'red';
            }

            return 'red';
        })
        .style('stroke', d => d.selected ? selectedNodeColor : nodeStrokeColor)
        .style('stroke-width', d => d.selected ? 2 : 1);
}

function updateLinkColors() {
    svg.selectAll('line.link')
        .style('stroke', d => {
            if (d.target.selected) {
                return selectedNodeColor; 
            } else {
                return linkStrokeColor; 
            }
        })
        .style('stroke-width', d => {
            if (d.target.selected) {
                return 2; 
            } else {
                return 1; 
            }
        });
}

function deselectChildren(node) {
    if (node.children) {
        node.children.forEach(child => {
            child.selected = false;
            if (child.type === 'file') {
                selectedFiles.delete(child.id); 
            }
            deselectChildren(child); 
        });
    }
    updateNodeColors(); 
}

function toggleFolder(node) {
    if (node.children.length > 0) {

        node.children.forEach(child => collapseNode(child));
        node.children = [];
        updateGraph(); 
    } else {

        fetch(`/api/folder_contents/${encodeURIComponent(node.fullPath)}`)
        .then(response => response.json())
        .then(contents => {
            addChildrenToNode(node, contents);
            updateGraph(); 
            updateLinkColors();
        })
        .catch(error => console.error('Error fetching folder contents:', error));
    }
}

function addChildrenToNode(parentNode, contents) {

    contents.folders.forEach(folderName => {
        const childFullPath = `${parentNode.fullPath}/${folderName}`;
        const childNode = new Node(folderName, childFullPath, 'folder');
        parentNode.children.push(childNode);
        nodesData.push(childNode);
        linksData.push({ source: parentNode.id, target: childNode.id });
    });

    contents.files.forEach(fileName => {
        const childFullPath = `${parentNode.fullPath}/${fileName}`;
        const childNode = new Node(fileName, childFullPath, 'file');
        parentNode.children.push(childNode);
        nodesData.push(childNode);
        linksData.push({ source: parentNode.id, target: childNode.id });
    });

    updateGraph(); 
}

function collapseNode(node) {

    if (node.type === 'file') {
        nodesData = nodesData.filter(n => n.id !== node.id);
        linksData = linksData.filter(l => l.source.id !== node.id && l.target.id !== node.id);
        return; 
    }

    if (node.children) {
        node.children.forEach(child => collapseNode(child));
        node.children = [];
    }
    nodesData = nodesData.filter(n => n.id !== node.id);
    linksData = linksData.filter(l => l.source.id !== node.id && l.target.id !== node.id);
}

function dragStart(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; 
    d.fy = d.y; 
}

function dragging(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnd(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; 
    d.fy = null; 
}

function ticked() {
    const radius = 10; 
    const margin = radius + 2; 

    svg.selectAll('circle.node')
        .attr('cx', d => d.x = Math.max(margin, Math.min(1200 - margin, d.x)))
        .attr('cy', d => d.y = Math.max(margin, Math.min(900 - margin, d.y)));

    svg.selectAll('text.label')
        .attr('x', d => d.x + 15)
        .attr('y', d => d.y + 5)
        .attr('visibility', 'visible')

        .style('font', d => (d.selected) ? 'bold 14px sans-serif' : '12px sans-serif')
        .style('stroke', nodeStrokeColor)
        .style('fill', selectedNodeColor)
        .raise();

    svg.selectAll('line.link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => Math.max(margin, Math.min(1200 - margin, d.target.x)))
        .attr('y2', d => Math.max(margin, Math.min(900 - margin, d.target.y)));
}

initializeGraph();