const { app, BrowserWindow, ipcMain } = require("electron");
const { exec ,spawn} = require("child_process");
const path = require("path");


let mainWindow;


app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width:  2024,
        height: 968,
        webPreferences: {
            nodeIntegration: true, // Szükséges az IPC kommunikációhoz
            contextIsolation: false
        }
    });

    mainWindow.loadURL("http://localhost:3000");
    // Fejlesztői konzol automatikus megnyitása
    mainWindow.webContents.openDevTools();
});

ipcMain.on("run-python", (event, args) => {
    const pythonProcess = spawn("python3", ["-u", "script.py", ...args]);

    pythonProcess.stdout.on("data", (data) => {
        event.sender.send("python-response", data.toString()); // Azonnal továbbítja a Vue-nak
    });

    pythonProcess.stderr.on("data", (data) => {
        event.sender.send("python-error", data.toString()); // Hibák továbbítása
    });

    pythonProcess.on("close", (code) => {
        event.sender.send("python-finished", `Python script kilépett, kód: ${code}`);
    });
});
