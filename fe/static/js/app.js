const socket = new WebSocket("ws://localhost:8080/ws");

// Set up dimensions and configuration
const width = 800;
const height = 400;

const svg = d3
  .select("#heatmap")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

let functionData = {};
let nodesData = [];

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log(data);
  const newData = updateFunctionData(data);
  if (newData.length > 0) {
    updateBubblePlot(newData);
  }
};

function updateFunctionData(data) {
  let newData = [];
  for (const item of data) {
    if (!functionData[item.function_name]) {
      functionData[item.function_name] = item.duration;
      newData.push({
        function_name: item.function_name,
        duration: item.duration,
      });
    } else {
      functionData[item.function_name] += item.duration;
    }
  }
  //   console.log(functionData);
  return newData;
}

const maxSize = 50;
const sizeScale = d3.scaleLinear().range([5, maxSize]);

const simulation = d3
  .forceSimulation(nodesData)
  .force("charge", d3.forceManyBody().strength(10))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force(
    "collision",
    d3.forceCollide().radius((d) => sizeScale(d.duration))
  )
  .on("tick", ticked);

function updateBubblePlot(newData) {
  // Update the scale for the bubble sizes
  const maxDuration = d3.max(Object.values(functionData));
  sizeScale.domain([0, maxDuration]);

  // Add new nodes to the simulation
  nodesData = nodesData.concat(newData);
  simulation.nodes(nodesData);

  // Create/update the bubbles
  const bubbles = svg
    .selectAll("circle")
    .data(nodesData, (d) => d.function_name);

  bubbles
    .enter()
    .append("circle")
    .attr("fill", (d) => colorScale(d.function_name))
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .merge(bubbles)
    .attr("r", (d) => sizeScale(d.duration));

  // Update the radius of existing bubbles
  bubbles.attr("r", (d) => sizeScale(d.duration));

  bubbles.exit().remove();
}

function ticked() {
  svg
    .selectAll("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);
}

function handleMouseOver(d, i) {
  d3.select(this).attr("stroke", "black").attr("stroke-width", 2);

  // Show function name on hover
  svg
    .append("text")
    .attr("id", "hoverText")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y - sizeScale(d.duration) - 5)
    .text(d.function_name);
}

function handleMouseOut(d, i) {
  d3.select(this).attr("stroke", "none");

  // Remove function name text
  svg.select("#hoverText").remove();
}
