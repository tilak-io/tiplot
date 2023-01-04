const path = require("path");
const { app, BrowserWindow } = require("electron");
const portfinder = require("portfinder");
const api = path.join(process.resourcesPath, "api/server");
const model = path.join(process.resourcesPath, "obj/main.gltf");

// just for debugging
// const api = "/home/hamza/projects/github/tiplot/backend/server";

var spawn = require("child_process").spawn;
var start;
portfinder.getPort({ port: 5005, stopPort: 6000 }, function (error, port) {
  if (error) {
    console.error(error);
  } else {
    console.log(`Found available port: ${port}`);
    process.env.API_PORT = port;
    start = spawn(api, ["--model", model, "--port", port], {
      windowsHide: true,
      shell: process.env.ComSpec,
      stdio: "inherit",
    });
  }
});

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    // autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.setMenu(null);

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(`file://${path.join(__dirname, "../build/index.html")}`);
  // win.loadURL(`http://localhost:3000`);
  // Open the DevTools.
  // win.webContents.openDevTools({ mode: "detach" });
  win.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
      },
    };
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // Ctrl + C console
  process.on("SIGINT", (e) => {
    start.kill();
    app.quit();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    start.kill();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
