import { binnedTooltipHandler } from "../../common/utils/tooltip";

function XHistogram({ dataProperties, config, maxX, width }) {
  return {
    selection: {
      grid: {
        type: "interval",
        bind: "scales",
      },
      highlight: {
        type: "single",
        empty: "none",
        on: "mouseover",
      },
    },
    name: "X_HISTOGRAM",
    mark: {
      type: "bar",
      cursor: "pointer",
    },
    height: 60,
    width: width,
    encoding: {
      x: {
        bin: {
          ...(config.bin_type === "bins" && {
            maxbins: config["max_bins"],
          }),
          ...(config.bin_type === "steps" && {
            step:
              config["num_step_x"] <= Math.floor(maxX / 200)
                ? Math.floor(maxX / 200)
                : config["num_step_x"],
          }),
          ...(config.bin_type === "breakpoints" && { binned: true }),
        },
        field: config.bin_type === "breakpoints" ? "bin_start_x" : config["x"],
        type: "quantitative",
        axis: {
          grid: config["x_grids"],
          title: null,
          labels: false,
          ticks: false,
        },
      },
      ...(config["bin_type"] === "breakpoints" && {
        x2: { field: "bin_end_x" },
      }),
      y: {
        ...(config["bin_type"] !== "breakpoints" && { aggregate: "count" }),
        ...(config["bin_type"] === "breakpoints" && { field: "count_x" }),
        type: "quantitative",
        title: "",
        axis: {
          labelColor: "#696969",
          titleColor: "#696969",
          grid: config["y_grids"],
        },
      },
      tooltip: binnedTooltipHandler(
        dataProperties[config["x"]],
        config["x_axis_override"],
        {
          ...(config.bin_type === "bins" && {
            maxbins: config["max_bins"],
          }),
          ...(config.bin_type === "steps" && {
            step:
              config["num_step_x"] <= Math.floor(maxX / 200)
                ? Math.floor(maxX / 200)
                : config["num_step_x"],
          }),
          ...(config.bin_type === "breakpoints" && { binned: true }),
        }
      ),
      color: {
        condition: {
          selection: "highlight",
          value: config["color_on_hover"],
        },
        value: config["color_col"],
      },
    },
  };
}

export default XHistogram;
