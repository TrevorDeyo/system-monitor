"""
System Monitor Dashboard - Launcher
Author: Trevor Deyo
Description:
    Starts the FastAPI backend server in a background thread and
    automatically opens the dashboard UI in the user's default web browser.
    Closing the terminal window cleanly shuts down the application.
"""

import threading
import webbrowser
import uvicorn
from main import app


def start_server():
    """
    Start the FastAPI server.
    Running this in a background thread allows the program to
    continue running and control startup (e.g., open browser).
    """
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    # Informational startup message for the terminal
    print("==============================================")
    print("   System Monitor Starting...")
    print("   Opening dashboard in your browser...")
    print("   Close this window to stop the application.")
    print("==============================================\n")

    # Launch server in a background thread so the script can continue executing
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Automatically open the dashboard UI
    webbrowser.open("http://127.0.0.1:8000", new=1)

    # Keep the main thread alive so closing the terminal fully stops the app
    server_thread.join()
