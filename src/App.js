import Loader from "./components/Loader";
import Cesium from "./components/Cesium";
import Layout from "./components/Layout";
//import Paper from "./components/Paper";

import { HashRouter as Router, Route, Routes } from "react-router-dom";
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path="/" element={<Loader />} />
          <Route
            exact
            path="/home"
            element={
              <>
                <Layout />
              </>
            }
          />
          <Route path="*" element={"not found"} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
