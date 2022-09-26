const path = require("path");
const fs = require("fs");
const { app, BrowserWindow } = require("electron");

const api = path.join(process.resourcesPath, "api/api");

var execfile = require("child_process").execFile;
var start = execfile(api, { windowsHide: true }, (err, stdout, stderr) => {
  if (err) {
    console.log(err);
  }
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.log(stderr);
  }
});

console.log(path.resolve(__dirname));

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(`file://${path.join(__dirname, "../build/index.html")}`);
  //  win.loadURL(`http://localhost:3000`);
  // Open the DevTools.
  //  win.webContents.openDevTools({ mode: "detach" });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    start.kill("SIGINT");
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
