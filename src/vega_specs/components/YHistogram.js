import { binnedTooltipHandler } from "../../common/utils/tooltip";

const YHistogram = ({ dataProperties, config, maxY, height }) => {
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
    name: "Y_HISTOGRAM",
    mark: {
      type: "bar",
      cursor: "pointer",
    },
    width: 60,
    height: height,
    encoding: {
      y: {
        bin: {
          ...(config.bin_type === "bins" && {
            maxbins: config["max_bins"],
          }),
          ...(config.bin_type === "steps" && {
            step:
              config["num_step_y"] <= Math.floor(maxY / 200)
                ? Math.floor(maxY / 200)
                : config["num_step_y"],
          }),
          ...(config.bin_type === "breakpoints" && { binned: true }),
        },
        field: config["bin_type"] === "breakpoints" ? "bin_start_y" : config["y"],
        type: "quantitative",
        axis: {
          grid: config["y_grids"],
          title: null,
          labels: false,
          ticks: false,
        },
      },
      ...(config["bin_type"] === "breakpoints" && {
        y2: { field: "bin_end_y" },
      }),
      x: {
        ...(config["bin_type"] !== "breakpoints" && {
          aggregate: "count",
        }),
        ...(config["bin_type"] === "breakpoints" && {
          field: "count_y",
        }),
        type: "quantitative",
        title: "",
        axis: {
          labelColor: "#696969",
          titleColor: "#696969",
          grid: config["x_grids"],
          title: null,
        },
      },
      tooltip: binnedTooltipHandler(
        dataProperties[config["y"]],
        config["y_axis_override"],
        {
          ...(config.bin_type === "bins" && {
            maxbins: config["max_bins"],
          }),
          ...(config.bin_type === "steps" && {
            step:
              config["num_step_y"] <= Math.floor(maxY / 200)
                ? Math.floor(maxY / 200)
                : config["num_step_y"],
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
};

export default YHistogram;
