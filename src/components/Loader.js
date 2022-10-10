import "../css/loader.css";
import React, { useEffect, useState } from "react";
import { FcOpenedFolder, FcFile } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import TopBar from "./Navbar";

function Loader({ socket }) {
  const [files, setFiles] = useState([]);
  const [logsDir, setLogsDir] = useState("..");
  const navigate = useNavigate();

  useEffect(() => {
    // requesting the log files
    socket.emit("get_log_files");

    // handling the signals
    socket.on("log_files", (logs) => {
      setLogsDir(logs.path);
      setFiles(logs.files);
    });

    socket.on("log_selected", (ok) => {
      if (ok) navigate("/home");
      else alert("unsupported format");
    });

    // when recieving entities from jupyter notebook
    socket.on("entities_loaded", () => {
      navigate("/home");
    });
  });

  const parse = (file) => {
    socket.emit("select_log_file", file);
  };

  return (
    <>
      <TopBar page="loader" />
      <div className="container-fluid">
        <div className="break jumbotron" />
        <div className="row h-100">
          <div className="col-sm-12 my-auto">
            <Table striped bordered hover>
              <tbody>
                <tr>
                  <th className="align-middle">
                    <FcOpenedFolder />
                  </th>
                  <th className="align-middle">{logsDir}</th>
                  <th className="align-middle">Size</th>
                  <th className="align-middle">Modified</th>
                </tr>
                {files.map((file, i) => {
                  return (
                    <tr
                      key={i}
                      className="clickable"
                      onClick={() => parse(file)}
                    >
                      <td className="icon-row">
                        <FcFile />
                      </td>
                      <td>{file[0]}</td>
                      <td>{file[1]} Mb</td>
                      <td>{file[2]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Loader;
