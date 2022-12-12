export default class PlotData {

  constructor(id) {
    this.id = id;
  }

  getOptions = async () => {
    const options = [];
    const response = await fetch("http://localhost:5000/tables")
      .then((res) => res.json());
    const tables = response.tables;
    tables.forEach((table) => {
      var key = Object.keys(table)[0];
      var columns = Object.values(table)[0];
      columns.forEach((column) => {
        options.push({
          value: {
            "key": key,
            "column": column
          },
          label: `${key}/${column}`,
        });
      });
    });
    return options;
  }

  getData = async (field) => {
    const response = await fetch("http://localhost:5000/table_values", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(field)
    })
      .then((res) => res.json());


    const table = response["table"]
    const x_name = response["x"];
    const x_values = [];
    const y_name = response["y"];
    const y_values = [];

    response.values.forEach((e) => {
      x_values.push(e[x_name]);
      y_values.push(e[y_name]);
    });

    return {
      x: x_values,
      y: y_values,
      name: `${table}/${y_name}`
    }

  }

}
