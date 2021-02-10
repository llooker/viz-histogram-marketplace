import YHistogram from "../vega_components/YHistogram";
import Heatmap from "../vega_components/Heatmap";
import useLayers from "../vega_components/useLayers";

function YHistChart({
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
    hconcat: [
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
      YHistogram({
        dataProperties,
        config,
        maxY,
        height,
      }),
    ],
    config: {
      range: {
        heatmap: {
          scheme: config["color_scheme"],
        },
      },
    },
  };

  let layers = chart.hconcat[0].layer;
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

export default YHistChart;
