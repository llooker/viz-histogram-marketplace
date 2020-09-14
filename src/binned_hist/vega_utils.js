import { formatType } from './utils'

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
