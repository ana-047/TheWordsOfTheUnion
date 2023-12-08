// main.js

// COLOR SCHEMES
// Declare color variables
const themeColors = {
  'theme-border': '#ffc168',
  'theme-climate': '#2cefa2',
  'theme-economy': '#1cc7d0',
  'theme-guns': '#3369e7',
  'theme-immigration': '#fd8a63',
  'theme-crime': '#cf4eff',
  'theme-war': '#ff3f76',
};


const partyColors = {
  'party-republican': '#ff3f76',
  'party-democrat': '#1cc7d0',
  'party-other': '#A8A8A8',
  'party-whig': '#E2DE91',
  'party-national-union': '#39668C',
  'party-federalist': '#96787C',
};

// CHART SETUP
// Declare chart configurations
const chartConfigs = [
  {
    step: 0,
    chartGenerator: (container, data) => new TimelineChart(container, data),
    dataPath: 'data/sotu-speech-delivery-method-timeline.csv',
    visId: 'vis-brush',
  },
  {
    step: 2,
    chartGenerator: (container, data) => new RacingBarsChart(container, data),
    dataPath: 'data/speech_length_agg.csv',
    visId: 'vis-focus-secondary',
  },
  {
    step: 3,
    chartGenerator: (container, data) => new SplitBarChart(container, data),
    dataPath: 'data/sotu-speech-delivery-minutes.csv',
    visId: 'vis-focus-secondary',
  },
  {
    step: 4,
    chartGenerator: (container, data) => new HeatmapChart(container, data),
    dataPath: 'data/speech_similarity_scores.csv',
    visId: 'vis-focus-secondary',
  },
  {
    step: 5,
    chartGenerator: (container, data) => new HeatmapChart(container, data),
    dataPath: 'data/speech_similarity_scores.csv',
    visId: 'vis-focus-secondary',
  },
  {
    step: 6,
    chartGenerator: (container, data) => new LineChart(container, data),
    dataPath: 'data/policy_agg2.csv',
    visId: 'vis-brush',
  },
  {
    step: 6,
    chartGenerator: (container, data) => new StackedBarChart(container, data),
    dataPath: 'data/policy_agg.csv',
    visId: 'vis-focus-primary',
  },
  {
    step: 7,
    chartGenerator: (container, data) => new BeeswarmChart(container, data),
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-brush',
  },
  {
    step: 7,
    chartGenerator: (container, data) => new DripBarChart(container, data),
    // dataPath: 'data/sotu-themes-stack-formatted-data.json',
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 8,
    chartGenerator: (container, data) => new BeeswarmChart(container, data),
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-brush',
  },
  {
    step: 8,
    chartGenerator: (container, data) => new DripBarChart(container, data),
    // dataPath: 'data/sotu-themes-stack-formatted-data.json',
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 9,
    chartGenerator: (container, data) => new BeeswarmChart(container, data),
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-brush',
  },
  {
    step: 9,
    chartGenerator: (container, data) => new DripBarChart(container, data),
    // dataPath: 'data/sotu-themes-stack-formatted-data.json',
    dataPath: 'data/sotu-all-themes-and-sentiment.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 10,
    chartGenerator: (container, data) => new GlobeChart(container, data),
    dataPath: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 10,
    chartGenerator: (container, data) => new ScatterPlot(container, data),
    dataPath: 'data/countries_long.csv',
    visId: 'vis-brush',
  },
  {
    step: 11,
    chartGenerator: (container, data) => new GlobeChart(container, data),
    dataPath: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 11,
    chartGenerator: (container, data) => new ScatterPlot(container, data),
    dataPath: 'data/countries_long.csv',
    visId: 'vis-brush',
  },
  {
    step: 12,
    chartGenerator: (container, data) => new GlobeChart(container, data),
    dataPath: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    visId: 'vis-focus-primary',
  },
  {
    step: 12,
    chartGenerator: (container, data) => new ScatterPlot(container, data),
    dataPath: 'data/countries_long.csv',
    visId: 'vis-brush',
  },
];

// INIT OFFSET SERVICE FOR TOOLTIP POSITIONING
const offsetCalculator = new OffsetCalculator('vis-container');

// START THE WEB APP
// Set up display controller
// This is what makes the app run
const viewController = new Display(chartConfigs, '.step');
