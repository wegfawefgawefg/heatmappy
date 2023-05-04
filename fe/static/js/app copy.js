const socket = new WebSocket("ws://localhost:8080/ws");

// Select the table where the data will be displayed
const displayTable = document.querySelector("#data-display");

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  // Create a row in the table for each piece of data
  for (let i = 0; i < data.length; i++) {
    const row = displayTable.insertRow();
    row.insertCell().innerHTML = data[i].function_name;
    row.insertCell().innerHTML = new Date(
      data[i].timestamp * 1000
    ).toLocaleString();
    row.insertCell().innerHTML = data[i].duration;
  }
};
