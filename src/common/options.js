export const baseOptions = {
  // BINNING
  bin_type: {
    label: "Binning Type",
    section: "  Values",
    type: "string",
    order: 2,
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
  // show_percent: {
  //   label: "Show as Percent",
  //   section: "  Values",
  //   type: "boolean",
  //   order: 5,
  //   default: false
  // },
  winsorization: {
    label: "Limit Outliers (Winsorize)",
    section: "  Values",
    type: "boolean",
    order: 6,
    default: false
  },
  //COLOR
  color_col: {
    type: "string",
    section: " Style",
    label: "Color",
    display: "color",
    display_size: "half",
    default: "#4285F4",
    //default: "#7A55E3",
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
    default: true
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
  x_axis_label_angle: {
    label: "X Axis Label Angle",
    section: "Labels",
    type: "number",
    display: "range",
    default: 0,
    order: 11,
    min: 0,
    max: 90,
    step: 1
  },


  //Y-AXIS  Style
  y_axis_override: {
    label: "Y Axis Title Override",
    section: "Labels",
    type: "string",
    display: "text",
    default: "",
    order: 12
  },
  y_grids: {
    label: "Y Axis Gridlines",
    section: " Style",
    type: "boolean",
    display: "select",
    display_size: "half",
    order: 13,
    default: true
  },
  y_axis_title_font_size: {
    label: "Y Axis Title Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 24,
    display_size: "half",
    order: 14
  },
  y_axis_label_font_size: {
    label: "Y Axis Label Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 14,
    display_size: "half",
    order: 15
  },
  y_axis_label_angle: {
    label: "Y Axis Label Angle",
    section: "Labels",
    type: "number",
    display: "range",
    default: 0,
    order: 16,
    min: 0,
    max: 90,
    step: 1
  },
  font_type: {
    label: "Font Type",
    order: 1000,
    section: "Labels",
    type: "string",
    display: "select",
    values: [
      {"Google Sans": "Google Sans"},
      {"Open Sans": "'Open Sans','Noto Sans JP','Noto Sans CJK KR','Noto Sans Arabic UI','Noto Sans Devanagari UI','Noto Sans Hebrew','Noto Sans Thai UI',Helvetica,Arial,sans-serif,'Noto Sans'"},
      {"Tahoma": "Tahoma, Geneva, sans-serif"},
    ],
    default: "'Open Sans','Noto Sans JP','Noto Sans CJK KR','Noto Sans Arabic UI','Noto Sans Devanagari UI','Noto Sans Hebrew','Noto Sans Thai UI',Helvetica,Arial,sans-serif,'Noto Sans'"
  }

}


export function createOptions(queryResponse, baseOptions, config, maxX, maxY){
  var optionsResponse = {};
  optionsResponse['options'] = Object.assign({}, baseOptions);
  optionsResponse['measures'] = [];
  optionsResponse['dimensions'] = [];
  optionsResponse['masterList'] = [];

  //Remove breakpoint option
  if(optionsResponse['options']['bin_type']['values'].length > 2){
    optionsResponse['options']['bin_type']['values'].pop();
  }

  var dimCounter = 1;
  var mesCounter = 1;
  var defaultDim;
  var defaultDim2;
  var defaultMes;
  var defaultMes2;

  queryResponse.fields.dimension_like.forEach(function(field){
    if (!field.is_numeric && field.type !== "tier") {
      return
    } 
    var dimLib = {};
    var fieldName = (field.name).replace(".","_");
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
    optionsResponse['masterList'].push(dimLib); //add to master list of all fields
    optionsResponse['dimensions'].push(dimLib);
    dimCounter += 1;
  });

  queryResponse.fields.measure_like.forEach(function(field){
    var mesLib = {};
    var fieldName = (field.name).replace(".","_");
    if (typeof field.label_short != "undefined") {
      mesLib[field.label_short] = fieldName;
      optionsResponse['measures'].push(mesLib);
    } else {
      mesLib[field.label] = fieldName;
      if (field.type == "yesno") {
        optionsResponse['dimensions'].push(mesLib);
      } else {
        optionsResponse['measures'].push(mesLib);
      }
    }
    if (mesCounter == 1) {
      defaultMes = fieldName; //grab first measure as default Y value
    } else if (mesCounter == 2) {
      defaultMes2 = fieldName;
    }
    optionsResponse['masterList'].push(mesLib);
    
    mesCounter += 1;
  });

  if (typeof defaultMes == "undefined") {
    defaultMes = defaultDim;
  }

  if (typeof defaultMes2 == "undefined") {
    defaultMes2 = defaultDim2;
  }
  if(config['bin_type'] === 'steps') {
    optionsResponse['options']['num_step_x'] = {
      label: "Step Size (X)",
      section: "  Values",
      type: "number",
      order: 5,
      display: "text",
      default: Math.floor(maxX/10),  
      display_size: "half"
    }
    optionsResponse['options']['num_step_y'] = {
      label: "Step Size (Y)",
      section: "  Values",
      type: "number",
      order: 6,
      display: "text",
      default: Math.floor(maxY/10),  
      display_size: "half"
    }
  } else if(config['bin_type'] === 'bins'){
    optionsResponse['options']['max_bins'] = {
      label: "Max number of Bins",
      section: "  Values",
      type: "number",
      order: 4,
      display: "range",
      step: 1,
      min: 1,
      max: 100,
      default: 10
    }
  } else if(config['bin_type'] === 'breakpoints') {
    optionsResponse['options']['breakpointsX'] = {
      label: "Breakpoints (X)",
      section: "  Values",
      type: "string",
      placeholder: "Comma seperated breakpoints (100, 200, 300)",
      order: 4
    }
    optionsResponse['options']['breakpointsY'] = {
      label: "Breakpoints (Y)",
      section: "  Values",
      type: "string",
      placeholder: "Comma seperated breakpoints (100, 200, 300)",
      order: 5
    }
  }
  if(config['winsorization']) {
    optionsResponse['options']['percentile'] = {
      label: "Percentiles",
      section: "  Values",
      type: "string",
      order: 7,
      display: "select",
      display_size: "half",
      default: '1_99',
      values: [
        {'1% - 99%' : '1_99'},
        {'5% - 95%' : '5_95'}
      ]
    }
  }

  optionsResponse['options']['x'] = {
    label: "X Axis",
    section: "  Values",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse['masterList'],
    default: defaultMes
  }
  optionsResponse['options']['y'] = {
    label: "Y Axis",
    section: "  Values",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse['masterList'],
    default: defaultMes2
  }
  optionsResponse['options']['heatmap_off'] = {
    label: "Show Heatmap",
    section: "  Values",
    type: "boolean",
    order: 7,
    display: "select",
    default: true
  }
  optionsResponse['options']['layer_points'] = {
    label: "Show Points",
    section: "  Values",
    type: "boolean",
    order: 8,
    display: "select",
    default: true
  }
  var size_arr = optionsResponse['masterList'].concat([{'None': ""}]);
  optionsResponse['options']['size'] = {
    label: "Size Points By",
    section: "  Values",
    type: "string",
    order: 9,
    display: "select",
    values: size_arr,
    default: ""
  }
  optionsResponse['options']['color_scheme'] = {
    label: "Heatmap Color Scheme",
    section: " Style",
    type: "array",
    display: "colors",
    order: 1,
    default: ["#dbf1b4", "#bde5b5", "#94d5b9", "#69c5be", "#45b4c2", "#2c9ec0", "#2182b8", "#2163aa", "#23479c"]
  }
  optionsResponse['options']['heatmap_opacity'] = {
    label: "Heatmap Opacity",
    section: " Style",
    type: "number",
    display: "range",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    default: 0.8,
    order: 2
  }
  optionsResponse['options']['point_opacity'] = {
    label: "Point Opacity",
    section: " Style",
    type: "number",
    display: "range",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    default: 0.8,
    order: 6
  }
  optionsResponse['options']['legend_orient'] = {
    label: "Legend Position",
    section: "Labels",
    type: "string",
    display: "select",
    order: 6,
    values: [
      {"Left" : "left"},
      {"Right": "right"},
      {"Top" : "top"},
      {"Bottom": "bottom"}
    ],
    display_size: "half",
    default: "right"
  }
  optionsResponse['options']['legend_size'] = {
    label: "Legend Font Size",
    section: "Labels",
    type: "number",
    display: "text",
    default: 16,
    display_size: "half",
    order: 7
  }

  return optionsResponse;
}