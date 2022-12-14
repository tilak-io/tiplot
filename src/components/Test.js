import "../../node_modules/react-grid-layout/css/styles.css";
import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import { WidthProvider, Responsive } from "react-grid-layout";
import Graph from "./Graph";
import GraphXY from "./GraphXY";
import { v4 as uuid } from "uuid";

const ResponsiveGridLayout = WidthProvider(Responsive);

function Test() {
  const [graphs, setGraphs] = useState([]);
  const [rowHeight, setRowHeight] = useState(window.innerHeight);

  useEffect(() => {
    // const multiselectHeight = 38;
    var usedHeight = 56;
    // graphs.forEach((g) => {
    // if (g.type == "yt") usedHeight += multiselectHeight;
    // else usedHeight += 2 * multiselectHeight;
    // });

    setRowHeight((window.innerHeight - usedHeight) / graphs.length);
  }, [graphs]);

  const addGraphYT = () => {
    const graph = {
      id: uuid(),
      type: "yt",
      initialKeys: [],
    };
    setGraphs([...graphs, graph]);
  };

  const addGraphXY = () => {
    const graph = { id: uuid(), type: "xy", initialKeys: [] };
    setGraphs([...graphs, graph]);
  };

  const removeGraph = (id) => {
    const g = graphs.filter((e) => e.id != id);
    setGraphs(g);
  };

  function GraphType({ element }) {
    return element.type == "yt" ? (
      <Graph
        key={element.id}
        id={element.id}
        initialKeys={element.initialKeys}
        updateKeys={updateKeys}
        removeGraph={removeGraph}
      />
    ) : (
      <GraphXY
        key={element.id}
        id={element.id}
        initialKeys={element.initialKeys}
        updateKeys={updateKeys}
        removeGraph={removeGraph}
      />
    );
  }

  const updateKeys = (id, keys) => {
    const copy = graphs;
    const g = copy.find((e) => e.id === id);
    g.initialKeys = keys;
    console.log(g);
    // setGraphs(copy);
  };

  return (
    <>
      <TopBar addYT={addGraphYT} addXY={addGraphXY} />
      <div className="fit-to-screen">
        <ResponsiveGridLayout
          isResizable={false}
          margin={[0, 0]}
          rowHeight={rowHeight}
          className="layout"
          cols={{ lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 }}
          draggableHandle=".drag-button"
        >
          {graphs.map((g) => (
            <div key={uuid()}>
              <GraphType element={g} />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </>
  );
}

export default Test;
