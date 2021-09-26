export const FILTERED_LABELS = "_filterlabels";
export const baseOptions = {
  // BINNING
  bin_type: {
    label: "Binning Type",
    section: "  Values",
    type: "string",
    order: 2,
    display: "select",
    values: [
      {
        "Max Bins": "bins"
      },
      {
        Steps: "steps"
      },
      {
        Breakpoints: "breakpoints"
      },
    ],
    default: "bins",
  },
  bin_style: {
    label: "Chart Type",
    section: "  Values",
    type: "string",
    order: 1,
    display: "select",
    default: "simple_hist",
    values: [
      { "Simple Histogram": "simple_hist" },
      { "Scatter Histogram": "binned_hist" },
    ],
  },
  winsorization: {
    label: "Limit Outliers (Winsorize)",
    section: "  Values",
    type: "boolean",
    order: 7,
    default: false,
  },

  //COLOR
  color_col: {
    type: "string",
    section: " Style",
    label: "Color",
    display: "color",
    display_size: "half",
    default: "#1A73E8",
    order: 3,
  },
  color_on_hover: {
    type: "string",
    section: " Style",
    label: "Color On Hover",
    display: "color",
    display_size: "half",
    default: "#338bff",
    order: 4,
  },

  //X-AXIS  Style
  x_axis_label_divider: {
    label: "X Axis -------------------------------------------------------",
    section: "Labels",
    type: "string",
    display: "divider",
    order: 6,
  },
  x_axis_override: {
    label: "X Axis Title Override",
    section: "Labels",
    type: "string",
    display: "text",
    default: "",
    order: 7,
  },
  x_grids: {
    label: "X Axis Gridlines",
    section: " Style",
    type: "boolean",
    display: "select",
    display_size: "half",
    default: true,
  },
  x_axis_title_font_size: {
    label: "X Axis Title Size",
    section: "Labels",
    type: "number",
    default: 16,
    display_size: "half",
    order: 9,
  },
  x_axis_label_font_size: {
    label: "X Axis Label Size",
    section: "Labels",
    type: "number",
    default: 12,
    display_size: "half",
    order: 10,
  },
  x_axis_label_angle: {
    label: "X Axis Label Angle",
    section: "Labels",
    type: "number",
    display: "range",
    default: 0,
    order: 11,
    min: 0,
    max: 90,
    step: 1,
    display_size: "half",
  },
  x_label_separation: {
    label: "X Axis Label Density",
    section: "Labels",
    type: "number",
    display: "range",
    default: 100,
    order: 12,
    min: 1,
    max: 100,
    step: 1,
    display_size: "half",
  },

  //Y-AXIS  Style
  y_axis_label_divider: {
    label: "Y Axis -------------------------------------------------------",
    section: "Labels",
    type: "string",
    display: "divider",
    order: 13,
  },
  y_axis_override: {
    label: "Y Axis Title Override",
    section: "Labels",
    type: "string",
    display: "text",
    default: "",
    order: 14,
  },
  y_grids: {
    label: "Y Axis Gridlines",
    section: " Style",
    type: "boolean",
    display: "select",
    display_size: "half",
    order: 15,
    default: true,
  },
  y_axis_title_font_size: {
    label: "Y Axis Title Size",
    section: "Labels",
    type: "number",
    default: 16,
    display_size: "half",
    order: 16,
  },
  y_axis_label_font_size: {
    label: "Y Axis Label Size",
    section: "Labels",
    type: "number",
    default: 12,
    display_size: "half",
    order: 17,
  },
  y_axis_label_angle: {
    label: "Y Axis Label Angle",
    section: "Labels",
    type: "number",
    display: "range",
    default: 0,
    order: 18,
    min: 0,
    max: 90,
    step: 1,
    display_size: "half",
  },
  y_label_separation: {
    label: "Y Axis Label Density",
    section: "Labels",
    type: "number",
    display: "range",
    default: 100,
    order: 19,
    min: 1,
    max: 100,
    step: 1,
    display_size: "half",
  },
  x_axis_value_format: {
    label: "X Axis Value Format",
    order: 200,
    section: "  Values",
    type: "string",
    display: "text",
    default: "",
    placeholder: "Spreadsheet Style Value Format",
  },
};

export function createOptions(
  queryResponse,
  baseOptions,
  config,
  maxX,
  maxY,
  groupDimension
) {
  var optionsResponse = {};
  optionsResponse["options"] = Object.assign({}, baseOptions);
  optionsResponse["measures"] = [];
  optionsResponse["dimensions"] = [];
  optionsResponse["masterList"] = [];

  //Remove breakpoint option
  if (optionsResponse["options"]["bin_type"]["values"].length > 2) {
    optionsResponse["options"]["bin_type"]["values"].pop();
  }

  var dimCounter = 1;
  var mesCounter = 1;
  var defaultDim;
  var defaultDim2;
  var defaultMes;
  var defaultMes2;

  queryResponse.fields.dimension_like.forEach(function (field) {
    //ignore label filters
    if (field.name === FILTERED_LABELS) {
      return;
    }
    if (!field.is_numeric && field.type !== "tier") {
      return;
    }
    var dimLib = {};
    var fieldName = field.name.replace(".", "_");
    if (typeof field.label_short != "undefined") {
      dimLib[field.label_short] = fieldName; //store friendly label & field name
    } else {
      dimLib[field.label] = fieldName; //capture label, mainly for table calcs
    }
    if (dimCounter == 1) {
      defaultDim = fieldName; //grab first dimension to use as default X value
    } else if (dimCounter == 2) {
      defaultDim2 = fieldName;
    }
    optionsResponse["masterList"].push(dimLib); //add to master list of all fields
    optionsResponse["dimensions"].push(dimLib);
    dimCounter += 1;
  });

  queryResponse.fields.measure_like.forEach(function (field) {
    //ignore label filters
    if (field.name === FILTERED_LABELS) {
      return;
    }
    var mesLib = {};
    var fieldName = field.name.replace(".", "_");
    if (typeof field.label_short != "undefined") {
      mesLib[field.label_short] = fieldName;
      optionsResponse["measures"].push(mesLib);
    } else {
      mesLib[field.label] = fieldName;
      if (field.type == "yesno") {
        optionsResponse["dimensions"].push(mesLib);
      } else {
        optionsResponse["measures"].push(mesLib);
      }
    }
    if (mesCounter == 1) {
      defaultMes = fieldName; //grab first measure as default Y value
    } else if (mesCounter == 2) {
      defaultMes2 = fieldName;
    }
    optionsResponse["masterList"].push(mesLib);

    mesCounter += 1;
  });

  if (typeof defaultMes == "undefined") {
    defaultMes = defaultDim;
  }

  if (typeof defaultMes2 == "undefined") {
    defaultMes2 = defaultDim2;
  }
  if (config["bin_type"] === "steps") {
    optionsResponse["options"]["num_step_x"] = {
      label: "Step Size (X)",
      section: "  Values",
      type: "number",
      order: 5,
      default: Math.floor(maxX / 10),
      display_size: "half",
    };
    optionsResponse["options"]["num_step_y"] = {
      label: "Step Size (Y)",
      section: "  Values",
      type: "number",
      order: 6,
      default: Math.floor(maxY / 10),
      display_size: "half",
    };
  } else if (config["bin_type"] === "bins") {
    optionsResponse["options"]["max_bins"] = {
      label: "Max number of Bins",
      section: "  Values",
      type: "string",
      order: 4,
      default: "10",
    };
  } else if (config["bin_type"] === "breakpoints") {
    optionsResponse["options"]["breakpointsX"] = {
      label: "Breakpoints (X)",
      section: "  Values",
      type: "string",
      placeholder: "Comma seperated breakpoints (100, 200, 300)",
      order: 4,
    };
    optionsResponse["options"]["breakpointsY"] = {
      label: "Breakpoints (Y)",
      section: "  Values",
      type: "string",
      placeholder: "Comma seperated breakpoints (100, 200, 300)",
      order: 5,
    };
  }
  if (config["winsorization"]) {
    optionsResponse["options"]["percentile"] = {
      label: "Percentiles",
      section: "  Values",
      type: "string",
      order: 7,
      display: "select",
      display_size: "half",
      default: "1_99",
      values: [{ "1% - 99%": "1_99" }, { "5% - 95%": "5_95" }],
    };
  }

  optionsResponse["options"]["x"] = {
    label: "X Axis",
    section: "  Values",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse["measures"],
    default: defaultMes,
  };
  optionsResponse["options"]["y"] = {
    label: "Y Axis",
    section: "  Values",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse["measures"],
    default: defaultMes2,
  };
  optionsResponse["options"]["heatmap_off"] = {
    label: "Heatmap",
    section: "  Values",
    type: "boolean",
    order: 10,
    display: "select",
    display_size: "half",
    default: true,
  };
  optionsResponse["options"]["x_hist"] = {
    label: "X Histogram",
    section: "  Values",
    type: "boolean",
    display_size: "half",
    order: 11,
    default: true,
  };
  optionsResponse["options"]["y_hist"] = {
    label: "Y Histogram",
    section: "  Values",
    type: "boolean",
    display_size: "half",
    order: 11,
    default: true,
  };
  optionsResponse["options"]["layer_points"] = {
    label: "Points",
    section: "  Values",
    type: "boolean",
    display_size: "half",
    order: 11,
    display: "select",
    default: true,
  };
  var defaultVal =
    optionsResponse["measures"].length > 2 ? optionsResponse["measures"][2] : "";
  var size_arr = optionsResponse["measures"].concat([{ None: "" }]);
  optionsResponse["options"]["size"] = {
    label: "Size Points By",
    section: "  Values",
    type: "string",
    order: 12,
    display: "select",
    values: size_arr,
    default: defaultVal[Object.keys(defaultVal)[0]],
  };
  optionsResponse["options"]["color_scheme"] = {
    label: "Heatmap Color Scheme",
    section: " Style",
    type: "array",
    display: "colors",
    order: 1,
    default: [
      "#7FCDAE",
      "#7ED09C",
      "#7DD389",
      "#85D67C",
      "#9AD97B",
      "#B1DB7A",
      "#CADF79",
      "#E2DF78",
      "#E5C877",
      "#E7AF75",
      "#EB9474",
      "#EE7772",
    ],
  };
  if (groupDimension) {
    optionsResponse["options"]["point_group_colors"] = {
      label: "Point Groups Colors",
      section: " Style",
      type: "array",
      display: "colors",
      order: 2,
      default: [
        "#7FCDAE",
        "#7ED09C",
        "#7DD389",
        "#85D67C",
        "#9AD97B",
        "#B1DB7A",
        "#CADF79",
        "#E2DF78",
        "#E5C877",
        "#E7AF75",
        "#EB9474",
        "#EE7772",
      ],
    };
  }
  optionsResponse["options"]["heatmap_opacity"] = {
    label: "Heatmap Opacity",
    section: " Style",
    type: "number",
    display: "range",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    default: 0.8,
    order: 1,
  };
  optionsResponse["options"]["point_opacity"] = {
    label: "Point Opacity",
    section: " Style",
    type: "number",
    display: "range",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    default: 0.8,
    order: 6,
  };
  optionsResponse["options"]["legend_orient"] = {
    label: "Legend Position",
    section: "Labels",
    type: "string",
    display: "select",
    order: 6,
    values: [{ Left: "left" }, { Right: "right" }, { Top: "top" }, { Bottom: "bottom" }],
    display_size: "half",
    default: "right",
  };
  optionsResponse["options"]["legend_size"] = {
    label: "Legend Font Size",
    section: "Labels",
    type: "number",
    default: 16,
    display_size: "half",
    order: 5,
  };
  optionsResponse["options"]["y_axis_value_format"] = {
    label: "Y Axis Value Format",
    order: 201,
    section: "  Values",
    type: "string",
    display: "text",
    default: "",
    placeholder: "Spreadsheet Style Value Format",
  };
  optionsResponse["options"]["points_legend_value_format"] = {
    label: "Point Value Format",
    order: 202,
    section: "  Values",
    type: "string",
    display: "text",
    default: "",
    placeholder: "Spreadsheet Style Value Format",
  };
  optionsResponse["options"]["point_labels_divider"] = {
    label: "Point Labels ---------------------------------------------",
    section: "Labels",
    type: "string",
    display: "divider",
    order: 1000,
    default: false,
  };
  optionsResponse["options"]["point_labels"] = {
    label: "Scatterplot Point Labels",
    section: "Labels",
    type: "boolean",
    order: 1001,
    default: false,
  };
  optionsResponse["options"]["point_labels_x_offset"] = {
    label: "Point Label X Offset",
    section: "Labels",
    type: "number",
    display: "range",
    display_size: "half",
    default: 0,
    order: 1002,
    min: -50,
    max: 50,
    step: 1,
  };
  optionsResponse["options"]["point_labels_y_offset"] = {
    label: "Point Label Y Offset",
    section: "Labels",
    type: "number",
    display: "range",
    display_size: "half",
    order: 1003,
    default: 0,
    min: -50,
    max: 50,
    step: 1,
  };
  optionsResponse["options"]["point_labels_angle"] = {
    label: "Point Label Angle",
    section: "Labels",
    type: "number",
    display: "range",
    display_size: "half",
    order: 1004,
    default: 0,
    min: -90,
    max: 90,
    step: 1,
  };
  optionsResponse["options"]["point_labels_font_size"] = {
    label: "Point Label Font Size",
    section: "Labels",
    type: "number",
    display_size: "half",
    default: 12,
    order: 1005,
  };
  optionsResponse["options"]["reference_line_divider"] = {
    label: "Reference Lines ----------------------------------------",
    order: 1006,
    section: "Labels",
    type: "string",
    display: "divder",
  };
  optionsResponse["options"]["reference_line_x"] = {
    label: "X Axis",
    order: 1007,
    section: "Labels",
    type: "boolean",
    display_size: "half",
  };
  optionsResponse["options"]["reference_line_y"] = {
    label: "Y Axis",
    order: 1008,
    section: "Labels",
    type: "boolean",
    display_size: "half",
  };
  optionsResponse["options"]["reference_line_x_p"] = {
    label: "X Axis Percentile",
    placeholder: "Value from 0 to 100",
    order: 1009,
    section: "Labels",
    type: "number",
    display_size: "half",
    default: 50,
  };
  optionsResponse["options"]["reference_line_y_p"] = {
    label: "Y Axis Percentile",
    placeholder: "Value from 0 to 100",
    order: 1010,
    section: "Labels",
    type: "number",
    display_size: "half",
    default: 50,
  };
  optionsResponse["options"]["reference_line_x_width"] = {
    label: "X Axis Stroke",
    order: 1011,
    section: "Labels",
    type: "number",
    display_size: "half",
    default: 3,
  };
  optionsResponse["options"]["reference_line_y_width"] = {
    label: "Y Axis Stroke",
    order: 1012,
    section: "Labels",
    type: "number",
    display_size: "half",
    default: 3,
  };

  return optionsResponse;
}
