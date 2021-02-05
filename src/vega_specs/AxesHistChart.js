import XHistogram from "./XHistogram";
import YHistogram from "./YHistogram";
import Heatmap from "./Heatmap";

function AxesHistChart({
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
        spacing: 15,
        bounds: "flush",
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
}

export default AxesHistChart;
