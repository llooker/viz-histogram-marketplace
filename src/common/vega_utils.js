import { ORDINAL } from "vega-lite/build/src/type";

export const formatType = (valueFormat) => {
    if (!valueFormat) return undefined
    let formatString = ''
    switch (valueFormat.charAt(0)) {
      case '$':
        formatString += '$'; break
      case '£':
        formatString += '£'; break
      case '€':
        formatString += '€'; break
    }
    if (valueFormat.indexOf(',') > -1) {
      formatString += ','
    }
    const splitValueFormat = valueFormat.split('.')
    formatString += '.'
    formatString += splitValueFormat.length > 1 ? splitValueFormat[1].length : 0
  
    switch (valueFormat.slice(-1)) {
      case '%':
        formatString += '%'; break
      case '0':
        formatString += 'f'; break
    }
    
    return formatString
  }


export const handleErrors = (vis, res, options) => {
  const check = (group, noun, count, min, max) => {
    if (!vis.addError || !vis.clearErrors) return false
    if (count < min) {
      vis.addError({
        title: `Not Enough ${noun}s`,
        message: `This visualization requires ${min === max ? 'exactly' : 'at least'} ${min} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
        group
      })
      return false
    }
    if (count > max) {
      vis.addError({
        title: `Too Many ${noun}s`,
        message: `This visualization requires ${min === max ? 'exactly' : 'no more than'} ${max} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
        group
      })
      return false
    }
    vis.clearErrors(group)
    return true
  }

  const { pivots, dimensions, measure_like: measures } = res.fields

  return (check('pivot-req', 'Pivot', pivots.length, options.min_pivots, options.max_pivots)
   && check('dim-req', 'Dimension', dimensions.length, options.min_dimensions, options.max_dimensions)
   && check('mes-req', 'Measure', measures.length, options.min_measures, options.max_measures))
}


export const prepareData = (data, queryResponse) => {
    var myData = [];
    var dataProperties = {};
    var dims = [];
    var meas = [];
    var allFields = [];

    //get the data and store the links
    for (var cell in data) {
        var obj = data[cell];
        var dataDict = {};
        dataDict['links'] = [];
        for (var key in obj){
          var shortName = key.replace(".","_");
          dataDict[shortName] = obj[key]['value'];
          if (typeof obj[key]['links'] != "undefined") {
  
            //create array of all links for a row of data
            for(var l=0; l<obj[key]['links'].length; l++){
  
              //grab link label and add field name for clarity in menu
              var currentLabel = obj[key]['links'][l]['label'];
              currentLabel = currentLabel + " (" + key.substring(key.indexOf(".")+1) + ")";
              obj[key]['links'][l]['label'] = currentLabel;
            }
            //add links for field in row
            dataDict['links'].push(obj[key]['links']);
          }
        }
        //flatten to make single depth array
        dataDict['links'] = dataDict['links'].flat();
        myData.push(dataDict);
      }
  
      //create array of all measures for lookup purposes
      queryResponse.fields.measure_like.forEach(function(field){
        var fieldName = (field.name).replace(".","_");
        meas.push(fieldName);      
      });
      //create array of all dimensions for lookup purposes
      queryResponse.fields.dimension_like.forEach(function(field){
        var fieldName = (field.name).replace(".","_");
        dims.push(fieldName);      
      });
  
      allFields = meas.concat(dims);
  
      var dataFormatDict = {
        "$#,##0" : "$,.0f",
        "$#,##0.00" : "$,.2f",
        "#,##0.00%" : ",.2%",
        "#,##0.0%" : ",.1%",
        "#,##0%" : ",.0%",
        "null" : ""
      };
  
      //determine number format
      for (var field in allFields) {
        var lookerName = allFields[field];
        dataProperties[allFields[field]] = {};
        
        //get friendly names for measures
        queryResponse.fields.measure_like.forEach(function(measure){
          if (lookerName == measure['name'].replace(".","_")) {
            // get index of period to place it back in for drilling
            dataProperties[allFields[field]]['lookerName'] = measure['name'];
            //get label short or label to handle table calcs
            if (typeof measure['label_short'] != "undefined") {
              dataProperties[allFields[field]]['title'] = measure['label_short'];
            } else {
              dataProperties[allFields[field]]['title'] = measure['label'];
            }
            //dataProperties[allFields[field]]['valueFormat'] = dataFormatDict[String(measure['value_format'])];
            dataProperties[allFields[field]]['valueFormat'] = formatType(measure['value_format'])
            if (measure['type'] == "yesno") {
              dataProperties[allFields[field]]['dtype'] = "nominal";
            } else {
              dataProperties[allFields[field]]['dtype'] = "quantitative";
            }
            
          } 
        });
        //get friendly names for dimensions
        queryResponse.fields.dimension_like.forEach(function(dimension){
          if (lookerName == dimension['name'].replace(".","_")) {
            // get index of period to place it back in for drilling
            dataProperties[allFields[field]]['lookerName'] = dimension['name'];
            if (typeof dimension['label_short'] != "undefined") {
              dataProperties[allFields[field]]['title'] = dimension['label_short'];
            } else {
              dataProperties[allFields[field]]['title'] = dimension['label'];
            }       
            dataProperties[allFields[field]]['valueFormat'] = dataFormatDict[String(dimension['value_format'])];
            dataProperties[allFields[field]]['dtype'] = "nominal";
          } 
        });
      }

      return { dataProperties, myData }

}

export const tooltipFormatter = (datum) => {
    if((datum['dtype'] === "quantitative" && datum['valueFormat'] === "") || datum['valueFormat'] === undefined) {
      return ",d"
    }
    return datum['valueFormat']
  }

export const histTooltipHandler = (datum, bins) => {
  console.log(bins)
    return [{
      "title": datum['title'],
      "bin": bins,
      "field": bins.binned ? "label" : datum['lookerName'].replace('.','_'),
      "type": bins.binned ? "ordinal" : "quantitative",
      ...(!bins.binned && {"format": tooltipFormatter(datum)})
    },
    {
      "title": "Count of Records",
      "type": "quantitative",
      ...(!bins.binned && {"aggregate": "count"}),
      ...(bins.binned && {"field": "count"}),
    }]
  }

export const makeBins = (myData, field, breakpointsArray) => {
  let preBin = []
  let orderedArray = myData.map((e) => e[field]).sort((a,b) => a - b);
  let breakpoints = breakpointsArray.split(',').map(e => eval(e))
  breakpoints.push(orderedArray[orderedArray.length-1])

  for(let i = 0; i < breakpoints.length - 1; i++){
    let threshold = orderedArray.findIndex(n =>  n > breakpoints[i+1]);
    if(threshold === -1) {
      threshold = orderedArray.length
    }

    let count = orderedArray.splice(0, threshold).length
    preBin.push({
      "bin_start": breakpoints[i],
      "bin_end": breakpoints[i+1],
      "count": count
    })
    preBin[i]['label'] = `${preBin[i]['bin_start']}-${preBin[i]['bin_end']}`
  }

  return preBin;
}