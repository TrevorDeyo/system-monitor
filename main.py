"""
System Monitor Dashboard - Backend API
Author: Trevor Deyo
Description:
    FastAPI backend providing real-time CPU, memory, and process usage data.
    Includes PyInstaller-safe static file handling for Windows executable builds.
"""

import psutil
import os
import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# ---------------------------------------------------------
# Utility: Resolve correct path for static resources.
# Works in both local development and when packaged
# with PyInstaller (which unpacks files at runtime).
# ---------------------------------------------------------
def resource_path(relative_path: str):
    try:
        base_path = sys._MEIPASS  # PyInstaller temporary directory
    except Exception:
        base_path = os.path.abspath(".")  # Normal project directory
    return os.path.join(base_path, relative_path)


# Mount static UI assets (HTML / CSS / JS)
static_dir = resource_path("static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# ---------------------------------------------------------
# Serve the main dashboard UI
# ---------------------------------------------------------
@app.get("/")
def read_root():
    return FileResponse(resource_path("static/index.html"))


# ---------------------------------------------------------
# System Stats Endpoint
# Returns:
#   - CPU usage (sampled for smooth measurement)
#   - Memory usage (percentage of total RAM)
#   - Count of currently running processes
# ---------------------------------------------------------
@app.get("/stats")
def get_stats():
    return {
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "memory_percent": psutil.virtual_memory().percent,
        "total_processes": len(psutil.pids())
    }


# ---------------------------------------------------------
# Process List Endpoint
# Returns a list of processes sorted by CPU or memory usage.
# CPU usage is normalized across logical CPU cores for
# Task Manager–style usage percentages.
# ---------------------------------------------------------
@app.get("/processes")
def get_top_processes(limit: int = 10, sort_by: str = "cpu"):
    cpu_count = psutil.cpu_count(logical=True)
    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            info = proc.info

            # Skip Windows "System Idle Process" since it is not a real workload
            if info.get("pid") == 0 or info.get("name") == "System Idle Process":
                continue

            # Normalize CPU usage across cores
            cpu = info.get("cpu_percent") or 0.0
            info["cpu_percent"] = round(cpu / cpu_count, 1)

            # Clean memory usage values
            info["memory_percent"] = round(info.get("memory_percent") or 0.0, 1)

            processes.append(info)

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            # Process ended or protected — skip safely
            continue

    # Sorting behavior based on selected metric
    key = "memory_percent" if sort_by == "memory" else "cpu_percent"
    processes.sort(key=lambda x: x[key], reverse=True)

    return processes[:limit]


# ---------------------------------------------------------
# Browser Tab Icon
# ---------------------------------------------------------
@app.get("/favicon.ico")
def favicon():
    return FileResponse(resource_path("static/favicon.png"))
