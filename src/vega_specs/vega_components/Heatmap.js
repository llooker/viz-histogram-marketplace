import { FONT_TYPE } from "../../common/utils/vega_utils";
import { binnedTooltipHandler } from "../../common/utils/tooltip";

function Heatmap({
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
    name: "HEATMAP",
    mark: {
      zindex: -1,
      type: "rect",
      invalid: null,
      ...(config["heatmap_off"] && { cursor: "pointer" }),
      ...(!config["heatmap_off"] && { fillOpacity: 0.0 }),
    },
    height: height,
    width: width,
    encoding: {
      x: {
        ...(config["heatmap_off"] && {
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
            ...(config.bin_type === "breakpoints" && {
              binned: true,
            }),
          },
        }),
        field: config["bin_type"] === "breakpoints" ? "bin_start_x" : config["x"],
        type: "quantitative",
        axis: {
          name: "xAxis",
          title:
            config["x_axis_override"] === ""
              ? dataProperties[config["x"]]["title"]
              : config["x_axis_override"],
          titleFontSize: config["x_axis_title_font_size"],
          format: "d",
          labelFontSize: config["x_axis_label_font_size"],
          grid: config["x_grids"],
          titleFontWeight: "normal",
          titleFont: FONT_TYPE, //config['font_type'],
          labelFont: FONT_TYPE, //config['font_type'],
          labelSeparation: 100 - config["x_label_separation"],
          labelOverlap: true,
          labelColor: "#696969",
          labelAngle: config["x_axis_label_angle"] * -1,
          titleColor: "#696969",
          titlePadding: 25 + valFormatX.length, //config['x_axis_title_padding']
        },
      },
      ...(config["bin_type"] === "breakpoints" && {
        x2: { field: "bin_end_x" },
      }),
      y: {
        ...(config["heatmap_off"] && {
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
            ...(config.bin_type === "breakpoints" && {
              binned: true,
            }),
          },
        }),
        field: config["bin_type"] === "breakpoints" ? "bin_start_y" : config["y"],
        type: "quantitative",
        axis: {
          title:
            config["y_axis_override"] === ""
              ? dataProperties[config["y"]]["title"]
              : config["y_axis_override"],
          titleFontSize: config["y_axis_title_font_size"],
          format: "d",
          labelFontSize: config["y_axis_label_font_size"],
          labelAngle: config["y_axis_label_angle"] * -1,
          grid: config["y_grids"],
          titleFontWeight: "normal",
          titleFont: FONT_TYPE,
          labelFont: FONT_TYPE,
          labelSeparation: 100 - config["y_label_separation"],
          labelOverlap: true,
          labelColor: "#696969",
          titleColor: "#696969",
          titlePadding: 25 + valFormatY.length * 3,
        },
      },
      ...(config["bin_type"] === "breakpoints" && {
        y2: { field: "bin_end_y" },
      }),
      color: {
        aggregate: "count",
        type: "quantitative",
        legend: !config["heatmap_off"]
          ? false
          : {
              orient: config["legend_orient"],
              labelFontSize: config["legend_size"],
              titleFontSize: config["legend_size"],
              titleFontWeight: "normal",
              offset: config["y_hist"] ? 85 : 10,
              titleFont: FONT_TYPE,
              labelFont: FONT_TYPE,
              labelColor: "#696969",
              titleColor: "#696969",
            },
      },
      opacity: {
        condition: { selection: "highlight", value: 1 },
        value: config["heatmap_opacity"],
      },
      ...(config["heatmap_off"] && {
        tooltip: (() => {
          let arr = binnedTooltipHandler(
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
              ...(config.bin_type === "breakpoints" && {
                binned: true,
              }),
            }
          ).concat(
            binnedTooltipHandler(dataProperties[config["y"]], config["y_axis_override"], {
              ...(config.bin_type === "bins" && {
                maxbins: config["max_bins"],
              }),
              ...(config.bin_type === "steps" && {
                step:
                  config["num_step_y"] <= Math.floor(maxY / 200)
                    ? Math.floor(maxY / 200)
                    : config["num_step_y"],
              }),
              ...(config.bin_type === "breakpoints" && {
                binned: true,
              }),
            })
          );
          arr = arr.concat(arr.splice(1, 1));
          return arr;
        })(),
      }),
    },
  }
}

export default Heatmap;
