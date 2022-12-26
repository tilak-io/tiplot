import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../static/css/layout.css";
import { useState, useEffect } from "react";
import SplitLayout from "./SplitLayout";
import DetachedLayout from "./DetachedLayout";

function MainLayout({ socket }) {
  const [selectedLayout, setSelectedLayout] = useState("split-fit");
  const [showView, setShowView] = useState(false);

  useEffect(() => {
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

  function Layout() {
    switch (selectedLayout) {
      case "split-fit":
        return <SplitLayout socket={socket} defaultShowView={showView} />;
      case "detached-fit":
        return <DetachedLayout socket={socket} defaultShowView={showView} />;
    }
  }

  return <Layout />;
}

export default MainLayout;
