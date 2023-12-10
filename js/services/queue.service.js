// queue.service.js
// Queue class
class Queue {
  constructor() {
    this.plots = [];
  }

  buildQueue(data, chartGenerator, svg, step, visId) {
    // Populates an array of charts based on the chartConfigs object in main.js
    // This is where each chart class is called
    const plot = chartGenerator(svg, data);
    this.plots.push({ plot, step, visId });
  }

  getFileExtension(filename) {
    // Gets the filename of a dataPath to determine which D3 loading method to use
    return filename.split('.').pop().toLowerCase();
  }

  loadCSV(dataPath, chartGenerator, svg, step, visId) {
    // Load CSV file then build a chart with the data
    return new Promise((resolve, reject) => {
      d3.csv(dataPath)
        .then((data) => {
          this.buildQueue(data, chartGenerator, svg, step, visId);
          resolve();
        })
        .catch((error) => {
          // Elephant graveyard
          reject(error);
        });
    });
  }

  loadJSON(dataPath, chartGenerator, svg, step, visId) {
    // Load JSON file then build a chart with the data
    return new Promise((resolve, reject) => {
      d3.json(dataPath)
        .then((data) => {
          this.buildQueue(data, chartGenerator, svg, step, visId);
          resolve();
        })
        .catch((error) => {
          // You must never go here Simba. (Hopefully)
          reject(error);
        });
    });
  }

  loadData(charts) {
    const dataPromises = charts.map((chart) => {
      // Deconstruct each chart object from chartConfigs
      const {
        dataPath, chartGenerator, svg, step, visId,
      } = chart;

      // Determine the file type of the data for each chart
      const fileType = this.getFileExtension(dataPath);

      // Depending on file type, call the appropriate loading method
      switch (fileType) {
        case 'csv':
          return this.loadCSV(dataPath, chartGenerator, svg, step, visId);
        case 'json':
          return this.loadJSON(dataPath, chartGenerator, svg, step, visId);
        default:
          return Promise.reject(`Unsupported file type: ${fileType}`);
      }
    });

    return Promise.all(dataPromises);
  }
}
