project_name: "viz-histogram-marketplace"

constant: VIS_LABEL {
  value: "Histogram"
  export: override_optional
}

constant: VIS_ID {
  value: "histogram-marketplace"
  export:  override_optional
}

visualization: {
  id: "@{VIS_ID}"
  file: "histogram.js"
  label: "@{VIS_LABEL}"
}
