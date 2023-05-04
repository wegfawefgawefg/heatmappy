import asyncio
from fastapi import FastAPI, WebSocket

app = FastAPI()

# A list to store the function calls and their timing data
func_calls = []


# Define a WebSocket endpoint that sends the func_calls list to the client
# whenever it is updated
class FuncCallsWebSocket(WebSocket):
    async def on_connect(self, websocket: WebSocket):
        await websocket.accept()
        while True:
            if len(func_calls) > 0:
                await websocket.send_json(func_calls)
                func_calls.clear()
            await asyncio.sleep(1)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json(func_calls)
    while True:
        # Receive data from the client, if needed
        data = await websocket.receive_text()
        # Handle incoming data, if needed
