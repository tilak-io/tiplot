import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../static/css/layout.css";
import { useState, useEffect } from "react";
import SplitLayout from "./SplitLayout";
import DetachedLayout from "./DetachedLayout";
import { PORT } from "../../static/js/constants";

function MainLayout({ socket }) {
  const [selectedLayout, setSelectedLayout] = useState("split-fit");
  const [showView, setShowView] = useState(false);
  const [ext, setExt] = useState("default");

  useEffect(() => {
    getExt();
    getSelectedLayout();
    getShowView();
  }, []);

  const getSelectedLayout = () => {
    var view_layout =
      JSON.parse(localStorage.getItem("view_layout")) ?? "split-fit";
    setSelectedLayout(view_layout);
  };

  const getShowView = () => {
    var show_view = JSON.parse(localStorage.getItem("show_view")) ?? false;
    setShowView(show_view);
  };

  const getExt = () => {
    fetch(`http://localhost:${PORT}/current_parser`)
      .then((res) => res.json())
      .then((res) => {
        setExt(res.ext);
      });
  };

  function Layout() {
    switch (selectedLayout) {
      case "detached-fit":
        return (
          <DetachedLayout
            socket={socket}
            defaultShowView={showView}
            ext={ext}
          />
        );
      case "split-fit":
      default:
        return (
          <SplitLayout socket={socket} defaultShowView={showView} ext={ext} />
        );
    }
  }

  return <Layout />;
}

export default MainLayout;
