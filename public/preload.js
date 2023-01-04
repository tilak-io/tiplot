const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("API_PORT", parseInt(process.env.API_PORT));
