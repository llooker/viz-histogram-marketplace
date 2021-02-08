import XHistogram from "../vega_components/XHistogram";
import Heatmap from "../vega_components/Heatmap";
import useLayers from "../vega_components/useLayers";

function XHistChart({
  data,
  dataProperties,
  config,
  maxX,
  minX,
  maxY,
  minY,
  height,
  width,
  tooltipFields,
  valFormatX,
  valFormatY,
  mainDimensions,
}) {
  const chart = {
    vconcat: [
      XHistogram({
        dataProperties,
        config,
        maxX,
        width,
      }),
      {
        name: "BOUNDING_BOX",
        layer: [
          Heatmap({
            dataProperties,
            config,
            maxX,
            maxY,
            height,
            width,
            valFormatX,
            valFormatY,
          }),
        ],
      },
    ],
    config: {
      range: {
        heatmap: {
          scheme: config["color_scheme"],
        },
      },
    },
  };

  let layers = chart.vconcat[1].layer;
  useLayers({
    layers,
    data,
    dataProperties,
    config,
    maxX,
    minX,
    maxY,
    minY,
    height,
    width,
    tooltipFields,
    valFormatX,
    valFormatY,
    mainDimensions,
  });

  return chart;
}

export default XHistChart;
