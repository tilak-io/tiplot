const path = require("path");

const spawn = require("child_process").spawn,
  ls = spawn(
    "python3 -m PyInstaller",
    [
      "-w",
      "--onefile",
      "--distpath backend",
      "--add-data api:api",
      "api/server.py",
    ],
    {
      shell: true,
    }
  );

ls.stdout.on("data", function (data) {
  // stream output of build process
  console.log(data.toString());
});

ls.stderr.on("data", function (data) {
  console.log("Packaging error: " + data.toString());
});
ls.on("exit", function (code) {
  console.log("child process exited with code " + code.toString());
});
