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
  
  function initializeGraph() {
    svg = d3.select('#graph')
        .append('svg')
        .attr('viewBox', '0 0 800 600')
        .style('font', '12px sans-serif');
  
    simulation = d3.forceSimulation(nodesData)
        .force('link', d3.forceLink(linksData).id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('collide', d3.forceCollide(30)) // Prevent node overlap
        .force('x', d3.forceX(400)) // Attract to center x
        .force('y', d3.forceY(300)) // Attract to center y
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
    const nodes = svg.selectAll('circle.node')
        .data(nodesData, d => d.id)
        .join('circle')
        .classed('node', true)
        .attr('r', 10)
        .attr('fill', d => d.type === 'folder' ? 'blue' : 'red')
        .on('click', nodeClicked);
  
    svg.selectAll('text.label')
        .data(nodesData, d => d.id)
        .join('text')
        .classed('label', true)
        .attr('x', 15)
        .attr('y', 5)
        .text(d => d.nodeName)
        .attr('visibility', 'visible');
  
    const links = svg.selectAll('line.link')
        .data(linksData, d => `${d.source.id}-${d.target.id}`)
        .join('line')
        .classed('link', true)
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6);
  
    simulation.nodes(nodesData);
    simulation.force('link').links(linksData);
    simulation.alpha(0.3).restart();
  }
  
  function nodeClicked(event, node) {
    if (node.type === 'folder') {
      toggleFolder(node);
    }
  }
  
function toggleFolder(node) {
    if (node.children.length > 0) {
        // Collapse node
        node.children.forEach(child => collapseNode(child));
        node.children = []; // Reset children array
        updateGraph(); // Make sure to update the graph here
    } else {
        // Expand node
        fetch(`/api/folder_contents/${encodeURIComponent(node.fullPath)}`)
        .then(response => response.json())
        .then(contents => {
            addChildrenToNode(node, contents); // Add children and update the graph
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
    // Remove the node and its links from the data
    nodesData = nodesData.filter(n => n.id !== node.id);
    linksData = linksData.filter(l => l.source.id !== node.id && l.target.id !== node.id);

    // Recursively collapse children nodes if they have children
    if (node.children) {
        node.children.forEach(child => collapseNode(child));
    }
    // Reset the children array after collapsing
    node.children = [];
}

  
function ticked() {
    svg.selectAll('circle.node')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    svg.selectAll('text.label')
        .attr('x', d => d.x + 15)
        .attr('y', d => d.y + 5)
        .attr('visibility', d => d.children && d.children.length ? 'hidden' : 'visible');
    svg.selectAll('line.link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
}
  
initializeGraph();
  