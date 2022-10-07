import "../css/loader.css";
import React, { useEffect, useState } from "react";
import { FcOpenedFolder, FcFile } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import TopBar from "./Navbar";

function Loader() {
  const [files, setFiles] = useState([]);
  const [x, setX] = useState([]);
  const [logsDir, setLogsDir] = useState("..");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/list_dir")
      .then((res) => res.json())
      .then((res) => {
        setLogsDir(res.path);
        setFiles(res.files);
      });
  }, []);

  const parse = (file) => {
    fetch("http://localhost:5000/select", {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },

      body: JSON.stringify({
        file: file[0],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) navigate("/home");
        else alert("unsupported format");
      });
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
