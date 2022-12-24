import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../static/css/layout.css";
import { useState, useEffect } from "react";
import SplitLayout from "./SplitLayout";
import DetachedLayout from "./DetachedLayout";


function MainLayout({ socket }) {
  const [selectedLayout, setSelectedLayout] = useState("split-fit");
  useEffect(() => {
    getSelectedLayout();
  }, []);

  const getSelectedLayout = () => {
    var view_layout = JSON.parse(localStorage.getItem("view_layout")) ?? "split-fit";
    setSelectedLayout(view_layout);
  }

  function Layout() {
    switch (selectedLayout) {
      case "split-fit":
        return <SplitLayout socket={socket} />
      case "detached-fit":
        return <DetachedLayout socket={socket} />
    }
  }

  return <Layout />

}

export default MainLayout;
