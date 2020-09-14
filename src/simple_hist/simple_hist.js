import embed from 'vega-embed'
import { baseOptions } from '../options'
import { 
    handleErrors, 
    prepareData,
    histTooltipHandler
} from './vega_utils'
import { QUANTITATIVE } from 'vega-lite/build/src/type';

// export const simple_hist = {
//     options: baseOptions,
//     create: function(element, config) {
//         const container = element.appendChild(document.createElement("div"));
//         container.setAttribute("id","my-vega");
//     },
    //updateAsync: 
    
    export function simple_hist(data, element, config, queryResponse, details, done, that){
        console.log(queryResponse, data)
        that.clearErrors();

        if (!handleErrors(that, queryResponse, {
            min_pivots: 0, max_pivots: 0,
            min_dimensions: 1, max_dimensions: undefined,
            min_measures: 1, max_measures: undefined
        })) return

        const { dataProperties, myData } = prepareData(data, queryResponse);
        const vegaSafeNameMes = queryResponse.fields.measure_like[0].name.replace('.', '_');
        const vegaSafeNameDim = queryResponse.fields.dimensions[0].name.replace('.', '_');
        const width = element.clientWidth * 0.95;
        const height = element.clientHeight * 0.92;

        const options = Object.assign({}, baseOptions)
        const max = (() => {
            return (Math.max.apply(Math, myData.map((e) => { return e[vegaSafeNameMes]})))
        })()    
        if(config['bin_type'] === 'bins') {
            options['max_bins'] = {
                label: "Max number of Bins",
                section: " Values",
                type: "number",
                order: 4,
                display: "range",
                step: 1,
                min: 1,
                max: 200,
                default: 10
            }
        } else if(config['bin_type'] === 'steps') {
            options['step_size'] = {
                label: "Step Size",
                section: " Values",
                type: "number",
                order: 5,
                display: "text",
                default: Math.floor(max/10)  
            }
        } else {
            options['breakpoint_array'] = {
                label: "Breakpoints",
                section: " Values",
                type: "array",
                default: [100,200,300]
            }
            
        }
        that.trigger('registerOptions', options)
        if(config['bin_type'] === 'breakpoints'){
            const breakpointInts = config['breakpoint_array'].map(e => parseInt(e, 10))
            console.log(breakpointInts)
        }
       
        // console.log(max)
        // console.log(dataProperties)
        // console.log(myData)
        // console.log(details)
        //console.log(config['breakpoint_array'])
        // const breakpointInts = config['breakpoint_array'].map(e => parseInt(e, 10))
        


        const vegaChart = {
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {"values": myData},
            "width": width,
            "height": height,
            "padding": 5,
            "selection": {
                "highlight": {
                    "type": "single",
                    "empty": "none",
                    "on": "mouseover"
                },
            },
            "mark": {
                "type": "bar",
                "cursor": "pointer"
            },
            "encoding": {
                "x": {
                    "type": QUANTITATIVE,
                    "bin": {
                        "maxbins": config['max_bins'],
                        ...(config['bin_type'] === 'steps' && {'step': config['step_size']}),
                    },
                    "field": vegaSafeNameMes,
                    "axis": {
                        "title": config['x_axis_override'] === "" ? dataProperties[vegaSafeNameMes]['title'] : config['x_axis_override'],
                        "titleFontSize": config['x_axis_title_font_size'],
                        "labelFontSize": config['x_axis_label_font_size']
                    }
                },
                "y": {
                    "type": QUANTITATIVE,
                    "aggregate": "count",
                    "axis": {
                        "title": config['y_axis_override'] === "" ? `Count of ${dataProperties[vegaSafeNameDim]['title']}` : config['y_axis_override'],
                        "titleFontSize": config['y_axis_title_font_size'],
                        "labelFontSize": config['y_axis_label_font_size'],
                    }
                },
                "color": {
                    "condition": {"selection": "highlight", "value": config['color_on_hover']},
                    "value": config['color_col'],
                },
                "tooltip": histTooltipHandler(dataProperties[vegaSafeNameMes], {
                    "maxbins": config['max_bins'],
                    ...(config['bin_type'] === 'steps' && {'step': config['step_size']})
                })
            }   
           
        }

        embed("#my-vega", vegaChart, {actions: false}).then( ({spec, view}) => {
            view.addEventListener('click', function (event, item) {
                const aggField = dataProperties[vegaSafeNameMes]['lookerName']
                const bounds = Object.keys(item.datum).filter(ele => ele.includes(vegaSafeNameMes))
                
                let links = item.datum.links
                let baseURL = myData[0].links
                let fields = []

                for(let field of queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)) {
                    fields.push(field.name)
                }
                // Base URL points to all fields in queryResponse                
                if(baseURL.length < 1) { 
                    links = [] 
                } else {
                    baseURL = baseURL.filter(ele => ele.url.includes('/explore/'))[0].url.split('?')[0]
                    let url = `${baseURL}?fields=${fields.join(',')}`

                    // Apply appropriate filtering based on bounds
                    url += `&f[${aggField}]=[${item.datum[bounds[0]]}, ${item.datum[bounds[1]]}]`
                    links = [
                        {
                            label: `Show ${item.datum.__count} Records`, 
                            type: 'drill', 
                            type_label: 'Drill into Records', 
                            url: url
                        }
                    ]     
                }

                LookerCharts.Utils.openDrillMenu({
                    links: links,
                    event: event
                })
            
            })
        })
    }
//}


//looker.plugins.visualizations.add(simple_hist)