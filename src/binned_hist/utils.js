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

  const checkNumeric = (dim, mes) => {
      if (dim.filter((d) => d.is_numeric).length + mes.length >= 2) {
          return true
      }
      vis.addError({
          title: 'Not enough numeric fields',
          message: 'This visualization requires at least two numeric dimensions/measures'
      })
      return false
  } 

  const { pivots, dimensions, measure_like: measures } = res.fields

  return (check('pivot-req', 'Pivot', pivots.length, options.min_pivots, options.max_pivots)
   && check('dim-req', 'Dimension', dimensions.length, options.min_dimensions, options.max_dimensions)
   && check('mes-req', 'Measure', measures.length, options.min_measures, options.max_measures))
   && checkNumeric(dimensions, measures)
}