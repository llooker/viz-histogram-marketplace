export const baseOptions = {
  // BINNING
  bin_type: {
    label: "Binning Type",
    section: "  Values",
    type: "string",
    order: 3,
    display: "radio",
    values: [
      {'Max Bins' : {description: 'Set a maximum number of bins', value: 'bins' }},
      {'Steps': {description: 'Set an exact step size to use between bins', value: 'steps'}},
      {'Breakpoints': {description: 'An array of allowable step sizes to choose from.', value: 'breakpoints'}}
    ],
    default: 'bins'
  },
  bin_style: {
    label: "Chart Type",
    section: "  Values",
    type: "string",
    order: 1,
    display: "select",
    default: 'simple_hist',
    values: [
      {'Simple Histogram' : 'simple_hist'},
      {'Scatter Histogram' : 'binned_hist'}
    ]
  },
  //COLOR
  color_col: {
    type: "string",
    section: " Style",
    label: "Color",
    display: "color",
    display_size: "half",
    default: "#4285F4",
    order: 2
  },
  color_on_hover: {
    type: "string",
    section: " Style",
    label: "Color On Hover",
    display: "color",
    display_size: "half",
    default: "#5F6368",
    order: 2
  },

  //X-AXIS  Style
  x_axis_override: {
    label: "X Axis Title Override",
    section: "Labels",
    type: "string",
    display: "text",
    default: "",
    order: 7
  },
  x_grids: {
    label: "X Axis Gridlines",
    section: " Style",
    type: "boolean",
    display: "select",
    display_size: "half",
    default: false
  },
  x_axis_title_font_size: {
    label: "X Axis Title Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 24,
    display_size: "half",
    order: 9
  },
  x_axis_label_font_size: {
    label: "X Axis Label Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 14,
    display_size: "half",
    order: 10
  },


  //Y-AXIS  Style
  y_axis_override: {
    label: "Y Axis Title Override",
    section: "Labels",
    type: "string",
    display: "text",
    default: "",
    order: 11
  },
  y_grids: {
    label: "Y Axis Gridlines",
    section: " Style",
    type: "boolean",
    display: "select",
    display_size: "half",
    order: 12,
    default: false
  },
  y_axis_title_font_size: {
    label: "Y Axis Title Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 24,
    display_size: "half",
    order: 13
  },
  y_axis_label_font_size: {
    label: "Y Axis Label Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 14,
    display_size: "half",
    order: 14
  },
}