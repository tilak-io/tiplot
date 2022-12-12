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


}
