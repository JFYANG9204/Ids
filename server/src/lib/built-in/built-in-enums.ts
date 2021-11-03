import { BuiltInDefinition } from "./types";


export const builtInEnums = new Set<BuiltInDefinition>([
    {
        name: "LoopIterations",
        definitionType: "enum",
        enumerators: [
            {
                label: "New",
                value: -1,
            }
        ],
    },
    {
        name: "PublishOptions",
        definitionType: "enum",
        enumerators: [
            {
                label: "poUpdateExistingDefinitions",
                value: 0x0001
            }
        ]
    },
    {
        name: "ScriptGenerateOption",
        definitionType: "enum",
        enumerators: [
            {
                label: "sgDefault",
                value: 0x0000,
                note: "Deafult Option",
            },
            {
                label: "sgIncludeVarialbeEdit",
                value: 0x0001,
                note: "Including Variable Editions"
            }
        ]
    },
    {
        name: "RuleType",
        definitionType: "enum",
        enumerators: [
            {
                label: "rlHide",
                value: 0x0000,
                note: "Hide Rule"
            }
        ]
    },
    {
        name: "CategoryTypes",
        definitionType: "enum",
        enumerators: [
            {
                label: "ctCategory",
                value: 0x0000,
                note: "The category is a single category."
            },
            {
                label: "ctCategoryList",
                value: 0x0001,
                note: "The category is a category list."
            }
        ]
    },
    {
        name: "ScriptGenerateOption",
        definitionType: "enum",
        enumerators: [
            {
                label: "sgDefault",
                value: 0x0000,
                note: "Deafult Option"
            },
            {
                label: "sgIncludeVarialbeEdit",
                value: 0x0001,
                note: "Including Variable Editions"
            },
        ]
    },
    {
        name: "CompletedTypeConstants",
        definitionType: "enum",
        enumerators: [
            {
                label: "ctPercent",
                value: 0,
                note: "Express as a count"
            },
            {
                label: "ctCount",
                value: 1,
                note: "Express as a percentage"
            }
        ]
    },
    {
        name: "TerminateStatus",
        definitionType: "enum",
        enumerators: [
            {
                label: "tsCompleted",
                value: 0x0000,
                note: "The interview has normal completion status."
            },
            {
                label: "tsScriptStopped",
                value: 0x0001,
                note: "The interview is marked as stopped in script. (Default)"
            }
        ]
    },
    {
        name: "Orientations",
        definitionType: "enum",
        enumerators: [
            {
                label: "orDefault",
                value: 0x0000,
                note: "Use the default category orientation."
            },
            {
                label: "orRow",
                value: 0x0001,
                note: "Orient categories as rows."
            },
            {
                label: "orColumn",
                value: 0x0002,
                note: "Orient categories as columns."
            }
        ]
    },
    {
        name: "ScriptType",
        definitionType: "enum",
        enumerators: [
            {
                label: "stMRS",
                value: 0x0000,
                note: "mrScriptBasic"
            }
        ]
    },
    {
        name: "QuotaType",
        definitionType: "enum",
        enumerators: [
            {
                label: "qtTableQuotas",
                value: 0x0000,
                note: "A table quota."
            },
            {
                label: "qtExpressionQuotas",
                value: 0x0001,
                note: "An expression quota."
            }
        ]
    },
    {
        name: "ReportFormatType",
        definitionType: "enum",
        enumerators: [
            {
                label: "rtPlain",
                value: 0x0000,
                note: "Plain Text"
            },
            {
                label: "rtHtml",
                value: 0x0001,
                note: "HTML"
            }
        ]
    },
    {
        name: "CalculationScopeType",
        definitionType: "enum",
        enumerators: [
            {
                label: "csAllElements",
                value: 0x0000,
                note: "Perform the calculation over all elements"
            },
            {
                label: "csPrecedingElements",
                value: 0x0001,
                note: "Perform the calculation over the preceding elements"
            }
        ]
    },
    {
        name: "ComparisonOperator",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ComparisonOperator",
            "```",
            "----------------------------",
            "These constants define comparison operators for use in setting up table rules",
        ].join("\n"),
        enumerators: [
            {
                label: "opLess",
                value: 0x0000,
                note: "Less than"
            },
            {
                label: "opLessEqual",
                value: 0x0001,
                note: "Less than or equal to"
            },
            {
                label: "opEqual",
                value: 0x0002,
                note: "Equal to"
            },
            {
                label: "opGreaterEqual",
                value: 0x0003,
                note: "Greater than or equal to"
            },
            {
                label: "opGreater",
                value: 0x0004,
                note: "Greater than"
            }
        ]
    },
    {
        name: "FontEffects",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) FontEffects",
            "```",
            "----------------------------",
            "Font Effects.",
        ].join("\n"),
        enumerators: [
            {
                label: "feUnderline",
                value: 0x0000,
                note: "FontUnderline."
            },
            {
                label: "feItalic",
                value: 0x0002,
                note: "FontItalic."
            },
            {
                label: "feBold",
                value: 0x0004,
                note: "FontBold."
            },
            {
                label: "feStrikethrough",
                value: 0x0008,
                note: "FontStrikethrough."
            },
            {
                label: "feOverline",
                value: 0x0010,
                note: "FontOverline."
            },
            {
                label: "feBlink",
                value: 0x0020,
                note: "FontBlink."
            },
            {
                label: "feSuperscript",
                value: 0x0040,
                note: "FontSuperscript."
            },
            {
                label: "feSubscript",
                value: 0x0080,
                note: "FontSubscript."
            },
        ]
    },
    {
        name: "QuotaResultConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) QuotaResultConstants",
            "```",
            "----------------------------",
            "Describes the possible results of a quota test.",
        ].join("\n"),
        enumerators: [
            {
                label: "qrWasPended",
                value: 0x1000,
                note: "The quota counts were pended."
            },
            {
                label: "qrOverTarget",
                value: 0x0001,
                note: "The count completed interviews exceeds the quota target."
            },
            {
                label: "qrBelowTarget",
                value: 0x0002,
                note: "The count of completed interviews is below the quota target."
            },
            {
                label: "qrPendingOverTarget",
                value: 0x0004,
                note: "The sum of pended and completed interviews exceeds the quota target."
            },
        ]
    },
    {
        name: "GlobalQuestionPositions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) GlobalQuestionPositions",
            "```",
            "----------------------------",
            "Global question position modes. These control where the global question displays.",
        ].join("\n"),
        enumerators: [
            {
                label: "gqpTop",
                value: 0x0001,
                note: "The global question is at top."
            },
            {
                label: "gqpBottom",
                value: 0x0002,
                note: "The global question is at bottom."
            },
        ]
    },
    {
        name: "AxisType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) AxisType",
            "```",
            "----------------------------",
            "These constants define whether the axis is on the side, the top or the layer of a table.",
        ].join("\n"),
        enumerators: [
            {
                label: "axSide",
                value: 0xFFFF,
                note: "The Side axis of a table"
            },
            {
                label: "axTop",
                value: 0xFFFE,
                note: "The Top axis of a table"
            },
            {
                label: "axLayer",
                value: 0xFFFD,
                note: "The Layer axis of a table"
            },
        ]
    },
    {
        name: "ValidateActions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ValidateActions",
            "```",
            "----------------------------",
            "Validation Actions.",
        ].join("\n"),
        enumerators: [
            {
                label: "vaRaiseError",
                value: 0x0000,
                note: "Raises an error if validation fails."
            },
            {
                label: "vaUpdateErrors",
                value: 0x0001,
                note: "Update the Errors collection of the parent questions."
            },
            {
                label: "vaAssignDefault",
                value: 0x0002,
                note: "Assign the default value to the response."
            },
            {
                label: "vaAssignInitial",
                value: 0x0003,
                note: "Assign the initial value to the response."
            },
        ]
    },
    {
        name: "BorderStyles",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) BorderStyles",
            "```",
            "----------------------------",
            "Border Styles.",
        ].join("\n"),
        enumerators: [
            {
                label: "bsNone",
                value: 0x0000,
                note: "BorderNone."
            },
            {
                label: "bsSolid",
                value: 0x0001,
                note: "BorderSolid."
            },
            {
                label: "bsDouble",
                value: 0x0002,
                note: "BorderDouble."
            },
            {
                label: "bsGroove",
                value: 0x0003,
                note: "BorderGroove."
            },
            {
                label: "bsRidge",
                value: 0x0004,
                note: "BorderRidge."
            },
            {
                label: "bsInset",
                value: 0x0005,
                note: "BorderInset."
            },
            {
                label: "bsOutset",
                value: 0x0006,
                note: "BorderOutset."
            },
        ]
    },
    {
        name: "DBIdentifierOptions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DBIdentifierOptions",
            "```",
            "----------------------------",
            "DB Identifiers options.",
        ].join("\n"),
        enumerators: [
            {
                label: "diAutoUpdate",
                value: 0x0001,
                note: "Indicates that the Identifier should automatically update the data source when the identifier value changes."
            },
            {
                label: "diReturnCategoriesAsText",
                value: 0x0002,
                note: "Indicates that categorical values should be returned as strings containing the category values."
            },
            {
                label: "diReturnCategoryNames",
                value: 0x0004,
                note: "Indicates that categorical values should be returned as strings containing the category names."
            },
        ]
    },
    {
        name: "AskOptions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) AskOptions",
            "```",
            "----------------------------",
            "Ask Options.",
        ].join("\n"),
        enumerators: [
            {
                label: "opDefaultAsk",
                value: 0x0000,
                note: "Indicates that the default routing logic should be used."
            },
            {
                label: "opMultiAsk",
                value: 0x0001,
                note: "Indicates that a block should be asked as a multi-ask, ignoring any routing logic associated with the block."
            },
        ]
    },
    {
        name: "CategoryStyleTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) CategoryStyleTypes",
            "```",
            "----------------------------",
            "Category style types.",
        ].join("\n"),
        enumerators: [
            {
                label: "csSingle",
                value: 0x0000,
                note: "The default styles for single response categoricals."
            },
            {
                label: "csMulti",
                value: 0x0001,
                note: "The default styles for multi-response categoricals."
            },
            {
                label: "csExclusive",
                value: 0x0002,
                note: "The default styles for exclusive response categoricals."
            },
            {
                label: "csList",
                value: 0x0003,
                note: "The default styles for category lists."
            }
        ]
    },
    {
        name: "InterviewModes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) InterviewModes",
            "```",
            "----------------------------",
            "Interview modes.",
        ].join("\n"),
        enumerators: [
            {
                label: "imWeb",
                value: 0x0000,
                note: "The interview is a Web interview."
            },
            {
                label: "imPhone",
                value: 0x0001,
                note: "The interview is a Phone interview."
            },
            {
                label: "imLocal",
                value: 0x0002,
                note: "The interview is a Local interview."
            },
            {
                label: "imDataEntry",
                value: 0x0003,
                note: "The interview is a Data Entry interview."
            },
        ]
    },
    {
        name: "ChartStructure",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ChartStructure",
            "```",
            "----------------------------",
            "Specifies what part of the table is used to create a chart for any special statistical elements (mean, standard deviation, etc).",
        ].join("\n"),
        enumerators: [
            {
                label: "csNoChart",
                value: 0x0000,
                note: "Do not display chart"
            },
            {
                label: "csPerElement",
                value: 0x0001,
                note: "Chart produced for each element"
            },
            {
                label: "csPerVariable",
                value: 0x0002,
                note: "Chart produced for each table variable block"
            },
            {
                label: "csPerTable",
                value: 0x0003,
                note: "Chart produced for table"
            }
        ]
    },
    {
        name: "TableType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) TableType",
            "```",
            "----------------------------",
            "The type of table. A table will either contain aggregated case data or the results of profiling the case data. The Table object behaves slightly differently depending on its type.",
        ].join("\n"),
        enumerators: [
            {
                label: "ttAggregated",
                value: 0x0000,
                note: "A table containing aggregated case data"
            },
            {
                label: "ttProfile",
                value: 0x0001,
                note: "A table containing profiled case data"
            },
        ]
    },
    {
        name: "AudioControlPositions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) AudioControlPositions",
            "```",
            "----------------------------",
            "Audio Control Positions.",
        ].join("\n"),
        enumerators: [
            {
                label: "cpLeft",
                value: 0x0000,
                note: "Display audio control positioned to left of text."
            },
            {
                label: "cpRight",
                value: 0x0001,
                note: "Display audio control positioned to right of text."
            },
            {
                label: "cpTop",
                value: 0x0002,
                note: "Display audio control positioned above text."
            },
            {
                label: "cpBottom",
                value: 0x0003,
                note: "Display audio control positioned below text."
            },
        ]
    },
    {
        name: "ElementAlignments",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ElementAlignments",
            "```",
            "----------------------------",
            "ElementAlignment.",
        ].join("\n"),
        enumerators: [
            {
                label: "eaDefault",
                value: 0x0000,
                note: "Uses the default element alignment for the player."
            },
            {
                label: "eaRight",
                value: 0x0001,
                note: "Places the element to the right of the previous element."
            },
            {
                label: "eaNewLine",
                value: 0x0002,
                note: "Places the element on a new line."
            },
        ]
    },
    {
        name: "DataSetView",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DataSetView",
            "```",
            "----------------------------",
            "These constants select between the available views for the `DataSet` (`IDataSet` object).",
        ].join("\n"),
        enumerators: [
            {
                label: "dvVDATA",
                value: 0x0000,
                note: "View the data set as VDATA"
            },
            {
                label: "dvHDATA",
                value: 0x0001,
                note: "View the data set as HDATA"
            },
        ]
    },
    {
        name: "NavigationTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) NavigationTypes",
            "```",
            "----------------------------",
            "Navigation Types.",
        ].join("\n"),
        enumerators: [
            {
                label: "nvNone",
                value: 0xFFFF,
                note: "A navigation was not selected."
            },
            {
                label: "nvNext",
                value: 0x0000,
                note: "Navigates to the next page."
            },
            {
                label: "nvPrev",
                value: 0x0001,
                note: "Navigates to the previous page."
            },
            {
                label: "nvFirst",
                value: 0x0002,
                note: "Navigates to the first page."
            },
            {
                label: "nvLast",
                value: 0x0003,
                note: "Navigates to the last page asked."
            },
            {
                label: "nvGoto",
                value: 0x0004,
                note: "Navigates to a selected page."
            },
            {
                label: "nvStop",
                value: 0x0005,
                note: "Stops the interview."
            },
        ]
    },
    {
        name: "PostReturnTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) PostReturnTypes",
            "```",
            "----------------------------",
            "Interview status codes.",
        ].join("\n"),
        enumerators: [
            {
                label: "mrInterviewReturnXMLDOM",
                value: 0x0001,
                note: "Return the results of the event as an XML DOM."
            },
            {
                label: "mrInterviewReturnXMLString",
                value: 0x0002,
                note: "Return the results of the event as an XML string."
            },
        ]
    },
    {
        name: "OpenOptions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) OpenOptions",
            "```",
            "----------------------------",
            "The options that can be used when opening a data set.",
        ].join("\n"),
        enumerators: [
            {
                label: "ooDefault",
                value: 0x0000,
                note: "Do not merge new elements when opening new versions."
            },
            {
                label: "ooAddNewElements",
                value: 0x0001,
                note: "Merge new elements to axis expressions when opening new dataset versions."
            },
        ]
    },
    {
        name: "QuestionTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) QuestionTypes",
            "```",
            "----------------------------",
            "Question Types.",
        ].join("\n"),
        enumerators: [
            {
                label: "qtSimple",
                value: 0x0000,
                note: "The question is a simple question."
            },
            {
                label: "qtLoopCategorical",
                value: 0x0001,
                note: "The question is a categorical loop."
            },
            {
                label: "qtLoopNumeric",
                value: 0x0002,
                note: "The question is a numeric loop."
            },
            {
                label: "qtCompound",
                value: 0x0003,
                note: "The question is a compound."
            },
            {
                label: "qtBlock",
                value: 0x0004,
                note: "The question is a block."
            },
            {
                label: "qtPage",
                value: 0x0005,
                note: "The question is a multi-ask page."
            },
            {
                label: "qtDerived",
                value: 0x0006,
                note: "The question is a derived variable."
            },
        ]
    },
    {
        name: "QuotaPendModes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) QuotaPendModes",
            "```",
            "----------------------------",
            "Describes the ways in which quota counts may be pended.",
        ].join("\n"),
        enumerators: [
            {
                label: "qpNormal",
                value: 0x0000,
                note: "Normal"
            },
            {
                label: "qpPriority",
                value: 0x0001,
                note: "Priority"
            },
            {
                label: "qpRandom",
                value: 0x0002,
            },
            {
                label: "qpLeastFull",
                value: 0x0003,
                note: "Least full"
            },
            {
                label: "qpLeastFullCompletes",
                value: 0x0004,
                note: "Least full completes"
            },
        ]
    },
    {
        name: "OrderConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) OrderConstants",
            "```",
            "----------------------------",
            "The order in which to sort values (ascending/descending)",
        ].join("\n"),
        enumerators: [
            {
                label: "oAscending",
                value: 0x0000,
                note: "Sort values in order of smallest to largest."
            },
            {
                label: "oDescending",
                value: 0x0001,
                note: "Sort values in order of largest to smallest."
            },
        ]
    },
    {
        name: "XmlOption",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) XmlOption",
            "```",
            "----------------------------",
            "These constants control the XML that is returned by the `IDocument.GetTablesXml()` method.",
        ].join("\n"),
        enumerators: [
            {
                label: "xmlOptionsNone",
                value: 0x0000,
                note: "No special options specified"
            },
            {
                label: "xmlIncludeResults",
                value: 0x0001,
                note: "Include the cells values for the tables"
            },
            {
                label: "xmlIncludeCustomLabels",
                value: 0x0002,
                note: "Include user specified labels"
            },
            {
                label: "xmlExcludeSpecificationAttributes",
                value: 0x0004,
                note: "Don't include the Specification attributes in the XML"
            },
            {
                label: "xmlTableDocFormat",
                value: 0x0008,
                note: "Return Table Document (MTD file) format XML"
            },
        ]
    },
    {
        name: "ScriptStateConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ScriptStateConstants",
            "```",
            "----------------------------",
            "Script state constants.",
        ].join("\n"),
        enumerators: [
            {
                label: "scScriptRunning",
                value: 0x0000,
                note: "Indicates that script is being executed"
            },
            {
                label: "scScriptComplete",
                value: 0x0001,
                note: "Indicates that script completed normally"
            },
            {
                label: "scScriptDebugBreak",
                value: 0x0002,
                note: "Indicates that script exited due to a breakpoint being set"
            },
            {
                label: "scScriptBreak",
                value: 0x0003,
                note: "Indicates that script exited due to break being called"
            },
            {
                label: "scScriptReady",
                value: 0x0004,
                note: "Indicates that the script is ready to be executed"
            },
        ]
    },
    {
        name: "DisplayOption",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DisplayOption",
            "```",
            "----------------------------",
            "Specifies whether the export should create tables only, charts only, or both tables and charts and whether the chart or the table should be shown first.",
        ].join("\n"),
        enumerators: [
            {
                label: "doTableOnly",
                value: 0x0000,
                note: "Display the table and a chart below it"
            },
            {
                label: "doTableAndChart",
                value: 0x0001,
                note: "Display the table and a chart below it"
            },
            {
                label: "doChartAndTable",
                value: 0x0002,
                note: "Display the table and a chart above it"
            },
            {
                label: "doChartOnly",
                value: 0x0003,
                note: "Display the table chart"
            },
        ]
    },
    {
        name: "DisplayOrientation",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DisplayOrientation",
            "```",
            "----------------------------",
            "These constants determine the display orientation to use when constructing a grid from a grid or array field",
        ].join("\n"),
        enumerators: [
            {
                label: "doDefault",
                value: 0x0000,
                note: "Use the orientation specified by the MDM Orientation property"
            },
            {
                label: "doRow",
                value: 0x0001,
                note: "Display the iterations on the side axis so that they appear as rows in the table"
            },
            {
                label: "doColumn",
                value: 0x0002,
                note: "Display the iterations on the top axis so that they appear as columns in the table"
            },
        ]
    },
    {
        name: "Alignments",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) Alignments",
            "```",
            "----------------------------",
            "Alignments.",
        ].join("\n"),
        enumerators: [
            {
                label: "alDefault",
                value: 0x0000,
                note: "Uses the default alignment for the player."
            },
            {
                label: "alLeft",
                value: 0x0001,
                note: "Align text or controls to the left."
            },
            {
                label: "alCenter",
                value: 0x0002,
                note: "Align text or controls to the center."
            },
            {
                label: "alRight",
                value: 0x0003,
                note: "Align text or controls to the right."
            },
            {
                label: "alJustify",
                value: 0x0004,
                note: "Evenly space text or controls."
            },
        ]
    },
    {
        name: "RuleTarget",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) RuleTarget",
            "```",
            "----------------------------",
            "These constants define what is to be affected by a table rule (`IRule` object).",
        ].join("\n"),
        enumerators: [
            {
                label: "rtRow",
                value: 0x0000,
                note: "Row"
            },
            {
                label: "rtColumn",
                value: 0x0001,
                note: "Column"
            },
            {
                label: "rtCell",
                value: 0x0002,
                note: "Cell"
            },
            {
                label: "rtRowStats",
                value: 0x0003,
                note: "Row statistics"
            },
            {
                label: "rtColStats",
                value: 0x0004,
                note: "Column statistics"
            },
        ]
    },
    {
        name: "LicensableFeature",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) LicensableFeature",
            "```",
            "----------------------------",
            "These constants define the features of the Table Object Model that can be licensed. The `IDocument.LicensedFeatures` property returns a binary 'OR' of the features that are licensed.",
        ].join("\n"),
        enumerators: [
            {
                label: "lfNone",
                value: 0x0000,
                note: "No Features"
            },
            {
                label: "lfAll",
                value: 0x0001,
                note: "All Features"
            },
            {
                label: "lfCreateDocument",
                value: 0x0002,
                note: "Creating Document objects"
            },
            {
                label: "lfSaveDocument",
                value: 0x0004,
                note: "Saving documents"
            },
            {
                label: "lfOpenDocument",
                value: 0x0008,
                note: "Opening documents"
            },
            {
                label: "lfPopulate",
                value: 0x0010,
                note: "Populating documents"
            },
        ]
    },
    {
        name: "AxisVariableOptions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) AxisVariableOptions",
            "```",
            "----------------------------",
            "Options for the `CreateAxisVariable()` method.",
        ].join("\n"),
        enumerators: [
            {
                label: "avIncludeSpecialElements",
                value: 0x0001,
                note: "Add special elements to the derived variable. By default, only category and expression elements, including net and combine elements, will be added"
            },
            {
                label: "avGenerateVDATAExpressions",
                value: 0x0002,
                note: "If the variable is defined in a loop, generate expressions for each instance in variable instances."
            },
        ]
    },
    {
        name: "DebugMsgBoxResults",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DebugMsgBoxResults",
            "```",
            "----------------------------",
            "Debug message box results.",
        ].join("\n"),
        enumerators: [
            {
                label: "OK",
                value: 0x0001,
                note: "__OK__ button pressed"
            },
            {
                label: "Cancel",
                value: 0x0002,
                note: "__Cancel__ button pressed"
            },
            {
                label: "Abort",
                value: 0x0003,
                note: "__Abort__ button pressed"
            },
            {
                label: "Retry",
                value: 0x0004,
                note: "__Retry__ button pressed"
            },
            {
                label: "Ignore",
                value: 0x0005,
                note: "__Ignore__ button pressed"
            },
            {
                label: "Yes",
                value: 0x0006,
                note: "__Yes__ button pressed"
            },
            {
                label: "No",
                value: 0x0007,
                note: "__No__ button pressed"
            },
        ]
    },
    {
        name: "wtMethod",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) wtMethod",
            "```",
            "----------------------------",
            "The weighting method to apply: factor, target, or rim.",
        ].join("\n"),
        enumerators: [
            {
                label: "wtFactors",
                value: 0x0001,
                note: "Factor weighting"
            },
            {
                label: "wtTargets",
                value: 0x0002,
                note: "Cell target weighting"
            },
            {
                label: "wtRims",
                value: 0x0003,
                note: "Rim target weighting"
            },
        ]
    },
    {
        name: "RoundOptions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) RoundOptions",
            "```",
            "----------------------------",
            "The options that can be used when rounding occurs.",
        ].join("\n"),
        enumerators: [
            {
                label: "roRoundToEven",
                value: 0x0000,
                note: "If the value being rounded is exactly halfway between the two nearest values of the required precision, round to even. This means that of the two possible rounded values, the one that has an even number as the last significant digit is returned."
            },
            {
                label: "roRoundUp",
                value: 0x0001,
                note: "If the value being rounded is exactly halfway between the two nearest values of the required precision, round to the higher absolute value (round away from 0). E.g., 62.5 rounded to 0 decimal places would be 63 and -62.5 would be rounded to -63."
            },
        ]
    },
    {
        name: "ImagePositions",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ImagePositions",
            "```",
            "----------------------------",
            "The position to display an image relative to the text.",
        ].join("\n"),
        enumerators: [
            {
                label: "ipLeft",
                value: 0x0000,
                note: "Display image positioned to left of text."
            },
            {
                label: "ipRight",
                value: 0x0001,
                note: "Display image positioned to right of text."
            },
            {
                label: "ipTop",
                value: 0x0002,
                note: "Display image positioned above text."
            },
            {
                label: "ipBottom",
                value: 0x0003,
                note: "Display image positioned below text."
            },
            {
                label: "ipImageOnly",
                value: 0x0004,
                note: "Display image only."
            },
        ]
    },
    {
        name: "LabelStyleTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) LabelStyleTypes",
            "```",
            "----------------------------",
            "Label style types.",
        ].join("\n"),
        enumerators: [
            {
                label: "lsQuestion",
                value: 0x0000,
                note: "The default styles for question labels."
            },
            {
                label: "lsCategory",
                value: 0x0001,
                note: "The default styles for category labels."
            },
            {
                label: "lsBanner",
                value: 0x0002,
                note: "The default styles for banner labels."
            },
            {
                label: "lsError",
                value: 0x0003,
                note: "The default styles for error labels."
            },
            {
                label: "lsNavigation",
                value: 0x0004,
                note: "The default styles for navigation labels."
            },
            {
                label: "lsTitle",
                value: 0x0005,
                note: "The default styles for title labels."
            },
        ]
    },
    {
        name: "QuotaFlags",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) QuotaFlags",
            "```",
            "----------------------------",
            "Describes how the quota should count respondents.",
        ].join("\n"),
        enumerators: [
            {
                label: "qfNone",
                value: 0x0000,
                note: "The sum of the Completed and Pending counts must never exceed the target. Respondents fail quota control as soon as a target has been met."
            },
            {
                label: "qfAllowOverQuota",
                value: 0x0001,
                note: "The sum of the Completed and Pending counts may exceed the target. Pended respondents may complete interviews even if this causes the target."
            },
            {
                label: "qfCounter",
                value: 0x0002,
                note: "Count respondents but do not impose quota control."
            },
        ]
    },
    {
        name: "GridStyleTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) GridStyleTypes",
            "```",
            "----------------------------",
            "Grid style types.",
        ].join("\n"),
        enumerators: [
            {
                label: "gsCell",
                value: 0x0000,
                note: "The default style for the cells of a grid."
            },
            {
                label: "gsAltRow",
                value: 0x0001,
                note: "The default style for the alternate rows of a grid."
            },
            {
                label: "gsAltCol",
                value: 0x0002,
                note: "The default style for the alternate columns of a grid."
            },
            {
                label: "gsRowHeader",
                value: 0x0003,
                note: "The default style for the row headings of a grid."
            },
            {
                label: "gsColHeader",
                value: 0x0004,
                note: "The default style for the column headings of a grid."
            },
            {
                label: "gsAltRowHeader",
                value: 0x0005,
                note: "The default style for the alternate row headings of a grid."
            },
            {
                label: "gsAltColHeader",
                value: 0x0006,
                note: "The default style for the alternate column headings of a grid."
            },
        ]
    },
    {
        name: "CategoryAttributes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) CategoryAttributes",
            "```",
            "----------------------------",
            "Category Attributes.",
        ].join("\n"),
        enumerators: [
            {
                label: "caUser",
                value: 0x0040,
                note: "The category is a user missing category."
            },
            {
                label: "caDK",
                value: 0x0008,
                note: "The category is a Don't Know special response."
            },
            {
                label: "caREF",
                value: 0x0020,
                note: "The category is a Refused special response."
            },
            {
                label: "caNR",
                value: 0x0010,
                note: "The category is a No Response special response."
            },
            {
                label: "caOther",
                value: 0x0002,
                note: "The category is an other specify."
            },
            {
                label: "caExclusive",
                value: 0x0001,
                note: "The category is exclusive."
            },
            {
                label: "caFixed",
                value: 0x0004,
                note: "The category requires a fixed position in the category list."
            },
            {
                label: "caNA",
                value: 0x0010,
                note: "The category is a No Answer special response."
            },
        ]
    },
    {
        name: "DataTypeConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) DataTypeConstants",
            "```",
            "----------------------------",
            "Used to identify the type of data stored in a Field e.g. Real, Text",
        ].join("\n"),
        enumerators: [
            {
                label: "mtNone",
                value: 0x0000,
                note: "None"
            },
            {
                label: "mtLong",
                value: 0x0001,
                note: "Long integer"
            },
            {
                label: "mtText",
                value: 0x0002,
                note: "Text variable"
            },
            {
                label: "mtCategorical",
                value: 0x0003,
                note: "Categorical variables"
            },
            {
                label: "mtObject",
                value: 0x0004,
                note: "BLOB data, e.g. scribbled and voice recordings"
            },
            {
                label: "mtDate",
                value: 0x0005,
                note: "Datestamp (date and time)"
            },
            {
                label: "mtDouble",
                value: 0x0006,
                note: "Real"
            },
            {
                label: "mtBoolean",
                value: 0x0007,
                note: "Boolean"
            },
            {
                label: "mtLevel",
                value: 0x0008,
                note: "Level"
            },
        ]
    },
    {
        name: "PresentationStyle",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) PresentationStyle",
            "```",
            "----------------------------",
            "Specifies the style sheet (CSS file) to be used. See the topic HTML Tables Export - Customizing the Style Sheet for more information.",
        ].join("\n"),
        enumerators: [
            {
                label: "psDefault",
                value: 0x0000,
                note: "Use the default style sheet"
            },
            {
                label: "psBlackAndWhite",
                value: 0x0001,
                note: "Use the black and white style sheet"
            },
            {
                label: "psCustom1",
                value: 0x0002,
                note: "Use embedded custom style 1"
            },
            {
                label: "psCustom2",
                value: 0x0003,
                note: "Use embedded custom style 2"
            },
            {
                label: "psCustom3",
                value: 0x0004,
                note: "Use embedded custom style 3"
            },
        ]
    },
    {
        name: "PropertyAttributeConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) PropertyAttributeConstants",
            "```",
            "----------------------------",
            "The property attributes used to how the property can be accessed.",
        ].join("\n"),
        enumerators: [
            {
                label: "cdPropNotSupported",
                value: 0x0000,
                note: "Indicates that the property is not supported by the CDSC."
            },
            {
                label: "cdPropRead",
                value: 0x0001,
                note: "Indicates that the property can be read."
            },
            {
                label: "cdPropWrite",
                value: 0x0002,
                note: "Indicates that the property can be read."
            },
            {
                label: "cdPropOleDB",
                value: 0x0004,
                note: "Indicates that the property is an OLE DB property and that it should be visible to applications using mrOleDB via ADO."
            },
        ]
    },
    {
        name: "wtTotalType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) wtTotalType",
            "```",
            "----------------------------",
            "Defines how the weighted total is to be calculated. It can be the sum of the target values or the sum of (count * factor), if factor weighting is being used, the unweighted count of cases contributing to the weighting matrix, or a specified value.",
        ].join("\n"),
        enumerators: [
            {
                label: "wtTargetSum",
                value: 0x0001,
                note: "The sum of the targets, or if factor weighting is being used, the sum of (count * factor)."
            },
            {
                label: "wtUnweightedInput",
                value: 0x0002,
                note: "The unweighted count of the unweighted cases contributing to the weighting matrix."
            },
            {
                label: "wtTotalValue",
                value: 0x0003,
                note: "The value specified."
            },
        ]
    },
    {
        name: "InterviewStatus",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) InterviewStatus",
            "```",
            "----------------------------",
            "Interview status codes.",
        ].join("\n"),
        enumerators: [
            {
                label: "isIdle",
                value: 0x0001,
                note: "The interview is awaiting the next post."
            },
            {
                label: "isPost",
                value: 0x0002,
                note: "The interview is processing a post."
            },
            {
                label: "isTimedOut",
                value: 0x0003,
                note: "The interview has timed out."
            },
            {
                label: "isStopping",
                value: 0x0004,
                note: "The interview is shutting down."
            },
            {
                label: "isComplete",
                value: 0x0005,
                note: "The interview is complete."
            },
            {
                label: "isStopped",
                value: 0x0006,
                note: "The interview was stopped, either by the system or the user."
            },
            {
                label: "isShutdown",
                value: 0x0007,
                note: "The interview was shutdown by the interviewing system."
            },
        ]
    },
    {
        name: "AnnotationPosition",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) AnnotationPosition",
            "```",
            "----------------------------",
            "The positions around the outside of the table in which to display the annotation text.",
        ].join("\n"),
        enumerators: [
            {
                label: "annTitleHeader",
                value: 0x0000,
                note: "Title Header"
            },
            {
                label: "annLeftHeader",
                value: 0x0001,
                note: "Left Header"
            },
            {
                label: "annCenterHeader",
                value: 0x0002,
                note: "Center Header"
            },
            {
                label: "annRightHeader",
                value: 0x0003,
                note: "Right Header"
            },
            {
                label: "annTitleFooter",
                value: 0x0004,
                note: "Title Footer"
            },
            {
                label: "annLeftFooter",
                value: 0x0005,
                note: "Left Footer"
            },
            {
                label: "annCenterFooter",
                value: 0x0006,
                note: "Center Footer"
            },
            {
                label: "annRightFooter",
                value: 0x0007,
                note: "Right Footer"
            },
        ]
    },
    {
        name: "Signals",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) Signals",
            "```",
            "----------------------------",
            "Standard signal codes for use with the `Terminate()` method",
        ].join("\n"),
        enumerators: [
            {
                label: "sigCompleted",
                value: 0x0000,
                note: "The interview completed successfully"
            },
            {
                label: "sigStopped",
                value: 0x0002,
                note: "The interview was terminated prematurely"
            },
            {
                label: "sigError",
                value: 0x0004,
                note: "An error occurred during execution of the interview"
            },
            {
                label: "sigOverQuota",
                value: 0x0005,
                note: "The interview was terminated because a quota has been exceeded"
            },
            {
                label: "sigEarlyComplete",
                value: 0x0006,
                note: "The interview completed early"
            },
            {
                label: "sigFailedScreener",
                value: 0x0007,
                note: "The interview failed at screener question"
            },
        ]
    },
    {
        name: "RecordModes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) RecordModes",
            "```",
            "----------------------------",
            "Record Modes.",
        ].join("\n"),
        enumerators: [
            {
                label: "rmNone",
                value: 0x0000,
                note: "Indicates that a recording should not be made specifically for this question"
            },
            {
                label: "rmManual",
                value: 0x0001,
                note: "A recording should be made by the interviewer using the Record and Stop buttons. Navigating away from the question will automatically stop the recording if it wasn’t stopped by the interviewer."
            },
            {
                label: "rmAuto",
                value: 0x0002,
                note: "Indicates that the recording should be made automatically. Recording starts when the question is displayed and stops when the interviewer navigates away from the question."
            },
            {
                label: "rmProhibited",
                value: 0x0003,
                note: "Reserved for future use."
            },
        ]
    },
    {
        name: "LayoutStyle",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) LayoutStyle",
            "```",
            "----------------------------",
            "Specifies the layout style to be used.",
        ].join("\n"),
        enumerators: [
            {
                label: "lsSingleDocument",
                value: 0x0000,
                note: "Produce a single document that contains all the tables"
            },
            {
                label: "lsTableOfContents",
                value: 0x0001,
                note: "Produce a table of contents that references tables which are created as seperate files"
            },
            {
                label: "lsFrameTableOfContents",
                value: 0x0002,
                note: "Produce a frame page that shows the table of contents in the left frame and table in the right frame"
            },
        ]
    },
    {
        name: "VerticalAlignments",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) VerticalAlignments",
            "```",
            "----------------------------",
            "Vertical Alignment.",
        ].join("\n"),
        enumerators: [
            {
                label: "vaDefault",
                value: 0x0000,
                note: "Uses the default vertical alignment for the player."
            },
            {
                label: "vaBaseline",
                value: 0x0001,
                note: "Sets the alignment with the base of the parent."
            },
            {
                label: "vaMiddle",
                value: 0x0002,
                note: "Aligns the vertical midpoint of the element with the baseline of the parent plus half of the vertical height of the parent."
            },
            {
                label: "vaSub",
                value: 0x0003,
                note: "Makes the element a sub-script."
            },
            {
                label: "vaSuper",
                value: 0x0004,
                note: "Makes the element a super-script."
            },
            {
                label: "vaTextTop",
                value: 0x0005,
                note: "Aligns the element with the top of the text in the parent element's font."
            },
            {
                label: "vaTextBottom",
                value: 0x0006,
                note: "Aligns the element with the bottom of the text in the parent element's font."
            },
            {
                label: "vaTop",
                value: 0x0007,
                note: "Align the top of the element with the top of the tallest element on the current line."
            },
            {
                label: "vaBottom",
                value: 0x0008,
                note: "Align the bottom of the element with the bottom of the lowest element on the current line."
            },
        ]
    },
    {
        name: "LogLevels",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) LogLevels",
            "```",
            "----------------------------",
            "Log levels.",
        ].join("\n"),
        enumerators: [
            {
                label: "lgNone",
                value: 0x0000,
                note: "The logging level is undefined."
            },
            {
                label: "lgInfo",
                value: 0x0001,
                note: "The log entry contains information, most likely used for debugging."
            },
            {
                label: "lgWarning",
                value: 0x0002,
                note: "The log entry contains a warning message."
            },
            {
                label: "lgError",
                value: 0x0004,
                note: "The log entry contains an error message."
            },
            {
                label: "lgFatal",
                value: 0x0008,
                note: "The log entry contains an error message for a fatal condition that the system could not recover from."
            },
            {
                label: "lgTrace",
                value: 0x0010,
                note: "The log entry contains trace information that is used for debugging. Trace entries are used to log information that can be used to trace program execution."
            },
            {
                label: "lgMetric",
                value: 0x0020,
                note: "The log entry contains metric information or other 'paradata'."
            },
            {
                label: "lgScript",
                value: 0x0040,
                note: "The log entry contains a message added by the interview script."
            },
        ]
    },
    {
        name: "MinBaseOptionsConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) MinBaseOptionsConstants",
            "```",
            "----------------------------",
            "The options that can be applied to control how the table is displayed when a base value is below that specified by `Table.Properties[\"MinBase\"]`.",
        ].join("\n"),
        enumerators: [
            {
                label: "sbSymbolInFirstCellItemOnly",
                value: 0x0001,
                note: "Display the symbol in the first cell item position only, leaving the others blank."
            },
            {
                label: "sbUseWeightedBase",
                value: 0x0002,
                note: "Suppress on the basis of the weighted base instead of the unweighted one."
            },
            {
                label: "sbSuppressSpecialElements",
                value: 0x0004,
                note: "Make special elements eligible for suppression."
            },
            {
                label: "sbIgnoreTotals",
                value: 0x0008,
                note: "Avoid suppressing totals, subtotals and derived elements."
            },
            {
                label: "sbColumnsOnly",
                value: 0x0010,
                note: "Consider columns only, ie, do not suppress on row base values."
            },
            {
                label: "sbRowsOnly",
                value: 0x0020,
                note: "Consider rows only, ie, do not suppress on column base values."
            },
            {
                label: "sbRetainCounts",
                value: 0x0040,
                note: "Retain counts but suppress other cell items."
            },
        ]
    },
    {
        name: "PropertyTypeConstants",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) PropertyTypeConstants",
            "```",
            "----------------------------",
            "The property type used to determine how the property is stored.",
        ].join("\n"),
        enumerators: [
            {
                label: "cdLong",
                value: 0x0000,
                note: "Indicates a four-byte signed integer. (VT_I4)"
            },
            {
                label: "cdBoolean",
                value: 0x0001,
                note: "Indicates a boolean value (VT_BOOL)."
            },
            {
                label: "cdString",
                value: 0x0002,
                note: "Indicates a string value (VT_BSTR)"
            },
            {
                label: "cdDouble",
                value: 0x0003,
                note: "Indicates a double value (VT_R8)"
            },
            {
                label: "cdDate",
                value: 0x0004,
                note: "Indicates a data value (VT_DATE)"
            },
            {
                label: "cdIUnknown",
                value: 0x0005,
                note: "Indicates a pointer to an IUnknown interface on a COM object (VT_UNKNOWN)."
            },
            {
                label: "cdIDispatch",
                value: 0x0006,
                note: "Indicates a pointer to an IDispatch interface on a COM object (VT_DISPATCH)."
            },
            {
                label: "cdCategorical",
                value: 0x0007,
                note: "Indicates a categorical value (VT_ARRAY)"
            },
        ]
    },
    {
        name: "ControlTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ControlTypes",
            "```",
            "----------------------------",
            "Control Types.",
        ].join("\n"),
        enumerators: [
            {
                label: "ctStatic",
                value: 0x0000,
                note: "Static Control"
            },
            {
                label: "ctEdit",
                value: 0x0001,
                note: "Edit Control"
            },
            {
                label: "ctSingleLineEdit",
                value: 0x0002,
                note: "Single Line Edit Control"
            },
            {
                label: "ctMultiLineEdit",
                value: 0x0003,
                note: "Multiple Line Edit Control"
            },
            {
                label: "ctDropList",
                value: 0x0004,
                note: "DropList Control"
            },
            {
                label: "ctComboList",
                value: 0x0005,
                note: "ComboList Control (Not implemented. Reserved for future use.)"
            },
            {
                label: "ctRadioButton",
                value: 0x0006,
                note: "RadioButton Control"
            },
            {
                label: "ctCheckButton",
                value: 0x0007,
                note: "CheckButton Control"
            },
            {
                label: "ctListBox",
                value: 0x0008,
                note: "ListBox Control"
            },
            {
                label: "ctListControl",
                value: 0x0009,
                note: "ListControl Control"
            },
            {
                label: "ctButton",
                value: 0x000A,
                note: "Button Control"
            },
            {
                label: "ctDate",
                value: 0x000B,
                note: "Date Control"
            },
            {
                label: "ctTime",
                value: 0x000C,
                note: "Time Control"
            },
            {
                label: "ctDateTime",
                value: 0x000D,
                note: "DateTime Control"
            },
            {
                label: "ctPassword",
                value: 0x000E,
                note: "Password Control"
            },
        ]
    },
    {
        name: "OffPathDataModes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) OffPathDataModes",
            "```",
            "----------------------------",
            "Off-path data modes. These control how off-path data is handled.",
        ].join("\n"),
        enumerators: [
            {
                label: "dmClearOnExit",
                value: 0x0000,
                note: "Clear the off-path data when the interview exits. This is any interview exit including completed, stopped, and timed-out interviews."
            },
            {
                label: "dmClearOnComplete",
                value: 0x0001,
                note: "Clear the off-path data when the interview completes. The off-path data is kept if the interview is stopped or times-out. This is the default."
            },
            {
                label: "dmKeep",
                value: 0x0002,
                note: "Keep all off-path data."
            },
            {
                label: "dmClearOnNavigateBack",
                value: 0x0004,
                note: "Clear the off-path data immediately when the user navigates to a previous question using the Previous, Goto, or First navigations or the script uses the `ISavePoint.Go()` method."
            },
        ]
    },
    {
        name: "CursorTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) CursorTypes",
            "```",
            "----------------------------",
        ].join("\n"),
        enumerators: [
            {
                label: "crAuto",
                value: 0x0000,
            },
            {
                label: "crCrossHair",
                value: 0x0001,
            },
            {
                label: "crDefault",
                value: 0x0002,
            },
            {
                label: "crPointer",
                value: 0x0003,
            },
            {
                label: "crMove",
                value: 0x0004,
            },
            {
                label: "crEResize",
                value: 0x0005,
            },
            {
                label: "crNEResize",
                value: 0x0006,
            },
            {
                label: "crNResize",
                value: 0x0007,
            },
            {
                label: "crNWResize",
                value: 0x0008,
            },
            {
                label: "crWResize",
                value: 0x0009,
            },
            {
                label: "crSWResize",
                value: 0x000A,
            },
            {
                label: "crSResize",
                value: 0x000B,
            },
            {
                label: "crSEResize",
                value: 0x000C,
            },
            {
                label: "crText",
                value: 0x000D,
            },
            {
                label: "crWait",
                value: 0x000E,
            },
            {
                label: "crHelp",
                value: 0x000F,
            },
        ]
    },
    {
        name: "QuestionStyleTypes",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) QuestionStyleTypes",
            "```",
            "----------------------------",
            "Question style types.",
        ].join("\n"),
        enumerators: [
            {
                label: "qsInfo",
                value: 0x0000,
                note: "The default styles for info questions."
            },
            {
                label: "qsLong",
                value: 0x0001,
                note: "The default styles for long questions."
            },
            {
                label: "qsText",
                value: 0x0002,
                note: "The default styles for text questions."
            },
            {
                label: "qsCategorical",
                value: 0x0003,
                note: "The default styles for categorical questions."
            },
            {
                label: "qsObject",
                value: 0x0004,
                note: "The default styles for object questions."
            },
            {
                label: "qsDate",
                value: 0x0005,
                note: "The default styles for date questions."
            },
            {
                label: "qsDouble",
                value: 0x0006,
                note: ""
            },
            {
                label: "qsBoolean",
                value: 0x0007,
                note: "The default styles for boolean questions."
            },
            {
                label: "qsLoopCategorical",
                value: 0x0008,
                note: "The default styles for categorical loop questions."
            },
            {
                label: "qsLoopNumeric",
                value: 0x0009,
                note: "The default styles for numeric loop questions."
            },
            {
                label: "qsCompound",
                value: 0x000A,
                note: "The default styles for compound questions."
            },
            {
                label: "qsBlock",
                value: 0x000B,
                note: "The default styles for block questions."
            },
            {
                label: "qsOther",
                value: 0x000C,
                note: "The default styles for other questions."
            },
            {
                label: "qsPage",
                value: 0x000D,
                note: "The default styles for page questions."
            },
        ]
    },
    {
        name: "ChartType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ChartType",
            "```",
            "----------------------------",
            "These constants define the type of the chart that is to be created.",
        ].join("\n"),
        enumerators: [
            {
                label: "ctBarClustered",
                value: 3,
                note: "Clustered Bar Chart"
            },
            {
                label: "ctBarStacked",
                value: 4,
                note: "Stacked Bar Chart"
            },
            {
                label: "ct3DBarClustered",
                value: 51,
                note: "3D Clustered Bar Chart"
            },
            {
                label: "ct3DBarStacked",
                value: 52,
                note: "3D Stacked Bar Chart"
            },
            {
                label: "ctColumnClustered",
                value: 0,
                note: "Clustered Column Chart"
            },
            {
                label: "ctColumnStacked",
                value: 1,
                note: "Stacked Column Chart"
            },
            {
                label: "ct3DColumnClustered",
                value: 47,
                note: "3D Clustered Column Chart"
            },
            {
                label: "ct3DColumnStacked",
                value: 48,
                note: "3D Stacked Column Chart"
            },
            {
                label: "ct3DColumn",
                value: 46,
                note: "3D Column Chart"
            },
            {
                label: "ctLine",
                value: 6,
                note: "Line Chart"
            },
            {
                label: "ctLineStacked",
                value: 8,
                note: "Stacked Line Chart"
            },
            {
                label: "ctLineMarkers",
                value: 7,
                note: "Line with Markers Chart"
            },
            {
                label: "ctLineMarkersStacked100",
                value: 11,
                note: "100% Stacked Line with Markers Chart"
            },
            {
                label: "ctPie",
                value: 18,
                note: "Pie Chart"
            },
            {
                label: "ct3DPie",
                value: 58,
                note: "3D Pie Chart"
            },
            {
                label: "ctPieExploded",
                value: 19,
                note: "3D Separated Pie Chart"
            },
            {
                label: "ct3DPieExploded",
                value: 59,
                note: "3D Separated Pie Chart"
            },
            {
                label: "ctNoChart",
                value: -1,
                note: "A chart is not produced"
            },
            {
                label: "ctVariablePreview",
                value: -2,
                note: "Variable preview chart"
            },
        ]
    },
    {
        name: "CellItemType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) CellItemType",
            "```",
            "----------------------------",
            "These constants define types of cell contents for use in tables.",
        ].join("\n"),
        enumerators: [
            {
                label: "itCount",
                value: 0x0000,
                note: "Counts"
            },
            {
                label: "itColPercent",
                value: 0x0001,
                note: "Column percentages"
            },
            {
                label: "itRowPercent",
                value: 0x0002,
                note: "Row percentages"
            },
            {
                label: "itTotalPercent",
                value: 0x0003,
                note: "Total percentages"
            },
            {
                label: "itMean",
                value: 0x0004,
                note: "Mean"
            },
            {
                label: "itSum",
                value: 0x0005,
                note: "Sum"
            },
            {
                label: "itMinimum",
                value: 0x0006,
                note: "Minimum value"
            },
            {
                label: "itMaximum",
                value: 0x0007,
                note: "Maximum value"
            },
            {
                label: "itUnweightedCount",
                value: 0x0008,
                note: "Unweighted counts"
            },
            {
                label: "itCumColPercent",
                value: 0x0009,
                note: "Cumulative column percentages"
            },
            {
                label: "itCumRowPercent",
                value: 0x000A,
                note: "Cumulative row percentages"
            },
            {
                label: "itRange",
                value: 0x000B,
                note: "Range"
            },
            {
                label: "itMode",
                value: 0x000C,
                note: "Mode"
            },
            {
                label: "itMedian",
                value: 0x000D,
                note: "Median"
            },
            {
                label: "itPercentile",
                value: 0x000E,
                note: "Percentile"
            },
            {
                label: "itStdDev",
                value: 0x000F,
                note: "Standard deviation"
            },
            {
                label: "itStdErr",
                value: 0x0010,
                note: "Standard error"
            },
            {
                label: "itVariance",
                value: 0x0011,
                note: "Variance"
            },
            {
                label: "itResiduals",
                value: 0x0012,
                note: "Residuals"
            },
            {
                label: "itAdjustedResiduals",
                value: 0x0013,
                note: "Adjusted Residuals - Reserved for future use"
            },
            {
                label: "itExpectedValues",
                value: 0x0014,
                note: "Expected values"
            },
            {
                label: "itValidN",
                value: 0x0015,
                note: "Valid N - Reserved for future use"
            },
            {
                label: "itIndices",
                value: 0x0016,
                note: "Indices"
            },
            {
                label: "itColPropResults",
                value: 0x0017,
                note: "Results of the Column Proportions, Column Means and Tukey tests (added automatically when required)"
            },
            {
                label: "itColBase",
                value: 0x0018,
                note: "Column Base"
            },
            {
                label: "itRowBase",
                value: 0x0019,
                note: "Row Base"
            },
            {
                label: "itUnweightedColBase",
                value: 0x001A,
                note: "Unweighted Column Base"
            },
            {
                label: "itUnweightedRowBase",
                value: 0x001B,
                note: "Unweighted Row Base"
            },
            {
                label: "itProfileResult",
                value: 0x001C,
                note: "Profile result"
            },
            {
                label: "itCellChiSquare",
                value: 0x001D,
                note: "Results of the CellChiSquare test (added automatically when required)"
            },
            {
                label: "itColRanks",
                value: 0x001E,
                note: "Column Ranks"
            },
            {
                label: "itRowRanks",
                value: 0x001F,
                note: "Row Ranks"
            },
        ]
    },
    {
        name: "ElementType",
        definitionType: "enum",
        note: [
            "```ds",
            "(enum) ElementType",
            "```",
            "----------------------------",
            "These constants define the element type.",
        ].join("\n"),
        enumerators: [
            {
                label: "eCategory",
                value: 0x0000,
                note: "Category"
            },
            {
                label: "eBase",
                value: 0x0001,
                note: "Base element"
            },
            {
                label: "eTableStatistic",
                value: 0x0002,
                note: "Placeholder for the results of a Chi Square statistical test or a MinPVal column"
            },
            {
                label: "eEffectiveBase",
                value: 0x0003,
                note: "Effective base"
            },
            {
                label: "eSumWeightsSquared",
                value: 0x0004,
                note: "Sum of squared weights"
            },
            {
                label: "eSumN",
                value: 0x0005,
                note: "Sum N"
            },
            {
                label: "eSumX",
                value: 0x0006,
                note: "Sum X"
            },
            {
                label: "eSumXSquared",
                value: 0x0007,
                note: "Sum X-squared"
            },
            {
                label: "eSumUnweightedN",
                value: 0x0008,
                note: "Sum N-unweighted"
            },
            {
                label: "eMean",
                value: 0x0009,
                note: "Mean"
            },
            {
                label: "eStdDev",
                value: 0x000A,
                note: "Standard deviation"
            },
            {
                label: "eStdErr",
                value: 0x000B,
                note: "Standard error"
            },
            {
                label: "eSampleVar",
                value: 0x000C,
                note: "Sample variance"
            },
            {
                label: "eTotal",
                value: 0x000D,
                note: "Total between bases"
            },
            {
                label: "eSubTotal",
                value: 0x000E,
                note: "Total since previous"
            },
            {
                label: "eText",
                value: 0x000F,
                note: "Text only"
            },
            {
                label: "eNetDiffs",
                value: 0x0010,
                note: "Net difference"
            },
            {
                label: "ePairedPref",
                value: 0x0011,
                note: "Paired preference"
            },
            {
                label: "eMinimum",
                value: 0x0012,
                note: "Minimum"
            },
            {
                label: "eMaximum",
                value: 0x0013,
                note: "Maximum"
            },
            {
                label: "eOtherDerived",
                value: 0x0014,
                note: "Other type of derived element"
            },
            {
                label: "eNet",
                value: 0x0015,
                note: "A net is the combination of a number of sub-elements. Both the net element and its sub-elements are displayed"
            },
            {
                label: "eCombine",
                value: 0x0016,
                note: "A combine element is the combination of a number of sub-elements. Only the combine element is display on the table"
            },
            {
                label: "eExpression",
                value: 0x0017,
                note: "Element based on a custom expression"
            },
            {
                label: "eUnweightedBase",
                value: 0x0018,
                note: "The unweighted base value in a weighted table"
            },
            {
                label: "eNumeric",
                value: 0x0019,
                note: "Element is based on a numeric variable specified by the AnalysisVariable property (this is used to generated summary tables for numeric variables)"
            },
            {
                label: "eDerived",
                value: 0x001A,
                note: "The element value is generated using an expression based on other rows or columns in the table"
            },
            {
                label: "eSum",
                value: 0x001B,
                note: "Sum of a numeric value. This is identical to `eSumX` except `eSumX` is regarded as a 'System Element'"
            },
            {
                label: "eMedian",
                value: 0x001C,
                note: "Medium"
            },
            {
                label: "ePercentile",
                value: 0x001D,
                note: "Percentile. `IElement.CutOffValu`e controls the percentile that is calculated"
            },
            {
                label: "eMode",
                value: 0x001E,
                note: "Mode"
            },
            {
                label: "eProfile",
                value: 0x001F,
                note: "Profile element. In a profile table this represents the variable to profile. It's only applicable to profile tables."
            },
            {
                label: "eProfileResult",
                value: 0x0020,
                note: "The `eProfileResult` element corresponds to a row in a profile table. It's only applicable to profile tables."
            },
            {
                label: "eTValue",
                value: 0x0021,
                note: "1-D T-test value"
            },
            {
                label: "eTProb",
                value: 0x0022,
                note: "1-D T-test probability"
            },
        ]
    },
]);



