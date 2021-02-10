import percentile from "percentile";
import SSF from "ssf";

export function winsorize(myData, field, p) {
  if (p === undefined ) { return; }
  p = p.split("_").map((e) => eval(e));
  let thresholds = percentile(
    p,
    myData.map((e) => e[field])
  );

  return myData.map((e) => {
    let copy = Object.assign({}, e);
    if (copy[field] <= thresholds[0]) {
      copy[field] = thresholds[0];
    } else if (e[field] >= thresholds[1]) {
      copy[field] = thresholds[1];
    }
    return copy;
  });
}

export function handleErrors(vis, res, options) {
  const check = (group, noun, count, min, max) => {
    if (!vis.addError || !vis.clearErrors) return false;
    if (count < min) {
      vis.addError({
        title: `Not Enough ${noun}s`,
        message: `This visualization requires ${
          min === max ? "exactly" : "at least"
        } ${min} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    if (count > max) {
      vis.addError({
        title: `Too Many ${noun}s`,
        message: `This visualization requires ${
          min === max ? "exactly" : "no more than"
        } ${max} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    vis.clearErrors(group);
    return true;
  };

  const { pivots, dimension_like: dimensions, measure_like: measures } = res.fields;
  return (
    check("pivot-req", "Pivot", pivots.length, options.min_pivots, options.max_pivots) &&
    check(
      "dim-req",
      "Dimension",
      dimensions.length,
      options.min_dimensions,
      options.max_dimensions
    ) &&
    check(
      "mes-req",
      "Measure",
      measures.length,
      options.min_measures,
      options.max_measures
    )
  );
}

export function prepareData(data, queryResponse) {
  var myData = [];
  var dataProperties = {};
  var dims = [];
  var meas = [];
  var allFields = [];

  //get the data and store the links
  for (var cell in data) {
    var obj = data[cell];
    var dataDict = {};
    dataDict["links"] = [];
    for (var key in obj) {
      var shortName = key.replace(".", "_");
      dataDict[shortName] = obj[key]["value"];
      if (typeof obj[key]["links"] != "undefined") {
        //create array of all links for a row of data
        for (var l = 0; l < obj[key]["links"].length; l++) {
          //grab link label and add field name for clarity in menu
          var currentLabel = obj[key]["links"][l]["label"];
          currentLabel = currentLabel + " (" + key.substring(key.indexOf(".") + 1) + ")";
          obj[key]["links"][l]["label"] = currentLabel;
        }
        //add links for field in row
        dataDict["links"].push(obj[key]["links"]);
      }
    }
    //flatten to make single depth array
    dataDict["links"] = dataDict["links"].flat();
    myData.push(dataDict);
  }

  //create array of all measures for lookup purposes
  queryResponse.fields.measure_like.forEach(function (field) {
    var fieldName = field.name.replace(".", "_");
    meas.push(fieldName);
  });
  //create array of all dimensions for lookup purposes
  queryResponse.fields.dimension_like.forEach(function (field) {
    var fieldName = field.name.replace(".", "_");
    dims.push(fieldName);
  });

  allFields = meas.concat(dims);

  //determine number format
  for (var field in allFields) {
    var lookerName = allFields[field];
    dataProperties[allFields[field]] = {};
    //get friendly names for measures
    queryResponse.fields.measure_like.forEach(function (measure) {
      if (lookerName == measure["name"].replace(".", "_")) {
        // get index of period to place it back in for drilling
        dataProperties[allFields[field]]["lookerName"] = measure["name"];
        //get label short or label to handle table calcs
        if (typeof measure["label_short"] != "undefined") {
          dataProperties[allFields[field]]["title"] = measure["label_short"].trim();
        } else {
          dataProperties[allFields[field]]["title"] = measure["label"].trim();
        }
        dataProperties[allFields[field]]["valueFormat"] = measure["value_format"];
        if (measure["type"] == "yesno") {
          dataProperties[allFields[field]]["dtype"] = "nominal";
        } else {
          dataProperties[allFields[field]]["dtype"] = "quantitative";
        }
      }
    });
    //get friendly names for dimensions
    queryResponse.fields.dimension_like.forEach(function (dimension) {
      if (lookerName == dimension["name"].replace(".", "_")) {
        // get index of period to place it back in for drilling
        dataProperties[allFields[field]]["lookerName"] = dimension["name"];
        if (typeof dimension["label_short"] != "undefined") {
          dataProperties[allFields[field]]["title"] = dimension["label_short"];
        } else {
          dataProperties[allFields[field]]["title"] = dimension["label"];
        }
        dataProperties[allFields[field]]["valueFormat"] = dimension["value_format"];
        dataProperties[allFields[field]]["dtype"] = "nominal";
      }
    });
  }

  return { dataProperties, myData };
}

export function makeBins(myData, field, breakpointsArray, valFormat, axis) {
  if (!(myData && field && breakpointsArray && valFormat && axis)) { return; }
  let preBin = [];
  let orderedArray = myData.map((e) => e[field]).sort((a, b) => a - b);
  let breakpoints = breakpointsArray.split(",").map((e) => {
    switch (e.trim()) {
      case "min":
        return orderedArray[0];
      case "max":
        return orderedArray[orderedArray.length - 1];
      default:
        return eval(e);
    }
  });

  //Find first element larger than target
  for (let i = 0; i < breakpoints.length - 1; i++) {
    let threshold = orderedArray.findIndex((n) => n > breakpoints[i + 1]);
    if (threshold === -1) {
      threshold = orderedArray.length;
    }

    //Count length of resulting array
    let count = orderedArray.splice(0, threshold).length;
    preBin.push({});
    preBin[i][`bin_start_${axis}`] = breakpoints[i];
    preBin[i][`bin_end_${axis}`] = breakpoints[i + 1];
    preBin[i][`count_${axis}`] = count;
    preBin[i]["label"] = `${SSF.format(
      valFormat,
      preBin[i][`bin_start_${axis}`]
    )} - ${SSF.format(valFormat, preBin[i][`bin_end_${axis}`])}`;
    preBin[i]["order"] = i + 1;
  }
  return preBin;
}

export function getPercentile(p, field, myData) {
  return percentile(
    p,
    myData.map((e) => e[field]).filter(e => e !== null)
  );
}
