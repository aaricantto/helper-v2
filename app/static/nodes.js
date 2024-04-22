class Node {
    constructor(nodeName, fullPath, type, children = []) {
      this.nodeName = nodeName;
      this.fullPath = fullPath;
      this.type = type;
      this.children = children;
      this.id = fullPath; // Use fullPath for unique identification and as a link reference
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
        linkStrokeColor = '#e5e5e5';
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
        .force('collide', d3.forceCollide(40)) // Prevent node overlap
        .force('x', d3.forceX(600)) // Attract to center x
        .force('y', d3.forceY(450)) // Attract to center y
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
    // Append links first so that nodes appear on top of them
    const links = svg.selectAll('line.link')
        .data(linksData, d => `${d.source.id}-${d.target.id}`)
        .join('line')
        .classed('link', true)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1)
        .lower(); // Ensure links are below nodes

    // Append nodes
    const nodes = svg.selectAll('circle.node')
        .data(nodesData, d => d.id)
        .join(enter => enter.append('circle').classed('node', true)
                            .attr('r', 10)
                            .style('stroke', 'white')
                            .style('stroke-width', 1)
                            .call(dragHandler)  // Apply the drag handler here after entering new nodes
                            .on('click', nodeClicked),
              update => update,
              exit => exit.remove());

    // Append text labels
    const labels = svg.selectAll('text.label')
        .data(nodesData, d => d.id)
        .join(
            enter => enter.append('text')
                           .classed('label', true)
                           .attr('x', 15)
                           .attr('y', 5)
                           .text(d => d.nodeName)
                           .style('user-select', 'none')  // Prevent text selection
                           .style('-moz-user-select', 'none')
                           .style('-webkit-user-select', 'none')
                           .style('-ms-user-select', 'none')
                           .style('pointer-events', 'none')  // Prevent text from capturing mouse events
                           .style('paint-order', 'stroke')  // Ensure the stroke is drawn behind the fill
                           .style('stroke', nodeStrokeColor)
                           .style('fill', selectedNodeColor)
                           .style('stroke-width', '1px')  // Stroke width to create the outline effect
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
        d.selected = !d.selected; // Toggle the selected state

        if (!d.selected) deselectChildren(d);

        toggleFolder(d); // Expand or collapse the folder

    } else if (d.type === 'file') {
        // Toggle the selection state of the file
        if (selectedFiles.has(d.id)) {
            selectedFiles.delete(d.id);
            d.selected = false; // Visually indicate that the file is not selected
        } else {
            selectedFiles.add(d.id);
            d.selected = true; // Visually indicate that the file is selected
        }
    }
    updateLinkColors();
    updateNodeColors(); 

    // Log the set of selected files to the console
    console.log('Selected files:', Array.from(selectedFiles));
}
    


function updateNodeColors() {
    svg.selectAll('circle.node')
        .style('fill', d => {
            // If it's a folder and it's selected, use the selected color
            if (d.type === 'folder') {
                return d.selected ? '#ffa000' : '#ffca28';
            }
            // If it's a file and it's selected, use a different color (e.g., green)
            else if (d.type === 'file') {
                return d.selected ? '#32CD32' : 'red';
            }
            // Default color for files
            return 'red';
        })
        .style('stroke', d => d.selected ? selectedNodeColor : nodeStrokeColor)
        .style('stroke-width', d => d.selected ? 2 : 1);
}


function updateLinkColors() {
    svg.selectAll('line.link')
        .style('stroke', d => {
            if (d.target.selected) {
                return selectedNodeColor; // The link turns black if either the source or target node is selected.
            } else {
                return linkStrokeColor; // Default link color when no nodes are selected.
            }
        })
        .style('stroke-width', d => {
            if (d.target.selected) {
                return 2; // The link's stroke-width increases if either the source or target node is selected.
            } else {
                return 1; // Default link stroke-width.
            }
        });
}


function deselectChildren(node) {
    if (node.children) {
        node.children.forEach(child => {
            child.selected = false;
            if (child.type === 'file') {
                selectedFiles.delete(child.id); // Also remove from the selectedFiles set
            }
            deselectChildren(child); // Recursive call
        });
    }
    updateNodeColors(); // Update the node colors after deselecting children
}

  
function toggleFolder(node) {
    if (node.children.length > 0) {
        // Collapse node
        node.children.forEach(child => collapseNode(child));
        node.children = [];
        updateGraph(); // Make sure to update the graph here
    } else {
        // Expand node
        fetch(`/api/folder_contents/${encodeURIComponent(node.fullPath)}`)
        .then(response => response.json())
        .then(contents => {
            addChildrenToNode(node, contents);
            updateGraph(); // Make sure to update the graph here
            updateLinkColors();
        })
        .catch(error => console.error('Error fetching folder contents:', error));
    }
}


  
function addChildrenToNode(parentNode, contents) {
    // Create nodes for folders and files
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

    updateGraph(); // Update the graph with new nodes and links
}
  


function collapseNode(node) {
    // If it's a file node, simply remove it and its link
    if (node.type === 'file') {
        nodesData = nodesData.filter(n => n.id !== node.id);
        linksData = linksData.filter(l => l.source.id !== node.id && l.target.id !== node.id);
        return; // Exit the function early for file nodes
    }
    // For folder nodes, proceed with existing collapse logic
    if (node.children) {
        node.children.forEach(child => collapseNode(child));
        node.children = [];
    }
    nodesData = nodesData.filter(n => n.id !== node.id);
    linksData = linksData.filter(l => l.source.id !== node.id && l.target.id !== node.id);
}

function dragStart(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; // fx is the fixed x position
    d.fy = d.y; // fy is the fixed y position
}

// While dragging, update the position of the node and its label
function dragging(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

// When drag ends, re-enable the simulation if needed and clear the fixed positions
function dragEnd(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; // Clear the fixed x position
    d.fy = null; // Clear the fixed y position
}

  
function ticked() {
    const radius = 10; // Assuming the radius of nodes is 10
    const margin = radius + 2; // Little extra margin from the edge

    svg.selectAll('circle.node')
        .attr('cx', d => d.x = Math.max(margin, Math.min(1200 - margin, d.x)))
        .attr('cy', d => d.y = Math.max(margin, Math.min(900 - margin, d.y)));

    svg.selectAll('text.label')
        .attr('x', d => d.x + 15)
        .attr('y', d => d.y + 5)
        .attr('visibility', 'visible')
        // Shift the text-anchor and alignment-baseline based on the node's position
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
  