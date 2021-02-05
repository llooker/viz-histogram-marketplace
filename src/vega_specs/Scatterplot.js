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

export default Scatterplot;
