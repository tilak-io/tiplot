import "../css/loader.css";
import React, { useEffect, useState } from "react";
import { FcOpenedFolder, FcFile } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

function Loader() {
  const [files, setFiles] = useState([]);
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

  const onOpen = (file) => {
    fetch(`http://localhost:5000/select/${file[0]}`)
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        if (res.ok) navigate("/home");
        else alert("unsupported format");
      });
  };

  return (
    <div className="container">
      <div className="break jumbotron" />
      <div className="row h-100">
        <div className="col-sm-12 my-auto">
          <table className="table">
            <tbody>
              <tr className="clickable">
                <td className="icon-row">
                  <FcOpenedFolder />
                </td>
                <td>{logsDir}</td>
                <td></td>
                <td></td>
              </tr>
              {files.map((file, i) => {
                return (
                  <tr
                    key={i}
                    className="clickable"
                    onClick={() => onOpen(file)}
                  >
                    <td className="icon-row">
                      <FcFile />
                    </td>
                    <td>{file[0]}</td>
                    <td>{file[1]} Mb</td>
                    <td>
                      <span className="float-end">{file[2]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Loader;
