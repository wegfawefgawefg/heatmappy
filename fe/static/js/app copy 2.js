const socket = new WebSocket("ws://localhost:8080/ws");

// Set up dimensions and configuration
const width = 800;
const height = 400;
const cellHeight = 20;
const timeWindow = 10000; // Time window in milliseconds

const svg = d3
  .select("#heatmap")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

let receivedData = [];

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  receivedData = receivedData.concat(data);
  updateHeatmap();
};

function updateHeatmap() {
  const currentTime = Date.now();
  const filteredData = recievedData;
  const filteredData = receivedData.filter(
    (d) => currentTime - d.timestamp * 1000 <= timeWindow
  );

  // Calculate the total width of the function calls within the time window
  const totalWidth = filteredData.reduce(
    (sum, d) => sum + (d.duration / timeWindow) * width,
    0
  );

  // Create/update the heatmap cells
  const cells = svg
    .selectAll("rect")
    .data(filteredData, (d) => d.function_name + d.timestamp);

  cells
    .enter()
    .append("rect")
    .attr("y", (d, i) => Math.floor(i / timeWindow) * cellHeight)
    .attr("height", cellHeight)
    .attr("fill", (d) => colorScale(d.function_name))
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .merge(cells)
    .attr("x", (d, i) => {
      const precedingWidth = filteredData
        .slice(0, i)
        .reduce((sum, d) => sum + (d.duration / timeWindow) * width, 0);
      return width - totalWidth + precedingWidth;
    })
    .attr("width", (d) => (d.duration / timeWindow) * width);

  cells.exit().remove();
}

function handleMouseOver(d, i) {
  d3.select(this).attr("stroke", "black").attr("stroke-width", 2);

  // Show function name on hover
  const precedingWidth = receivedData
    .slice(0, i)
    .reduce((sum, d) => sum + (d.duration / timeWindow) * width, 0);
  const xPos =
    width -
    receivedData.reduce(
      (sum, d) => sum + (d.duration / timeWindow) * width,
      0
    ) +
    precedingWidth;

  svg
    .append("text")
    .attr("id", "hoverText")
    .attr("x", xPos)
    .attr("y", Math.floor(i / timeWindow) * cellHeight - 5)
    .text(d.function_name);
}

function handleMouseOut(d, i) {
  d3.select(this).attr("stroke", "none");

  // Remove function name text
  svg.select("#hoverText").remove();
}

// Periodically update the heatmap to remove outdated data
setInterval(updateHeatmap, 1000);
