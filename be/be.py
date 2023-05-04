import json
import random
import time
from fastapi import FastAPI, WebSocket
from asyncio import Queue, sleep, create_task

app = FastAPI()

# Create a queue to store the data to be sent
queue = Queue()

FUNCTION_NAMES = [
    "do_stuff",
    "do_different_stuff",
    "dogbark",
    "cowsay",
]


# Fill the queue with mock data once a second
async def fill_queue():
    while True:
        # Generate between 1 and 5 mock data
        num_data = random.randint(1, 5)
        mock_data = []
        for i in range(num_data):
            # Generate mock data
            func_name = random.choice(FUNCTION_NAMES)
            duration = random.randint(1, 10)
            if func_name == "do_stuff":
                duration += 100
            timestamp = int(time.time()) - random.randint(0, 30)
            data = f"{func_name},{timestamp},{duration}"
            mock_data.append(data)

        # Put the mock data into the queue
        for data in mock_data:
            await queue.put(data)

        await sleep(0.01)
        # print(f"Queue size: {queue.qsize()}")


async def send_data(websocket: WebSocket):
    while True:
        # Check if there's data in the queue
        if not queue.empty():
            # Create a list of dicts containing the data
            data_list = []
            while not queue.empty():
                data = await queue.get()
                func_name, timestamp, duration = data.split(",")
                data_dict = {
                    "function_name": func_name,
                    "timestamp": int(timestamp),
                    "duration": int(duration),
                }
                data_list.append(data_dict)

            # Convert the list of dicts to a JSON array
            data_json = json.dumps(data_list)

            # Send the JSON array over the WebSocket
            await websocket.send_text(data_json)
            # print(f"Sent data: {data_json}")  # Print the data that was sent

        # Wait for new data to be added to the queue
        await sleep(0.1)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    create_task(fill_queue())  # Run fill_queue in the background
    await send_data(websocket)
