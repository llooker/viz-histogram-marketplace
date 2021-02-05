import YHistogram from "./XHistogram";
import Heatmap from "./Heatmap";

function YHistChart({
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
    hconcat: [
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
      YHistogram({
        dataProperties,
        config,
        maxY,
        height,
      }),
    ],
  };
}

export default YHistChart;
