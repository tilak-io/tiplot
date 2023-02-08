const path = require("path");
const isWin = process.platform === "win32";

var add_data;
if (isWin) add_data = "--add-data api;api";
else add_data = "--add-data api:api";

const spawn = require("child_process").spawn,
  ls = spawn(
    "python3 -m PyInstaller",
    [
      "-w",
      // "--onefile",
      "--onedir",
      // "--strip",
      "--distpath backend",
      add_data,
      "api/server.py",
      "--add-data",
      "$(pip show pymavlink | grep 'Location:' | awk '{print $2}')/pymavlink:pymavlink",
    ],
    {
      shell: true,
    }
  );

ls.stderr.on("data", function (data) {
  // stream output of build process
  console.log(data.toString());
});

ls.on("exit", function (code) {
  console.log("child process exited with code " + code.toString());
});
