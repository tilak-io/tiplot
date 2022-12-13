import "../../node_modules/react-grid-layout/css/styles.css";
import "../../node_modules/react-resizable/css/styles.css";
import GridLayout from "react-grid-layout";

function Test() {
  const layout = [
    { i: "a", x: 0, y: 0, w: 1, h: 2 },
    { i: "b", x: 1, y: 0, w: 3, h: 2 },
    { i: "c", x: 4, y: 0, w: 1, h: 2 },
  ];
  return (
    <GridLayout className="layout" layout={layout} cols={1} width={100}>
      <div key="a" style={{ backgroundColor: "red" }}>
        a
      </div>

      <div key="b" style={{ backgroundColor: "red" }}>
        a
      </div>

      <div key="c" style={{ backgroundColor: "red" }}>
        a
      </div>
    </GridLayout>
  );
}

export default Test;
