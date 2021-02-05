import XHistogram from "./XHistogram";
import Heatmap from "./Heatmap";

function XHistChart({
  dataProperties,
  config,
  maxX,
  maxY,
  height,
  width,
  valFormatX,
  valFormatY,
}) {
  return {
    vconcat: [
      XHistogram({
        dataProperties,
        config,
        maxX,
        width,
      }),
      {
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
  };
}

export default XHistChart;
