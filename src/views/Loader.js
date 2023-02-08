import React, { useEffect, useState } from "react";
import { FcOpenedFolder, FcFile } from "react-icons/fc";
import {
  TiArrowSortedDown,
  TiArrowSortedUp,
  TiArrowUnsorted,
} from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import ToolBar from "../components/ToolBar";
import { PORT } from "../static/js/constants";
import "../static/css/loader.css";
import "../static/css/overlay.css";

function Loader({ socket, isExtra }) {
  const [files, setFiles] = useState([]);
  const [logsDir, setLogsDir] = useState("..");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("name");
  const navigate = useNavigate();

  useEffect(() => {
    getSortedLogFiles("time_desc");

    // when recieving entities from jupyter notebook
    socket.on("entities_loaded", () => {
      navigate("/home");
    });

    socket.on("connect", () => {
      // First app launch
      getSortedLogFiles("time_desc");
    });

    return () => {
      socket.off("entities_loaded");
    };
    // eslint-disable-next-line
  }, []);

  const parse = (file) => {
    setLoading(true);
    fetch(
      isExtra
        ? `http://localhost:${PORT}/add_log`
        : `http://localhost:${PORT}/select_log`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(file),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        setLoading(false);
        if (res.ok) isExtra ? navigate("/sync") : navigate("/home");
        else alert("unsupported format");
      });
    // socket.emit("select_log_file", file);
  };

  const handleChange = (event) => {
    setLoading(true);
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("log", file, file.name);
    fetch(`http://localhost:${PORT}/upload_log`, {
      headers: {
        isExtra: isExtra,
      },
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        setLoading(false);
        if (res.ok) isExtra ? navigate("/sync") : navigate("/home");
        else alert("unsupported format");
      });
  };

  const getSortedLogFiles = async (sort) => {
    const logs = await fetch(`http://localhost:${PORT}/log_files/${sort}`).then(
      (res) => res.json()
    );
    setConnected(true);
    setLogsDir(logs.path);
    setFiles(logs.files);
    setSortType(sort);
  };

  const sortFiles = (type) => {
    if (type === sortType) {
      getSortedLogFiles(`${type}_desc`);
    } else {
      getSortedLogFiles(type);
    }
  };

  const show = connected ? "hide" : "show";
  const showLoading = loading ? "show" : "hide";

  function SortIcon({ type }) {
    if (sortType === type) {
      return <TiArrowSortedDown />;
    } else if (sortType === `${type}_desc`) {
      return <TiArrowSortedUp />;
    } else {
      return <TiArrowUnsorted style={{ color: "#999" }} />;
    }
  }
  return (
    <>
      <ToolBar page="loader" />
      <div className="loader-page">
        <div className={`overlay ${show}`}></div>
        <div className={`spanner ${show}`}>
          <div className="loader"></div>
          <p>Starting Tiplot Server...</p>
        </div>
        <div className={`overlay ${showLoading}`}></div>
        <div className={`spanner ${showLoading}`}>
          <div className="loader"></div>
          <p>Loading file, please wait...</p>
        </div>
        <br />
        <div className="break"></div>
        <center>
          <label
            htmlFor="fileUpload"
            className={
              isExtra
                ? "file-upload btn btn-info btn-lg rounded-pill shadow"
                : "file-upload btn btn-warning btn-lg rounded-pill shadow"
            }
          >
            <i className="fa fa-upload mr-2"></i>Browse for file
            <input id="fileUpload" type="file" onChange={handleChange} />
          </label>
        </center>
        <br />
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12 my-auto">
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <th
                      className="align-middle"
                      onClick={() => sortFiles("unsorted")}
                    >
                      <FcOpenedFolder />
                    </th>
                    <th
                      className="align-middle"
                      onClick={() => sortFiles("name")}
                    >
                      <SortIcon type="name" />
                      {logsDir}
                    </th>
                    <th
                      className="align-middle"
                      onClick={() => sortFiles("size")}
                    >
                      <SortIcon type="size" />
                      Size
                    </th>
                    <th
                      className="align-middle"
                      onClick={() => sortFiles("time")}
                    >
                      <SortIcon type="time" />
                      Modified
                    </th>
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
                        <td>
                          {/* TODO: a cleaner way to convert */}
                          {file[1] < 1048576
                            ? (file[1] / 1024).toFixed(2) + " KB"
                            : (file[1] / 1048576).toFixed(2) + " MB"}
                        </td>
                        <td>{file[2]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Loader;
