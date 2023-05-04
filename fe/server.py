from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse

app = FastAPI()


@app.get("/")
async def index(request: Request):
    return HTMLResponse(content=open("templates/index.html").read(), status_code=200)


@app.get("/js/app.js")
async def js(request: Request):
    return FileResponse("static/js/app.js")
