import {app, BrowserWindow, ipcMain, session} from 'electron';
import {join} from 'path';
import {spawn} from "child_process";

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            // preload: join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    if (process.env.NODE_ENV === 'development') {
        const rendererPort = process.argv[2];
        mainWindow.loadURL(`http://localhost:${rendererPort}`);

        mainWindow.webContents.openDevTools();

    } else {
        mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ['script-src \'self\'']
            }
        })
    })

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
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