import Loader from "./components/Loader";
import Layout from "./components/Layout";
//import Post from "./components/Post";

import { HashRouter as Router, Route, Routes } from "react-router-dom";
function App() {
  //return <Post />;
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
