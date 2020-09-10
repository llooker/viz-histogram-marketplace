export const baseOptions = {
    // BINNING
    bin_type: {
        label: "Binning Type",
        section: " Values",
        type: "string",
        order: 3,
        display: "radio",
        values: [
            {'Max Bins' : {description: 'Set a maximum number of bins', value: 'bins' }},
            {'Steps': {description: 'Set an exact step size to use between bins', value: 'steps'}},
        ],
        default: 'bins'
    },
    //COLOR
    color_col: {
        type: "string",
        section: "Style",
        label: "Color",
        display: "color",
        display_size: "half",
        default: "#4285F4",
        order: 4
    },
    color_on_hover: {
        type: "string",
        section: "Style",
        label: "Color On Hover",
        display: "color",
        display_size: "half",
        default: "#5F6368",
        order: 5
    },

    //X-AXIS STYLE
    x_axis_override: {
        label: "X Axis Title Override",
        section: "Style",
        type: "string",
        display: "text",
        default: "",
        order: 6
    },
    x_axis_title_font_size: {
        label: "X Axis Title Size",
        section: "Style",
        type: "number",
        display: "text",
        default: 24,
        display_size: "half",
        order: 7
    },
    x_axis_label_font_size: {
        label: "X Axis Label Size",
        section: "Style",
        type: "number",
        display: "text",
        default: 14,
        display_size: "half",
        order: 8
    },

    //Y-AXIS STYLE
    y_axis_override: {
        label: "Y Axis Title Override",
        section: "Style",
        type: "string",
        display: "text",
        default: "",
        order: 9
    },
    y_axis_title_font_size: {
        label: "Y Axis Title Size",
        section: "Style",
        type: "number",
        display: "text",
        default: 24,
        display_size: "half",
        order: 10
    },
    y_axis_label_font_size: {
        label: "Y Axis Label Size",
        section: "Style",
        type: "number",
        display: "text",
        default: 14,
        display_size: "half",
        order: 11
    }
}