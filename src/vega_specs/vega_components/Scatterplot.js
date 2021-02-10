import { FONT_TYPE } from "../../common/utils/vega_utils";

export function useScatterplot({
  config,
  tooltipFields,
  dataProperties,
  width,
  height,
  mainDimensions,
}) {
  const scatterplot = Scatterplot({
    config,
    dataProperties,
    tooltipFields,
    width,
    height,
  });
  if (config["layer_points"] && config["size"] !== "" && config["size"] !== undefined) {
    useSize(scatterplot, config, dataProperties);
  }
  if (config["layer_points"] && mainDimensions[1] !== undefined) {
    useColor(scatterplot, config, dataProperties, mainDimensions);
  }
  return scatterplot;
}

function Scatterplot({ config, tooltipFields, width, height }) {
  return {
    name: "SCATTERPLOT",
    mark: {
      color: config["color_col"],
      cursor: "pointer",
      type: "circle",
      opacity: config["point_opacity"],
      zindex: 2,
      size: 100,
    },
    height: height,
    width: width,
    encoding: {
      tooltip: tooltipFields,
      x: {
        field: config["x"],
        type: "quantitative",
      },
      y: {
        field: config["y"],
        type: "quantitative",
      },
    },
  };
}

function useSize(scatterplot, config, dataProperties) {
  scatterplot.encoding.size = {
    field: config["size"],
    type: "quantitative",
    title: dataProperties[config["size"]]["title"],
    legend: {
      orient: config["legend_orient"],
      format: "d",
      labelFontSize: config["legend_size"],
      titleFontWeight: "normal",
      offset: config["y_hist"] ? 85 : 10,
      titleFontSize: config["legend_size"],
      titleFont: FONT_TYPE,
      labelFont: FONT_TYPE,
      labelColor: "#696969",
      titleColor: "#696969",
    },
  };
}

function useColor(scatterplot, config, dataProperties, mainDimensions) {
  scatterplot.encoding.color = {
    scale: { scheme: config["point_group_colors"] },
    field: mainDimensions[1],
    legend: {
      type: "symbol",
      offset: config["y_hist"] ? 85 : 10,
      title: dataProperties[mainDimensions[1]]["title"],
      type: "symbol",
      orient: config["legend_orient"],
      labelFontSize: config["legend_size"],
      titleFontWeight: "normal",
      titleFontSize: config["legend_size"],
      titleFont: FONT_TYPE,
      labelFont: FONT_TYPE,
      labelColor: "#696969",
      titleColor: "#696969",
    },
  };
}
