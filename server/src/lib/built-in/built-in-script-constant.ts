import { BuiltInDefinition } from "./types";


export const builtInScriptConstants: BuiltInDefinition = {
        name: "mr",
        label: "(constant) mr",
        definitionType: "constant",
        note: [
            "```ds",
            "(constant) mr",
            "```",
            "---------------------",
            "### Script Constants",
            "A number of constants are built into mrScriptBasic. Constants provide a convenient way to use specific values without actually having to remember the value itself. Using constants also makes your code more maintainable should the value of any constant ever change. Because these constants are already defined in mrScriptBasic, you don't need to explicitly declare them in your code. Simply use them in place of the values they represent.",
            "The constants build into mrScriptBasic fall into the following groups:",
            "+ **Color**. Defines basic colors that can be used in scripting. ",
            "+ **Date and Time**. Defines date and time constants used by date and time functions.",
            "+ **Date and Time Format**. Defines constants used to format dates and times. ",
            "+ **String**. Defines a variety of non-printable characters used in string manipulation.",
            "+ **Type**. Defines the various Variant subtypes. ",
            "",
        ].join("\n"),
        constants: [
            {
                name: "Cr",
                value: "Chr(13)",
                note: "Carriage return."
            },
            {
                name: "CrLf",
                value: "Chr(13) & Chr(10)",
                note: "Carriage return-linefeed combination."
            },
            {
                name: "FormFeed",
                value: "Chr(12)",
                note: "Form feed."
            },
            {
                name: "Lf",
                value: "Chr(10)",
                note: "Line feed."
            },
            {
                name: "NewLine",
                value: "Chr(13) & Chr(10) or Chr(10)",
                note: "A newline character."
            },
            {
                name: "Tab",
                value: "Chr(9)",
                note: "Horizontal tab."
            },
            {
                name: "Black",
                value: "Black",
                note: "Black"
            },
            {
                name: "Red",
                value: "Red",
                note: "Red"
            },
            {
                name: "Green",
                value: "Green",
                note: "Green"
            },
            {
                name: "Yellow",
                value: "Yellow",
                note: "Yellow"
            },
            {
                name: "Blue",
                value: "Blue",
                note: "Blue"
            },
            {
                name: "Magenta",
                value: "Magenta",
                note: "Magenta"
            },
            {
                name: "Cyan",
                value: "Cyan",
                note: "Cyan."
            },
            {
                name: "White",
                value: "White",
                note: "White."
            },
            {
                name: "Sunday",
                value: 1,
                note: "Sunday."
            },
            {
                name: "Monday",
                value: 2,
                note: "Monday."
            },
            {
                name: "Tuesday",
                value: 3,
                note: "Tuesday."
            },
            {
                name: "Wednesday",
                value: 4,
                note: "Wednesday."
            },
            {
                name: "Thursday",
                value: 5,
                note: "Thursday."
            },
            {
                name: "Friday",
                value: 6,
                note: "Friday."
            },
            {
                name: "Saturday",
                value: 7,
                note: "Saturday."
            },
            {
                name: "UseSystem",
                value: 0,
                note: "Use the day of the week specified in your system settings for the first day of the week."
            },
            {
                name: "FirstJan1",
                value: 1,
                note: "Use the week in which January 1 occurs (default)."
            },
            {
                name: "FirstFourDays",
                value: 2,
                note: "Use the first week that has at least four days in the new year."
            },
            {
                name: "FirstFullWeek",
                value: 3,
                note: "Use the first full week of the year."
            },
            {
                name: "GeneralDate",
                value: 0,
                note: "Display a date and/or time. For real numbers, display a date and time. If there is no fractional part, display only a date. If there is no integer part, display time only. Date and time display is determined by your system settings.."
            },
            {
                name: "LongDate",
                value: 1,
                note: "Display a date using the long date format specified in your computer's regional settings."
            },
            {
                name: "ShortDate",
                value: 2,
                note: "Display a date using the short date format specified in your computer's regional settings."
            },
            {
                name: "LongTime",
                value: 3,
                note: "Display a time using the long time format specified in your computer's regional settings."
            },
            {
                name: "ShortTime",
                value: 4,
                note: "Display a time using the short time format specified in your computer's regional settings."
            },
            {
                name: "None",
                value: 0,
                note: "Unitialized or empty."
            },
            {
                name: "Double",
                value: 6,
                note: "Double subtype."
            },
            {
                name: "Long",
                value: 1,
                note: "Long subtype."
            },
            {
                name: "Text",
                value: 2,
                note: "Text subtype."
            },
            {
                name: "Categorical",
                value: 3,
                note: "Categorical subtype."
            },
            {
                name: "Date",
                value: 5,
                note: "Date subtype."
            },
            {
                name: "Object",
                value: 4,
                note: "Object subtype."
            },
            {
                name: "Boolean",
                value: 7,
                note: "Boolean subtype."
            },
        ]
    };


