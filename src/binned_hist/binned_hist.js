import embed from 'vega-embed'
import { handleErrors } from './utils'
import { prepareData } from './vega_utils'
import { field } from 'vega';


//export const binned_hist = {
    // create: function(element, config) {
    //   var container = element.appendChild(document.createElement("div"));
    //   container.setAttribute("id","my-vega");
    // },


    //updateAsync: 
    
    export function binned_hist(data, element, config, queryResponse, details, doneRendering, that) {
      that.clearErrors();

      if (!handleErrors(that, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 0, max_dimensions: undefined,
        min_measures: 0, max_measures: undefined
      })) return
  
      var width = element.clientWidth - (60 * 5);
      var height = element.clientHeight - (
            60 * (config['legend_orient'] === 'top' || config['legend_orient'] === 'bottom' ? 3 : 2)
          ); //60*2 due to hist and axis labels


      const options = createOptions(queryResponse)['options'];
      const { dataProperties, myData } = prepareData(data, queryResponse);

      that.trigger('registerOptions', options);
    
      //construct the tooltip with appropriate formatting
      const tooltipFormatter = (datum) => {
        if((datum['dtype'] === "quantitative" && datum['valueFormat'] === "") || datum['valueFormat'] === undefined) {
          return ",d"
        }
        return datum['valueFormat']
      }
        

      const tooltipHandler = (axis) => {
        return [{
          "title": dataProperties[config[axis]]['title'],
          "bin": {
            "maxbins": config['num_bins'],
            ...(config.steps_or_bins === 'steps' && {'step': config[`num_step_${axis}`]})
          },
          "field": config[axis],
          "type": "quantitative",
          "format": tooltipFormatter(dataProperties[config[axis]])
        },
        {
          "title": "Count of Records",
          "aggregate": "count",
          "type": "quantitative"
        }]
      }


      const tooltipFields = [];
      for (let datum in dataProperties) {
        let tip = {};
        tip['field'] = datum;
        tip['type'] = dataProperties[datum]['dtype'];
        tip['format'] = tooltipFormatter(dataProperties[datum])
        tip['title'] = dataProperties[datum]['title'];
        tooltipFields.push(tip);
      }
      //end section of prepping the data

      //TOP HIST
      var chart = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "data": {"values": myData},
        "spacing": 15,
        "bounds": "flush",
        "vconcat": [{
          "mark": {"type":"bar","color":config['histogram_color']},
          "height": 60, 
          "width": width,
          "encoding": {
            "x": {
              "bin": {
                "maxbins": config['num_bins'],
                ...(config.steps_or_bins === 'steps' && {'step': config['num_step_x']})
              },
              "field": config['x'],
              "type": "quantitative",
              "axis": null
            },
            "y": {
              "aggregate": "count",
              "type": "quantitative",
              "title": ""
            },
            "tooltip": tooltipHandler('x')
          },
        }, 

        //HEATMAP
        {
          "spacing": 15,
          "bounds": "flush",
          "hconcat": [{
            "layer": [{
              "mark": {
                "zindex": -1,
                "type":"rect",
                "stroke": config['border'] ? "#000000" : "",
                "strokeWidth": 2,
                "invalid": null,
                ...(!config['heatmap_off'] && {"fillOpacity": 0.0})
              },
              // Selections kill tooltip currently: https://github.com/vega/vega-lite/issues/6003
              // "selection": {
              //   "highlight": {
              //     "type": "single", 
              //     "empty": "none", 
              //     "on": "mouseover"
              //   },
              // },
              "height" : height,
              "width": width,
              "encoding": {
                "x": {
                  "bin": {
                    "maxbins":config['num_bins'],
                    ...(config.steps_or_bins === 'steps' && {'step': config['num_step_x']})
                  },
                  "field": config['x'],
                  "type": "quantitative",
                  "axis": { 
                      "title": dataProperties[config['x']]['title'], 
                      "titleFontSize" : config['x_title_font_size'],
                      "format": tooltipFormatter(dataProperties[config['x']]),
                      "labelFontSize": config['x_label_font_size'],
                      "grid": config['x_grids']
                    }
                },
                "y": {
                  "bin": {
                    "maxbins":config['num_bins'],
                    ...(config.steps_or_bins === 'steps' && {'step': config['num_step_y']})
                  },
                  "field": config['y'],
                  "type": "quantitative",
                  "axis": {
                      "title": dataProperties[config['y']]['title'],
                      "titleFontSize": config['y_title_font_size'],
                      "format": tooltipFormatter(dataProperties[config['y']]),
                      "labelFontSize": config['y_label_font_size'],
                      "grid": config['y_grids']
                    }
                },
                "color": {
                  "aggregate": "count",
                  "type": "quantitative",
                  "legend": !config['heatmap_off'] ? false : { "orient": config['legend_orient'] }
                },
                // "opacity": {
                //   "condition": {
                //     "selection": "highlight", "value": 1
                //   },
                //   "value": 0.7
                // }
              },           
            }]
          }, {
            "mark": {"type":"bar","color":config['histogram_color']},
            "width": 60,
            "height" : height,
            "encoding": {
              "y": {
                "bin": {
                  "maxbins":config['num_bins'],
                  ...(config.steps_or_bins === 'steps' && {'step': config['num_step_y']})
                },
                "field": config['y'],
                "type": "quantitative",
                "axis": null
              },
              "x": {
                "aggregate": "count",
                "type": "quantitative",
                "title": ""
              },
              "tooltip": tooltipHandler('y')
            }
          }]
        }],
        "config": {
          "range": {
            "heatmap": {
              "scheme": config['color_scheme']
              
            }
          },
          // "view": {
          //   "stroke": "transparent"
          // }
        }
      }
  
      //adds scatterplot
      if (config['layer_points']) {
  
        chart.vconcat[1].hconcat[0].layer[1] = {
              "mark": {
                "type":"circle",
                "color": config['histogram_color'],
                "opacity": config['point_opacity'],
                "zindex": 2
              },
              "height": height,
              "width": width,
              "encoding": {
                "tooltip":tooltipFields,
                "x": {
                  "field": config['x'],
                  "type": "quantitative"
                },
                "y": {
                  "field": config['y'],
                  "type": "quantitative"
                },
              }            
            };
  
            
            if (config['size'] != "" && typeof config['size'] != "undefined") {
              chart.vconcat[1].hconcat[0].layer[1].encoding.size = {
                "field": config['size'], 
                "type":"quantitative", 
                "title":dataProperties[config['size']]['title'],
                "legend": { 
                  "type": "symbol",
                  "orient": config['legend_orient'],
                  "format": tooltipFormatter(dataProperties[config['size']]),
                },
              };
            }
      }
  
      embed("#my-vega", chart, {actions: false}).then(({spec, view}) => {
        view.addEventListener('click', function (event, item) {
          
          var links = item.datum.links
          if (Object.keys(item.datum)[0].startsWith('bin_')) {
            let fields = []
            for(let field of queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)) {
              fields.push(field.name)
            }
            
            // Pull original Looker references from dataProperties
            const aggFieldX = dataProperties[config['x']]['lookerName']
            const aggFieldY = dataProperties[config['y']]['lookerName']
            const boundsX = Object.keys(item.datum).filter(ele => ele.includes(config['x']))
            const boundsY = Object.keys(item.datum).filter(ele => ele.includes(config['y']))
            
            // Base URL points to all fields in queryResponse
            let baseURL = myData[0].links
            if(baseURL.length < 1) { 
              links = [] 
            } else {
              baseURL = baseURL.filter(ele => ele.url.includes('/explore/'))[0].url.split('?')[0]
              let url = `${baseURL}?fields=${fields.join(',')}`
              // Apply appropriate filtering based on bounds
              if(boundsX.length > 0) {
                url += `&f[${aggFieldX}]=[${item.datum[boundsX[0]]}, ${item.datum[boundsX[1]]}]`
              }
              if(boundsY.length > 0){
                url += `&f[${aggFieldY}]=[${item.datum[boundsY[0]]}, ${item.datum[boundsY[1]]}]`
              }
              links = [
                {
                  label: `Show ${item.datum.__count} Records`, 
                  type: 'drill', 
                  type_label: 'Drill into Records', 
                  url: url
                }
              ]     
            }
          }
          LookerCharts.Utils.openDrillMenu({
            links: links,
            event: event
          });               
        });
        
        //center viz horizontally
        var vegaDiv = document.getElementsByClassName('vega-embed')[0];
        var canvasWidth = parseInt(document.getElementsByTagName('canvas')[0].style.width, 10);
        vegaDiv.style.paddingLeft = (Math.floor((element.getBoundingClientRect().width - canvasWidth)/2)) + 'px';
        
        doneRendering();
      });
  

    //}//end if statement checking for config to load
  
  
  
    }//end update async
  //};
  
  function createOptions(queryResponse){
  
    var optionsResponse = {};
    optionsResponse['options'] = {};
    optionsResponse['measures'] = [];
    optionsResponse['dimensions'] = [];
    optionsResponse['masterList'] = [];
  
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
  
  
    optionsResponse['options']['x'] = {
      label: "X Axis",
      section: " Values",
      type: "string",
      display: "select",
      order: 1,
      values: optionsResponse['masterList'],
      default: defaultMes
    }
    optionsResponse['options']['y'] = {
      label: "Y Axis",
      section: " Values",
      type: "string",
      display: "select",
      order: 2,
      values: optionsResponse['masterList'],
      default: defaultMes2
    }
    optionsResponse['options']['steps_or_bins'] = {
      label: "Binning Type",
      section: " Values",
      type: "string",
      order: 3,
      display: "select",
      values: [
        {'Max Bins (set a maximum number of bins)': 'bins' },
        {'Steps (set an exact step size to use between bins)': 'steps'},
      ],
      default: 'bins'
    }
    optionsResponse['options']['num_bins'] = {
      label: "Max number of Bins",
      section: " Values",
      type: "number",
      order: 4,
      display: "text",
      default: 10,
    }
    optionsResponse['options']['num_step_x'] = {
      label: "Step Size (X)",
      section: " Values",
      type: "number",
      order: 5,
      display: "text",
      default: 500,  
      display_size: "half"
    }
    optionsResponse['options']['num_step_y'] = {
      label: "Step Size (Y)",
      section: " Values",
      type: "number",
      order: 6,
      display: "text",
      default: 500,  
      display_size: "half"
    }
    optionsResponse['options']['heatmap_off'] = {
      label: "Show Heatmap",
      section: " Values",
      type: "boolean",
      order: 7,
      display: "select",
      default: true
    }
    optionsResponse['options']['layer_points'] = {
      label: "Show Points",
      section: " Values",
      type: "boolean",
      order: 8,
      display: "select",
      default: true
    }
    var size_arr = optionsResponse['masterList'].concat([{'None': ""}]);
    optionsResponse['options']['size'] = {
      label: "Size Points By",
      section: " Values",
      type: "string",
      order: 9,
      display: "select",
      values: size_arr,
      default: ""
    }
    optionsResponse['options']['color_scheme'] = {
      label: "Heatmap Color Scheme",
      section: "Style",
      type: "array",
      display: "colors",
      order: 1,
      default: ["#dbf1b4", "#bde5b5", "#94d5b9", "#69c5be", "#45b4c2", "#2c9ec0", "#2182b8", "#2163aa", "#23479c"]
    }
    optionsResponse['options']['border'] = {
      label: "Heatmap Border",
      section: "Style",
      type: "boolean",
      display: "select",
      default: false,
      order: 2,
    }
    optionsResponse['options']['histogram_color'] = {
      label: "Histogram/Point Color",
      section: "Style",
      type: "string",
      display: "color",
      display_size: "half",
      default: "#23479c",
      order: 3
    }
    optionsResponse['options']['point_opacity'] = {
      label: "Point Opacity",
      section: "Style",
      type: "number",
      display: "range",
      min: 0.0,
      max: 1.0,
      step: 0.05,
      default: 0.8,
      order: 3
    }
    optionsResponse['options']['legend_orient'] = {
      label: "Legend Position",
      section: "Style",
      type: "string",
      display: "select",
      order: 4,
      values: [
        {"Left" : "left"},
        {"Right": "right"},
        {"Top" : "top"},
        {"Bottom": "bottom"}
      ],
      default: "right"
    }
    optionsResponse['options']['x_grids'] = {
      label: "X Axis Gridlines",
      section: "Style",
      type: "boolean",
      display: "select",
      order: 6,
      default: false
    }
    optionsResponse['options']['x_title_font_size'] = {
      label: "X Axis Title Size",
      section: "Style",
      type: "number",
      display: "text",
      default: 24,
      display_size: "half",
      order: 7
    }
    optionsResponse['options']['x_label_font_size'] = {
      label: "X Axis Label Size",
      section: "Style",
      type: "number",
      display: "text",
      default: 14,
      display_size: "half",
      order: 8
    }
    optionsResponse['options']['y_grids'] = {
      label: "Y Axis Gridlines",
      section: "Style",
      type: "boolean",
      display: "select",
      order: 9,
      default: false
    }
    optionsResponse['options']['y_title_font_size'] = {
      label: "Y Axis Title Size",
      section: "Style",
      type: "number",
      display: "text",
      default: 24,
      display_size: "half",
      order: 10
    }
    optionsResponse['options']['y_label_font_size'] = {
      label: "Y Axis Label Size",
      section: "Style",
      type: "number",
      display: "text",
      default: 14,
      display_size: "half",
      order: 11
    }

    return optionsResponse;
  }