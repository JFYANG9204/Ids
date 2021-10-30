import {
    BasicTypeDefinitions,
    createBuiltInDefPlaceHolder
} from "./basic";
import { BuiltInDefinition } from "./types";

export const builtInInterfaces = new Set<BuiltInDefinition>([
    {
        name: "IDispatch",
        definitionType: "interface",
        note: [
            "```cpp",
            "(interface) IDispatch",
            "-----------------------------",
            "Exposes objects, methods and properties to programming tools and other applications that support Automation. COM components implement the `IDispatch` interface to enable access by Automation clients, such as Visual Basic.",
            "Header File: oaidl.h",
            "",
        ].join("\n"),
        methods: [
            {
                name: "GetIDsOfNames",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("HRESULT", "variant", false),
                arguments: [
                    {
                        name: "riid",
                        type: createBuiltInDefPlaceHolder("REFIID", "variant", false),
                        note: "Reserved for future use. Must be *IID_NULL*."
                    },
                    {
                        name: "*rgszNames",
                        type: createBuiltInDefPlaceHolder("LPOLESTR", "variant", false),
                        note: "The array of names to be mapped.",
                    },
                    {
                        name: "cNames",
                        type: createBuiltInDefPlaceHolder("UINT", "variant", false),
                        note: "The count of the names to be mapped.",
                    },
                    {
                        name: "lcid",
                        type: createBuiltInDefPlaceHolder("LCID", "variant", false),
                        note: "The locale context in which to interpret the names.",
                    },
                    {
                        name: "*rgDispId",
                        type: createBuiltInDefPlaceHolder("DISPID", "variant", false),
                        note: "Caller-allocated array, each element of which contains an identifier (ID) corresponding to one of the names passed in the rgszNames array. The first element represents the member name. The subsequent elements represent each of the member's parameters.",
                    }
                ],
                note: [
                    "(method) HRESULT GetIDsOfNames(",
                    "           REFIID   riid,",
                    "           LPOLESTR *rgszNames,",
                    "           UINT     cNames,",
                    "           LCID     lcid,",
                    "           DISPID   *rgDispId",
                    "         );",
                    "------------------------",
                    "### Parameters",
                    "+ `riid`: *REFIID* - Reserved for future use. Must be *IID_NULL*.",
                    "+ `*rgszNames`: *LPOLESTR* - The array of names to be mapped.",
                    "+ `cNames`: *UINT* - The count of the names to be mapped.",
                    "+ `lcid`: *LCID* - The locale context in which to interpret the names.",
                    "+ `*rgDispId`: *DISPID* - Caller-allocated array, each element of which contains an identifier (ID) corresponding to one of the names passed in the rgszNames array. The first element represents the member name. The subsequent elements represent each of the member's parameters.",
                    "",
                    "### Return value",
                    "This method can return one of these values.",
                    "",
                    "| Return code        | Description |",
                    "| :----------        | :---------- |",
                    "| S_OK               | Success.    |",
                    "| E_OUTOFMEMORY      | Out of memory. |",
                    "| DISP_E_UNKNOWNNAME | One or more of the specified names were not known. The returned array of DISPIDs contains DISPID_UNKNOWN for each entry that corresponds to an unknown name. |",
                    "| DISP_E_UNKNOWNLCID | The locale identifier (LCID) was not recognized. |",
                    "",
                    "### Remarks",
                    "An [IDispatch](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/api/oaidl/nn-oaidl-idispatch) implementation can associate any positive integer ID value with a given name. Zero is reserved for the default, or Value property; –1 is reserved to indicate an unknown name; and other negative values are defined for other purposes. For example, if `GetIDsOfNames` is called, and the implementation does not recognize one or more of the names, it returns *DISP_E_UNKNOWNNAME*, and the *rgDispId* array contains *DISPID_UNKNOWN* for the entries that correspond to the unknown names.",
                    "The member and parameter `DISPIDs` must remain constant for the lifetime of the object. This allows a client to obtain the `DISPIDs` once, and cache them for later use.",
                    "When `GetIDsOfNames` is called with more than one name, the first name (*rgszNames*[0]) corresponds to the member name, and subsequent names correspond to the names of the member's parameters.",
                    "The same name may map to different `DISPIDs`, depending on context. For example, a name may have a DISPID when it is used as a member name with a particular interface, a different ID as a member of a different interface, and different mapping for each time it appears as a parameter.",
                    "`GetIDsOfNames` is used when an IDispatch client binds to names at run time. To bind at compile time instead, an IDispatch client can map names to `DISPIDs` by using the type information interfaces described in [Type Description Interfaces](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/automat/type-description-interfaces). This allows a client to bind to members at compile time and avoid calling GetIDsOfNames at run time. For a description of binding at compile time, see [Type Description Interfaces](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/automat/type-description-interfaces).",
                    "The implementation of `GetIDsOfNames` is case insensitive. Users that need case-sensitive name mapping should use type information interfaces to map names to `DISPIDs`, rather than call `GetIDsOfNames`.",
                    "",
                    "### Examples",
                    "The following code from the Lines sample file Lines.cpp implements the `GetIDsOfNames` member function for the CLine class. The ActiveX or OLE object uses the standard implementation, [DispGetIDsOfNames](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/api/oleauto/nf-oleauto-dispgetidsofnames). This implementation relies on `DispGetIdsOfNames` to validate input arguments. To help minimize security risks, include code that performs more robust validation of the input arguments.",
                    "```cpp",
                    "STDMETHODIMP ",
                    "CLine::GetIDsOfNames(",
                    "      REFIID riid,",
                    "      OLECHAR ** rgszNames,",
                    "      UINT cNames,",
                    "      LCID lcid,",
                    "      DISPID * rgDispId)",
                    "{",
                    "      return DispGetIDsOfNames(m_ptinfo, rgszNames, cNames, rgDispId);",
                    "}",
                    "```",
                    "The following code might appear in an ActiveX client that calls `GetIDsOfNames` to get the `DISPID` of the `CLineColor` property.",
                    "```cpp",
                    "HRESULT hresult;",
                    "IDispatch * pdisp = (IDispatch *)NULL;",
                    "DISPID dispid;",
                    "OLECHAR * szMember = \"color\";",
                    "",
                    "// Code that sets a pointer to the dispatch (pdisp) is omitted.",
                    "",
                    "hresult = pdisp->GetIDsOfNames(",
                    "   IID_NULL,",
                    "   &szMember,",
                    "   1, LOCALE_SYSTEM_DEFAULT,",
                    "   &dispid);",
                    "```",
                    "",
                ].join("\n"),
            },
            {
                name: "GetTypeInfo",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("HRESULT", "variant", false),
                arguments: [
                    {
                        name: "UINT",
                        type: createBuiltInDefPlaceHolder("iTInfo", "variant", false),
                        note: "The type information to return. Pass 0 to retrieve type information for the `IDispatch` implementation."
                    },
                    {
                        name: "LCID",
                        type: createBuiltInDefPlaceHolder("lcid", "variant", false),
                        note: "The locale identifier for the type information. An object may be able to return different type information for different languages. This is important for classes that support localized member names. For classes that do not support localized member names, this parameter can be ignored."
                    },
                    {
                        name: "**ppTInfo",
                        type: createBuiltInDefPlaceHolder("ITypeInfo", "variant", false),
                        note: "The requested type information object."
                    }
                ],
                note: [
                    "(method)  HRESULT GetTypeInfo(",
                    "            UINT      iTInfo,",
                    "            LCID      lcid,",
                    "            ITypeInfo **ppTInfo",
                    "          );",
                    "------------------",
                    "### Parameters",
                    "+ `iTInfo`: *UINT* - The type information to return. Pass 0 to retrieve type information for the `IDispatch` implementation.",
                    "+ `lcid`: *LCID* - The locale identifier for the type information. An object may be able to return different type information for different languages. This is important for classes that support localized member names. For classes that do not support localized member names, this parameter can be ignored.",
                    "+ `ppTInfo`: *ITypeInfo* - The requested type information object.",
                    "",
                    "### Return value",
                    "This method can return one of these values.",
                    "",
                    "| Return code     | Description                     |",
                    "| :----------     | :----------                     |",
                    "| S_OK            | Success.                        |",
                    "| DISP_E_BADINDEX | The iTInfo parameter was not 0. |",
                    "",
                ].join("\n"),
            },
            {
                name: "GetTypeInfoCount",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("HRESULT", "variant", false),
                arguments: [
                    {
                        name: "UINT",
                        type: createBuiltInDefPlaceHolder("*pctinfo", "variant", false),
                        note: "The number of type information interfaces provided by the object. If the object provides type information, this number is 1; otherwise the number is 0."
                    }
                ],
                note: [
                    "(method)  HRESULT GetTypeInfoCount(",
                    "            UINT *pctinfo",
                    "          );",
                    "-------------------------",
                    "",
                    "### Parameters",
                    "+ `pctinfo`: *UINT* - The number of type information interfaces provided by the object. If the object provides type information, this number is 1; otherwise the number is 0.",
                    "",
                    "### Return value",
                    "",
                    "| Return code     | Description |",
                    "| :----------     | :---------- |",
                    "| S_OK            | Success.    |",
                    "| E_NOTIMPL       | Failure.    |",
                    "",
                    "### Remarks",
                    "The method may return zero, which indicates that the object does not provide any type information. In this case, the object may still be programmable through `IDispatch` or a `VTBL`, but does not provide run-time type information for browsers, compilers, or other programming tools that access type information. This can be useful for hiding an object from browsers.",
                    "",
                    "### Examples",
                    "This code from the `Lines` sample file `Lines.cpp` implements the `GetTypeInfoCount` member function for the `CLines` class (ActiveX or OLE object).",
                    "```cpp",
                    "STDMETHODIMP",
                    "CLines::GetTypeInfoCount(UINT * pctinfo)",
                    "{",
                    "   if (pctinfo == NULL) {",
                    "      return E_INVALIDARG;",
                    "}",
                    "   *pctinfo = 1;",
                    "   return NOERROR;",
                    "}",
                    "```",
                    "",
                ].join("\n")
            },
            {
                name: "Invoke",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("HRESULT", "variant", false),
                arguments: [
                    {
                        name: "dispIdMember",
                        type: createBuiltInDefPlaceHolder("DISPID", "variant", false),
                        note: "Identifies the member. Use `GetIDsOfNames` or the object's documentation to obtain the dispatch identifier.",
                    },
                    {
                        name: "riid",
                        type: createBuiltInDefPlaceHolder("REFIID", "variant", false),
                        note: "Reserved for future use. **Must** be *IID_NULL*.",
                    },
                    {
                        name: "lcid",
                        type: createBuiltInDefPlaceHolder("LCID", "variant", false),
                        note: "The locale context in which to interpret arguments. The lcid is used by the `GetIDsOfNames` function, and is also passed to `Invoke` to allow the object to interpret its arguments specific to a locale.",
                    },
                    {
                        name: "wFlags",
                        type: createBuiltInDefPlaceHolder("WORD", "variant", false),
                        note: "Flags describing the context of the `Invoke` call.",
                    },
                    {
                        name: "pDispParams",
                        type: createBuiltInDefPlaceHolder("DISPPARAMS", "variant", false),
                        note: "Pointer to a `DISPPARAMS` structure containing an array of arguments, an array of argument `DISPIDs` for named arguments, and counts for the number of elements in the arrays.",
                    },
                    {
                        name: "pVarResult",
                        type: createBuiltInDefPlaceHolder("VARIANT", "variant", false),
                        note: "Pointer to the location where the result is to be stored, or *NULL* if the caller expects no result. This argument is ignored if `DISPATCH_PROPERTYPUT` or `DISPATCH_PROPERTYPUTREF` is specified.",
                    },
                    {
                        name: "pExcepInfo",
                        type: createBuiltInDefPlaceHolder("EXCEPINFO", "variant", false),
                        note: "Pointer to a structure that contains exception information. This structure should be filled in if `DISP_E_EXCEPTION` is returned. Can be *NULL*.",
                    },
                    {
                        name: "puArgErr",
                        type: createBuiltInDefPlaceHolder("UINT", "variant", false),
                        note: "The index within rgvarg of the first argument that has an error. Arguments are stored in pDispParams->rgvarg in reverse order, so the first argument is the one with the highest index in the array. This parameter is returned only when the resulting return value is `DISP_E_TYPEMISMATCH` or `DISP_E_PARAMNOTFOUND`. This argument can be set to null. For details, see [Returning Errors](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/automat/returning-errors).",
                    },
                ],
                note: [
                    "(method) HRESULT Invoke(",
                    "           DISPID     dispIdMember,",
                    "           REFIID     riid,",
                    "           LCID       lcid,",
                    "           WORD       wFlags,",
                    "           DISPPARAMS *pDispParams,",
                    "           VARIANT    *pVarResult,",
                    "           EXCEPINFO  *pExcepInfo,",
                    "           UINT       *puArgErr",
                    "         );",
                    "--------------------------------",
                    "### Parameters",
                    "+ `dispIdMember`: *DISPID* - Identifies the member. Use `GetIDsOfNames` or the object's documentation to obtain the dispatch identifier.",
                    "+ `riid`: *REFIID* - Reserved for future use. **Must** be *IID_NULL*.",
                    "+ `lcid`: *LCID* - The locale context in which to interpret arguments. The lcid is used by the `GetIDsOfNames` function, and is also passed to `Invoke` to allow the object to interpret its arguments specific to a locale.Applications that do not support multiple national languages can ignore this parameter. For more information, refer to Supporting Multiple National Languages and Exposing ActiveX Objects.",
                    "+ `wFlags`: *WORD* - ",
                    "Flags describing the context of the `Invoke` call.",
                    "",
                    "| Value                   | Meaning  |",
                    "| :-----------            | :--------------  |",
                    "| DISPATCH_METHOD         | The member is invoked as a method. If a property has the same name, both this and the DISPATCH_PROPERTYGET flag can be set. |",
                    "| DISPATCH_PROPERTYGET    | The member is retrieved as a property or data member.  |",
                    "| DISPATCH_PROPERTYPUT    | The member is changed as a property or data member.  |",
                    "| DISPATCH_PROPERTYPUTREF | The member is changed by a reference assignment, rather than a value assignment. This flag is valid only when the property accepts a reference to an object.  |",
                    "",
                    "+ `pDispParams`: *DISPPARAMS* - ",
                    "+ `pVarResult`: *VARIANT* - ",
                    "+ `pExcepInfo`: *EXCEPINFO* - ",
                    "+ `puArgErr`: *UINT* - ",
                    "",
                    "### Return value",
                    "",
                    "| Return code           | Description |",
                    "| :----------           | :---------- |",
                    "| S_OK                  | Success.    |",
                    "| DISP_E_BADPARAMCOUNT  | The number of elements provided to DISPPARAMS is different from the number of arguments accepted by the method or property. |",
                    "| DISP_E_BADVARTYPE     | One of the arguments in DISPPARAMS is not a valid variant type.  |",
                    "| DISP_E_EXCEPTION      | The application needs to raise an exception. In this case, the structure passed in `pexcepinfo` should be filled in. |",
                    "| DISP_E_MEMBERNOTFOUND | The requested member does not exist. |",
                    "| DISP_E_NONAMEDARGS    | This implementation of `IDispatch` does not support named arguments.  |",
                    "| DISP_E_OVERFLOW       | One of the arguments in DISPPARAMS could not be coerced to the specified type. |",
                    "| DISP_E_PARAMNOTFOUND  | One of the parameter IDs does not correspond to a parameter on the method. In this case, `puArgErr` is set to the first argument that contains the error. |",
                    "| DISP_E_TYPEMISMATCH   | One or more of the arguments could not be coerced. The index of the first parameter with the incorrect type within rgvarg is returned in `puArgErr`. |",
                    "| DISP_E_UNKNOWNINTERFACE  | The interface identifier passed in riid is not IID_NULL. |",
                    "| DISP_E_UNKNOWNLCID    | The member being invoked interprets string arguments according to the LCID, and the LCID is not recognized. If the LCID is not needed to interpret arguments, this error should not be returned |",
                    "| DISP_E_PARAMNOTOPTIONAL  | A required parameter was omitted. |",
                    "",
                    "",
                    "### Remarks",
                    "Generally, you should not implement `Invoke` directly. Instead, use the dispatch interface to create functions `CreateStdDispatch` and `DispInvoke`. For details, refer to CreateStdDispatch, DispInvoke, Creating the `IDispatch` Interface and Exposing ActiveX Objects.",
                    "If some application-specific processing needs to be performed before calling a member, the code should perform the necessary actions, and then call `ITypeInfo::Invoke` to invoke the member. `ITypeInfo::Invoke` acts exactly like Invoke. The standard implementations of `Invoke` created by CreateStdDispatch and `DispInvoke` defer to `ITypeInfo::Invoke`.",
                    "In an ActiveX client, Invoke should be used to get and set the values of properties, or to call a method of an ActiveX object. The dispIdMember argument identifies the member to invoke. The DISPIDs that identify members are defined by the implementer of the object and can be determined by using the object's documentation, the `IDispatch::GetIDsOfNames` function, or the `ITypeInfo` interface.",
                    "When you use `IDispatch::Invoke()` with `DISPATCH_PROPERTYPUT` or `DISPATCH_PROPERTYPUTREF`, you have to specially initialize the `cNamedArgs` and `rgdispidNamedArgs` elements of your `DISPPARAMS` structure with the following:",
                    "",
                    "```cpp",
                    "DISPID dispidNamed = DISPID_PROPERTYPUT;",
                    "dispparams.cNamedArgs = 1;",
                    "dispparams.rgdispidNamedArgs = &dispidNamed;",
                    "```",
                ].join("\n")
            }
        ]
    },
    {
        name: "IDataManagerJob",
        definitionType: "interface",
        note: [
            "(interface) IDataManagerJob",
            "-----------------------------",
            "This interface enables script writers to access the Job object from the mrScripBasic section of the DMS file. The Job object is registered in the mrScriptBasic engine as Job.",
            "",
            "### Remarks",
            "The Job object is accessible in the following sections in the DMS file:",
            "+ OnJobStart Section",
            "+ OnNextCase Section",
            "+ OnJobEnd Section",
            "",
            "The Job object registers a set of variables with the mrScriptBasic engine. These are:",
            "+ Log",
            "+ Global",
            "+ Questions",
            "",
            "In addition Global SQL Variables are created as variables within the mrScriptBasic engine and can be accessed through mrScriptBasic.",
            "These variables are accessible in the following sections in the DMS file:",
            "+ OnJobStart Section",
            "+ OnNextCase Section",
            "+ OnJobEnd Section",
            "",
            "The variables can be accessed by calling the variable directly or through the `Job` object.",
            "The `Log` object is accessed as:",
            "```ds",
            "dmgrLog.LogFatal(\"Some Fatal Error\")",
            "```",
            "Or through the Job object:",
            "```ds",
            "dmgrJob.Log.LogFatal(\"Some Fatal Error\")",
            "```",
            "The `Global` variables object is accessed as:",
            "```ds",
            "dmgrGlobal.Item[\"SomeVar\"]",
            "dmgrGlobal[\"SomeVar\"]",
            "dmgrGlobal.SomeVar",
            "Dim somevalue",
            "somevalue = CreateObject(\"SomeValue\")",
            "dmgrGlobal.Add(\"SomeNewVar\", somevalue)",
            "```",
            "Or through the Job object:",
            "```ds",
            "dmgrJob.GlobalVariables.Item[\"SomeVar\"]",
            "dmgrJob.GlobalVariables[\"SomeVar\"]",
            "dmgrJob.GlobalVariables.SomeVar",
            "Dim somevalue",
            "somevalue = CreateObject(\"SomeValue\")",
            "dmgrJob.GlobalVariables.Add(\"SomeNewVar\", somevalue)",
            "```",
            "`Global` SQL Variables are accessed as:",
            "```ds",
            "If age.Response Is Null Then",
            "    age.Response = @SomeSQLVariable",
            "End If",
            "```",
            "The Questions collection can be accessed as:",
            "```ds",
            "Dim response",
            "response = dmgrJob.Questions.Q1.response",
            "```",
            "Or:",
            "```ds",
            "Dim response",
            "response = dmgrQuestions.Q1.response",
            "```",
            "Or:",
            "```ds",
            "Dim response",
            "response = Q1.response",
            "```",
            "The Weighting component can be accessed through the Job object:",
            "```ds",
            "Dim W",
            "Set W = dmgrJob.WeightEngine",
            "```",
            "The Weighting component is accesible in the following sections:",
            "+ OnJobStart Section",
            "+ OnNextCase Section",
            "+ OnJobEnd Section",
            "",
        ].join("\n"),
        methods: [
            {
                name: "DropCurrentCase",
                definitionType: "method",
                note: [
                    "(method) DropCurrentCase()",
                    "--------------------",
                    "By calling this method, the current respondent's data will not be written to the output data source."
                ].join("\n"),
            },
            {
                name: "EnvironmentInit",
                definitionType: "method",
                arguments: [
                    {
                        name: "Value",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) IDataManagerJob.EnvironmentInit(Value: String): string",
                    "--------------------",
                    "Sets the internal environment value."
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "CurrentInputDataSource",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.CurrentInputDataSource",
                    "--------------------",
                    "Returns the first input datasource which is currently in use in the transformation"
                ].join("\n"),
            },
            {
                name: "GlobalVariables: IDataManagerGlobalVariables",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDataManagerGlobalVariables"),
                readonly: true,
                isCollection: true,
                note: [
                    "(property) IDataManagerJob.GlobalVariables",
                    "--------------------",
                    "This property returns the Job's global variables collection.",
                    "",
                    "### Example",
                    "To return the Job's global variables collection:",
                    "```ds",
                    "dmgrJob.GlobalVariables.Item[\"SomeVar\"]",
                    "dmgrJob.GlobalVariables[\"SomeVar\"]",
                    "dmgrJob.GlobalVariables.SomeVar",
                    "```",
                    "To add an object to the collection:",
                    "```ds",
                    "Dim somevalue",
                    "somevalue = CreateObject(\"SomeValue\")",
                    "dmgrJob.GlobalVariables.Add(\"SomeNewVar\", somevalue)",
                    "```",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "InputCaseNumbers",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: true,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.InputCaseNumbers[Index: Variant]: Long",
                    "--------------------",
                    "Returns the current input case number for the specified datasource index.",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "Log",
                definitionType: "property",
                returnType: BasicTypeDefinitions.object,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.Log: Object",
                    "--------------------",
                    "Return the Logging component.",
                    "",
                    "### Remarks",
                    "The Logging object can be accessed in either of the following ways:",
                    "```ds",
                    "dmgrLog.LogFatal(\"Some Fatal Error\")",
                    "dmgrJob.Log.LogFatal(\"Some Fatal Error\")",
                    "```",
                ].join("\n"),
            },
            {
                name: "OutputCaseNumber",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.OutputCaseNumber: Long",
                    "--------------------",
                    "Returns the current output case number.",
                ].join("\n"),
            },
            {
                name: "Questions",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IQuestions"),
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.Questions: IQuestions",
                    "--------------------",
                    "This property returns the Job's **Questions** collection.",
                    "",
                    "### Example",
                    "```ds",
                    "Dim response",
                    "response = dmgrJob.Questions.Q1.response",
                    "```",
                ].join("\n"),
            },
            {
                name: "TableDocument",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.TableDocument: IDocument",
                    "--------------------",
                    "Default Table document i.e. the Table document assigned to the first output datasource.",
                    "",
                    "### Example",
                    "In a DMS Script this could be done as:",
                    "```ds",
                    "Event(OnAfterJobEnd, TOM stuff)",
                    "    Dim TOM",
                    "    Set TOM = dmgrJob.TableDocument",
                    "    With TOM",
                    "        .Tables.AddNew(\"Table1\", \"age*gender\", _",
                    "            \"Table1 - age by gender\")",
                    "        .Save(\"D:\\Development\\Museum\\TOMDemo.mtd\")",
                    "        .Exports(\"mrHtmlExport\").Export( _",
                    "            \"D:\\Development\\Museum\\TOMDemo.htm\", _",
                    "            \"Table1\")",
                    "    End With",
                    "End Event",
                    "```",
                    "",
                ].join("\n"),
            },
            {
                name: "TableDocuments",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument", "default", false, { dimensions: 1 }),
                isCollection: true,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.TableDocument: IDocument[]",
                    "--------------------",
                    "Table documents collection, containing one Table document per output datasource",
                    "",
                    "### Example",
                    "In a DMS Script this could be done as:",
                    "```ds",
                    "Event(OnAfterJobEnd, TOM stuff)",
                    "    Dim TOM",
                    "    Set TOM = dmgrTableDocuments[\"XMLOutput\"]",
                    "    With TOM",
                    "        .DataSet.View = 0",
                    "        .Tables.AddNew(\"Table1\", \"age*gender\", _",
                    "            \"Table1 - age by gender\")",
                    "        .Populate()",
                    "        .Save(\"D:\\Development\\Museum\\TOMDemo.mtd\")",
                    "    End With",
                    "End Event",
                    "",
                    "OutputDataSource(XMLOutput, Output XML data source)",
                    "    ConnectionString = Provider=mrOleDB.Provider.2; _",
                    "        Data Source=mrXmlDsc; _",
                    "        Location=D:\\TOMDemo.xml; _",
                    "        Initial Catalog=\"\"; _",
                    "        Mode=ReadWrite; _",
                    "        MR Init MDM Access=0",
                    "    MetaDataOutputName = D:\\TOMDemo.mdd",
                    "End OutputDataSource",
                    "```",
                    "",
                    "",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "TransformedInputMetaData",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDataManagerMetaDataSources"),
                isCollection: true,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.TransformedInputMetaData[Index: Variant]: IDataManagerMetaDataSources",
                    "--------------------",
                    "Returns a collection of input metadata filenames, one for each input data source.",
                    "",
                    "### Example",
                    "In a DMS Script this could be done as:",
                    "```ds",
                    "InputDataSource(SomeInput, the output)",
                    "    ConnectionString = Provider......",
                    "    .",
                    "    .",
                    "End InputDataSource",
                    "",
                    "Event (OnAfterMetaDataTransformations, dddd)",
                    "    ' accesssing the weight engine by output datasource name",
                    "    Dim weName",
                    "    Set weName = dmgrJob.TransformedInputMetaData[\"SomeInput\"]",
                    "    ' accesssing the weight engine by by ordinal",
                    "    Dim weOrdinal",
                    "    Set weOrdinal = dmgrJob.TransformedInputMetaData[0]",
                    "End Event",
                    "```",
                    "",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "TransformedOutputMetaData",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDataManagerMetaDataSources"),
                isCollection: true,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.TransformedOutputMetaData[Index: Variant]: IDataManagerMetaDataSources",
                    "--------------------",
                    "Returns a collection of output metadata filenames, one for each input data source.",
                    "",
                    "### Example",
                    "In a DMS Script this could be done as:",
                    "```ds",
                    "OutputDataSource(SomeOutput, the output)",
                    "    ConnectionString = Provider......",
                    "    .",
                    "    .",
                    "End OutputDataSource",
                    "",
                    "Event (OnAfterMetaDataTransformations, dddd)",
                    "    ' accesssing the weight engine by output datasource name",
                    "    Dim weName",
                    "    Set weName = dmgrJob.TransformedOutputMetaData[\"SomeOutput\"]",
                    "    ' accesssing the weight engine by by ordinal",
                    "    Dim weOrdinal",
                    "    Set weOrdinal = dmgrJob.TransformedOutputMetaData[0]",
                    "End Event",
                    "```",
                    "",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "WeightEngine",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IWeightEngine"),
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.WeightEngine: IWeightEngine",
                    "--------------------",
                    "This property returns the interface pointer to the weight engine interface for the first output data source.",
                    "",
                    "### Example",
                    "```ds",
                    "Dim we",
                    "we = dmgrJob.WeightEngine",
                    "```",
                ].join("\n"),
            },
            {
                name: "WeightEngines",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDataManagerWeightEngines"),
                isCollection: true,
                readonly: true,
                note: [
                    "(property) IDataManagerJob.WeightEngines[Index: Variant]: IDataManagerWeightEngines",
                    "--------------------",
                    "Returns a collection of weight engines, one for each output data source.",
                    "",
                    "### Example",
                    "```ds",
                    "OutputDataSource(SomeOutput, the output)",
                    "    ConnectionString = Provider......",
                    "    .",
                    "    .",
                    "End OutputDataSource",
                    "",
                    "Event (OnJobStart, job start)",
                    "    ' accesssing the weight engine by output datasource name",
                    "    Dim weName",
                    "    Set weName = dmgrJob.WeightEngines[\"SomeOutput\"]",
                    "    ' accesssing the weight engine by by ordinal",
                    "    Dim weOrdinal",
                    "    Set weOrdinal = dmgrJob.WeightEngines[0]",
                    "End Event",
                    "```",
                ].join("\n"),
            },
            {
                name: "TempDirectory",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                isCollection: false,
                readonly: false,
                note: [
                    "(property) IDataManagerJob.TempDirectory: String",
                    "--------------------",
                    "Get / Set the temporary directory to use during the transformation",
                ].join("\n")
            },
        ]
    },
    {
        name: "IDataManagerMetaDataSources",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IDataManagerMetaDataSources",
            "-----------------------------",
            "Get the collection item at the specified location. (This is the default property.)"
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerMetaDataSources.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IDataManagerMetaDataSources.Item[Index: Variant]: Variant",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)",
                ].join("\n")
            },
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        isCollection: false,
                    },
                    {
                        name: "Value",
                        type: BasicTypeDefinitions.variant,
                        optional: true,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) IDataManagerMetaDataSources.Add(Name: String [, Value: Variant]): Void",
                    "--------------------",
                    "Add an item to the collection."
                ].join("\n")
            },
            {
                name: "Append",
                definitionType: "method",
                arguments: [
                    {
                        name: "Item",
                        type: createBuiltInDefPlaceHolder("IDataManagerGlobalVariable"),
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) IDataManagerMetaDataSources.Append(Item: IDataManagerGlobalVariable): Void",
                    "--------------------",
                    "Append a global variable object to the collection"
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) IDataManagerMetaDataSources.Remove(Index: Variant): Void",
                    "--------------------",
                    "Remove an item from the collection."
                ].join("\n")
            },
        ]
    },
    {
        name: "IDataManagerWeightEngines",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IDataManagerWeightEngines",
            "-----------------------------",
            "A collection object containing weightengine objects."
        ].join("\n"),
        properties: [
            {
                name: "Item",
                definitionType: "interface",
                readonly: false,
                isCollection: true,
                returnType: createBuiltInDefPlaceHolder("IWeightEngine"),
                note: [
                    "(property) IDataManagerMetaDataSources.Item[Index: Variant]: IWeightEngine",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)",
                ].join("\n"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            },
            {
                name: "Count",
                definitionType: "property",
                readonly: false,
                isCollection: true,
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IDataManagerMetaDataSources.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                ].join("\n"),
            },
        ],
    },
    {
        name: "IDataManagerGlobalVariables",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IDataManagerGlobalVariables",
            "-----------------------------",
            "A collection of GlobalVariable objects.",
        ].join("\n"),
        methods: [
            {
                name: "Add",
                definitionType: "method",
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        isCollection: false,
                        optional: false,
                    },
                    {
                        name: "Value",
                        type: BasicTypeDefinitions.variant,
                        isCollection: false,
                        optional: true,
                    }
                ],
                note: [
                    "(method) IDataManagerGlobalVariables.Add(Name: String [, Value: Variant]): Void",
                    "--------------------",
                    "Add an item to the collection."
                ].join("\n"),
            },
            {
                name: "Append",
                definitionType: "method",
                arguments: [
                    {
                        name: "Item",
                        type: createBuiltInDefPlaceHolder("IDataManagerGlobalVariable"),
                        isCollection: false,
                        optional: false,
                    }
                ],
                note: [
                    "(method) IDataManagerGlobalVariables.Append(Item: IDataManagerGlobalVariable): Void",
                    "--------------------",
                    "Append a global variable object to the collection."
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        isCollection: false,
                        optional: false,
                    }
                ],
                note: [
                    "(method) IDataManagerGlobalVariables.Remove(Index: Variant): Void",
                    "--------------------",
                    "Remove an item from the collection."
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDataManagerGlobalVariables.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                },
                note: [
                    "(property) IDataManagerGlobalVariables.Item[Index: Variant]: Variant",
                    "--------------------",
                    "Get the collection item at the specified location. (This is the default property.)"
                ].join("\n"),
            }
        ],
    },
    {
        name: "IDataManagerGlobalVariable",
        definitionType: "interface",
        defaultProperty: "Value",
        note: [
            "(interface) IDataManagerGlobalVariable",
            "-----------------------------",
            "Get the collection item at the specified location. (This is the default property.)",
            "",
            "### Remarks",
            "####1. Accessing through a call to the Job object:",
            "```ds",
            "      dmgrJob.GlobalVariables.Item[\"SomeVar\"]",
            "      dmgrJob.GlobalVariables[\"SomeVar\"]",
            "      dmgrJob.GlobalVariables.SomeVar",
            "```",
            "",
            "To add an object to the collection:",
            "```ds",
            "      Dim somevalue",
            "      somevalue=CreateObject(\"SomeValue\")",
            "      dmgrJob.GlobalVariables.Add(\"SomeNewVar\",somevalue)",
            "```",
            "",
            "### 2: Using the variable that is registered in the mrScriptBasic engine, under the name `Global`:",
            "```ds",
            "      dmgrGlobal.Item[\"SomeVar\"]",
            "      dmgrGlobal[\"SomeVar\"]",
            "      dmgrGlobal.SomeVar",
            "```",
            "To add an object to the collection:",
            "```ds",
            "      Dim somevalue",
            "      somevalue=CreateObject(\"SomeValue\")",
            "      dmgrGlobal.Add(\"SomeNewVar\",somevalue)",
            "```",
            "",
            "You can also declare a global SQL variable in the `GlobalSQLVariables` section in a DMS file. For example:",
            "```sql",
            "SELECT MAX(adults) AS @MaxAdults FROM VDATA",
            "```",
            "",
            "You can refer to these global SQL variables in the mrScriptBasic, simply using the global SQL variable's name:",
            "```ds",
            "If adults.Response=null Then",
            "    adults.Response=@MaxAdults",
            "End If",
            "```",
            "",
            "### Note:",
            "",
            "Only the syntax `Job.GlobalVariables.SomeVar = SomeValue` can be used to SET the value of a global variable.",
        ].join("\n"),
        properties: [
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDataManagerGlobalVariable.Name: String",
                    "--------------------",
                    "The name of the global variable"
                ].join("\n"),
            },
            {
                name: "Value",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDataManagerGlobalVariable.Value: Variant",
                    "--------------------",
                    "Gets or sets the value of the `ValueObj`. (This is the default property.)"
                ].join("\n"),
            },
            {
                name: "ValueObj",
                returnType: createBuiltInDefPlaceHolder("IValue"),
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDataManagerGlobalVariable.ValueObj: IValue",
                    "--------------------",
                    "Gets or sets an instance of the `Value` object."
                ].join("\n"),
            }
        ],
    },
    {
        name: "IValue",
        definitionType: "interface",
        note: [
            "(interface) IDataManagerGlobalVariable",
            "-----------------------------",
            "Appends data to a binary value. The `AppendChunk` method is only supported for values of type mtObject. The Source property 'Stream Binary' must be set to True for the `AppendChunk` method to be used, otherwise the error *E_NOTIMPL* will be generated.",
            "",
            "### Remarks",
            "When returning values from the `Value` object, the CDM data types are mapped to Variants:",
            "+ **Variant** - *VT_EMPTY* or *VT_NULL*. In VB this is an unassigned Variant or a variant assigned Empty.",
            "+ **Double** - *VT_R8*. In VB this is a *Double*.",
            "+ **Long** - *VT_I4*. In VB this is a *Long*.",
            "+ **Date** - *VT_DATE*. In VB this is the *Date* data type.",
            "+ **Text** - *VT_BSTR* or *VT_BSTR*|*VT_BYREF*. In VB a text variable is a *String*.",
            "+ **Categorical** - *VT_ARRAY*|*VT_VARIANT* or *VT_ARRAY*|*VT_VARIANT*|*VT_BYREF*. In VB this is an array of Variants. Each variant must contain a *Long* value.",
            "+ **Boolean** - *VT_BOOL*. In VB this is a *Boolean*.",
            "+ **Object** - *VT_DISPATCH*. In VB this is an *Object*.",
        ].join("\n"),
        methods: [
            {
                name: "AppendChunk",
                definitionType: "method",
                arguments: [
                    {
                        name: "Data",
                        type: BasicTypeDefinitions.variant,
                        isCollection: false,
                        optional: false
                    }
                ],
                note: [
                    "(method) IValue.AppendChunk(Data: Variant): Void",
                    "--------------------",
                    "Appends data to a binary value. The `AppendChunk` method is only supported for values of type *mtObject*. The `Source` property 'Stream Binary' must be set to *True* for the `AppendChunk` method to be used, otherwise the error *E_NOTIMPL* will be generated."
                ].join("\n"),
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IValue.AppendChunk(Data: Variant): Void",
                    "--------------------",
                    "Clears the current contents of the value."
                ].join("\n"),
            },
            {
                name: "GetChunk",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "method",
                arguments: [
                    {
                        name: "lSize",
                        type: BasicTypeDefinitions.long,
                        isCollection: false,
                        optional: false,
                    }
                ],
                note: [
                    "(method) IValue.GetChunk(lSize: Long): Variant",
                    "--------------------",
                    "Returns all, or a portion, of the contents of a binary value. The `GetChunk` method is only supported for values of type *mtObject*. The `Source` property 'Stream Binary' must be set to *True* for the `GetChunk` method to be used, otherwise the error *E_NOTIMPL* will be generated."
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "Attributes",
                returnType: createBuiltInDefPlaceHolder("IValueAttributes"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IValue.Attributes: IValueAttributes",
                    "--------------------",
                    "Indicates whether the value should be included in a base aggregate. Normally, a value is included in the base if it is not *NULL*."
                ].join("\n"),
            },
            {
                name: "IsDirty",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValue.IsDirty: Boolean",
                    "--------------------",
                    "Indicates whether the value should be included in an update."
                ].join("\n"),
            },
            {
                name: "Type",
                returnType: createBuiltInDefPlaceHolder("DataTypeConstants"),
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValue.Type: DataTypeConstants",
                    "--------------------",
                    "Property that returns the value data type."
                ].join("\n"),
            },
            {
                name: "Value",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: true,
                note: [
                    "(property) IValue.Value: Variant",
                    "--------------------",
                    "The actual value assigned to the value object."
                ].join("\n"),
                index: {
                    name: "IsDirty",
                    type: BasicTypeDefinitions.boolean,
                    optional: true,
                    defaultValue: -1,
                    isCollection: false,
                }
            }
        ]
    },
    {
        name: "IValueAttributes",
        definitionType: "interface",
        note: [
            "(interface) IValueAttributes",
            "-----------------------------",
            "A collection object that contains the attributes relating to a value."
        ].join("\n"),
        properties: [
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValueAttributes.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: createBuiltInDefPlaceHolder("IValueAttribute"),
                definitionType: "property",
                readonly: false,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    isCollection: false,
                },
                note: [
                    "(property) IValueAttributes.Item[Index: Variant]: IValueAttribute",
                    "--------------------",
                    "Get the collection item at the specified location."
                ].join("\n"),
            }
        ]
    },
    {
        name: "ILabelInsert",
        definitionType: "interface",
        defaultProperty: "Text",
        note: [
            "(interface) ILabelInsert",
            "-----------------------------",
            "The LabelInsert object is used to get or set the text for a named insert of a label."
        ].join("\n"),
        properties: [
            {
                name: "Name",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabelInsert.Name: String",
                    "--------------------",
                    "A read-only property that returns the name of the label insert."
                ].join("\n"),
            },
            {
                name: "Text",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ILabelInsert.Text: String",
                    "--------------------",
                    "This property contains the text for the label insert. (Default Property)"
                ].join("\n"),
            }
        ]
    },
    {
        name: "ILabelInserts",
        definitionType: "interface",
        note: [
            "(interface) ILabelInserts",
            "-----------------------------",
            "A collection object that contains LabelInsert objects."
        ].join("\n"),
        defaultProperty: "Item",
        properties: [
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabelInserts.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: createBuiltInDefPlaceHolder("ILabelInsert"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    isCollection: false,
                },
                note: [
                    "(property) ILabelInserts.Item: ILabelInsert",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)."
                ].join("\n"),
            }
        ]
    },
    {
        name: "ILabel",
        definitionType: "interface",
        defaultProperty: "Text",
        note: [
            "(interface) ILabel",
            "-----------------------------",
            "The Label object is used to get or set a label for questions, banners, errors, and navigation controls.",
            "",
            "### Remarks",
            "With the properties and methods of a `Label` object, you can:",
            "+ Get or set label text using the `Text` property.",
            "+ Set label presentation styles using the `Style` property.",
            "+ Set label insertion text using the `Inserts` collection.",
        ].join("\n"),
        properties: [
            {
                name: "Inserts",
                returnType: createBuiltInDefPlaceHolder("ILabelInserts"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabel.Inserts: ILabelInserts",
                    "--------------------",
                    "A read-only collection of ILabelInsert objects."
                ].join("\n"),
            },
            {
                name: "Name",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabel.Inserts: ILabelInserts",
                    "--------------------",
                    "A read-only property that returns the name of the label."
                ].join("\n"),
            },
            {
                name: "Style",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabel.Style: IStyle",
                    "--------------------",
                    "This property returns a Style object for the label."
                ].join("\n"),
            },
            {
                name: "Text",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ILabel.Text: String",
                    "--------------------",
                    "This property contains the text for the label. (Default Property)"
                ].join("\n"),
            }
        ]
    },
    {
        name: "ILabels",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ILabels",
            "-----------------------------",
            "A collection object that contains label objects.",
        ].join("\n"),
        methods: [
            {
                name: "Add",
                definitionType: "method",
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        isCollection: false,
                    },
                    {
                        name: "pLabel",
                        type: createBuiltInDefPlaceHolder("ILabel"),
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) ILabels.Add(Name: String, pLabel: ILabel): Void",
                    "--------------------",
                    "Adds an existing label to the collection."
                ].join("\n"),
            },
            {
                name: "AddNew",
                returnType: createBuiltInDefPlaceHolder("ILabel"),
                definitionType: "method",
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        isCollection: false,
                    },
                    {
                        name: "Text",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) ILabels.AddNew(Name: String, Text: String): ILabel",
                    "--------------------",
                    "Adds a new label to the collection."
                ].join("\n"),
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ILabels.Clear(): Void",
                    "--------------------",
                    "Removes all items from the collection."
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        isCollection: false,
                    }
                ],
                note: [
                    "(method) ILabels.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes an item from the collection."
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ILabels.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: createBuiltInDefPlaceHolder("ILabel"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    isCollection: false,
                },
                note: [
                    "(property) ILabels.Item[Index: Variant]: ILabel",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)"
                ].join("\n"),
            }
        ]
    },
    {
        name: "IQuestions",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IQuestions",
            "-----------------------------",
            "A collection object that contains the questions for the current interview.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestions.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: createBuiltInDefPlaceHolder("IQuestion"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    isCollection: false,
                },
                note: [
                    "(property) IQuestions.Item[Index: Variant]: IQuestion",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)"
                ].join("\n"),
            }
        ]
    },
    {
        name: "IQuestion",
        definitionType: "interface",
        defaultProperty: "Response",
        note: [
            "(interface) IQuestion",
            "-----------------------------",
            "The `Question` object is used to represent a question in the interview.",
            "",
            "### Remarks",
            "With the properties and methods of a `Question` object, you can:",
            "+ Ask the question.",
            "+ Add and remove banners to the question.",
            "+ Show the question and its current response value.",
            "+ Get and set the current response value.",
            "+ Mark the question as preserved so that it cannot be re-asked.",
            "+ Determine the question type and response data type.",
            "+ Set the question label.",
            "+ Set the error labels and styles for the question.",
            "+ Set the styles for the question.",
            "+ List the sub-questions available for the question.",
            "+ Modify the validation of the question response.",
            "+ List the valid categorical responses for the question.",
            "+ Set the styles for each of the categorical responses.",
            "+ Get and set any custom properties for the question.",
            "+ Get and set additional interview paradata.",
            "",
            "There are three different types of `Question` object. The properties which are available, and the property defined as the default varies for each type:",
            "",
            "+ **Simple**: The *Simple* question type is a single ask, with a response type of *Long*, *Double*, *Text*, *Date*, *Categorical*, or *Boolean*. The Simple question type supports all of the properties except `Item` and `Count` and has `Value` as its default property.",
            "```ds",
            "' Example - Simple question usage",
            "' Ask Q1",
            "Q1.Ask()",
            "' Set Q1 color to red",
            "Q1.Style.Color = mr.Red",
            "```ds",
            "+ **Loop**: The *Loop* (*Categorical* or *Numeric*) question type defines an array of sub-questions. Each index or iteration of the array can contain one or more different sub-questions. The *Loop* question type supports all of the question properties except value and has `Item` as its default property.",
            "```ds",
            "' Multi-ask the loop",
            "Loop1.Ask()",
            "",
            "' Ask the sub-questions for Exhibit A",
            "Loop1[{ExhibitA}].Ask()",
            "",
            "' Ask the sub-question Rating for Exhibit B",
            "Loop1[{ExhibitB}].Rating.Ask()",
            "```",
            "+ **Block**: The *Block* (or Compound, Page) question type defines a list of sub-questions. The Block question type supports all of the question properties except Value and has Item as its default property.",
            "```ds",
            "' Ask all of the questions in the block",
            "Block1.Ask()",
            "",
            "' Ask Q1 from the block",
            "Block1.Q1.Ask()",
            "",
            "' Ask the Demo sub-question using Item",
            "Block1[\"Q1\"].Ask()",
            "```",
            "To support a consistent interface for all question types, as well as supporting a dynamic interface based on sub-question names, the names of sub-questions cannot match those of question object properties. To demonstrate why, if a sub-question was named 'Style', there needs to be a way to ask just the sub-question:",
            "```ds",
            "' Ask the sub-question of Block1",
            "Block1.Style.Ask()",
            "```",
            "Unfortunately, `Style` is also a property of the question object. It also needs to be possible to set a property on the style object:",
            "```ds",
            "' Set the default color for the block",
            "Block1.Style.Color = mr.Blue",
            "```",
            "Hence, there is a name clash between the `Style` sub-question and the `Style` question property. While it will still be possible to have sub-questions whose names match question properties, the question property will always take precedence:",
            "```ds",
            "' VALID: Set the default color for the block",
            "Block1.Style.Color = mr.Blue",
            "",
            "' INVALID: Ask the sub-question for the block",
            "Block1.Style.Ask()",
            "```",
            "The second statement is invalid because the `Style` question property takes precedence. As the `Style` object does not have an `Ask` method, the parser will raise an error. To use reserved property names as sub-question names, the Item method must be used to ask the question:",
            "```ds",
            "' VALID: Ask the sub-question for the block",
            "Block1[\"Style\"].Ask()",
            "```",
            "The list of keywords that should not be used as sub-question names:",
            "",
            "*Categories* *Count* *Errors* *Item* *Label* *LayoutTemplate* *ParentQuestion* *Properties* *QuestionName* *QuestionFullName* *QuestionInfo* *QuestionType* *Response* *Style* *Validation*",
        ].join("\n"),
        methods: [
            {
                name: "Ask",
                definitionType: "method",
                arguments: [
                    {
                        name: "LabelArgs",
                        type: BasicTypeDefinitions.variant,
                        isCollection: true,
                        optional: false,
                    }
                ],
                note: [
                    "(method) IQuestion.Ask(LabelArgs: Variant[]): Void",
                    "--------------------",
                    "Asks a question in an interview.",
                    "",
                    "### Remarks",
                    "The `Ask` method causes the Interview state machine to stop script execution, save the interview state, and to generate question output. The question output generated is dependent on the type of question and the properties that have been set on the interview, next page, and question objects.",
                    "",
                    "The `Ask` method is ignored if:",
                    "",
                    "+ `MustAnswer` is *False* AND",
                    "+ The question is a *categorical* or *compound* question and there are no categories OR",
                    "+ The question is a *categorical* or *compound* question and the only category is a NA (No Answer) category OR",
                    "+ The question is a block, compound, page, or loop and it doesn't have any sub-questions.",
                    "",
                    "The most common situation in which a question is skipped automatically is when all responses or sub-questions have been filtered out due to the response given to a previous question.",
                    "",
                    "### Example",
                    "```ds",
                    "'  q1 and q2 are lists of brands",
                    "IOM.MustAnswer = False",
                    "q1.Ask()",
                    "q2.Categories = q1.Response",
                    "",
                    "'  If the respondant doesn't choose any brands at q1 then q2 has",
                    "'  no categories and the following line won't have any effect.",
                    "q2.Ask()",
                    "```",
                    "If the question label has inserts then the `LabelArgs` parameter can be used to specify",
                    "values for those inserts.  For example, if the question label for Spend was \"How",
                    "much did you spend? (e.g. {ExampleValue:f})\" then the question could be asked as",
                    "`Spend.Ask(123.45)` and 123.45 would be inserted into the label and formatted appropriately",
                    "for the current locale, e.g. \"123.45\" or \"123,45\".",
                    "",
                    "This method is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "BuildDBFilter",
                definitionType: "method",
                returnType: BasicTypeDefinitions.string ,
                arguments: [
                    {
                        name: "bstrFieldName",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        isCollection: false,
                        defaultValue: "L"
                    }
                ],
                note: [
                    "(method) IQuestion.BuildDBFilter([bstrFieldName: String = \"L\"]): String",
                    "--------------------",
                    "This method is used to build a database filter according to its response value.",
                    "",
                    "### Remarks",
                    "This method is only supported by single and multiple response database questions. If the `bstrFieldName` is omitted, the `QuestionName` will be used as the `bstrFieldName`.",
                    "",
                    "### Example",
                    "```ds",
                    "Make.Ask() 'A DB multiple response question for favorite automobile makers.",
                    "'Model is filtered based on the Make response. For example, if BMW and Audi is",
                    "'selected above, the return value of Make.BuildDBFilter will be (MakeID='BMW') OR (MakeID='Audi').",
                    "Model.DBFilter = Make.BuildDBFilter(\"MakeID\")",
                    "Model.Ask()",
                    "```",
                ].join("\n"),
            },
            {
                name: "ClearOffPathResponse",
                definitionType: "method",
                note: [
                    "(method) IQuestion.ClearOffPathResponse(): Void",
                    "--------------------",
                    "Clears the off-path response to the question (if applicable)",
                    "",
                    "### Remarks",
                    "Normally when a question becomes off-path the response in the case data is cleared (exactly when that happens depends on the OffPathDataMode property) but the response is kept so that it is presented to the respondent if the question is redisplayed. The `ClearOffPathResponse()` method can be used to clear the response to the question if the response is off-path. The `ClearOffPathResponse()` also clears the responses to any \"other specify\" and sub-questions that the question may have. Compare this to setting `Question.Info.OffPathResponse` to *Null* which will only clear the response of the immediate question object.",
                    "The typical use of the `ClearOffPathResponse()` method is to clear all off-path responses (using `IOM.Questions[..].ClearOffPathResponse()`) when the respondent changes an answer that invalidates all off-path responses.",
                    "For example, imagine an interview that asks which fruit the respondent likes the most, and then asks questions like why they like that fruit and how often they eat it. If the respondent navigates back to the question about which fruit they liked the most, and then changes their answer then the answers to the subsequent questions should be completely discarded as they might have been applicable to apples but the respondent might have now selected oranges as their favorite fruit.",
                ].join("\n"),
            },
            {
                name: "Delete",
                definitionType: "method",
                arguments: [
                    {
                        name: "vtIndex",
                        type: BasicTypeDefinitions.variant,
                        isCollection: false,
                        optional: false,
                    }
                ],
                note: [
                    "(method) IQuestion.Delete(vtIndex: Variant): Void",
                    "--------------------",
                    "This method is used to delete the given iteration of the question.",
                    "",
                    "### Remarks",
                    "This method is only supported by unbound loop question."
                ].join("\n"),
            },
            {
                name: "Exists",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "method",
                arguments: [
                    {
                        name: "vtIndex",
                        type: BasicTypeDefinitions.variant,
                        isCollection: false,
                        optional: false
                    }
                ],
                note: [
                    "(method) IQuestion.Exists(vtIndex: Variant): Boolean",
                    "--------------------",
                    "This method is used to check given iteration exists or not.",
                    "",
                    "### Remarks",
                    "This method is only supported by numeric loop question for now."
                ].join("\n"),
            },
            {
                name: "Preserve",
                definitionType: "method",
                note: [
                    "(method) IQuestion.Preserve(): Void",
                    "--------------------",
                    "Preserves the response of a question such that the question can never be re-asked or reviewed.",
                    "",
                    "### Remarks",
                    "`Preserve` could be used in CAPI where a respondent will only answer questions if they cannot be reviewed by the interviewer.",
                    "This method is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Show",
                definitionType: "method",
                arguments: [
                    {
                        name: "LabelArgs",
                        type: BasicTypeDefinitions.variant,
                        isCollection: true,
                        optional: false,
                        index: {
                            name: "Index",
                            type: BasicTypeDefinitions.variant,
                            optional: false,
                            isCollection: false,
                        }
                    }
                ],
                note: [
                    "(method) IQuestion.Show(LableArgs: Variant[]): Void",
                    "--------------------",
                    "Shows a question with its associated value or values.",
                    "",
                    "### Remarks",
                    "The `Show` method is identical to `Ask` method except that the user is not able to set a response value for the question.",
                    "This method is not supported in mrDataManager 1.0",
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "Banners",
                returnType: createBuiltInDefPlaceHolder("ILabels"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestion.Banners: ILabels",
                    "--------------------",
                    "A read-only property that returns a collection of Label objects.",
                    "",
                    "### Remarks",
                    "Question banners are displayed only when the question is asked.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Categories",
                returnType: createBuiltInDefPlaceHolder("ICategories"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestion.Categories: ICategories",
                    "--------------------",
                    "A read-only property that returns a collection of category objects.",
                    "",
                    "### Remarks",
                    "The `Categories` collection supports the standard collection properties and methods: `Item`, `Count`, and `_NewEnum`. The collection also supports a helper property, Filter.",
                    "The categories properties is not used for *Block* or *Page* questions, but can be used for all other question types. For a Compound question, the `Categories` property returns the shared category list for the sub-questions. For a *categorical* loop question, the `Categories` property returns the categories which define the loop iterations. Finally, for a Simple question, this property returns the possible categorical responses for the question. All simple data types, except Boolean, can have categorical responses associated with them.",
                ].join("\n"),
            },
            {
                name: "Codes",
                returnType: createBuiltInDefPlaceHolder("ICategories"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestion.Codes: ICategories",
                    "--------------------",
                    "A read only property that returns a collection of category objects.",
                    "",
                    "### Remarks",
                    "The categories returned by the `Codes` property represent the alternative categorical responses for a question. Optionally used on simple questions, these categorical responses typically include categories such as *Don't Know*, *No Answer*, or *Refused*"
                ].join("\n"),
            },
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IQuestion.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Errors",
                returnType: createBuiltInDefPlaceHolder("ILables"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                note: [
                    "(property) IQuestion.Errors: ILabels",
                    "--------------------",
                    "This property returns a collection of label objects for the question error texts.",
                    "",
                    "### Remarks",
                    "The `IQuestion.Errors` collection can be used to display errors associated with a question when the question is asked. The default formatting causes error texts to be displayed in red.",
                    "After a question has been answered some standard validation is performed on the response. If one of these validation checks fails then an appropriate error is automatically added to the `Errors` collection and the question is re-asked, displaying the error message. If the standard validation checks pass and a custom validation function has been defined (using `IValidation`.Function) then that custom validation function is executed. That custom validation function can add additional errors to the `IQuestion.Errors` collection.",
                    "The `IQuestion.Errors` collection is automatically cleared before the standard validation is performed.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Info",
                returnType: createBuiltInDefPlaceHolder("IQuestionInfo"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.Info: IQuestionInfo",
                    "--------------------",
                    "This read-only property indicates whether the question is a `Database` question.",
                    "",
                    "### Remarks",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            },
            {
                name: "IsDBQuestion",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.IsDBQuestion: Boolean",
                    "--------------------",
                    "This read-only property indicates whether the question is a Database question."
                ].join("\n"),
            },
            {
                name: "Label",
                returnType: createBuiltInDefPlaceHolder("ILabel"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.Label: ILabel",
                    "--------------------",
                    "This read-only property returns the label for the question.",
                    "",
                    "### Remarks",
                    "The question label that is returned is based on the active language, context, and label type. The question label can be modified, but any changes will not be written back into the MDM."
                ].join("\n"),
            },
            {
                name: "OtherCategories",
                returnType: createBuiltInDefPlaceHolder("ICategories"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.OtherCategories: ICategories",
                    "--------------------",
                    "A read-only property that returns a collection of \"other specify\" categories.",
                    "",
                    "### Remarks",
                    "The categories returned by the `OtherCategories` property represent the \"Other Specify\" categorical responses for a question.",
                    "The `OtherCategories` collection is similar to the `Categories` collection except it is a flattened list and only contains categories that have an associated \"other specify\" question",
                ].join("\n"),
            },
            {
                name: "ParentQuestion",
                returnType: createBuiltInDefPlaceHolder("IQuestion"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.ParentQuestion: IQuestion",
                    "--------------------",
                    "A read-only property that returns the parent question if one exists.",
                    "",
                    "### Remarks",
                    "*NULL* is returned if the question does not have a parent question."
                ].join("\n"),
            },
            {
                name: "Properties",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.Properties: IProperties",
                    "--------------------",
                    "A read-only property that returns the properties for the question.",
                    "",
                    "### Remarks",
                    "*NULL* is returned if the question does not have a parent question."
                ].join("\n"),
            },
            {
                name: "QuestionDataType",
                returnType: createBuiltInDefPlaceHolder("DataTypeContants"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.QuestionDataType: DataTypeContants",
                    "--------------------",
                    "A read-only property that returns the question data type.",
                    "",
                    "### Remarks",
                    "This property is only valid for questions with a `QuestionType` of *qtSimple*."
                ].join("\n"),
            },
            {
                name: "QuestionFullName",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.QuestionFullName: String",
                    "--------------------",
                    "A read-only property that returns the full name of the question.",
                    "",
                    "### Remarks",
                    "If the question is a sub-question of another question object, then the full-name will not match the name."
                ].join("\n"),
            },
            {
                name: "QuestionName",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.QuestionName: String",
                    "--------------------",
                    "A read-only property that returns the name of the question or sub-question."
                ].join("\n"),
            },
            {
                name: "QuestionType",
                returnType: createBuiltInDefPlaceHolder("QuestionTypes"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.QuestionType: QuestionTypes",
                    "--------------------",
                    "A read-only property that returns the question type.",
                    "",
                    "### Remarks",
                    "The question type determines which properties are available."
                ].join("\n"),
            },
            {
                name: "Response",
                returnType: createBuiltInDefPlaceHolder("IResponse"),
                definitionType: "property",
                readonly: true,
                note: [
                    "(property) IQuestion.Response: IResponse",
                    "--------------------",
                    "The read-only Response property returns the response object for the question.",
                    "",
                    "### Remarks",
                    "The `response` object can be used to set and unset a question value, as well as setting the default value. The `Response` object is only available for *Simple* questions, for which it is the default property. The following examples show how the `Response` object can be used:",
                    "```ds",
                    "' Unset the response for Q1",
                    "Q1.Response = NULL",
                    "",
                    "' Set the default value for Q1",
                    "Q1.Response.Default = {Female}",
                    "",
                    "' Use the response value of Q1 in an expression",
                    "Total.Response = Total.Response + Q1",
                    "```",
                ].join("\n"),
            },
            {
                name: "Style",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestion.Style: IStyle",
                    "--------------------",
                    "This property returns a `Style` object for the question.",
                    "",
                    "### Remarks",
                    "The `Style` object is used to override or reset the default presentation styles for the question. For *Loop*, *Block*, *Page*, and *Compound* question types, the `Style` object can be used to set styles for all of the sub-questions. Any styles set in a parent question can be further overridden in a sub-question.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Validation",
                returnType: createBuiltInDefPlaceHolder("IValidation"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IQuestion.Validation: IValidation",
                    "--------------------",
                    "This read-only property that defines the validation for the question.",
                    "",
                    "### Remarks",
                    "The validation object is used only with Simple question types.",
                ].join("\n"),
            },
            {
                name: "BannerTemplacte",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.BannerTemplacte: String",
                    "--------------------",
                    "This property is used to get or set the name of a `Banner` template for the question.",
                    "",
                    "### Remarks",
                    "The banner template is used when replacing mrBanner tags.",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            },
            {
                name: "DBFilter",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.DBFilter: String",
                    "--------------------",
                    "This property is used to get and set the `Database` filter for the question."
                ].join("\n"),
            },
            {
                name: "ErrorTemplate",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.ErrorTemplate: String",
                    "--------------------",
                    "This property is used to get or set the name of a `Error` template for the question.",
                    "",
                    "### Remarks",
                    "The error template is used when replacing mrError tags.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                },
                note: [
                    "(property) IQuestion.Item: Variant",
                    "--------------------",
                    "The `Item` property is used to return a sub-question. (Default Property)",
                    "",
                    "### Remarks",
                    "The `Item` property is only available for the *Loop*, *Block*, *Compound*, and *Page* question types, for which it is the default property. The Item method is used to return the sub-questions from an iteration of a *Loop* or to return a sub-question from a *Block*, *Compound*, or *Page*. The `Item` property would not normally be used for *Blocks*, *Compounds* and *Pages*, except when a sub-question has the same name as a property.",
                    "```ds",
                    "' Item example: Ask the sub-questions on the loop",
                    "Loop1[{ExA}].Ask() ' Equivalent to: Loop1.Item[{ExA}].Ask()",
                    "",
                    "' Item example: Block sub-question uses reserved name",
                    "Block1[\"Style\"].Ask()",
                    "```",
                    "The index parameter on `Item` is optional.  If the index is not specified, then the property sets or gets the `Response` value.",
                    "",
                    "```ds",
                    "' Equivalent to Q1.Response = {Female}",
                    "Q1 = {Female}",
                    "",
                    "' Equivalent to TotalQ.Response = TotalQ.Response + 1",
                    "TotalQ = TotalQ + 1",
                    "```",
                ].join("\n"),
            },
            {
                name: "LayoutTemplate",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.LayoutTemplate: String",
                    "--------------------",
                    "This read/write property is used to get or set the layout template for the question.",
                    "",
                    "### Remarks",
                    "The layout template is typically the name of a file which defines where the questions on a page should be rendered.",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            },
            {
                name: "MustAnswer",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.MustAnswer: Boolean",
                    "--------------------",
                    "This read/write property is used to enable or disable automatic no answer questions.",
                    "",
                    "### Remarks",
                    "If the `MustAnswer` property is set, the question must be answered. If `MustAnswer` is set to *False*, then any questions with a default value or a no answer (NA) special response will automatically be answered. If `MustAnswer` is set to *False* and a question does not have a *default* or *NA* as a valid response, then the question needs to be answered before proceeding to the next question.",
                    "If no value is set for this property then the `MustAnswer` setting of the parent question is used, i.e. the iterations of a loop or the questions in a block will use the MustAnswer setting for the loop or block question respectively. Top level questions will use the `IOM.MustAnswer` (which has a default of *True*) if no `MustAnswer` value has been set.",
                ].join("\n"),
            },
            {
                name: "NarBarTemplate",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.NarBarTemplate: String",
                    "--------------------",
                    "This property is used to get or set the name of a `NavBar` template for the question.",
                    "",
                    "### Remarks",
                    "The navigation bar template is used when replacing *mrNavBar* tags.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "QuestionFilter",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.QuestionFilter: Variant",
                    "--------------------",
                    "The sub-questions of this question that are to be asked.",
                    "",
                    "### Remarks",
                    "This is similar to the `Filter` property of `ICategories` and `ICategory`. It determines the sub-questions that are returned by the Item property when using a numeric index and by the `For-Each` enumerator. It also affects the value returned by the `Count` property. All questions are still accessible from the `Item` property using the question name. Unlike the `Filter` property of `ICategories` and `ICategory`, this `Filter` property only affects the immediate sub-questions.",
                    "For a categorical loop the `QuestionFilter` property can be a categorical value or a range expression, e.g. *{Monday, Tuesday, Wednesday}* or \"Monday..Wednesday\"",
                    "For a numeric loop the `QuestionFilter` property can be a range expression or a numeric value. A numeric value is interpreted as a range expression expression of \"..n\" where n is the numeric value, e.g. the following are equivalent:",
                    "```ds",
                    "PersonLoop.QuestionFilter '\"..5\"",
                    " ",
                    "PersonLoop.QuestionFilter `5",
                    "```",
                    "",
                    "A typical example of filtering a numeric loop would be to reduce the number if iterations asked based on the response to a previous question, e.g:",
                    "```ds",
                    "' Filter the numeric loop sub-questions based on a previous question ",
                    "PersonLoop.QuestionFilter = PeopleInHousehold",
                    "```",
                    "For a compound, block, or page question the `QuestionFilter` property is a range expression containing a list of the questions to ask, e.g.",
                    "```ds",
                    "Demographics.QuestionFilter ' \"age, gender, education\"",
                    "```",
                    "The `QuestionFilter` is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "QuestionOrder",
                returnType: createBuiltInDefPlaceHolder("OrderConstants") ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.QuestionOrder: OrderConstants",
                    "--------------------",
                    "The order of the sub-questions of this question.",
                    "",
                    "### Remarks",
                    "Setting the order property controls the sequence in which `Questions` objects are returned by the Item property when using a numeric index and also by the `For-Each` enumerator.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "QuestionTemplate",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IQuestion.QuestionTemplate: String",
                    "--------------------",
                    "This property is used to get or set the name of a question template for the question.",
                    "",
                    "### Remarks",
                    "The question template is used when replacing mrData tags that do not specify a question element.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IResponses",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IResponses",
            "-----------------------------",
            "A collection object containing response objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IResponses.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IResponses.Item[Index: Variant]: Variant",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)"
                ].join("\n"),
            }
        ],
    },
    {
        name: "IResponse",
        definitionType: "interface",
        defaultProperty: "Value",
        note: [
            "(interface) IResponse",
            "-----------------------------",
            "The `Response` object is used to get or set a response value on a question.",
            "With the properties and methods of a `Response` object, you can:",
            "+ Get the data type for the question response with the `Type` property.",
            "+ Get and set the current value for the question using the `Value` property.",
            "+ Get and set the default value for the question using the `Default` property.",
            "+ Get and set the initial value for the question using the `Initial` property.",
            "+ Get and set the other values for the question using the `Other` collection property.",
        ].join("\n"),
        properties: [
            {
                name: "Label",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IResponse.Label: String",
                    "-----------------------------",
                    "The label corresponding to a *categorical* response"
                ].join("\n"),
            },
            {
                name: "Name",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IResponse.Name: String",
                    "-----------------------------",
                    "This read-only property returns the name of an other response category."
                ].join("\n"),
            },
            {
                name: "Other",
                returnType: createBuiltInDefPlaceHolder("IResponses"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IResponse.Other: IResponses",
                    "-----------------------------",
                    "This read only property returns a collection of `Response` objects."
                ].join("\n"),
            },
            {
                name: "Coded",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.Coded: Variant",
                    "-----------------------------",
                    "A read/write property that returns the coded value for the question."
                ].join("\n"),
            },
            {
                name: "DataType",
                returnType: createBuiltInDefPlaceHolder("DataTypeConstants") ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.DataType: DataTypeConstants",
                    "-----------------------------",
                    "Read-only property that returns the value object data type."
                ].join("\n"),
            },
            {
                name: "Default",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.Default: Variant",
                    "-----------------------------",
                    "This read/write property is used to set the default value for the question."
                ].join("\n"),
            },
            {
                name: "Initial",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.Initial: Variant",
                    "-----------------------------",
                    "This read/write property is used to set the initial value for the question.",
                    "",
                    "### Remarks",
                    "The `Initial` value differs from the `Default` value in that it is the initially selected response when the question is first asked. Regardless of the setting of `MustAnswer`, a question does not require an answer when an initial value is set. Hence, when a question has an initial value, the *default* is ignored.",
                    "",
                    "### Example",
                    "```ds",
                    "' Set the default value for Gender",
                    "Gender.Response.Default = {Female}",
                    "Gender.Ask()",
                    "```",
                    "",
                ].join("\n"),
            },
            {
                name: "IsDirty",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.IsDirty: Boolean",
                    "-----------------------------",
                    "A read/write property that is automatically set to *True* when a value is updated.",
                    "",
                    "### Remarks",
                    "The `IsDirty` property has no impact on how data is written and is merely a way of checking for changes in question values. For example, the `IsDirty` property could get set to *False* at one point in the script and then later it could be checked to see if value has been updated.",
                ].join("\n"),
            },
            {
                name: "Value",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.Value: Variant",
                    "-----------------------------",
                    "This read/write property is the actual value assigned to the value object. (Default Property)",
                ].join("\n"),
            },
            {
                name: "ValueObj",
                returnType: createBuiltInDefPlaceHolder("IValue"),
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IResponse.ValueObj: IValue",
                    "-----------------------------",
                    "The value object assigned to the `Response` object. The value object is an alternative mechanism for setting a value on a response.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IValidation",
        definitionType: "interface",
        defaultProperty: "ValidateExpression",
        note: [
            "(interface) IValidation",
            "-----------------------------",
            "The Validation object is used to manage the question validation.",
            "With the properties of a Validation object, you can:",
            "+ Get or set the minimum and maximum allowed values.",
            "+ Get or set the allowed text or numeric value ranges.",
        ].join("\n"),
        properties: [
            {
                name: "Options",
                returnType: createBuiltInDefPlaceHolder("IValidationOptions"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IValidation.Options: IValidationOptions",
                    "-----------------------------",
                    "Additional validation options that differ between question types.",
                    "",
                    "### Remarks",
                    "The `Options` property is a collection of additional validation options that are specific to each question type. Currently there are only two validation options; 'AllowThousandsSeparator' which is applicable to Long and Double questions and 'AllowXHTML' which is applicable to Text questions.",
                    "+ ***AllowThousandsSeparator***: By default the 'thousands separator character' (e.g. the ',' character in English) is not allowed in responses to Long and Double questions. Setting the `AllowThousandsSeparator` option to True will allow the thousands separator character in responses.",
                    "+ ***AllowXHTML***: By default XHTML is not allowed in responses to Text questions. This is done to prevent Cross Site Scripting attacks as any script entered as the response may be executed when the response is re-displayed. If AllowXHTML is set to True, for example to allow respondents to enter XHTML formating in their response, then custom validation for the text question should be used.",
                    "",
                    "### Example",
                    "```ds",
                    "' Allow the thousands separator character for the Spend question",
                    "Spend.Validation.Options[\"AllowThousandsSeparator\"] = True",
                    "",
                    "' A short-hand way to specify the same option that takes",
                    "' advantage of dynamic property expansion",
                    "Spend.Validation.AllowThousandsSeparator = True",
                    "```",
                ].join("\n"),
            },
            {
                name: "Function",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.Function: String",
                    "-----------------------------",
                    "The custom validation function to use.",
                    "",
                    "### Remarks",
                    "Custom validation can be performed in addition to the standard validation implemented by the `Validation` object. This is done by specifying the name of a function for the `IValidation.Function` property.",
                    "Any function that takes the form \"FuncName(Question, IOM, Attempt)\" can be used. The parameters are:",
                    "+ ***Question***: The Question object that is being validated.",
                    "+ ***IOM***: The Interview object.",
                    "+ ***Attempt***: The number of the current custom validation attempt.",
                    "The custom validation function is automatically called during the validation of a response entered for a Ask() statement. The custom validation function is called after the standard validation has been performed. If the question that was asked has child questions, and they also have custom validation functions, then those functions will also be invoked.",
                    "The custom validation function must return a Boolean value. True indicates that the validation was successful and the interview should move on to the next question. False indicates the response is invalid and the question should be re-asked. If the question has sub-questions with validate functions then the question will be re-asked if any validation function returns *False*.",
                    "The custom validation function is also invoked during a call to `IValidation.Validate()` when the validate action is `vaUpdateErrors`.",
                    "The `Attempt` parameter indicates the number of times the custom validation function has been called for the particular question. The first time custom validation is performed the `Attempt` parameter has the value 1 and it is incremented on each subsequent attempt. The Attempt count is reset whenever the custom validation function returns *True*. The Attempt count can be used to give the respondent a limited number of attempts at the question before just accepting whatever response they gave and continuing with the interview.",
                    "",
                    "### Example",
                    "```ds",
                    "' TimeAllocation is a block of numeric questions.  The interview",
                    "' will not proceed to the next question until the responses of all",
                    "' the numeric questions add to 100.",
                    "TimeAllocation.Validation.Function = \"Validate100Percent\"",
                    "TimeAllocation.Ask()",
                    "",
                    "Function Validate100Percent(Question, IOM, Attempt)",
                    "   Dim SubQuestion, Total",
                    "   ",
                    "   Total = 0",
                    "   For Each SubQuestion In Question",
                    "      Total = Total + SubQuestion.Response.Value",
                    "   Next",
                    "   If Total = 100 Then",
                    "      Validate100Percent = True",
                    "   Else",
                    "      Question.Errors.AddNew(\"IncorrectTotal\", \"Responses don't add up to 100%\")",
                    "      Validate100Percent = False",
                    "   End If",
                    "End Function",
                    "```",
                ].join("\n"),
            },
            {
                name: "MaxValue",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.MaxValue: Variant",
                    "-----------------------------",
                    "This read/write property returns the maximum possible value.",
                    "",
                    "### Remarks",
                    "The maximum value is interpreted as follows for the different types:",
                    "+ **Double**. The maximum double value (default = 1.79769313486232E308)",
                    "+ **Long**. The maximum long value (default = 2,147,483,647)",
                    "+ **Text**. The maximum number of characters (default = 2,147,483,647)",
                    "+ **Date**. The maximum date value (default = 31 December 9999)",
                    "+ **Categorical**. The maximum number of categories (default = total categories)",
                    "+ **Boolean**. not applicable"
                ].join("\n"),
            },
            {
                name: "MinValue",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.MinValue: Variant",
                    "-----------------------------",
                    "This read/write property returns the minimum possible value.",
                    "",
                    "### Remarks",
                    "The minimum value is interpreted as follows for the different types:",
                    "+ **Double**. The minimum double value (default = -1.79769313486232E308)",
                    "+ **Long**. The minimum long value (default = -2,147,483,648)",
                    "+ **Text**. The minimum number of characters (default = 0)",
                    "+ **Date**. The minimum date value (default = 1 January 100)",
                    "+ **Categorical**. The minimum number of categories (default = 0)",
                    "+ **Boolean**. not applicable",
                    "Note that the `IQuestion.MustAnswer` and `IInterview.MustAnswer` properties override the `MinValue` property for *Text* questions. i.e. if `MinValue` is 0 but `MustAnswer` is *True* then at least 1 character must be entered.",
                ].join("\n"),
            },
            {
                name: "Precision",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.Precision: Long",
                    "-----------------------------",
                    "The total number of digits that can be specified for a numeric value",
                    "",
                    "### Remarks",
                    "The `Precision` property can only be set for numeric questions (i.e. questions of type *Double* or *Long*). Attempting to read the property for any other question will return a value of -1. For a double value, the precision specifies the total number of digits, including those after the decimal point."
                ].join("\n"),
            },
            {
                name: "Scale",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.Scale: Long",
                    "-----------------------------",
                    "The number of digits after the decimal point for a double value",
                    "",
                    "### Remarks",
                    "The `Scale` property can only be set for questions of type 'Double'. Attempting to read the property for any other question will return a value of -1. If no `Scale` value has been specified then -1 is returned."
                ].join("\n"),
            },
            {
                name: "ValidateExpression",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IValidation.ValidateExpression: Long",
                    "-----------------------------",
                    "This read/write property returns the validation expression. (Default Property)",
                    "",
                    "### Remarks",
                    "The validation expression is only used for numeric and text types. For numeric types, it is the range expression that defines the ranges of values that are valid. For the text type it defines the validation expression defined in metadata."
                ].join("\n"),
            }
        ]
    },
    {
        name: "ICategories",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ICategories",
            "-----------------------------",
            "A collection object that contains Category objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategories.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Filter",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ICategories.Filter: Variant",
                    "--------------------",
                    "A read/write property that returns the filter used to select categories. The filter can be specified as a range or a categorical value. (Default Property)",
                    "",
                    "### Remarks",
                    "The `Filter` property is used to limit the category objects returned by the collection. If a `Filter` is set, then the final list of categories returned is the intersection of the `Filter` and the category list:",
                    "+ ***Categories*** `Question Categories * Filter`",
                    "The `Filter` property can be used to limit the categories displayed by a question to just those categories chosen in a previous question.",
                    "",
                    "### Example",
                    "```ds",
                    "' Filtering a simple category list",
                    "' Q1 and Q2 have categories {a,b,c,d}",
                    "",
                    "' Ask the categories answered in a previous question",
                    "' NOTE: Q2.Categories is the same as Q2.Categories.Filter",
                    "Q2.Categories = Q1",
                    "Q2.Ask()",
                    "",
                    "' Ask the categories not answered in a previous question",
                    "Q2.Categories = Q2.DefinedCategories() ?Q1",
                    "Q2.Ask()",
                    "",
                    "' Ask the categories based on a range",
                    "Q2.Categories = \"a..c\"",
                    "Q2.Ask()",
                    "```",
                    "The `Filter` property can be used to limit the categories in a categorical loop or compound.",
                    "",
                    "```ds",
                    "BrandsUsed.Ask()           ' Simple question for brands used",
                    "",
                    "' Set the Loop filter so that only the brands used are presented",
                    "BrandsLoop.Categories.Filter = BrandsUsed",
                    "```",
                    "For questions, the `Filter` property only applies to the current list and does not cascade to sub-lists.  However, for categories, the filter setting is passed to sub-lists.  This is done to ensure that a filter can be based on an answer to a previous question.",
                    "",
                    "```ds",
                    "' Filtering a category list with sub-lists",
                    "' Q1 has categories {a, b{x,y}, c{i,j},d}",
                    "' The sub-lists are name-spaced.",
                    "",
                    "' Filter {a,b{x},c{i,j}}",
                    "Q1.Categories = {a,b.x,c.i,c.j}",
                    "",
                    "' After setting the filter:",
                    "' Q1.Categories returns {a,b,c}",
                    "' Q1.Categories.b returns {x}",
                    "' Q1.Categories.c returns {i,j}",
                    "",
                    "' Filter {a,b{..}}",
                    "Q1.Categories = {a,b}",
                    "",
                    "' Filter {a,b{..},b.x}",
                    "' NOTE: b.x has no effect because it is already selected by b",
                    "Q1.Categories = {a,b,b.x}",
                    "",
                    "To clear a filter, assign \"..\" (all categories) or NULL to the Filter property or",
                    "use the DefinedCategories function.",
                    "",
                    "' Different ways to reset the filter",
                    "Q2.Categories = Q2.DefinedCategories()",
                    "Q2.Categories = \"..\"",
                    "Q2.Categories.Filter = NULL",
                    "Q2.Categories = NULL",
                    "```",
                    "The `Filter` property is the default parameterless property.  So the previous examples could have been written without explicitly specifying 'Filter':",
                    "",
                    "```ds",
                    "' Set the Filter, ask the questions and remove the filter",
                    "BrandsLoop.Categories = BrandsUsed",
                    "BrandsLoop[..].Ask()",
                    "BrandsLoop.Categories = NULL",
                    "```",
                    "The `Filter` setting only impacts how items are returned by the enumerator and using numeric indexes.  Even if an item it not selected by the filter, it will still be possible to get the item by its name.",
                    "Note that in the example below, when defining the filter in the script, the value can be set as a string (a category expression) or a *categorical* value (a categorical literal {}).",
                    "When assigning the filter as a string (for example, \"a\"), the category names will be validated against the question's categories, because *category* expressions need to be evaluated to resolve any range expressions.",
                    "On the other hand, a *category* value (for example, {a}) is only validated against the *category* map at parse time, but is not checked when setting the filter.  The filter property does not consider this an error because filters can be set based on the answers to a previous question that could contain additional categories that are not included in the current question. The additional categories are ignored.  This distinction is important for database questions. Given that the categories for database questions are not known at parse time, *category* expressions must be used. This does mean that hard coded filters set for database questions will be validated at run time against the categories read from the database.",
                    "```ds",
                    "'Example for unusual case of setting filter.",
                    "q1 \"Test question 1\"",
                    "categorical",
                    "{",
                    "A \"A\",",
                    "B \"B\"",
                    "};",
                    "q1.Categories.Filter = \"C\" ==> the error \"The range expression 'C' is not valid\" is produced.",
                    "q1.Categories.Filter = {C} ==> no error is produced",
                    "```",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: createBuiltInDefPlaceHolder("ICategory"),
                definitionType: "property",
                readonly: false,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                },
                note: [
                    "(property) ICategories.Item[Index: Variant]: ICategory",
                    "--------------------",
                    "Get the `Category` at the specified location. (Default Property)",
                    "",
                    "### Remarks",
                    "`Val` can be a numeric index or *category* name.",
                    "",
                    "### Example",
                    "```ds",
                    "' These three lines are equivalent",
                    "Q1.Categories[0].Label.Style.Color = \"blue\"",
                    "Q1.Categories[\"Cat1\"].Label.Style.Color = \"blue\"",
                    "Q1.Categories.Cat1.Label.Style.Color = \"blue\"",
                    "```",
                ].join("\n"),
            },
            {
                name: "Order",
                returnType: createBuiltInDefPlaceHolder("OrderConstants") ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ICategories.Order: OrderConstants",
                    "--------------------",
                    "The order of the categories in the collection",
                    "",
                    "### Remarks",
                    "Setting the order property controls the sequence in which `Category` objects are returned by the `Item` property when using a numeric index and also by the `For-Each` enumerator.",
                    "This property is not supported in mrDataManager 1.0",
                ].join("\n"),
            }
        ]
    },
    {
        name: "ICategory",
        definitionType: "interface",
        defaultProperty: "Value",
        note: [
            "(interface) ICategory",
            "-----------------------------",
            "The `Category` object is used to represent a possible *category* response for a question.",
            "",
            "### Remarks",
            "With the properties and methods of a `Category` object, you can:",
            "+ Determine the category type.",
            "+ Set the category label.",
            "+ Get the category name and full-name.",
            "+ Get the category index, its unique value, and any associated factor value.",
            "+ Set the styles for the category.",
            "+ List any sub-categories for the category.",
            "+ Get and set any custom properties for the category.",
            "+ Determine whether the category is exclusive or an other specify using the `Attributes` property.",
        ].join("\n"),
        properties: [
            {
                name: "Attributes",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Attributes: Long",
                    "--------------------",
                    "A read-only property that returns the CategoryAttributes. CategoryAttributes specify a category as exclusive, fixed, other etc.",
                    "",
                    "### Remarks",
                    "The default value of 0 indicates the category has no special `CategoryAttributes`.",
                    "`CategoryAttributes` can be checked using the `IsSet` function. E.g.",
                    "```ds",
                    "If Q1.Categories[\"Other\"].Attributes.IsSet(CategoryAttributes.caExclusive) Then",
                    "```",
                ].join("\n"),
            },
            {
                name: "Categories",
                returnType: createBuiltInDefPlaceHolder("ICategories"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                note: [
                    "(property) ICategory.Categories: ICategories",
                    "--------------------",
                    "A read-only property that returns a collection of category objects.",
                    "",
                    "### Remarks",
                    "The `Categories` collection supports the standard collection properties and methods: `Item`, `Count`, and `_NewEnum`. The use of the `Categories` property is the same as that for the `Question` object.",
                ].join("\n"),
            },
            {
                name: "CategoryType",
                returnType: createBuiltInDefPlaceHolder("CategoryTypes") ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.CategoryType: CategoryTypes",
                    "--------------------",
                    "A read-only property that returns the `CategoryType`. `CategoryTypes` specify a category as a single category or a category list."
                ].join("\n"),
            },
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Count: Long",
                    "--------------------",
                    "This is a read only property that returns the number of sub-categories.",
                    "",
                    "### Remarks",
                    "The `Count` is the total number of sub-categories of type `Category` or `CategoryList`. The `Count` property takes into account the effect of the filter and corresponds to the number of items in the collection that can be accessed using a numeric index. Note that all items in the collection can be indexed by name even if they have been filtered out.",
                ].join("\n"),
            },
            {
                name: "Factor",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Factor: Variant",
                    "--------------------",
                    "A read-only property that returns a factor value that can be used for tabulating the category."
                ].join("\n"),
            },
            {
                name: "FullName",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.FullName: String",
                    "--------------------",
                    "A read-only property that returns the full name of the `category`.",
                    "",
                    "### Remarks",
                    "If a category is defined as a sub-category of another `category` object, then the full name will not match the name. For example, if a `categories` were grouped into positive and negative *category* lists, the *category* names might be \"Good\" and \"Bad\", while the full names would be \"Positive.Good\" and \"Negative.Bad\".",
                    "NOTE: Look-up by name into the `categories` collection is based on the full name.",
                ].join("\n"),
            },
            {
                name: "Index",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Index: Long",
                    "--------------------",
                    "A read-only property that returns the 0-based index for the position of the *category* in its parent *category* list."
                ].join("\n"),
            },
            {
                name: "KeyCode",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.KeyCode: String",
                    "--------------------",
                    "This property returns the key code for the `category`."
                ].join("\n"),
            },
            {
                name: "Label",
                returnType: createBuiltInDefPlaceHolder("ILabel"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Label: ILabel",
                    "--------------------",
                    "This read-only property returns the label for the category.",
                    "",
                    "### Remarks",
                    "The *category* label that is returned is based on the *active language*, *context*, and *label type*. The category label can be modified, but any changes will not be written back into the MDM."
                ].join("\n"),
            },
            {
                name: "Name",
                returnType: BasicTypeDefinitions.string ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Name: String",
                    "--------------------",
                    "A read-only property that returns the name of the category."
                ].join("\n"),
            },
            {
                name: "OtherQuestion",
                returnType: createBuiltInDefPlaceHolder("IQuestion"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.OtherQuestion: IQuestion",
                    "--------------------",
                    "This property returns the *Other Specify* question.",
                    "",
                    "### Remarks",
                    "An error is returned if the category is not an *other specify* category."
                ].join("\n"),
            },
            {
                name: "Parent",
                returnType: createBuiltInDefPlaceHolder("ICategory"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Parent: ICategory",
                    "--------------------",
                    "A read-only property that returns the parent `category` if one exists.",
                    "",
                    "### Remarks",
                    "*NULL* is returned if the `category` does not have a parent."
                ].join("\n"),
            },
            {
                name: "Properties",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                definitionType: "property",
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                },
                note: [
                    "(property) ICategory.Properties: IProperties",
                    "--------------------",
                    "A read-only property that returns the properties for the `category`.",
                    "",
                    "### Remarks",
                    "The `category` properties are taken from the `element` properties in the MDM."
                ].join("\n"),
            },
            {
                name: "Style",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Style: IStyle",
                    "--------------------",
                    "This read/write property returns a `Style` object for the category.",
                    "",
                    "### Remarks",
                    "The `Style` object is used to override or reset the default presentation styles for the category.",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            },
            {
                name: "Value",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICategory.Value: Variant",
                    "--------------------",
                    "A read-only property that returns the *categorical* value of the `category`. (Default Property)",
                ].join("\n"),
            },
            {
                name: "Filter",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ICategory.Filter: Variant",
                    "--------------------",
                    "This property is used to get or set the categories filter.",
                    "",
                    "### Remarks",
                    "This property is only supported on `category` objects of `CategoryType` `ctCategoryList`. Refer to the `Categories` `Filter` property for a description of the how to apply a filter.",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: false,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                },
                note: [
                    "(property) ICategory.Item[Index: Variant]: Variant",
                    "--------------------",
                    "The `Item` property is used to return a sub-category. (Default Property)",
                    "",
                    "### Remarks",
                    "The `index` parameter on `Item` is optional. If the `index` is not specified, then the property gets the *category* value."
                ].join("\n"),
            },
            {
                name: "Order",
                returnType: createBuiltInDefPlaceHolder("OrderConstants") ,
                definitionType: "property",
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ICategory.Order: OrderConstants",
                    "--------------------",
                    "The order of the categories in the collection",
                    "",
                    "### Remarks",
                    "Setting the `order` property controls the sequence in which `Category` objects are returned by the `Item` property when using a numeric index and also by the `For-Each` enumerator.",
                    "This property is not supported in mrDataManager 1.0"
                ].join("\n"),
            }
        ]
    },
    {
        name: "IDataManagerLogging",
        definitionType: "interface",
        note: [
            "(interface) IDataManagerLogging",
            "-----------------------------",
            "A wrapper to the Logging component.",
        ].join("\n"),
        methods: [
            {
                name: "CreateGroupLog",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "method",
                note: [
                    "(method) IDataManagerLogging.CreateGroupLog(): Boolean",
                    "```",
                    "---------------------",
                    "Creates a public/group log file at the location designated by *m_Path* For full explanation of the parameters and their effect on logging please see the logging component documentation."
                ].join("\n"),
            },
            {
                name: "CreatePrivateLog",
                returnType: BasicTypeDefinitions.boolean ,
                definitionType: "method",
                note: [
                    "(method) IDataManagerLogging.CreatePrivateLog(): Boolean",
                    "```",
                    "---------------------",
                    "Creates a private log file at the location designated by *m_Path* For full explanation of the parameters and their effect on logging please see the logging component documentation."
                ].join("\n"),
            },
            {
                name: "LogError",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogError(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes an Error-level error message, to the log file.",
                ].join("\n")
            },
            {
                name: "LogError_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogError_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes an Error-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogFatal",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogFatal(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Fatal-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogFatal_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogFatal_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Fatal-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogInfo",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogInfo(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes an Info-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogInfo_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogInfo_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes an Info-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogMetric",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogMetric(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes an Metric-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogMetric_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogMetric_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Metric-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogScript",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogScript(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Script-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogScript_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogScript_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Script-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogTrace",
                definitionType: "method",
                arguments: [
                    {
                        name: "Id",
                        type: BasicTypeDefinitions.long,
                        optional: false
                    },
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogTrace(Id: Long, LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Trace-level error message, to the log file.",
                ].join("\n"),
            },
            {
                name: "LogTrace_2",
                definitionType: "method",
                arguments: [
                    {
                        name: "LogEntry",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDataManagerLogging.LogTrace_2(LogEntry: String): Void",
                    "```",
                    "---------------------",
                    "Writes a Trace-level error message, to the log file.",
                ].join("\n"),
            },
        ]
    },
    {
        name: "IDataManagerWeightEngines",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IDataManagerWeightEngines",
            "-----------------------------",
            "A collection object containing weightengine objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IDataManagerWeightEngines.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IWeightEngine"),
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IDataManagerWeightEngines.Item[Index: Variant]: ILabel",
                    "--------------------",
                    "Get the collection item at the specified location. (Default Property)"
                ].join("\n"),
            }
        ]
    },
    // Table document
    {
        name: "IDocument",
        definitionType: "interface",
        note: [
            "(interface) IDocument",
            "-----------------------------",
            "The **Table Object Model (TOM)** document is at the root of the object model and is the only object which is publicly creatable. The `Document` object represents a book of tables.",
        ].join("\n"),
        properties: [
            {
                name: "Axes",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxes"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IDocument.Axes[Index: Variant]: IAxes",
                    "--------------------",
                    "A collection of axis objects that can be reused on multiple tables.",
                    "",
                    "### Remarks",
                    "This is intended to be used as a 'toolbox' of reusable axis objects. Axis objects can be created and stored in this collection and then used on multiple tables. Note that when the axis is used, it is copied to each individual table. Therefore the axis on a particular table can be modified without affecting other tables that also used the same axis."
                ].join("\n"),
            },
            {
                name: "Coding",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICoding"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Coding: ICoding",
                    "--------------------",
                    "The `Coding` object includes methods that can be used to `categorize` and *band text*, *numeric*, and *date* variables in the TOM document.",
                ].join("\n"),
            },
            {
                name: "CreatedByVersion",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.CreatedByVersion: String",
                    "--------------------",
                    "Returns the version number of the `TOM.DLL` that created the `Document`.",
                ].join("\n"),
            },
            {
                name: "DataSet",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDataSet"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.DataSet: IDataSet",
                    "--------------------",
                    "The data set that this table document is based upon. The data set consists of metadata and associated case data.",
                ].join("\n"),
            },
            {
                name: "Default",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Default: ITableDefaults",
                    "--------------------",
                    "The `Default` property has various settings that are automatically copied to a new table",
                    "",
                    "### Remarks",
                    "The `IDocument.Default` property specifies the default settings for new `ttAggregated` tables (added via the `ITables.AddNew()` method).",
                    "The `IDocument.ProfileDefault` property specifies the default settings for new `ttProfile` tables."
                ].join("\n"),
            },
            {
                name: "Exports",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IExports"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Exports: IExports",
                    "--------------------",
                    "Collection of `Export` objects. `Exports` are used to publish the resulting tables in a variety of formats.",
                ].join("\n"),
            },
            {
                name: "Filters",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFilters"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Filters: IFilters",
                    "--------------------",
                    "A collection of table filters which may be set up in advance for use on tables.",
                    "",
                    "### Remarks",
                    "This is intended to be used as a 'toolbox' of reusable `filter` objects. `Filter` objects can be created and stored in this collection and then used on multiple tables. Note than when the filter is used, it is copied to each individual table. Therefore the filter on a particular table can be modified without affecting other tables that also used the same filter."
                ].join("\n"),
            },
            {
                name: "Global",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableGlobals"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Global: ITableGlobals",
                    "--------------------",
                    "The `TableGlobals` are various settings that are applied to all tables in the document. The settings are merged together with the per-table settings."
                ].join("\n"),
            },
            {
                name: "GroupedTables",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.GroupedTables: ITableListNode",
                    "--------------------",
                    "Tables arranged into groups",
                    "",
                    "### Remarks",
                    "The `IDocument.Tables` property is a flat collection of tables. The tables in that collection can be given a hierarchical arrangement using the `GroupedTables` property."
                ].join("\n"),
            },
            {
                name: "IsPopulating",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.IsPopulating: Boolean",
                    "--------------------",
                    "Returns *True* if the `Document` is currently populating."
                ].join("\n"),
            },
            {
                name: "LastUpdatedByVersion",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.LastUpdatedByVersion: String",
                    "--------------------",
                    "Returns the version number of the `TOM.DLL` that last updated the `Document`."
                ].join("\n"),
            },
            {
                name: "LicensedFeatures",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.LicensedFeatures: Long",
                    "--------------------",
                    "The features of the document for which a valid license exists.",
                    "",
                    "### Remarks",
                    "The `LicensedFeatures` property returns a binary 'OR' of `LicensableFeature` enumerated values. The `LicensableFeature` values that are set depends on the licenses that have been installed."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: BasicTypeDefinitions.null ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Parent: Null",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Document` object always returns *Null*"
                ].join("\n"),
            },
            {
                name: "PopulateProgress",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.PopulateProgress: Long",
                    "--------------------",
                    "Returns the percentage completion of the population run",
                    "",
                    "### Remarks",
                    "The `PopulateProgress` property can be used to indicate on a progress bar the percentage of completion of the current population run. Note that the `PopulateProgress` doesn't increase linearly with time as the population process consists of multiple stages and it's not possible to accurately calculate in advance how long each stage will take to complete."
                ].join("\n"),
            },
            {
                name: "PopulateStatus",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.PopulateStatus: String",
                    "--------------------",
                    "Returns a description of the current population status.",
                    "",
                    "### Remarks",
                    "The `PopulateStatus` is updated as the population run progresses."
                ].join("\n"),
            },
            {
                name: "ProfileDefault",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.ProfileDefault: ITableDefaults",
                    "--------------------",
                    "The `ProfileDefault` property has various setting that are automatically copied to a new profile table.",
                    "",
                    "### Remarks",
                    "The `IDocument.DefaultProfile` property specifies the default settings for new *ttProfile* tables (added via the `ITables.AddNewProfile()` method).",
                    "The `IDocument.Default` property specifies the default settings for new *ttAggregated* tables."
                ].join("\n"),
            },
            {
                name: "Properties",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Properties: IProperties",
                    "--------------------",
                    "A collection of user added Property objects relating to the document.",
                    "",
                    "### Remarks",
                    "The `IDocument.Properties` collection can be used to store user added properties relating to the table document. Any properties added will be saved and loaded as part of the table document but will not otherwise have any effect on TOM. The contents of the `IDocument.Properties` collection will be included in the Tables XML returned by `IDocument.GetTablesXml()` but not in the script returned by `IDocument.GenerateScript()`",
                    "",
                    "### Example",
                    "```ds",
                    "Dim DocCreator",
                    "",
                    "Set DocCreator = TableDoc.Properties.CreateProperty()",
                    "DocCreator.Name = \"DocumentCreator\"",
                    "DocCreator.Value = \"Sam Smith, Acme Research Limited\"",
                    "TableDoc.Properties.Add(DocCreator)",
                    "",
                    "Debug.Echo(\"Document Creator: \" + TableDoc.Properties.Item[\"DocCreator\"])",
                    "```",
                ].join("\n"),
            },
            {
                name: "Statistics",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistics"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Statistics: IStatistics",
                    "--------------------",
                    "A collection of Statistic objects that define statistical tests that are available for applying to tables.",
                    "",
                    "### Remarks",
                    "Chi-Square, column means, column proportions, paired preference, net difference, Tukey and Fisher Exact tests are currently available."
                ].join("\n"),
            },
            {
                name: "Tables",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITables"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.Tables: ITables",
                    "--------------------",
                    "This collection of tables contained in the document. This is the default property."
                ].join("\n"),
            },
            {
                name: "TOMVersion",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IDocument.TOMVersion: String",
                    "--------------------",
                    "Returns the version number of the `TOM.DLL`"
                ].join("\n"),
            },
            {
                name: "Context",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.Context: String",
                    "--------------------",
                    "The document context.",
                    "",
                    "### Remarks",
                    "The context set via this property becomes the current context for the data set (or more precisely, the MDM Document) that this table document is based on."
                ].join("\n"),
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.Description: String",
                    "--------------------",
                    "A user specified string that can be used to describe the contents of this table document."
                ].join("\n"),
            },
            {
                name: "ImageLocation",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.ImageLocation: String",
                    "--------------------",
                    "The location of the images referenced by the elements.",
                    "",
                    "### Remarks",
                    "If the `IStyle.Image` property doesn't refer to an absolute HTTP address then the ImageLocation property should be used to specify the location of the images. Any export that makes use of the `IStyle.Image` property will typically prefix relative image locations directly with the value of the `ImageLocation` property. For this reason, make sure the `ImageLocation` ends with a forwardslash or backslash as appropriate.",
                    "Typical values for this property might be:",
                    "+ An empty string if the images reside in the same location as the exported table document.",
                    "+ A local path, e.g. \"C:\\images\\\"",
                    "+ A URL to an HTTP server, e.g. \"HTTP://www.server.com/images/\"",
                ].join("\n"),
            },
            {
                name: "KeepLogFiles",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.KeepLogFiles: Boolean",
                    "--------------------",
                    "Keep the temporary files created during the call to IDocument.Populate",
                    "",
                    "### Remarks",
                    "If KeepLogFiles is False (the default value) then the temporary files created during the call to IDocument.Populate are deleted. Setting KeepLogFiles to True will stop the log files from being deleted. The temporary files and log files created are stored in the location specified by the IDocument.LogFilePath property."
                ].join("\n"),
            },
            {
                name: "LabelType",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.LabelType: String",
                    "--------------------",
                    "The document label type.",
                    "",
                    "### Remarks",
                    "The label type set via this property becomes the current label type for the data set (or more precisely, the MDM Document) that this table document is based on."
                ].join("\n"),
            },
            {
                name: "Language",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.Language: String",
                    "--------------------",
                    "The document language. The language can be the three-character language code (such as \"ENU\"), the language long name, which is the localized name of the language and the country where it is spoken, such as \"English (United States)\" or the XML-name.",
                    "",
                    "### Remarks",
                    "The language set via this property becomes the current language for the data set (or more precisely, the MDM Document) that this table document is based on."
                ].join("\n"),
            },
            {
                name: "LogFilePath",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.LogFilePath: String",
                    "--------------------",
                    "The location used to write temporary files and log files created when a table is populated.",
                    "",
                    "### Remarks",
                    "If a location is not specified for the `LogFilePath` property then the system temporary directory is used. The exact files produced and their content is undefined, but the information they contain is useful for Technical Support purposes. The files are normally discarded automatically unless `IDocument.KeepLogFiles` is set to *True*."
                ].join("\n"),
            },
            {
                name: "OpenOption",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("OpenOptions") ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.OpenOption: OpenOptions",
                    "--------------------",
                    "The options used when opening data sets."
                ].join("\n"),
            },
            {
                name: "OutputLocaleId",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.OutputLocaleId: Long",
                    "--------------------",
                    "Sets the locale id used for any error messages descriptions.",
                    "",
                    "### Remarks",
                    "This must be a valid locale id (LCID). Fallback mechanisms are used if the specified `OutputLocaleId` is not supported."
                ].join("\n"),
            },
            {
                name: "ProfileSpecialElements",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.ProfileSpecialElements: Boolean",
                    "--------------------",
                    "If set to *True*, special data elements, such as *Net* and *Base* elements, will be included in profile table results.",
                    "",
                    "### Remarks",
                    "The `ProfileSpecialElements` property is set to *False* by default, meaning that special data elements will not be included in profile tables"
                ].join("\n"),
            },
            {
                name: "RawStatisticsDataEnabled",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.RawStatisticsDataEnabled: Boolean",
                    "--------------------",
                    "Controls the generation of raw statistical data during execution of the Populate method.",
                    "",
                    "### Remarks",
                    "If `RawStatisticsDataEnabled` is set to *True* then raw statistical data is generated during execution of the `Populate` method and is able from the `RawStatisticsData` property. The default value for `RawStatisticsDataEnabled` is *False*."
                ].join("\n"),
            },
            {
                name: "SaveProfileResults",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IDocument.SaveProfileResults: Boolean",
                    "--------------------",
                    "If *True* the populated results for profile tables are included in saved `Table Document` files",
                    "",
                    "### Remarks",
                    "The `SaveProfileResults` property is *True* by default. Setting the property to *False* causes all profile tables to be saved as if they were unpopulated."
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IDocument.Clear(): Void",
                    "--------------------",
                    "Returns the `Document` to its initial state.",
                    "",
                    "### Remarks",
                    "The `Clear` method performs the following actions:",
                    "+ All tables are removed from the document",
                    "+ The `Axes` and `Filters` collections of the document are cleared",
                    "+ The `Statistics` collection of the document is restored to its initial state",
                    "+ The `Reset` method on the `TableDefaults` object is invoked to restore all default settings.",
                    "+ The `Clear` method on the `TableGlobals` object is invoked to remove all global settings.",
                    "+ The `DataSet` property of the `Document` is cleared, removing the reference to the metadata.",
                ].join("\n"),
            },
            {
                name: "GenerateScript",
                definitionType: "method",
                returnType: BasicTypeDefinitions.string ,
                arguments: [
                    {
                        name: "Tables",
                        type: BasicTypeDefinitions.variant,
                        optional: true,
                        note: "A list of tables to include in the generated script.",
                    },
                    {
                        name: "Type",
                        type: createBuiltInDefPlaceHolder("ScriptType"),
                        optional: true,
                        defaultValue: "stMRS",
                        note: "The type of script to generate. Currently only stMRS (mrScriptBasic) script is possible",
                    },
                    {
                        name: "Options",
                        type: BasicTypeDefinitions.variant,
                        optional: true,
                        note: "Reserved for future use",
                    }
                ],
                note: [
                    "(method) IDocument.GenerateScript([Tables: Variant], [Type: ScriptType], [Options: Variant]): String",
                    "--------------------",
                    "Generates a script representation of the table document.",
                    "",
                    "### Parameters",
                    "+ ***Tables*** - A list of tables to include in the generated script.",
                    "+ ***Type*** - The type of script to generate. Currently only *stMRS* (mrScriptBasic) script is possible",
                    "+ ***Options*** - Reserved for future use",
                    "",
                    "### Return Value",
                    "A string containing the script",
                    "",
                    "### Remarks",
                    "The script that is created by this method will create a new `Document` object, load the correct dataset, set up default and global settings, define the tables, populate them, and finally configure the exports and export the tables.",
                    "It is intended that this method will be invoked by a GUI that is using the `Table Object Model`. A user would use the GUI to define, populate, view, and export tables. The user could then select a 'View Script' option which would cause the GUI to invoke this method and return the resulting script to the user. The user could then modify the script in Professional and re-run it to automatically regenerate the tables. The script could also be run as a batch job via *mrScriptCL.exe*.",
                    "Note that for security reasons the `DataSet.Load` method will not include the full paths to the metadata and case data. If full paths were included then in a client server situation it would allow the user to see the full path to the data on the server. A comment will be included in the generated script if path information has been removed.",
                ].join("\n")
            },
            {
                name: "GetObjectFromID",
                definitionType: "method",
                returnType: BasicTypeDefinitions.object,
                arguments: [
                    {
                        name: "ID",
                        type: BasicTypeDefinitions.string,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDocument.GetObjectFromID(ID: String): Object",
                    "--------------------",
                    "Get the object corresponding to an object ID",
                    "",
                    "### Remarks",
                    "The ObjectID property on the IPersistObject interface on some of objects can be used to get an ID string for that object. This GetObjectFromID method can be used to retrieve the object corresponding to an object ID."
                ].join("\n")
            },
            {
                name: "GetTablesXml",
                definitionType: "method",
                returnType: BasicTypeDefinitions.string ,
                arguments: [
                    {
                        name: "Tables",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "A list of tables to include in the generated script. See the Tables parameter of IDocument.Populate for more information on the valid values for this parameter.",
                    },
                    {
                        name: "Options",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "xmlIncludeResults",
                        note: "A binary '`OR`' of `XmlOption` enumerated values which control the contents of the returned Tables XML"
                    }
                ],
                note: [
                    "(method) IDocument.GetTablesXml([Tables: Variant], [Options: Long = xmlIncludeResults]): String",
                    "--------------------",
                    "Generates an XML representation of the table document.",
                    "",
                    "### Parameters",
                    "+ ***Tables*** - A list of tables to include in the generated script.",
                    "+ ***Options*** - A binary '`OR`' of `XmlOption` enumerated values which control the contents of the returned `Tables` XML",
                    "",
                    "### Return Value",
                    "A string containing the `Tables` XML",
                ].join("\n"),
            },
            {
                name: "Open",
                definitionType: "method",
                arguments: [
                    {
                        name: "Source",
                        type: BasicTypeDefinitions.variant,
                        note: "Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                    },
                    {
                        name: "IncludeResults",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "1",
                        note: "If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the Open method slightly faster."
                    }
                ],
                note: [
                    "(method) IDocument.Open(Source: Variant, [IncludeResults: Boolean = 1]): String",
                    "--------------------",
                    "Opens a previously saved table document.",
                    "",
                    "### Parameters",
                    "+ ***Source*** - Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                    "+ ***IncludeResults*** - If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the `Open` method slightly faster.",
                    "",
                    "### Remarks",
                    "The `Open` method can \"open\" the table document from a file on disk or read it out of a previously loaded `XML DOM` document."
                ].join("\n"),
            },
            {
                name: "OpenWithDataSet",
                definitionType: "method",
                arguments: [
                    {
                        name: "Source",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "Either the name of a previously saved table document file or an XML DOM object into which a table document has already been loaded.",
                    },
                    {
                        name: "IncludeResults",
                        type: BasicTypeDefinitions.boolean,
                        optional: false,
                        note: "If the previously saved table document had been populated then it may contain cell values. If IncludeResults is False then these values will not be loaded with the rest of the document. This will make the call to the Open method slightly faster.",
                    },
                    {
                        name: "MetaData",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "The location of the metadata to use. The format of this string depends on the MDSC, but is typically a location of an .MDD or some other type of file. This can also be an existing MDM document object.",
                    },
                    {
                        name: "MDSC",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The metadata DSC to use e.g. *mrQvDsc*, or empty if no MDSC is required",
                    },
                    {
                        name: "DbLocation",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The location of the case data to use. The format of this string depends on the CDSC",
                    },
                    {
                        name: "CDSC",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The case data dsc to use e.g. *mrQdiDrsDsc*",
                    },
                    {
                        name: "Project",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The project name to use if the CDSC supports multiple projects. Otherwise this parameter is ignored.",
                    },
                    {
                        name: "Version",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "{..}",
                        note: "A version specified for the metadata to use. The default specification string is \"{..}\" (the 'SuperVersion') which means to use all locked versions in the metadata.",
                    },
                ],
                note: [
                    "(method) IDocument.OpenWithDataSet(Source: Variant, [IncludeResults: Boolean = 1], MetaData: Variant, [MDSC: String = \"\"], [DbLocation: String = \"\"], [CDSC: String = \"\"], [Project: String = \"\"], [Version: String = {..}]): String",
                    "--------------------",
                    "Opens a previously saved table document with the specified metadata and case data.",
                    "",
                    "### Parameters",
                    "+ ***Source*** - Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                    "+ ***IncludeResults*** - If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the `Open` method slightly faster.",
                    "+ ***MetaData*** - The location of the metadata to use. The format of this string depends on the `MDSC`, but is typically a location of an *.MDD* or some other type of file. This can also be an existing MDM document object.",
                    "+ ***MDSC*** - The metadata DSC to use e.g. *mrQvDsc*, or empty if no `MDSC` is required",
                    "+ ***DbLocation*** - The location of the case data to use. The format of this string depends on the `CDSC`",
                    "+ ***CDSC*** - The case data dsc to use e.g. *mrQdiDrsDsc*",
                    "+ ***Project*** - The project name to use if the `CDSC` supports multiple projects. Otherwise this parameter is ignored.",
                    "+ ***Version*** - A version specified for the metadata to use. The default specification string is \"{..}\" (the 'SuperVersion') which means to use all locked versions in the metadata.",
                    "",
                    "### Remarks",
                    "The `IDocument.Open` method automatically reloads the metadata that is specified in the saved table document. The `IDocument.OpenWithDataSet` method is used to override the metadata and case data information that is stored in the saved table document. If this method is used any information about the metadata and case data stored in the saved file is ignored. `IDocument.OpenWithDataSet` is typically used if the location of the metadata has changed since the document was last saved."
                ].join("\n"),
            },
            {
                name: "Populate",
                definitionType: "method",
                returnType: BasicTypeDefinitions.boolean ,
                arguments: [
                    {
                        name: "Tables",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: [
                            "A list of tables to populate. If this parameter is not specified, then all tables in the document are populated. ",
                            "    - An empty string means populate no tables (the method call does nothing)",
                            "    - A value of \"*\" means populate all tables",
                            "    - A string containing the name of a single table populates just that table",
                            "    - A comma separated list of table names will populate all tables in the list",
                            "    - An array of table names will populate all tables specified in the array",
                        ].join("\n"),
                    }
                ],
                note: [
                    "(method) IDocument.Populate(Tables: Variant): Boolean",
                    "--------------------",
                    "Populates the `CellValues` of the required document tables.Return *True* if all tables are populated successfully; return *False* if any of the tables fail during population.",
                    "",
                    "### Parameters",
                    "+ ***Tables*** - A list of tables to populate. If this parameter is not specified, then all tables in the document are populated. A restricted set of tables can be specified using any of the following techniques:",
                    "    - An empty string means populate no tables (the method call does nothing)",
                    "    - A value of \"*\" means populate all tables",
                    "    - A string containing the name of a single table populates just that table",
                    "    - A comma separated list of table names will populate all tables in the list",
                    "    - An array of table names will populate all tables specified in the array",
                    "",
                    "### Return Value",
                    "Return *True* if all tables are populated successfully; return *False* if any of the tables fail during population.",
                ].join("\n"),
            },
            {
                name: "PopulateBegin",
                definitionType: "method",
                arguments: [
                    {
                        name: "Tables",
                        type: BasicTypeDefinitions.variant,
                        optional: false
                    }
                ],
                note: [
                    "(method) IDocument.PopulateBegin(Tables: Variant): Void",
                    "--------------------",
                    "Begin an asynchronous population run",
                    "",
                    "### Return Value",
                    "The `PopulateBegin()` method is identical to the `Populate()` method except that it is asynchronous. This means that the `PopulateBegin()` method returns immediately and the population will occur in the background.",
                    "No method or property of the object model should be accessed while population is occurring, other than the `PopulateCancel()` method and the PopulateStatus, PopulateProgress, and IsPopulating properties.",
                    "If `PopulateBegin()` is used the `OnPopulateError` event should be used to monitor for errors that occur during population. The end of population can be detected by either polling the `IsPopulating` property or waiting for the `OnPopulateComplete` event.",
                ].join("\n"),
            },
            {
                name: "PopulateCancel",
                definitionType: "method",
                note: [
                    "(method) IDocument.PopulateCancel(): Void",
                    "--------------------",
                    "Cancel an existing population started via `Populate()` or `PopulateBegin()`"
                ].join("\n"),
            },
            {
                name: "RefreshFromMetadata",
                definitionType: "method",
                arguments: [
                    {
                        name: "ForceRefresh",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "0"
                    }
                ],
                note: [
                    "(method) IDocument.RefreshFromMetadata([ForceRefresh: Boolean = 0]): Void",
                    "--------------------",
                    "Updates all axes in all tables from the metadata if `UseMetadataDefinition` is *True*",
                    "",
                    "### Remarks",
                    "The `RefreshFromMetadata` method updates axes which have the `UseMetadataDefinition` property set to True based on the current definition in the metadata. This is useful if the metadata has changed since the tables in the document were defined.",
                    "The axes are automatically refresh from the metadata definition when the table is populated.",
                    "It is assumed the metadata will not be modified while the table document is open. The `Axis` objects track when they have been synchronized with metadata and will not refresh if they are up to date. If the metadata does change while the table document is open the `ForceRefresh` parameter can be used to force the axis to refresh itself.",
                ].join("\n"),
            },
            {
                name: "Save",
                definitionType: "method",
                arguments: [
                    {
                        name: "Destination",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "Either the name of a file to save the table document to, or an empty `XML DOM` object. If a file name is specified, and the file already exists, then it is overwritten without warning.",
                    },
                    {
                        name: "IncludeResults",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "1",
                        note: "If the parameter is *False*, then the cell values for all tables are not saved. This makes the call to the `Save` method slightly faster and the resulting document smaller.",
                    }
                ],
                note: [
                    "(method) IDocument.Save(Destination: Variant, [IncludeResults: Boolean = 1]): Void",
                    "--------------------",
                    "Saves the table document to the specified location.",
                    "",
                    "### Parameters",
                    "+ ***Destination*** - Either the name of a file to save the table document to, or an empty `XML DOM` object. If a file name is specified, and the file already exists, then it is overwritten without warning.",
                    "+ ***IncludeResults*** - If the parameter is *False*, then the cell values for all tables are not saved. This makes the call to the `Save` method slightly faster and the resulting document smaller.",
                    "",
                    "### Remarks",
                    "The Save method can \"save\" the table document to either a file on disk or to an in-memory `XML DOM`.",
                    "The cell values for profile tables are not saved if `IDocument.SaveProfileResults` is *False*, even if the `IncludeResults` parameter of the `Save()` method is *True*."
                ].join("\n"),
            },
            {
                name: "SaveWithoutDataSet",
                definitionType: "method",
                arguments: [
                    {
                        name: "Destination",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                    },
                    {
                        name: "IncludeResults",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "1"
                    }
                ],
                note: [
                    "(method) IDocument.SaveWithoutDataSet(Destination: Variant, [IncludeResults: Boolean = 1]): Void",
                    "--------------------",
                    "Saves the table document without any dataset information.",
                    "",
                    "### Remarks",
                    "The `SaveWithoutDataSet()` method is similar to the `Save()` method except that it doesn't save any information on the dataset (i.e. metadata or case data). The file can only be opened again using the `OpenWithDataSet()` method. Attempting to open a file that doesn't contain dataset information using the `Open()` method will cause an error.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "ITables",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ITables",
            "-----------------------------",
            "A collection of Table objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                returnType: BasicTypeDefinitions.long ,
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITables.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                returnType: BasicTypeDefinitions.variant ,
                definitionType: "property",
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                },
                note: [
                    "(property) ITables.Item[Index: Variant]: Variant",
                    "--------------------",
                    "Returns the specified `Table` in the collection. This is the default property.",
                ].join("\n"),
            },
            {
                name: "Parent",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                definitionType: "property",
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITables.Parent: IDocument",
                    "--------------------",
                    "The parent object"
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Add",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                definitionType: "method",
                arguments: [
                    {
                        name: "Table",
                        type: createBuiltInDefPlaceHolder("ITable"),
                        optional: false,
                        note: "A previously created `ITable` object",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the table.",
                    }
                ],
                note: [
                    "(method) ITables.Add(Table: ITable, [Index: Long = -1]): ITable",
                    "--------------------",
                    "Adds an existing Table object into the `Tables` collection.",
                    "",
                    "### Remarks",
                    "The `Table` object must have previously been created for this `Document`. The purpose of this method is to allow the Table objects in the collection to be reordered. This can be achieved using the following example code.",
                    "",
                    "### Example",
                    "```ds",
                    "Set TheTable = TableDoc.Tables[\"MyTable1\"]",
                    "TableDoc.Tables.Remove(\"MyTable1\")",
                    "TableDoc.Tables.Add(TheTable, 42)",
                    "```",
                ].join("\n")
            },
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        note: "The name used to reference the table in the collection",
                    },
                    {
                        name: "Specification",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The table specification string. An empty table may be created by using an empty string for the specification (this is the default value)",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "An optional description for the table, e.g. \"Table of age against gender\". This is can be used as an annotation on the resulting table.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the table. The new table is inserted at the specified integer position. The index of the table that is currently at that position and all following tables is increased by one. If the index is not specified, or is specified as -1, then the table is appended to the end of the collection.",
                    },
                ],
                note: [
                    "(method) ITables.AddNew(Name: String, [Specification: String = \"\"], [Description: String = \"\"], [Index: Long = -1]): ITable",
                    "--------------------",
                    "Creates a new Table object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "The new table created is based on the supplied specification string, which has the form \"[SideAxis] * [TopAxis] * [LayerAxis]\". For more information, see Table Specification Syntax. The AddNew() method is used to added tables of type 'ttAggregated'. When populated the table contains the aggregated counts of the answers that the respondents gave, and also possibly other values derived from those counts (e.g. column percentages based on the counts).",
                    "",
                    "### Example",
                    "1. \"gender\" nested within \"age\" on the side and \"cost\" on the top axis.",
                    "```ds",
                    "TableDoc.Tables.AddNew(\"Table1\", \"age > gender * cost\")",
                    "```",
                    "2. Using the axis objects called \"brandlist\" and \"demogs\" that exist within the Document.Axes collection",
                    "```ds",
                    "TableDoc.Tables.AddNew(\"Table2\", \"axis(brandlist) * axis(demogs)\")",
                    "```",
                    "3. No side axis and a top axis based on the \"cost\" variable",
                    "```ds",
                    "TableDoc.Tables.AddNew(\"Table3\", \" * cost\")",
                    "```",
                ].join("\n")
            },
            {
                name: "AddNewGrid",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        note: "The name used to reference the table in the collection",
                    },
                    {
                        name: "Field",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        note: "The name of an MDM grid or array field tabulate.",
                    },
                    {
                        name: "Orientation",
                        type: createBuiltInDefPlaceHolder("DisplayOrientation"),
                        optional: true,
                        defaultValue: "doDefault",
                        note: "The display orientation of the table. This controls whether the iterations of the grid or array appear on the side or top axis of the table (corresponding to the rows and columns respectively)",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "An optional description for the table, e.g. \"Table of interest rating of exhibits\". This is can be used as an annotation on the resulting table.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the table. See the `ITables.AddNew` method for more information on the `Index` parameter. The default is for the table to be appended to the end of the collection.",
                    },
                ],
                note: [
                    "(method) ITables.AddNewGrid(Name: String, Field: String, [Orientation: DisplayOrientation = doDefault], [Description: String = \"\"], [Index: Long = -1]): ITable",
                    "--------------------",
                    "Constructs a new Table object from a grid or an array and adds it into the `Tables` collection.",
                    "",
                    "### Parameters",
                    "",
                    "+ ***Name*** - The name used to reference the table in the collection",
                    "+ ***Field*** - The name of an MDM grid or array field tabulate.",
                    "+ ***Orientation*** - The display orientation of the table. This controls whether the iterations of the grid or array appear on the side or top axis of the table (corresponding to the rows and columns respectively)",
                    "+ ***Description*** - An optional description for the table, e.g. \"Table of interest rating of exhibits\". This is can be used as an annotation on the resulting table.",
                    "+ ***Index*** - The position in the collection to insert the table. See the `ITables.AddNew` method for more information on the `Index` parameter. The default is for the table to be appended to the end of the collection.",
                    "",
                    "### Remarks",
                    "The `AddNewGrid` method is a specialized form of the `AddNew` method for creating a table directly from a grid or an array field.",
                    "The `Field` and `Orientation` parameters are used to create an equivalent table specification string. This corresponds to the field tabulated against all child variables of that field.",
                    "The aggregation level (the Level property) of the newly added table is set to the same level as the field.",
                    "The `AddNewGrid` method is only valid if the `IDataSet.View` property is set to *dvHDATA*.",
                    "",
                    "### Example",
                    "```ds",
                    "AddNewGrid(\"RatingTable\", \"rating\")",
                    "' will be converted to (assuming the display orientation is doRow)",
                    "AddNew(\"RatingTable\", \"rating * rating.column\")",
                    "```",
                ].join("\n"),
            },
            {
                name: "AddNewProfile",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                        note: "The name used to reference the table in the collection",
                    },
                    {
                        name: "Specification",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The profile table specification string. An empty table may be created by using an empty string for the specification (this is the default value)",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "An optional description for the table, e.g. \"User's comments\". This is can be used as an annotation on the resulting table.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the table. The new table is inserted at the specified integer position. The index of the table that is currently at that position and all following tables is increased by one. If the index is not specified, or is specified as -1, then the table is appended to the end of the collection.",
                    }
                ],
                note: [
                    "(method) ITables.AddNewProfile(Name: String, [Specification: String = \"\"], [Description: String = \"\"], [Index: Long = -1]): ITable",
                    "--------------------",
                    "Creates a new profile `Table` object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "The new table created is based on the supplied specification string. For more information, see Working with `Profile Tables`. Tables added using the `AddNewProfile()` method have a type of *ttProfile*. Each row in the table corresponds to a response in the case data. The top axis of the table is used to define the variables in the metadata that should be profiles. Profile tables are most useful for viewing the open ended responses given for text questions but any variable type can be included in a profile table.",
                    "",
                    "### Example",
                    "```ds",
                    "TableDoc.Tables.AddNewProfile(\"Table1\", \"profile({device, likesmost, likesleast})\")",
                    "```",
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ITables.Clear(): Void",
                    "--------------------",
                    "Removes all Table objects from the collection."
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "A reference to the table to be removed. This is either the integer position of the table in the collection or the name of the table."
                    }
                ],
                note: [
                    "(method) ITables.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes a Table from the Tables collection.",
                ].join("\n")
            }
        ]
    },
    {
        name: "ITable",
        definitionType: "interface",
        note: [
            "(interface) ITable",
            "-----------------------------",
            "The Table object defines the structure of a table in terms of `Axes`, as well as a variety of other settings. The `Axes` objects define the dimensions while CellItems define the contents of the cells.",
            "",
            "### Remarks",
            "Only the 'Side' and 'Top' axes are currently supported. 'Layer' axes may be added in the future.",
        ].join("\n"),
        properties: [
            {
                name: "Annotations",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAnnotations"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Annotations: IAnnotations",
                    "--------------------",
                    "A collection of `Annotation` objects that define additional information to be shown outside the main body of the table (for example, headings and footnotes)."
                ].join("\n"),
            },
            {
                name: "AvailableLevels",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("Variant", "default", false, { dimensions: 1 }),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                },
                note: [
                    "(property) ITable.AvailableLevels: Variant[]",
                    "--------------------",
                    "A list of levels that the table can be aggregated at.",
                    "",
                    "### Remarks",
                    "If the `IDataSet.View` property is set to *dvHDATA* then it is possible to set the level at which data processing occurs. This property is an array of level names that are able to be used as the value for the Level property. The list of available levels depends on the variables that are currently being used on the table.",
                ].join("\n"),
            },
            {
                name: "Axes",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxes"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Axes: IAxes",
                    "--------------------",
                    "A collection of `Axis` objects that define the structure of the table.",
                    "",
                    "### Remarks",
                    "The `axes` collection will typically contain 'Side' and 'Top' axis objects, with additional axis objects describing the layers of the table. Note that layers are not currently supported. The table will initially contain any axes that were specified in the Specification string when the table was created.",
                    "",
                    "### Example",
                    "The side axis of a table can be accessed using any of the following techniques",
                    "```ds",
                    "Set SideAxis = MyTable.Axes.Item[\"side\"]",
                    "Set SideAxis = MyTable.Axes[\"side\"]",
                    "Set SideAxis = MyTable[\"side\"]",
                    "Set SideAxis = MyTable[axSide]",
                    "```",
                ].join("\n"),
            },
            {
                name: "Base",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Base: Long",
                    "--------------------",
                    "The numeric 'Base' value for the table.",
                    "",
                    "### Remarks",
                    "If the table base cannot be determined or its value exceeds the maximum of long, which is between -2,147,483,648 and 2,147,483,647, then -1 is returned.",
                ].join("\n"),
            },
            {
                name: "CellItems",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellItems"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.CellItems: ICellItems",
                    "--------------------",
                    "A collection of `CellItem` objects that define the cell contents for the table.",
                    "",
                    "### Remarks",
                    "In terms of the resulting table, the axis and element objects basically describe what is shown along the top and side of the table, while the cell items control what is shown in each cell in the body of the table. For aggregated tables this is a count and column percentage by default but can be a number of more complex values derived from the counts (e.g. a mean, min, max, or standard deviation). For a profile table the cell item is simply `itProfileResult` which is the response from the case data. Note that the `CellItems` property of a profile table can not be modified to add additional cell items."
                ].join("\n"),
            },
            {
                name: "DatePopulated",
                definitionType: "property",
                returnType: BasicTypeDefinitions.date ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.DatePopulated: Date",
                    "--------------------",
                    "The date when the table was last populated.",
                    "",
                    "### Remarks",
                    "If the table is not currently populated (e.g. if `IDocument.Populate` has not been called or the table has since been modified) then the date *01/01/100* is returned.",
                ].join("\n"),
            },
            {
                name: "DefaultLevel",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.DefaultLevel: String",
                    "--------------------",
                    "The default aggregation level for a table containing hierarchical data",
                    "",
                    "### Remarks",
                    "The default aggregation level is the lowest available level that is not a grid/loop slice or below a grid/loop slice. The `ITable.Level` property will be set to `ITable.DefaultLevel` if `ITable.UseDefaultLevel` is set to *True*.",
                ].join("\n"),
            },
            {
                name: "Filters",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFilters"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Filters: IFilters",
                    "--------------------",
                    "A collection of `Filter` objects that are applied to the case data that the table is based on when the table is populated."
                ].join("\n"),
            },
            {
                name: "IsEmpty",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsEmpty: Boolean",
                    "--------------------",
                    "Returns *True* if the `Axes` collection is empty for this table, i.e. If the table doesn't have any *Top*, *Side*, or *Layer* axis."
                ].join("\n"),
            },
            {
                name: "IsEmptySide",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsEmptySide: Boolean",
                    "--------------------",
                    "Returns *True* if no 'Side' axis exists in the `Axes` collection of this table.",
                ].join("\n")
            },
            {
                name: "IsEmptyTop",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsEmptySide: Boolean",
                    "--------------------",
                    "Returns *True* if no 'Top' axis exists in the `Axes` collection of this table.",
                ].join("\n"),
            },
            {
                name: "IsLevelValid",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsLevelValid: Boolean",
                    "--------------------",
                    "*True* if the `ITable.Level` property is valid",
                    "",
                    "### Remarks",
                    "If the `ITable.UseDefaultLevel` property is True then the `ITable.IsLevelValid` will be True, unless there are no available levels for the table.",
                    "It is only possible to set the `ITable.Level` property to an available level for the table, however it is possible to modify the table after setting the level so that the level set is no longer an available level for the table. In this situation the `ITable.IsLevelValid` will return *False*.",
                ].join("\n"),
            },
            {
                name: "IsPopulated",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsPopulated: Boolean",
                    "--------------------",
                    "Returns *True* if the table has been populated (i.e. `ITable.CellValues` is not 'null').",
                    "",
                    "### Remarks",
                    "Changing the object model in any way such that the cell values no longer match the object model will cause the `ITables.CellValues` property to be set to 'null' and the `IsPopulated` property to become *False*.",
                ].join("\n"),
            },
            {
                name: "IsValid",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsValid: Boolean",
                    "--------------------",
                    "*True* if the table is valid.",
                    "",
                    "### Remarks",
                    "`IsValid` is *True* if all the MDM objects required by the table exist in the metadata. It's possible for a table to become invalid when opening an old table document that uses objects that have been deleted from the metadata. Tables where IsValid is False are ignored when populating the table document.",
                    "+ The `IsValid` property takes into account the following:",
                    "+ The MDM objects that the axes of the table are based upon.",
                    "+ The MDM elements that the elements of the table are based upon.",
                    "+ The numeric variables used by elements (For example, *eMean* or *eNumeric* elements).",
                    "+ The numeric variables used by per-table and global cell items.",
                    "+ The MDM arrays and grids used as the filter level for per-table and global filters.",
                    "+ The numeric weighting variable.",
                    "`IsValid` doesn't currently check the `Expression` property of filters and element. It's therefore possible for an expression to reference an MDM object that has been deleted and for `IsValid` to still return *True*. `Expressions` that refer to an MDM object that doesn't exist will generate an error when the document is populated.",
                    "The `IsValid` property will not immediately become *False* after an MDM object is deleted. This is because TOM caches copies of MDM objects that it's using. `IsValid` will normally be become *False* when the table document is saved then reopened.",
                ].join("\n"),
            },
            {
                name: "IsWeighted",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.IsWeighted: Boolean",
                    "--------------------",
                    "*True* if a weight variable has been specified for the `Weight` property",
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Name: String",
                    "--------------------",
                    "The name used to reference the table in the `Tables` collection."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITables"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Parent: ITables",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Table` object always returns the `Tables` collection",
                ].join("\n")
            },
            {
                name: "Properties",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Properties: IProperties",
                    "--------------------",
                    "A collection of Property objects that define additional configuration information about the table.",
                ].join("\n")
            },
            {
                name: "Rules",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IRules"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Rules: IRules",
                    "--------------------",
                    "A collection of `Rule` objects that are applied to the values in the table when it is populated.",
                ].join("\n")
            },
            {
                name: "Statistics",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistics"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Statistics: IStatistics",
                    "--------------------",
                    "A collection of `Statistic` objects that define statistical tests to be calculated for the table.",
                ].join("\n")
            },
            {
                name: "Type",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("TableType") ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ITable.Type: TableType",
                    "--------------------",
                    "The `Type` of table (either *ttAggregated* or *ttProfile*)",
                ].join("\n")
            },
            {
                name: "CellValues",
                definitionType: "property",
                returnType: BasicTypeDefinitions.object,
                readonly: false,
                isCollection: true,
                index: {
                    name: "Layer",
                    type: BasicTypeDefinitions.variant,
                    defaultValue: 0,
                },
                note: [
                    "(property) ITable.CellValues[[Layer: Variant = 0]]: Object",
                    "--------------------",
                    "The values of the cells of the table",
                    "",
                    "### Remarks",
                    "The contents (values) of a populated table are stored in an ADO recordset.",
                    "Changing the object model in any way such that the cell values no longer match the object model will cause the `CellValues` to be cleared. For example:",
                    "    + Adding a new `CellItem` object to the `ITable.CellItems` collection will cause the `CellValues` to no longer match the `CellItems` and so the `CellValues` will be cleared.",
                    "    + Modifying the `Expression` property of any filter applied to the table will potentially change the values in the table and so the `CellValues` will be cleared.",
                    "Note:	In scripting languages, this property can be used only for read access.",
                ].join("\n")
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.Description: String",
                    "--------------------",
                    "A description or title for the table, e.g. \"Table of age by gender\".",
                    "",
                    "### Remarks",
                    "This is typically used for the table title annotation when the table is exported.",
                ].join("\n")
            },
            {
                name: "Level",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.Level: String",
                    "--------------------",
                    "The level at which to aggregate a table containing hierarchical data.",
                    "",
                    "### Remarks",
                    "If the `IDataSet.View` property is set to *dvHDATA* then it is possible to set the level at which data processing occurs. This property must be set to one of the levels listed in the `AvailableLevels` property. The available levels are determined by the levels of the variables being tabulated, the levels of the filter(s), and the level of the weight variable applied to the table.",
                    "By default, the `Level` property is set to the level of the lowest level variable on the table that is not a grid/loop slice or below a grid/loop slice and UseDefaultLevel will be True. Setting the `Level` property will fix the level at the specified value and cause `UseDefaultLevel` to become False.",
                ].join("\n")
            },
            {
                name: "PopulateError",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.PopulateError: String",
                    "--------------------",
                    "The error message when populating the table.",
                    "",
                    "### Remarks",
                    "This property is reset every time the table is populated. An error occurred during population when this property is not empty (the output may not be valid)."
                ].join("\n")
            },
            {
                name: "SortColumn",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.SortColumn: String",
                    "--------------------",
                    "Controls sorting of rows by specifying the column to sort on and the order in which to sort.",
                    "",
                    "### Remarks",
                    "The `SortColumn` property returns a `SortSpecification` object which can be used to specify the column to sort on and the order in which to sort the values. ",
                    "Because the default property of the `ISortSpecfication` object is the `ElementRef` of the element to sort on, the sort column can be specified as shown in the following examples (i.e. the `ElementRef` property can be omitted because it is the default).",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.SortColumn = \"\"",
                    "Table.SortColumn = \"Base\"",
                    "Table.SortColumn = \"Education{Base}\"",
                    "Table.SortColumn = \"Education{Yes}>Gender{Female}\"",
                    "```",
                ].join("\n")
            },
            {
                name: "SortRow",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.SortRow: String",
                    "--------------------",
                    "Controls sorting of columns by specifying the row to sort on and the order in which to sort.",
                    "",
                    "### Remarks",
                    "The `SortRow` property returns a `SortSpecification` object which can be used to specify the row to sort on and the order in which to sort the values. ",
                    "The is not possible to sort the columns of a profile table by specifying a `SortRow`.",
                    "Because the default property of the `ISortSpecfication` object is the `ElementRef` of the element to sort on, the sort row can be specified as shown in the following examples (i.e. the `ElementRef` property can be omitted because it is the default).",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.SortRow = \"\"",
                    "Table.SortRow = \"Base\"",
                    "Table.SortRow = \"Age{Base}\"",
                    "Table.SortRow = \"Age{E1116_years}>Gender{Female}\"",
                    "```",
                ].join("\n")
            },
            {
                name: "Specification",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.Specification: String",
                    "--------------------",
                    "The table specification string that defines the structure of the table.",
                    "",
                    "### Remarks",
                    "This is initially the `specification` string that was used when the table was initially created. If the structure (axes and elements) of the table is modified using the methods of the object model (for example, `IAxis.Nest`, `IAxis.Concatenate`, `IAxis.Elements.AddNew`) then the `specification` string will update to reflect the current structure of the table.",
                    "If this `specification` string is modified then all existing axis objects in the `Axes` collection are removed and then recreated according to the new specification.",
                    "To keep the `specification` string compact, the elements are not shown if all the elements of a variable are present in the axis (e.g. \"age\"), but if it differs in any way then the full list of elements is shown.",
                    "",
                    "### Examples",
                    "```ds",
                    "age{E1116_years, E1721_years, meanage mean(age)} * gender",
                    "```",
                ].join("\n")
            },
            {
                name: "UseDefaultLevel",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.UseDefaultLevel: Boolean",
                    "--------------------",
                    "Causes the `ITable.Level` property to be set to the default aggregation level",
                    "",
                    "### Remarks",
                    "The `UseDefaultLevel` property is set to True by default and the `ITable.Level` property will return the default aggregation level. If `UseDefaultLevel` is set to False then the Level will become fixed at the current default level. If a specific level is specified for the `ITable.Level` property then `UseDefaultLevel` is automatically set to False.",
                ].join("\n")
            },
            {
                name: "Weight",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) ITable.Weight: String",
                    "--------------------",
                    "Sets the name of the weight variable to be used for the table.",
                    "",
                    "### Remarks",
                    "The table is considered to be weighted only if this property has been set. When a table is initially created the value of this property will be copied from the `IDocument.Default.Weight` property. A weighted table can be unweighted by clearing this property.",
                    "The `Weight` property is only applicable to tables of type *ttAggregated* and can not be set for a profile table."
                ].join("\n")
            },
        ],
        methods: [
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ITable.Clear(): Void",
                    "--------------------",
                    "Clears the table",
                    "",
                    "### Remarks",
                    "A table is \"cleared\" by performing the following actions:",
                    "+ Clearing the `Axes`, `CellItems`, `Properties`, `Rules`, `Filters`, `Statistics`, and `Annotations` collections.",
                    "+ Clearing the CellValues",
                    "+ Restoring all properties to their default values as defined by the `IDocument.Default` property (or `IDocument.ProfileDefault` in the case of a profile table).",
                ].join("\n")
            },
            {
                name: "IsStatisticValid",
                definitionType: "method",
                returnType: BasicTypeDefinitions.boolean ,
                arguments: [
                    {
                        name: "StatisticName",
                        type: BasicTypeDefinitions.string,
                        optional: false,
                    }
                ],
                note: [
                    "(method) ITable.IsStatisticValid(StatisticName: String): Boolean",
                    "```",
                    "-----------------",
                    "Returns *True* if the specified statistical test is valid for this table.",
                    "",
                    "### Remarks",
                    "There are a number of reasons why a statistic may become invalid for a particular table. These are described in About Statistical Tests."
                ].join("\n"),
            },
            {
                name: "RefreshFromMetadata",
                definitionType: "method",
                arguments: [
                    {
                        name: "ForceRefresh",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "0"
                    }
                ],
                note: [
                    "(method) RefreshFromMetadata([ForceRefresh: Boolean = 0]): Boolean",
                    "```",
                    "-----------------",
                    "Updates all axes in the table from the metadata if `UseMetadataDefinition` is *True*",
                    "",
                    "### Remarks",
                    "The `RefreshFromMetadata` method updates axes which have the `UseMetadataDefinition` property set to True based on the current definition in the metadata. This is useful if the metadata has changed since the table was defined.",
                    "The axes are automatically refresh from the metadata definition when the table is populated.",
                    "It is assumed the metadata will not be modified while the table document is open. The `Axis` objects track when they have been synchronized with metadata and will not refresh if they are up to date. If the metadata does change while the table document is open the `ForceRefresh` parameter can be used to force the axis to refresh itself.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IAxes",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IAxes",
            "-----------------------------",
            "A collection of Axis objects. Each Axis object is used to describe the content of the side, the top, or a layer of a table.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) IAxes.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IAxes.Item[Index: Variant]: IAxis",
                    "--------------------",
                    "Returns a specified item in the collection.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxes.Parent: ITable | ITableDefaults | IDocument | IAxis",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The Parent property of the `Axes` object will return either the parent `Axis`, or `Table`, `TableDefaults`, or `Document` object"
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "Either a string name used to reference the axis or an `AxisType` enumerated value. The enumerated values map to the corresponding string equivalent, i.e. \"Side\" and axSide can be used interchangeably.",
                    },
                    {
                        name: "Axis",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "The name of an `Axis` object that exists in the `IDocument.Axes` collection.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the axis."
                    },
                ],
                note: [
                    "(method) IAxes.Add(Name: Variant, Axis: Variant, [Index: Long = -1]): IAxis",
                    "--------------------",
                    "Add a copy of an existing Axis object to the Axes collection.",
                    "",
                    "### Remarks",
                    "The `IDocument.Axes` collection holds pre-constructed `Axis` objects that can be re-used on multiple tables. The `Add` method adds one of those `Axis` objects to this collection. A copy is made of the `Axis` object that exists in the `IDocument.Axes` collection. This way the individual `Axis` objects on each table and the original `Axis` in the `IDocument.Axes` collection can be modified independently.",
                    "",
                    "### Examples",
                    "```ds",
                    "TableDoc.Axes.AddNew(\"MyAgeAxis\")",
                    "TableDoc.Axes.MyAgeAxis.Specification = \"age{E1116_years..E4554_years}\"",
                    "TableDoc.Axes.AddNew(\"MyGenderAxis\")",
                    "TableDoc.Axes.MyGenderAxis.Specification = \"gender{Male, Female}\"",
                    "",
                    "Set Table = TableDoc.Tables.AddNew(\"Table1\")",
                    "Table.Axes.Add(\"Side\", \"MyAgeAxis\")",
                    "Table.Axes.Add(\"Top\", \"MyGenderAxis\")",
                    "```",
                ].join("\n"),
            },
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "Either a string name used to reference the axis or an `AxisType` enumerated value. The enumerated values map to the corresponding string equivalent, i.e. \"Side\" and axSide can be used interchangeably.",
                    },
                    {
                        name: "MdmObject",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The MDM object that the axis is to be based upon. This can be a variable, grid, or loop. If the data set view is set to *dvVDATA* this refers to an object in the `Variables` collection of the metadata. If the data set view is set to dvHDATA this refers to an object in the `Fields` collection of the metadata.",
                    },
                    {
                        name: "AxisExpression",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "If the `MdmObject` is a variable then an axis expression can be specified to override the axis expression specified in the metadata.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "-1",
                        note: "The position in the collection to insert the axis. The new axis is inserted at the specified integer position. The index of the axis that is currently at that position and all following axes is increased by one. If the index is not specified, or is specified as -1, then the axis is appended to the end of the collection.",
                    },
                ],
                note: [
                    "(method) IAxes.AddNew(Name: Variant, [MdmObject: String = \"\"], [AxisExpression: String = \"\"], [Index: Long = -1]): IAxis",
                    "--------------------",
                    "Creates an `Axis` object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "The axis can optionally be based on an MDM object. Only an axis based on an MDM object can contain *eCategory* elements, which must correspond to elements of the MDM object. Axes not based on MDM objects either act as containers for sub-axes (e.g. 'Side' and 'Top') or can only non-category elements (normally *eExpression* elements, or *eProfile* elements in the case of a profile table).",
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IAxes.Clear(): Void",
                    "--------------------",
                    "Removes all `Axis` objects from the collection."
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "A reference to an `Axis` object in the collection. This is either the integer position of the object in the collection, the string name of the axis, or an `AxisType` enumerated value."
                    }
                ],
                note: [
                    "(method) IAxes.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes an `Axis` object from the collection.",
                ].join("\n")
            }
        ]
    },
    {
        name: "IAxis",
        definitionType: "interface",
        note: [
            "(interface) IAxis",
            "-----------------------------",
            "The `Axis` object defines the composition of a table axis. An `Axis` consists of elements and nested axes.",
        ].join("\n"),
        properties: [
            {
                name: "AxisHeadings",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxisHeadings"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.AxisHeadings: IAxisHeadings",
                    "--------------------",
                    "The headings to display on the table corresponding to `SubAxes` of this axis.",
                ].join("\n"),
            },
            {
                name: "ElementHeadings",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElementHeadings"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.ElementHeadings: IElementHeadings",
                    "--------------------",
                    "The headings to display on the table corresponding to the `Elements` of this axis."
                ].join("\n"),
            },
            {
                name: "Elements",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElements"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.Elements: IElements",
                    "--------------------",
                    "The collection of `Element` objects that make up the axis."
                ].join("\n"),
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.Name: String",
                    "--------------------",
                    "The axis is always named the same as the MDM field or variable that it is based upon, except in the case of a root axis which will normally be called 'Side' or 'Top'"
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.Parent: IAxis",
                    "--------------------",
                    "The parent axis of this axis",
                    "",
                    "### Remarks",
                    "In the case of a root axis (e.g. 'Side' or 'Top') the `Parent` axis is *null* or *Nothing* depending on the scripting language used."
                ].join("\n"),
            },
            {
                name: "ParentObject",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxes"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.ParentObject: IAxes",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `ParentObject` property of the `Axis` object always returns an `Axes` collection.",
                ].join("\n"),
            },
            {
                name: "SubAxes",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxes"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IAxis.SubAxes: IAxes",
                    "--------------------",
                    "The collection of `Axis` objects that are nested within this axis.",
                    "",
                    "### Remarks",
                    "This collection will be empty if there are no nested axes."
                ].join("\n"),
            },
            {
                name: "Label",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: true,
                index: {
                    name: "Language",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\""
                },
                note: [
                    "(property) IAxis.Label[[Language: String = \"\"]]: String",
                    "--------------------",
                    "The label for the axis",
                    "",
                    "### Remarks",
                    "The axis label is taken directly from the corresponding MDM field or variable based on the current settings of the `IDocument.Language`, `IDocument.Context`, and `IDocument.LabelType` properties. In the case of an axis that is not based on an MDM field or variable (i.e. a root axis). Default labels are generated for the root-level axis (e.g. 'Side' and 'Top'). Both the default labels and the MDM field or variable labels can be overridden by specifying a new label for the axis."
                ].join("\n"),
            },
            {
                name: "MaxResponses",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IAxis.MaxResponses: Long",
                    "--------------------",
                    "The maximum response number of the `Axis`. The default value is -1, which means it is identical to the source variable's `EffectiveMaxValue`.",
                    "",
                    "### Remarks",
                    "When setting an axis expression to a variable, it is possible to change its original maximum response number. It is the user's responsibility to set this number if the value is different from the source variable. This property value is important when performing statistical tests, because statistic formula may vary between the single response questions and multiple response questions."
                ].join("\n"),
            },
            {
                name: "Specification",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IAxis.Specification: String",
                    "--------------------",
                    "The current specification for the axis",
                    "",
                    "### Remarks",
                    "The `Specification` property is read/write. When reading the `Specification` property it is dynamically generated from the structure and properties of the axis and element objects. Modifying the `Specification` property will cause the axes to be destroyed and recreated."
                ].join("\n"),
            },
            {
                name: "UseMetadataDefinition",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IAxis.UseMetadataDefinition: Boolean",
                    "--------------------",
                    "Use the definition of the metadata variable that the axis is based upon.",
                    "",
                    "### Remarks",
                    "If when the axis is added to the table it's definition is based solely on the metadata then the `UserMetadataDefinition` property for the axis will be True. If an axis expression is specified then this overrides the metadata definition and `UseMetadataDefinition` will be *False*. Similarly, if the elements of the axis are modified in any way after it's been added then `UseMetadataDefinition` will be *False*.",
                    "The `IAxis.UseMetadataDefinition` property is used in conjunction with the `RefreshFromMetadata` methods (which is available from the `Document`, `Table`, and `Axis` objects).",
                    "The `UseMetadataDefinition` property and `RefreshFromMetadata` methods are important when the metadata has been modified since the table was defined. For example, consider metadata that contains two variables - month and satisfaction. The month variable initially contains categories of *Jan*, *Feb*, and *Mar*. If a table of \"month * satisfaction\" is saved in an MTD file it will have rows of *Jan*, *Feb*, and *Mar* Consider what happens when a new version of the metadata is produced that also has an *Apr* category. When the previously saved MTD file is reopened it will still contain the previously saved definition of month (*Jan*, *Feb*, *Mar*). When `RefreshFromMetadata` is called this axis is regenerated from the metadata and will have elements of *Jan*, *Feb*, *Mar*, and *Apr*.",
                    "Calling `IDocument.Populate` automatically invokes `RefreshFromMetadata`.",
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Concatenate",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        note: "The name of an MDM variable"
                    }
                ],
                note: [
                    "(method) IAxis.Concatenate(Name: Variant): IAxis",
                    "--------------------",
                    "Concatenates a variable with this axis",
                    "",
                    "### Remarks",
                    "The `Concatenate` method creates an `IAxis` object based on the specified MDM variable and adds it to the `SubAxes` collection of the parent of this `IAxis` object. The effect of this is to make the MDM variable a sibling of this axis (i.e. appear at the same level in the axis hierarchy). The `Concatenate` method is effectively a short-hand notation to invoking the `AddNew` method of the `SubAxes` collection of the parent axis of this axis."
                ].join("\n"),
            },
            {
                name: "Nest",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.variant,
                        note: "The name of an MDM variable"
                    }
                ],
                note: [
                    "(method) IAxis.Nest(Name: Variant): IAxis",
                    "--------------------",
                    "Nests a variable inside of this axis",
                    "",
                    "### Remarks",
                    "The Nest method creates an `IAxis` object based on the specified MDM variable and adds the new `IAxis` object to the `SubAxes` collection of this `IAxis` object. The effect of this is to nest the specified MDM variable inside this axis. The `Nest` method is effectively a short-hand notation to invoking the `AddNew` method of the `SubAxes` collection of this axis."
                ].join("\n"),
            },
            {
                name: "RefreshFromMetadata",
                definitionType: "method",
                arguments: [
                    {
                        name: "ForceRefresh",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: "0"
                    }
                ],
                note: [
                    "(method) IAxis.RefreshFromMetadata([ForceRefresh: Boolean = 0]): IAxis",
                    "--------------------",
                    "Updates the axis from the metadata if `UseMetadataDefinition` is *True*",
                    "",
                    "### Remarks",
                    "The `RefreshFromMetadata` method updates the axis based on the current definition in the metadata if `UseMetadataDefinition` is True. If `UseMetadataDefinition` is *False* the RefreshFromMetadata method has no effect. This method is useful if the metadata has changed since the axis was defined.",
                    "The axes are automatically refresh from the metadata definition when the table is populated.",
                    "It is assumed the metadata will not be modified while the table document is open. The Axis objects track when they have been synchronized with metadata and will not refresh if they are up to date. If the metadata does change while the table document is open the `ForceRefresh` parameter can be used to force the axis to refresh itself.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "ICellItems",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ICellItems",
            "-----------------------------",
            "The CellItems object is a collection of CellItem objects. The collection represents the contents of each cell in the populated table. Adding a statistics test may automatically add extra cell items.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                isCollection: false,
                readonly: true,
                note: [
                    "(property) ICellItems.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellItem"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) ICellItems.Item[Index: Variant]: ICellItem",
                    "--------------------",
                    "Returns a specified item in the collection.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) ICellItems.Parent: ITable | ITableDefaults | ITableGlobals",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `CellItems` object will return either a `Table`, `TableDefaults` or `TableGlobals` object."
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ICellItem"),
                arguments: [
                    {
                        name: "Type",
                        type: createBuiltInDefPlaceHolder("CellItemType"),
                        optional: false,
                        note: "The type of cell item object to be added, e.g. *itCount* or *itMean*. All `CellItemType` enumerated values are valid with the exception of *itCellChiSquare* (which is added automatically if a CellChiSquare statistic test is added), and itColPropResults (which is added automatically if a ColumnProportions, ColumnMeans or Tukey statistics test is added).",
                    },
                    {
                        name: "Decimals",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "0",
                        note: "The number of decimal places to display for the cell value. The default is 0 decimal places.",
                    },
                    {
                        name: "Variable",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The variable to base the calculation of the cell value on (for those cell items types that require it). The default is for no variable to be specified.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The position in the collection to insert the cell item. The new cell item is inserted at the specified integer position. The index of the cell item that is currently at that position and all following cell items is increased by one. If the index is not specified, or is specified as -1, then the cell item is appended to the end of the collection.",
                    }
                ],
                note: [
                    "(method) ICellItems.AddNew(Type: CellItemType, [Decimals: Long = 0], [Variable: String = \"\"], [Index: Long = -1]): ICellItem",
                    "--------------------",
                    "Creates a new `CellItem` object and adds it to the collection.",
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ICellItems.Clear(): Void",
                    "--------------------",
                    "Removes all `CellItem` objects from the collection"
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "The integer position of the `CellItem` object in the collection to be removed.",
                    }
                ],
                note: [
                    "(method) ICellItems.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes the specified cell item from the collection.",
                ].join("\n")
            }
        ]
    },
    {
        name: "ICellItem",
        definitionType: "interface",
        note: [
            "(interface) ICellItem",
            "-----------------------------",
            "A `CellItem` is a type of value that appears in each cell of the table. Each `CellItem` defines a single value that appears in each of the cells of the table. An example of a cell item is a count or column percentage.",
        ].join("\n"),
        properties: [
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellItems"),
                note: [
                    "(property) ICellItem.Parent: ICellItems",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The Parent property of the `CellItem` object always returns a `CellItems` collection"
                ].join("\n"),
            },
            {
                name: "Type",
                definitionType: "property",
                readonly: true,
                returnType: createBuiltInDefPlaceHolder("CellItemType") ,
                note: [
                    "(property) ICellItem.Type: CellItemType",
                    "--------------------",
                    "The type of cell item (e.g. *itCount*, *itColPercent*)"
                ].join("\n"),
            },
            {
                name: "CutOffValue",
                definitionType: "property",
                returnType: BasicTypeDefinitions.double ,
                note: [
                    "(property) ICellItem.CutOffValue: Double",
                    "--------------------",
                    "The cut-off value for percentiles (not relevant for other cell item types).",
                    "",
                    "### Remarks",
                    "The default value is 50, which corresponds to the 50th percentile (also referred to as the median). The `CutOffValue` must be set between 0 and 100 percent and is only applicable to *itPercentile* cell items.",
                    "The `CutOffValue` determines the percentile that the *itPercentile* cell item calculates, where a P-th percentile is the smallest value of a numeric variable that is greater than *P* percent of the values in a given set. For example a `CutOffValue` of 25 calculates *V*, the smallest value such that 25% of respondents have a value less than *V*.",
                ].join("\n"),
            },
            {
                name: "Decimals",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) ICellItem.Decimals: Double",
                    "--------------------",
                    "The number of digits to show after the decimal point.",
                    "",
                    "### Remarks",
                    "The default value is 0 (i.e. no digits are shown after the decimal point). The number of digits after the decimal place must be between 0 to 20 digits. Setting this property to 0 causes the cell values to be displayed as integers."
                ].join("\n"),
            },
            {
                name: "FormatExpression",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ICellItem.FormatExpression: String",
                    "--------------------",
                    "FormatExpression",
                    "",
                    "### Remarks",
                    "The `FormatExpression` property must be an *mrEvaluate* expression. The expression must take a single parameter called `Value` and return a text value. If the result of the expression isn't text the result will automatically be converted to text.",
                    "For a table of type *ttAggregated* the `Value` parameter will always be a numeric value. For a *ttProfile* table the `Value` parameter will be the same data type as the variable being profiled.",
                    "The most common use of the `FormatExpression` is to use the `Format` function library function to format a value for display, but any function or expression can be used to produce a text value from the `Value` parameter.",
                    "Note that string literals within the `FormatExpression` property must be enclosed in single quote characters rather than double quote characters like the `IElement.Expression` and `IFilter.Expression` properties use.",
                    "",
                    "### Examples",
                    "```ds",
                    "' Display the value as the name of the category",
                    "CellItem.FormatExpression = \"Format(Value, 'a')\"",
                    "",
                    "' Display the numeric value in scientific format with 5 decimal places, e.g.  2.34567e+003",
                    "CellItem.FormatExpression = \"Format(Value, 'e5')\"",
                    "",
                    "' Display the first 100 characters of a text response",
                    "CellItem.FormatExpression = \"Left(Value, 100)\"",
                    "```",
                ].join("\n"),
            },
            {
                name: "Index",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) ICellItem.Index: Long",
                    "--------------------",
                    "The index of the item in the parent `CellItems` collection.",
                    "",
                    "### Remarks",
                    "The `Index` property is intended to be used to easily get a `CellItemRef` value that can be used with the `Rule` objects, which require the cell item to operate on to be specified."
                ].join("\n"),
            },
            {
                name: "Prefix",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ICellItem.Prefix: String",
                    "--------------------",
                    "A string to prefix to all values",
                ].join("\n"),
            },
            {
                name: "Variable",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ICellItem.Variable: String",
                    "--------------------",
                    "The variable name for those cell item types that require a numeric variable for their calculation (for example, *itMean*).",
                    "",
                    "### Remarks",
                    "The default value for this property is an empty string (i.e. no variable specified).",
                    "",
                    "It is not possible to specify a variable for the following cell item types:",
                    "+ itCount",
                    "+ itUnweightedCount",
                    "+ itColPropResults",
                    "+ itCellChiSquare",
                    "+ itColBase",
                    "+ itRowBase",
                    "+ itUnweightedColBase",
                    "+ itUnweightedRowBase",
                    "+ itProfileResult",
                    "+ itColRanks",
                    "+ itRowRanks",
                    "",
                    "A numeric variable must be specified for the following cell item types:",
                    "+ itSum",
                    "+ itMinimum",
                    "+ itMaximum",
                    "+ itMean",
                    "+ itRange",
                    "+ itMode",
                    "+ itMedian",
                    "+ itPercentile",
                    "+ itStdDev",
                    "+ itStdErr",
                    "+ itVariance",
                    "",
                    "A numeric variable can be specified for the following cell item types. If a variable is specified the cell item is calculated based on the sum of the variable. If a variable isn't specified the cell item is calculated based on the count.",
                    "+ itColPercent",
                    "+ itRowPercent",
                    "+ itTotalPercent",
                    "+ itCumColPercent",
                    "+ itCumRowPercent",
                    "+ itResiduals",
                    "+ itExpectedValues",
                    "+ itIndices",
                    "",
                    "It is possible for the variable to be specified as \"-\". This is a special code that means \"look at the `AnalysisVariable` property on the `Element` object to determine the Variable for this cell\". This is useful in the creation of summary tables for numeric variables. The columns of the table are created from multiple *eNumeric* elements, each based on a different numeric variable. Cell items like *itMean*, *itMinimum*, *itMaximum* based on an variable of \"-\" can be requested for the body of the table. The result is that each column of mean, min, and max values is based on a different numeric variable.",
                ].join("\n"),
            },
            {
                name: "Suffix",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ICellItem.Suffix: String",
                    "--------------------",
                    "A string to append to all values",
                ].join("\n")
            },
        ]
    },
    {
        name: "IFilters",
        definitionType: "interface",
        note: [
            "(interface) IFilters",
            "-----------------------------",
            "A collection of `Filter` objects. During population of the table, all filters in the collection are combined (ANDed together).",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IFilters.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IFilters.Item[Index: Variant]: Variant",
                    "--------------------",
                    "Get the collection item at the specified location."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                readonly: true,
                note: [
                    "(property) IFilters.Parent: ITable | ITableDefault | ITableGlobals | IDocument",
                    "--------------------",
                    "The parent object"
                ].join("\n")
            }
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IFilter"),
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "A reference to a Filter object in the ID`ocument.Filters` collection. This is either the integer position of the object within the collection or the name of the filter."
                    }
                ],
                note: [
                    "(method) IFilters.Add(Index: Variant): IFilter",
                    "--------------------",
                    "Adds a copy of a filter object in the `IDocument.Filters` collection to the current collection.",
                    "",
                    "### Remarks",
                    "The `IDocument.Filters` collection is intended to be used as a 'toolbox' of filters that can be applied to multiple tables. The Add method makes a copy of the filter such that original Filter object can be modified without affecting the per-table filters."
                ].join("\n")
            },
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IFilter"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        note: "The filter name. This is used to reference the filter within the collection.",
                    },
                    {
                        name: "Expression",
                        type: BasicTypeDefinitions.string,
                        note: "An *mrEvalulate* expression that is evaluated for each case in the case data. Only cases for which the expression evaluates to *True* are included.",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "Filter description",
                    },
                    {
                        name: "Level",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "HDATA",
                        note: "The level the filter is to be applied at. The expression used must be relative to the specified level. The default level is HDATA.",
                    },
                    {
                        name: "IsInterviewFilter",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: 0,
                        note: "*True* if the new filter is intended to filter based on the interview status. The default is *False*. This flag does not effect the evaluation of the filter, it just allows a distinction to be made between interview and non-interview filters for the purpose of generating table annotations.",
                    }
                ],
                note: [
                    "(method) IFilters.AddNew(Name: String, Expression: String, Description: String = \"\", Level: String = HDATA, IsInterviewFilter: Boolean = 0): IFilter",
                    "--------------------",
                    "Adds a new `Filter` object to the collection.",
                    "",
                    "### Parameters",
                    "+ `Name`: *String* - The filter name. This is used to reference the filter within the collection.",
                    "+ `Expression`: *String* - An *mrEvalulate* expression that is evaluated for each case in the case data. Only cases for which the expression evaluates to True are included.",
                    "+ `Description`: *String* - Filter description",
                    "+ `Level`: *String* - The level the filter is to be applied at. The expression used must be relative to the specified level. The default level is *HDATA*.",
                    "+ `IsInterviewFilter`: *Boolean* - *True* if the new filter is intended to filter based on the interview status. The default is *False*. This flag does not effect the evaluation of the filter, it just allows a distinction to be made between interview and non-interview filters for the purpose of generating table annotations.",
                    "",
                    "### Remarks",
                    "The `Name`, `Expression`, `Description`, `Level`, and `IsInterviewFilter` properties of the new `Filter` object are set as specified by the parameters to this function.",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.Filters.AddNew(\"Exclude11_16s\", \"Not age.ContainsAny({e1116_years})\")",
                    "```",
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IFilters.Clear(): Void",
                    "--------------------",
                    "Removes all `Filter` objects from the collection.",
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                    }
                ],
                note: [
                    "(method) IFilters.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes a `Filter` object from the collection."
                ].join("\n"),
            }
        ]
    },
    {
        name: "IFilter",
        definitionType: "interface",
        note: [
            "(interface) IFilter",
            "-----------------------------",
            "The `Filter` object represents a user-defined case data filter. It is used to filter the cases that are to be included when the table is populated.",
        ].join("\n"),
        properties: [
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IFilter.Name: String",
                    "--------------------",
                    "The `Filter` object represents a user-defined case data filter. It is used to filter the cases that are to be included when the table is populated."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFilters"),
                readonly: true,
                note: [
                    "(property) IFilter.Parent: IFilters",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Filter` object always returns a `Filters` collection"
                ].join("\n"),
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IFilter.Description: String",
                    "--------------------",
                    "A description of the filter"
                ].join("\n"),
            },
            {
                name: "Expression",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IFilter.Expression: String",
                    "--------------------",
                    "An *mrEvalulate* expression that is evaluated for each case in the case data. Only cases for which the expression evaluates to *True* are included.",
                    "",
                    "### Remarks",
                    "```ds",
                    "Filter.Expression = \"Not age.ContainsAny({e1116_years})\"",
                    "```",
                ].join("\n"),
            },
            {
                name: "IsDimensionsFilter",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IFilter.IsDimensionsFilter: Boolean",
                    "--------------------",
                    "*True* if the filter is intended to filter based on a per-user filter defined in `DimensionNet`. This allows the differentiation between the two types of filters for the purposes of generating annotations. `IsDimensionsFilter` is *False* by default."
                ].join("\n"),
            },
            {
                name: "IsInterviewFilter",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IFilter.IsInterviewFilter: Boolean",
                    "--------------------",
                    "*True* if the filter is intended to filter based on the interview status. This allows the differentiation between the two types of filters for the purposes of generating annotations."
                ].join("\n"),
            },
            {
                name: "Level",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IFilter.Level: String",
                    "--------------------",
                    "The level the filter is to be applied at. The expression used must be relative to this level."
                ].join("\n"),
            }
        ]
    },
    {
        name: "IStatistics",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IStatistics",
            "-----------------------------",
            "The `Statistics` object is a collection of `Statistic` objects that define statistical tests to be calculated when a table is populated.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IStatistics.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistic"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IStatistics.Item[Index: Variant]: IStatistic",
                    "--------------------",
                    "Get the collection item at the specified location."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                note: [
                    "(property) IStatistics.Parent: ITable | ITableDefaults | ITableGlobals | IDocument",
                    "--------------------",
                    "The parent object",
                ].join("\n"),
            },
            {
                name: "ColumnIDs",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStatistics.ColumnIDs: String",
                    "--------------------",
                    "The selected column heading IDs that the `Column` Proportions, *Column Means*, and *Tukey* statistics are to test.",
                    "",
                    "### Remarks",
                    "Each character in the string is used to allocate the ID for a column, with a space or dot used to indicate that an ID should not be allocated. A character needs to be specified for each of the columns in the table, including BASE columns. Do not include a . or space for hidden columns. e.g. \"....MF.NG\". Note that you cannot include a period '.' or space for hidden columns.",
                    "If no value is specified, the string is set to the `ColumnID`s property. The `Column` Proportions, *Column Means*, and *Tukey* tests will default to testing the group of columns indicated by `TestColumns`. If no value is specified, the string is set to the `TestColumns` property. The `Column` Proportions, Column Means, and Tukey tests will default to testing the IDs against each other. e.g. \"M/F/N/G\"",
                ].join("\n"),
            },
            {
                name: "ShowMinPVal",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IStatistics.ShowMinPVal: Boolean",
                    "--------------------",
                    "If *True*, a column is appended to the table to contain the minimum p-value found in the row.",
                    "",
                    "### Remarks",
                    "This option is only valid on a table with the ColumnProportions or ColumnMeans statistic, and is not valid when there is any nesting or concatenating in the top axis."
                ].join("\n")
            },
            {
                name: "TestColumns",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStatistics.TestColumns: String",
                    "--------------------",
                    "The heading ids of the columns the `Column` Proportions, *Column Means* and *Tukey* statistics are to test",
                    "",
                    "### Remarks",
                    "The columns that the `Column` Proportions, *Column Means* and *Tukey tests* are to compare can be specified using the `TestColumns` property. The `TestColumns` specification is a string that lists the groups of columns to test separated by comma. Each column is represented by it's heading id and is tested against every other column in the group.",
                    "For example, the specification \"A/B/C, D/E/F/G\" will test all possible combinations of the columns *A*, *B*, and *C*, and all possible combinations of the columns *D*, *E*, *F*, *G*. i.e. o A against B o A against C o B against C o B against A o C against A o C against B o D against E o D against F o D against G o E against D o E against F o ... and so on",
                    "As another example, the specification \"A/B, C/D, E/F\" will only test pairs of columns. i.e. ",
                    "+ A against B    ",
                    "+ B against A",
                    "+ C against D",
                    "+ D against C",
                    "+ E against F",
                    "+ F against E",
                    "",
                    "If no value is specification string is set for the `TestColumns` property then `Column` Proportions, *Column Means* and *Tukey tests* will default to testing the default groups of columns. By default columns are split into groups delimited by base or sub-total elements.",
                ].join("\n")
            },
            {
                name: "UseEffectiveBase",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IStatistics.UseEffectiveBase: Boolean",
                    "--------------------",
                    "If *True*, the effective base is used when the tests are calculated, otherwise no base adjustment is made.",
                    "",
                    "### Remarks",
                    "This option affects statistical tests on weighted tables only. The effective base is designed to reduce the likelihood of the statistical tests producing significant results because of the adjustments made by weighting."
                ].join("\n")
            },
            {
                name: "UseGridOverlapFormula",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IStatistics.UseGridOverlapFormula: Boolean",
                    "--------------------",
                    "Set if the statistics should use grid overlap formula. If this option is set to *false*, the grid overlap formula is not used and normal overlap formula is used if current table is an overlap table (normal overlap or grid table). If this option is set to *true*, the product itself decides which formula to use.",
                    "",
                    "### Remarks",
                    "The grid overlap formula usually needs more memory and more time than the normal overlap formula"
                ].join("\n")
            }
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IStatistic"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.variant,
                        note: "The name of a `Statistic` object in the `IDocument.Statistics` collection.",
                    }
                ],
                note: [
                    "(method) IStatistics.Add(Name: Variant): IStatistic",
                    "--------------------",
                    "Adds a statistic from the `IDocument.Statistics` collection to the current collection.",
                    "",
                    "### Remarks",
                    "The `IDocument.Statistics` collection is populated with all available statistical tests when the IDocument object is created. This Add method makes a copy of the Statistic object and adds it to this Statistics collection. Adding a statistic test may automatically add extra cell items or elements."
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IStatistics.Clear(): Void",
                    "--------------------",
                    "Removes all `Statistic` objects from the collection.",
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                    }
                ],
                note: [
                    "(method) IStatistics.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes a `Statistic` object from the collection."
                ].join("\n"),
            }
        ]
    },
    {
        name: "IStatistic",
        definitionType: "interface",
        note: [
            "(interface) IStatistic",
            "-----------------------------",
            "A `Statistic` object represents a statistical test that is to be calculated when a table is populated. Adding a statistical test to a table may automatically add extra cell items or elements to the table.",
        ].join("\n"),
        properties: [
            {
                name: "Annotation",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IStatistic.Annotation: String",
                    "--------------------",
                    "Additional textual information provided about the test.",
                    "",
                    "### Remarks",
                    "If the statistic has not been applied to a table or if a particular statistic does not have any information it would like to display then the `Annotation` property is an empty string.",
                    "An example of the use of the `Annotation` property is to provide information about the columns tested and the significance level that was used for a column proportions test. A table consisting of `age * gender + museums` with a SigLevel of 5 will have the annotation \"Columns Tested (5%): A/B, C/D/E/F/G/H/I/J\", where the letters match up with the columns produced by the table builder.",
                ].join("\n"),
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IStatistic.Name: String",
                    "--------------------",
                    "The name of the statistical test",
                    "",
                    "### Remarks",
                    "The following statistics tests are currently available:",
                    "+ ChiSquare Chi-Square test",
                    "+ ColumnMeans Column Means test",
                    "+ ColumnProportions Column Proportions test",
                    "+ PairedPreference Paired Preference test",
                    "+ NetDifference Net Difference test",
                    "+ Fisher Fisher Exact test for 2*2 tables or sections of tables",
                    "+ Tukey Tukey's Honestly Significant Difference Test",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistics"),
                readonly: true,
                note: [
                    "(property) IStatistic.Parent: IStatistics",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Statistic` object always returns a `Statistics` collection"
                ].join("\n"),
            },
            {
                name: "Properties",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                note: [
                    "(property) IStatistic.Properties: IProperties",
                    "--------------------",
                    "A collection of `Property` objects that supply additional parameters that are needed to perform the statistical test.",
                    "",
                    "### Remarks",
                    "The exact parameters (Properties) vary between statistical tests. ",
                    "",
                    "### Examples",
                    "```ds",
                    "ColPropStat.Properties[\"SigLevel\"] = 1",
                    "ColPropStat.Properties[\"SigLevelLow\"] = 10",
                    "ColPropStat.Properties[\"MinBase\"] = 50",
                    "ColPropStat.Properties[\"SmallBase\"] = 150",
                    "```",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IProperties",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IProperties",
            "-----------------------------",
            "A collection of property objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IProperties.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperty"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IProperties.Item[Index: Variant]: IProperty",
                    "--------------------",
                    "Get the collection item at the specified location."
                ].join("\n"),
            },
            {
                name: "Copy",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                note: [
                    "(property) IProperties.Copy: IProperties",
                    "--------------------",
                    "Returns a copy of the current property object.",
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                arguments: [
                    {
                        name: "Property",
                        type: createBuiltInDefPlaceHolder("IProperty"),
                    }
                ],
                note: [
                    "(method) IProperties.Add(Property: IProperty): Void",
                    "--------------------",
                    "Adds an item to the collection."
                ].join("\n"),
            },
            {
                name: "CopyTo",
                definitionType: "method",
                arguments: [
                    {
                        name: "Properties",
                        type: createBuiltInDefPlaceHolder("IProperties"),
                    }
                ],
                note: [
                    "(method) IProperties.CopyTo(Properties: IProperties): Void",
                    "--------------------",
                    "Copies the properties collection to the supplied properties collection object.",
                ].join("\n"),
            },
            {
                name: "CreateProperty",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IProperty"),
                note: [
                    "(method) IProperties.CreateProperty(): IProperty",
                    "--------------------",
                    "Creates a new property object."
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Property",
                        type: createBuiltInDefPlaceHolder("IProperty"),
                    }
                ],
                note: [
                    "(method) IProperties.Remove(Property: IProperty): Void",
                    "--------------------",
                    "Removes an item from the collection."
                ].join("\n")
            }
        ]
    },
    {
        name: "IProperty",
        definitionType: "interface",
        defaultProperty: "Value",
        note: [
            "(interface) IProperties",
            "-----------------------------",
            "The `Property` object represents a project property.",
            "",
            "### Remarks",
            "With the properties of a `Property` object, you can:",
            "+ Determine the name of the property using the `Name` property.",
            "+ Get or set the value of the property using the `Value` property.",
        ].join("\n"),
        properties: [
            {
                name: "Copy",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperty"),
                readonly: true,
                note: [
                    "(property) IProperty.Copy: IProperty",
                    "--------------------",
                    "Returns a copy of the current property object.",
                ].join("\n"),
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IProperty.Name: String",
                    "--------------------",
                    "The name of the property.",
                ].join("\n"),
            },
            {
                name: "Value",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                note: [
                    "(property) IProperty.Value: Variant",
                    "--------------------",
                    "The property value. (Default Property)"
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "CopyTo",
                definitionType: "method",
                arguments: [
                    {
                        name: "Property",
                        type: createBuiltInDefPlaceHolder("IProperty"),
                    }
                ],
                note: [
                    "(method) IProperty.CopyTo(Property: IProperty): Void",
                    "--------------------",
                    "Copies the property name and value to the supplied property object."
                ].join("\n"),
            }
        ]
    },
    {
        name: "IRules",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IRules",
            "-----------------------------",
            "The `Rules` object is a collection of `Rule` objects. All of the rules defined by the `Rule` objects are applied to the cell values of a table when they are calculated during the call to `IDocument.Populate`",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IRules.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IRule"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IRules.Item[Index: Variant]: IRule",
                    "--------------------",
                    "Get the collection item at the specified location."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                note: [
                    "(property) IRules.Parent: ITable | ITableDefaults",
                    "--------------------",
                    "The parent object",
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IRule"),
                arguments: [
                    {
                        name: "Type",
                        type: createBuiltInDefPlaceHolder("RuleType"),
                        optional: true,
                        defaultValue: "rlHide",
                        note: "The type of rule. Currently only hide rules are available.",
                    },
                    {
                        name: "Target",
                        type: createBuiltInDefPlaceHolder("RuleTarget"),
                        optional: true,
                        defaultValue: "rtRow",
                        note: "The target of the rule can be a row, column, cell, row statistic or column statistic. The default is rtRow",
                    },
                    {
                        name: "CellItemRef",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: "(long)0",
                        note: "The index of an item in the tables CellItems collection to apply the rule to. The default is 0 (the first cell item)",
                    },
                    {
                        name: "Operator",
                        type: createBuiltInDefPlaceHolder("ComparisonOperator"),
                        optional: true,
                        defaultValue: "opEqual",
                        note: "The operator to use for the test, e.g. <, >, =, etc. The default is opEqual.",
                    },
                    {
                        name: "Value",
                        type: BasicTypeDefinitions.double,
                        optional: true,
                        defaultValue: "(double)0.0",
                        note: "The condition to test for. The default is 0.",
                    }
                ],
                note: [
                    "(method) IRules.AddNew([Type: RuleType = rlHide], [Target: RuleTarget = rtRow], [CellItemRef: Long = (long)0], [Operator: ComparisonOperator = opEqual], [Value: Double = (double)0.0]): IRule",
                    "--------------------",
                    "Creates a new Rule and adds it to the collection.",
                    "",
                    "### Remarks",
                    "Addition properties such as IRule.ElementRef and IRule.IgnoreSpecialElements can be set on the Rule object after it has been created by the AddNew() method.",
                    "",
                    "### Example",
                    "```ds",
                    "Table.Rules.AddNew(rlHide, rtRow, 0, opLess, 40)",
                    "```",
                ].join("\n"),
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IRules.Clear(): Void",
                    "--------------------",
                    "Removes all `Rule` objects from the collection."
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "An integer index into the collection."
                    }
                ],
                note: [
                    "(method) IRules.Remove(Index: Variant): Void",
                    "--------------------",
                    "Removes an item from the collection.",
                    "### Parameters",
                    "- `Index`: *Variant* - An integer index into the collection.",
                ].join("\n"),
            },
        ]
    },
    {
        name: "IRule",
        definitionType: "interface",
        note: [
            "(interface) IRule",
            "-----------------------------",
            "The `IRule` object defines criteria, for example, hiding parts of the table.",
        ].join("\n"),
        properties: [
            {
                name: "IsActive",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IRule.IsActive: Boolean",
                    "--------------------",
                    "Returns *True* if the rule is active, or *False* if the rule is disabled.",
                    "",
                    "### Remarks",
                    "A rule becomes inactive (disabled) if the `CellItemRef` property is invalid. Also, in versions prior to 2.4, the `IsActive` property would return *False* if any statistic was applied to the table."
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IRules"),
                readonly: true,
                note: [
                    "(property) IRule.Parent: IRules",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Rule` object always returns a `Rules` collection",
                ].join("\n"),
            },
            {
                name: "CellItemRef",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IRule.CellItemRef: Long",
                    "--------------------",
                    "The index (into the tables `CellItems` collection) of the `CellItem` on which the rule's condition is based.",
                ].join("\n")
            },
            {
                name: "ElementRef",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IRule.ElementRef: String",
                    "--------------------",
                    "A reference to the element to the rule is to operate on.",
                    "",
                    "### Remarks",
                    "The reference to the element to base the hide rule on is specified as \"AxisName{ElementName}\" where `AxisName` must be the name of an axis within the 'Side' axis for a `Rule` suppressing columns, and the 'Top' axis for a `Rule` suppressing rows. `ElementName` must be the name of an element within that axis. Nested axes can be referenced by using the '>' symbol.",
                    "The first or last row/column can be referenced by specifying the keyword \"First\" or \"Last\".",
                    "If the `ElementRef` property is not specified then the rule operates on all elements.",
                ].join("\n")
            },
            {
                name: "IgnoreSpecialElements",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IRule.IgnoreSpecialElements: Boolean",
                    "--------------------",
                    "If *False*, any special element such as mean, subtotal, etc, is hidden if it passes the rule for hiding.",
                    "",
                    "### Remarks",
                    "The default is *True*, meaning that special elements are always displayed even when they pass the rules for hiding."
                ].join("\n")
            },
            {
                name: "Operator",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ComparisonOperator") ,
                note: [
                    "(property) IRule.Operator: ComparisonOperator",
                    "--------------------",
                    "The type of comparison operation to perform.",
                ].join("\n"),
            },
            {
                name: "Target",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("RuleTarget") ,
                note: [
                    "(property) IRule.Target: RuleTarget",
                    "--------------------",
                    "The target of the rule.Note that it's not possible to change the `Target` property of a rule if an `ElementRef` property has been set. This is because changing the target will probably make the `ElementRef` invalid.",
                ].join("\n")
            },
            {
                name: "Type",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("RuleType") ,
                note: [
                    "(property) IRule.Type: RuleType",
                    "--------------------",
                    "The type of rule.",
                ].join("\n")
            },
            {
                name: "Value",
                definitionType: "property",
                returnType: BasicTypeDefinitions.double ,
                note: [
                    "(property) IRule.Value: Double",
                    "--------------------",
                    "The condition the rule is to test for.",
                    "",
                    "### Remarks",
                    "For example, if all rows where values are less than 10 are to be hidden, then the cut-off value of the rule is 10.",
                    "",
                    "### Example",
                    "```ds",
                    "Table.Rules.AddNew(rlHide, rtRow, 0, opLess, 10)",
                    "```",
                ].join("\n")
            },
        ]
    },
    {
        name: "ISortSpecification",
        definitionType: "interface",
        note: [
            "(interface) ISortSpecification",
            "-----------------------------",
            "The `ISortSpecification` object defines the row or column to sort and the sort order (ascending/descending).",
        ].join("\n"),
        properties: [
            {
                name: "IsActive",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) ISortSpecification.IsActive: Boolean",
                    "--------------------",
                    "*True* if the sort specification is active",
                    "",
                    "### Remarks",
                    "The `IsActive` property is *True* if a value has been set for the *ElementRef* property.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                readonly: true,
                note: [
                    "(property) ISortSpecification.Parent: ITable | ITableDefaults",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The Parent property of the `SortSpecification` object returns either a `Table` or `TableDefaults` object."
                ].join("\n"),
            },
            {
                name: "ElementRef",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ISortSpecification.ElementRef: String",
                    "--------------------",
                    "A reference to the element to sort on",
                    "",
                    "### Remarks",
                    "The reference to the element to sort on is specified as \"AxisName{ElementName}\" where `AxisName` must be the name of an axis within the 'Side' axis for a `SortRow` and the 'Top' axis for a `SortColumn`. `ElementName` must be the name of an element within that axis. Nested axes can be referenced by using the '>' symbol.",
                    "The first or last row/column can be referenced by specifying the keyword \"First\" or \"Last\" as the `ElementRef`.",
                    "The single row or column that exists in a frequency table can be referenced by specifying the keyword \"Base\".",
                    "If no value is specified for the `ElementRef` property then the table is not sorted.",
                    "`ElementRef` is the default property for the `SortSpecification` object and so is optional as shown in the following examples.",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.SortRow = \"\"          ' No sorting",
                    "Table.SortColumn = \"Base\"   ' Sort on the base column in a frequency table",
                    "Table.SortRow = \"Age{Base}\"",
                    "Table.SortRow.ElementRef = \"Age{Base}\"      ' Equivalent to above as ElementRef is the default property",
                    "Table.SortRow = \"Age{E1116_years}>Gender{Female}\"",
                    "Table.SortColumn = \"Last\"   ' Sort on the last column in a table (that has multiple columns)",
                    "```",
                ].join("\n"),
            },
            {
                name: "Order",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("OrderConstants") ,
                note: [
                    "(property) ISortSpecification.Order: OrderConstants",
                    "--------------------",
                    "The order (ascending/descending) in which to sort the values.",
                    "",
                    "### Remarks",
                    "The `Order` property is *oDescending* by default which means the values are sorted from largest first to smallest last.",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.SortRow.Order = 0   ' 0 = oAscending",
                    "```",
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ISortSpecification.Clear(): Void",
                    "--------------------",
                    "Clears the sort specification",
                    "",
                    "### Remarks",
                    "Clearing the sort specification removes any `ElementRef` value that has been set. It also resets the `Order` property to *oDescending*."
                ].join("\n"),
            }
        ]
    },
    {
        name: "IAnnotation",
        definitionType: "interface",
        note: [
            "(interface) IAnnotation",
            "-----------------------------",
            "The `Annotation` object is used to represent the heading, footnote, or table title text. The text can contain macros that are automatically replaced with the correct information about the table. The annotations are generally used to define the information that appears around the table when it is exported.",
        ].join("\n"),
        properties: [
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAnnotations"),
                readonly: true,
                note: [
                    "(property) IAnnotation.Parent: IAnnotations",
                    "--------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The Parent property of the `Annotation` object always returns a `Annotations` collection"
                ].join("\n"),
            },
            {
                name: "Text",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IAnnotation.Text: String",
                    "--------------------",
                    "The text of the annotation. This is the same as the `IAnnotation.Specification` property but with the macros expanded."
                ].join("\n")
            },
            {
                name: "Position",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("AnnotationPosition") ,
                note: [
                    "(property) IAnnotation.Position: AnnotationPosition",
                    "--------------------",
                    "The position on the table of this `Annotation`."
                ].join("\n")
            },
            {
                name: "Specification",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IAnnotation.Specification: String",
                    "--------------------",
                    "A specification of the annotation. This can contain macros which are automatically replaced with the correct table information.",
                    "",
                    "### Remarks",
                    "The `Specification` can contain any text, including a number of predefined macros which represent information about the table. Reading the `IAnnotation.Text` property returns the specification string but with the macros replaced by the correct text. The specification can also contain a restricted set of HTML tags to control the formatting of the annotation. Where possible the annotation will be displayed with the specified formatting (if supported by the export).",
                    "",
                    "### Example",
                    "```ds",
                    "Table.Annotations[annLeftHeader].Specification = \"Weight Variable: {Weight}\"",
                    "```",
                ].join("\n")
            }
        ]
    },
    {
        name: "IAnnotations",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IAnnotations",
            "-----------------------------",
            "A collection of `Annotation` objects. An `Annotation` is a piece of text that gives information about the table. The text is dynamically generated by the Annotation object and is intended to be used when exporting the table.",
            "",
            "### Remarks",
            "The `Annotations` collection always contains 8 `Annotation` objects. Each of these represents a position around the outside of the table (title, left, right, and center for both the header and footer). Each position accepts free-formatted text and information about the table is inserted into this text using macros. When required the macros are expanded per table to the full text string for display. Formatting information can be included in the text using a subset of the Hyper Text Markup Language (HTML). See the IAnnotation object for more information."
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IAnnotations.Count: Long",
                    "-----------------------------",
                    "The number of `Annotation` objects in the collection."
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAnnotation"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IAnnotations.Item[Index: Variant]: IAnnotation",
                    "-----------------------------",
                    "Returns the specified `Annotation` object in the collection."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
                readonly: true,
                note: [
                    "(property) IAnnotations.Parent: ITable | ITableDefaults | ITableGlobals",
                    "-----------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Annotations` object will return either a `Table`, `TableDefaults`, or `TableGlobals` object.",
                ].join("\n")
            }
        ],
        methods: [
            {
                name: "ClearAll",
                definitionType: "method",
                note: [
                    "(method) IAnnotations.ClearAll(): Void",
                    "-----------------------------",
                    "Clears the `Specification` property of all `Annotation` objects in the collection"
                ].join("\n"),
            }
        ]
    },
    {
        name: "ITableListNode",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ITableListNode",
            "-----------------------------",
            "The `IDocument.GroupedTables` property represents tables arranged into hierarchical groupings. This can be thought of as groups of tables that can in turn contain other groups, like folders that contain files or other folders.",
            "",
            "### Remarks",
            "The `GroupedTables` property is a `TableListNode`. Each `TableListNode` can reference a Table object and has a collection of child `TableListNode` objects. Although it's possible for a `TableListNode` to both reference a `Table` object and have child `TableListNode` objects it will typically have either one or the other.",
            "Using the concept of groups of tables, a `TableListNode` with child nodes represents a group and a `TableListNode` that references a table represents a table in a group.",
            "",
            "### Example",
            "The following script will produce 7 tables arranged into 3 groups in the",
            "following arrangement:",
            "",
            "GroupedTables",
            "+ Group1 - Age tables",
            "    + Table1 - age * gender",
            "    + Table2 - age * biology",
            "+ Table3 - education * biology",
            "+ Group2 - Gender tables",
            "    + Table4 - gender * biology",
            "    + Table5 - gender * before",
            "    + Group2b - Sub-group of gender tables",
            "        +Table6 - gender * entrance",
            "+ Table7 - education * age",
            "",
            "```ds",
            "Set TableDoc = CreateObject(\"TOM.Document\")",
            "TableDoc.DataSet.Load(\"C:\\Program Files\\IBM\\SPSS\\DataCollection\\6\\DDL\\Data\\XML\\museum.mdd\")",
            "",
            "Set Group1 = TableDoc.GroupedTables.AddNewNode(\"Group1\", \"Age tables\")",
            "Group1.AddNewTable(\"Table1\", \"age * gender\", \"Age by Gender\")",
            "Group1.AddNewTable(\"Table2\", \"age * biology\", \"Age by Biology\")",
            "TableDoc.GroupedTables.AddNewTable(\"Table3\", \"education * biology\", \"Education by Biology\")",
            "Set Group2 = TableDoc.GroupedTables.AddNewNode(\"Group2\", \"Gender tables\")",
            "Group2.AddNewTable(\"Table4\", \"gender * biology\", \"Gender by Biology\")",
            "Group2.AddNewTable(\"Table5\", \"gender * before\", \"Gender by Before\")",
            "Set Group2b = Group2.AddNewNode(\"Group2b\", \"Sub-group of Gender tables\")",
            "Group2b.AddNewTable(\"Table6\", \"gender * entrance\", \"Gender by Entrance\")",
            "TableDoc.GroupedTables.AddNewTable(\"Table7\", \"education * age\", \"Education by Age\")",
            "```",
        ].join("\n"),
        properties: [
            {
                name: "ChildNode",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant
                },
                note: [
                    "(property) ITableListNode.ChildNode[Index: Variant]: ITableListNode",
                    "-----------------------------",
                    "Returns the specified child node.",
                ].join("\n")
            },
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) ITableListNode.Count: Long",
                    "-----------------------------",
                    "The number of child nodes the current node has."
                ].join("\n")
            },
            {
                name: "HasChildNodes",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) ITableListNode.HasChildNodes: Boolean",
                    "-----------------------------",
                    "*True* if this node has at least one child node",
                ].join("\n")
            },
            {
                name: "HasTable",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) ITableListNode.HasTable: Boolean",
                    "-----------------------------",
                    "*True* if this node references a table.",
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) ITableListNode.Item[Index: Variant]: ITableListNode",
                    "-----------------------------",
                    "Returns the specified child node. This is the default property.",
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) ITableListNode.Name: String",
                    "-----------------------------",
                    "The name of the node."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                readonly: true,
                note: [
                    "(property) ITableListNode.Parent: ITableListNode | IDocument",
                    "-----------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `TableListNode` object will return either the parent `TableListNode` or a `Document` object"
                ].join("\n")
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ITableListNode.Description: String",
                    "-----------------------------",
                    "A description of the node.",
                ].join("\n")
            },
            {
                name: "Table",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                note: [
                    "(property) ITableListNode.Table: ITable",
                    "-----------------------------",
                    "The table object associated with the node.",
                    "",
                    "### Remarks",
                    "When a `Table` object is removed from the `IDocument.Tables` collection any node that references that `Table` object is also removed."
                ].join("\n")
            }
        ],
        methods: [
            {
                name: "AddNewGrid",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                    },
                    {
                        name: "Field",
                        type: BasicTypeDefinitions.string,
                    },
                    {
                        name: "Orientation",
                        type: createBuiltInDefPlaceHolder("DisplayOrientation"),
                        optional: true,
                        defaultValue: "doDefault"
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\""
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                    },
                ],
                note: [
                    "(method) ITableListNode.AddNewGrid(Name: String, Field: String, [Orientation: DisplayOrientation = doDefault], [Description: String = \"\"], [Index: Long = -1]): ITable",
                    "-----------------------------",
                    "Adds a new child node that references grid table.",
                    "",
                    "### Remarks",
                    "The `AddNewGrid` method simplifies the three steps that are normally required to add a child node that references a grid table. This steps the `AddNewGrid` method performs are:",
                    "+ Creates a new node using `ITableListNode.AddNewNode()`",
                    "+ Creates a new table using `IDocument.Tables.AddNewGrid()`",
                    "+ Assigns the table to the node using the `ITableListNode.Table` property of the new node",
                    "The `AddNewGrid` method can be thought of as adding a new table object to a group of tables. The new node will have the same name as the table object. For information about the rest of the parameters see the `ITables.AddNewGrid` method.",
                    "The `AddNewGrid` method creates a new node and a new table object. Removing the node doesn't automatically remove the table from the `IDocument.Tables` collection as it's possible that other nodes are also referencing the same table. Removing the table from the `IDocument.Tables` collection will however remove all nodes that reference that table.",
                ].join("\n")
            },
            {
                name: "AddNewNode",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        note: "The name of the node",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "An optional description for the node",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The position in the collection to insert the new node. The new node is inserted at the specified integer position. The index of the node that is currently at that position and all following nodes is increased by one. If the index is not specified, or is specified as -1, then the node is appended to the end of the collection.",
                    },
                ],
                note: [
                    "(method) ITableListNode.AddNewNode(Name: String, [Description: String = \"\"], [Index: Long = -1]): ITableListNode",
                    "-----------------------------",
                    "Adds a new child node",
                    "",
                    "### Parameters",
                    "- `Name`: *String* - The name of the node",
                    "- `Description`: *String* - An optional description for the node",
                    "- `Index`: *Long* - The position in the collection to insert the new node. The new node is inserted at the specified integer position. The index of the node that is currently at that position and all following nodes is increased by one. If the index is not specified, or is specified as -1, then the node is appended to the end of the collection.",
                    "",
                    "### Return Value",
                    "The newly added `TableListNode` object.",
                    "",
                    "### Remarks",
                    "The `AddNewNode` method creates a new `TableListNode` object and adds it as a child of the current node.",
                    "",
                    "### Examples",
                    "```ds",
                    "Set Group1 = TableDoc.GroupedTables.AddNewNode(\"Group1\", \"A group of related tables\")",
                    "Group1.AddNewNode(\"Group1b\", \"A sub-group of Group 1\")",
                    "```",
                ].join("\n")
            },
            {
                name: "AddNewTable",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITable"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                    },
                    {
                        name: "Specification",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                    },
                ],
                note: [
                    "(method) ITableListNode.AddNewTable(Name: String, [Specification: String = \"\"], [Description: String = \"\"], [Index: Long = -1]): ITable",
                    "-----------------------------",
                    "Adds a new child node that references table.",
                    "",
                    "### Remarks",
                    "The `AddNewTable` method simplifies the three steps that are normally required to add a child node that references a table. This steps the `AddNewTable` method performs are:",
                    "+ Creates a new node using `ITableListNode.AddNewNode()`",
                    "+ Creates a new table using `IDocument.Tables.AddNew()`",
                    "+ Assigns the table to the node using the `ITableListNode.Table` property of the new node",
                    "",
                    "The `AddNewTable` method can be thought of as adding a new `Table` object to a group of tables. The new node will have the same name as the table object. For information about the rest of the parameters see the `ITables.AddNew` method.",
                    "The `AddNewTable` method creates a new node and a new table object. Removing the node doesn't automatically remove the table from the `IDocument.Tables` collection as it's possible that other nodes are also referencing the same table. Removing the table from the `IDocument.Tables` collection will however remove all nodes that reference that table.",
                ].join("\n")
            },
            {
                name: "AddNode",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                arguments: [
                    {
                        name: "Node",
                        type: createBuiltInDefPlaceHolder("ITableListNode"),
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1
                    }
                ],
                note: [
                    "(method) ITableListNode.AddNode(Node: ITableListNode, [Index: Long = -1]): ITableListNode",
                    "-----------------------------",
                    "Add an existing node as a child of the current node.",
                    "",
                    "### Remarks",
                    "The `AddNode` method can be used to move an existing node to a new position in the hierarchy of nodes. If the node being added still exists at another position in the hierarchy of nodes then it is removed from that position before being added as a child of the current node.",
                    "",
                    "### Examples",
                    "To move *Group1b* which is a child of *Group1* so that it is instead a child of *Group2*:",
                    "```ds",
                    "Set Group1b = TableDoc.GroupedTables[\"Group1\"].ChildNode[\"Group1b\"]",
                    "TableDoc.GroupedTables[\"Group2\"].AddNode(Group1b)",
                    "```",
                ].join("\n")
            },
            {
                name: "AddTable",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("ITableListNode"),
                arguments: [
                    {
                        name: "Table",
                        type: createBuiltInDefPlaceHolder("ITable"),
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1
                    }
                ],
                note: [
                    "(method) ITableListNode.AddTable(Table: ITable, [Index: Long = -1]): ITableListNode",
                    "-----------------------------",
                    "Add an existing table as new node that is a child of the current node.",
                    "",
                    "### Remarks",
                    "The `AddTable` method adds a new child node to represent and reference the specified table. The `AddTable` method simplifies the 3 steps that are normally required to achieve this. The steps the `AddTable` method performs are:",
                    "+ Retrieves the name of the table object using ITable.Name",
                    "+ Adds a new node using `ITableListNode.AddNewNode()`",
                    "+ Set the new node to reference the table by setting the `ITableListNode.Table` property of the new node",
                    "",
                    "### Examples",
                    "To add a table called \"Rating\" as a child of the *Group1* node.",
                    "```ds",
                    "Set RatingTable = TableDoc.Table[\"Rating\"]",
                    "ITableDoc.GroupedTables[\"Group1\"].AddTable(RatingTable)",
                    "```",
                ].join("\n")
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ITableListNode.Clear(): Void",
                    "-----------------------------",
                    "Removes all child nodes"
                ].join("\n"),
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "A reference to the child node to be removed. This is either the integer index of the node or the name of the node."
                    }
                ],
                note: [
                    "(method) ITableListNode.Remove(Index: Variant): Void",
                    "-----------------------------",
                    "Removes a child node",
                ].join("\n")
            }
        ]
    },
    {
        name: "ITableDefaults",
        definitionType: "interface",
        note: [
            "(interface) ITableDefaults",
            "-----------------------------",
            "The `TableDefaults` object contains properties that define the initial state of a newly created Table object. These default properties are set to \"sensible\" values when the `Document` object is first created. These initial defaults allow simple tables to be created with a minimal amount of code. Separate TableDefaults objects are used for aggregated and profile tables (IDocument.Default and IDocument.ProfileDefault respectively).",
        ].join("\n"),
        properties: [
            {
                name: "Annotations",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAnnotations"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Annotations: IAnnotations",
                    "-----------------------------",
                    "A collection of `Annotation` objects. These are copied to the `Annotations` collection of the Table object when a new table is created.",
                    "",
                    "### Remarks",
                    "The following annotations are initially specified:",
                    "+ **Title** Header = \"{ProjectDescription}\"",
                    "+ **Left** Header = \"{TableDescription}{Filters}\"",
                    "+ **Right** Header = \"{TableNumber}{WeightVariable}{Level}\"",
                    "+ **Left** Footer = \"{CellContents}{Statistics}{Rules}\"",
                    "",
                    "The default annotations for profile tables (`IDocument.ProfileDefault.Annotations`) have an empty left footer annotation by default as statistics and rules aren't applicable to profile tables and there is only ever one cell item so the CellContents annotation is redundant.",
                ].join("\n"),
            },
            {
                name: "Axes",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxes"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Axes: IAxes",
                    "-----------------------------",
                    "A collection of `Axis` objects. These are copied to the `Axes` collection of the `Table` object when a new table is created. This collection is initially empty."
                ].join("\n"),
            },
            {
                name: "CellItems",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellItems"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.CellItems: ICellItems",
                    "-----------------------------",
                    "A collection of `CellItem` objects. These are copied to the `CellItems` collection of the Table object when a new table is created.",
                    "",
                    "### Remarks",
                    "The `IDocument.Default.CellItems` collection initially contains two `CellItem` objects. These are:",
                    "+ Counts to zero decimal places",
                    "+ Column percentages to zero decimal places",
                    "",
                    "The `IDocument.ProfileDefault.CellItems` collection only contains one `CellItem` object, which is a *itProfileResult* cell item. The `IDocument.ProfileDefault.CellItems` collection can not be modified (i.e. new cell items added), although the default *itProfileResult* cell item can be modified.",
                ].join("\n"),
            },
            {
                name: "Filters",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFilters"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Filters: IFilters",
                    "-----------------------------",
                    "A collection of `Filter` objects. These are copied to the `Filters` collection of the `Table` object when a new table is created. This collection is initially empty.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Parent: IDocument",
                    "-----------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `TableDefaults` object always returns a `Document` object"
                ].join("\n"),
            },
            {
                name: "Properties",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Properties: IProperties",
                    "-----------------------------",
                    "A collection of `Property` objects. These are copied to the `Properties` collection of the `Table` object when a new table is created. See `ITable.Properties` for more information.",
                ].join("\n"),
            },
            {
                name: "Rules",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IRules"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Rules: IRules",
                    "-----------------------------",
                    "A collection of `Rule` objects. These are copied to the `Rules` collection of the `Table` object when a new table is created. This collection is initially empty.",
                ].join("\n"),
            },
            {
                name: "Statistics",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistics"),
                readonly: true,
                note: [
                    "(property) ITableDefaults.Statistics: IStatistics",
                    "-----------------------------",
                    "A collection of `Statistic` objects. These are copied to the `Statistics` collection of the `Table` object when a new table is created. This collection is initially empty.",
                    "",
                    "### Remarks",
                    "This is a read-only property. Users cannot modify its properties by accessing `ITableDefaults.Statistics`."
                ].join("\n"),
            },
            {
                name: "SortColumn",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ITableDefaults.SortColumn: String",
                    "-----------------------------",
                    "The default `SortColumn` settings for new tables.",
                    "",
                    "### Remarks",
                    "The `ITableDefaults.SortColumn` settings are copied to the `ITable.SortColumn` property when a new table is created. The `ITableDefaults.SortColumn.ElementRef` property is initially empty (i.e. no sorting occurs). See `ISortSpecification` for more information on specifying the element to sort on and the order in which to sort.",
                ].join("\n"),
            },
            {
                name: "SortRow",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ITableDefaults.SortRow: String",
                    "-----------------------------",
                    "The default `SortRow` settings for new tables.",
                    "",
                    "### Remarks",
                    "The `ITableDefaults.SortRow` settings are copied to the `ITable.SortRow` property when a new table is created. The `ITableDefaults.SortRow.ElementRef` property is initially empty (i.e. no sorting occurs). See `ISortSpecification` for more information on specifying the element to sort on and the order in which to sort.",
                    "The `SortRow` property is not relevant to profile tables.",
                ].join("\n"),
            },
            {
                name: "Weight",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) ITableDefaults.Weight: String",
                    "-----------------------------",
                    "The default value of the `Weight` property for new tables.",
                    "",
                    "### Remarks",
                    "The value of this property is copied to the `ITable.Weight` property when a new table is created. This property is initially empty (i.e. no weighting applied)"
                ].join("\n"),
            }
        ],
        methods: [
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ITableDefaults.Clear(): Void",
                    "-----------------------------",
                    "Clears all the properties of the TableDefaults object"
                ].join("\n")
            },
            {
                name: "Reset",
                definitionType: "method",
                note: [
                    "(method) ITableDefaults.Reset(): Void",
                    "-----------------------------",
                    "Resets all the properties of the TableDefaults object to what they were when the Document object was initially created."
                ].join("\n"),
            }
        ]
    },
    {
        name: "ITableGlobals",
        definitionType: "interface",
        note: [
            "(interface) ITableGlobals",
            "-----------------------------",
            "The `TableGlobals` object contains settings that are applied to all tables in the table document.",
            "",
            "### Remarks",
            "These settings are merged in with the properties of each individual table when the tables are populated. In general, the global settings appear before any of the per-table settings.",
        ].join("\n"),
        properties: [
            {
                name: "Annotations",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAnnotations"),
                readonly: true,
                note: [
                    "(property) ITableGlobals.Annotations: IAnnotations",
                    "-----------------------------",
                    "A collection of `Annotation` objects that are applied to all tables in the collection.",
                    "",
                    "### Remarks",
                    "If the corresponding annotation object on an individual table already has a specification set then it is concatenated onto the global annotation such that the global annotation is first and there is a tag between the two annotations. This `Annotations` collection is initially empty.",
                    "",
                    "### Examples",
                    "```ds",
                    "Table.Annotations[1].Specification = \"Weight Variable: {Weight}\"",
                    "TableDoc.Global.Annotations[1].Specification = \"Description: {ProjectDescription}\"",
                    "```",
                    "Will result in the annotation:",
                    "\"Weight Variable: {Weight} [Line break] Description: {ProjectDescription}\"",
                ].join("\n"),
            },
            {
                name: "CellItems",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellItems"),
                readonly: true,
                note: [
                    "(property) ITableGlobals.CellItems: ICellItems",
                    "-----------------------------",
                    "A collection of `CellItem` objects that are applied to all tables in the collection.",
                    "",
                    "### Remarks",
                    "The cell items in this collection appear before cell items on the individual tables. If an individual table already has a cell item with the same type, variable, and cutoff value then the global cell item is not applied to that table. This collection is initially empty.",
                ].join("\n"),
            },
            {
                name: "Filters",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFilters"),
                readonly: true,
                note: [
                    "(property) ITableGlobals.Filters: IFilters",
                    "-----------------------------",
                    "A collection of `Filter` objects that are applied to all the tables in the collection.",
                    "",
                    "### Remarks",
                    "The filters in this collection are combined (ANDed) with the filters for the individual tables. This collection is initially empty.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                readonly: true,
                note: [
                    "(property) ITableGlobals.Parent: IDocument",
                    "-----------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `TableDefaults` object always returns a `Document` object"
                ].join("\n"),
            },
            {
                name: "Statistics",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStatistics"),
                readonly: true,
                note: [
                    "(property) ITableGlobals.Statistics: IStatistics",
                    "-----------------------------",
                    "A collection of `Statistic` objects that are applied to all tables in the collection.",
                    "",
                    "### Remarks",
                    "The statistics in this collection are merged with the statistics for the individual tables. If an individual table already has a statistic of the same name as one that exists in this collection then the statistic on the table is used instead of the global statistic (the configuration of the local table statistic may be slightly different from the global one). This collection is initially empty. Please also be advised that since this is a read-only property. Users cannot modify its properties by accessing `ITableGlobals.Statistics`."
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) ITableGlobals.Clear(): Void",
                    "-----------------------------",
                    "Clears all the properties of the `TableGlobals` object.",
                    "",
                    "### Remarks",
                    "The `Clear` method performs the following actions:",
                    "+ Clears the `CellItems` collection",
                    "+ Clears the `Filters` collection",
                    "+ Clears the `Statistics` collection",
                    "+ Clears the `Annotations` collection",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IDataSet",
        definitionType: "interface",
        note: [
            "(interface) IDataSet",
            "-----------------------------",
            "The `DataSet` object represents the data that the table is to be based upon. The `Load()` method of the `DataSet` object needs to be called soon after creating a Document object in order to set the data set to be used for the tables.",
            "",
            "### Remarks",
            "The data set is split into metadata and case data. The metadata to use is specified in the call to the `Load` method and can not be changed without calling the Load method again, which will clear the Document. The case data is only required when the tables are populated and can therefore be changed at any time."
        ].join("\n"),
        properties: [
            {
                name: "CanChangeView",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IDataSet.CanChangeView: Boolean",
                    "-----------------------------",
                    "*True* if the View property can be changed.",
                    "",
                    "### Remarks",
                    "It is not possible to change the `View` property if any object in the table document could potentially reference a variable or field in the metadata. Modifying the `View` property when `CanChangeView` is False will generate an error.",
                ].join("\n"),
            },
            {
                name: "HasHdata",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IDataSet.HasHdata: Boolean",
                    "-----------------------------",
                    "*True* if the current data set supports *HDATA*.",
                    "",
                    "### Remarks",
                    "A data set must support either *VDATA* or *HDATA*, or possibly both. Since v3.5 a *HDATA* view is automatically created for *CDSCs* that only support *VDATA*. This means the `HasHdata` property will always be True.",
                    "Please read the Data Model documentation in the Data Collection Developer Library for more information on the difference between *VDATA* and *HDATA*.",
                ].join("\n"),
            },
            {
                name: "HasVdata",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IDataSet.HasVdata: Boolean",
                    "-----------------------------",
                    "*True* if the current data set supports *VDATA*.",
                    "",
                    "### Remarks",
                    "A data set must support either *VDATA* or *HDATA*, or possibly both. Since v4.5 a *VDATA* view is automatically created for *CDSCs* that only support *HDATA*. This means the `HasVdata` property will always be *True*.",
                    "Please read the Data Model documentation in the Data Collection Developer Library for more information on the difference between *VDATA* and *HDATA*.",
                ].join("\n"),
            },
            {
                name: "MdmChangeTracker",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IChangeTracker"),
                readonly: true,
                note: [
                    "(property) IDataSet.MdmChangeTracker: IChangeTracker",
                    "-----------------------------",
                    "A `ChangeTracker` object which can be used to track changes to the `MdmDocument`",
                    "",
                    "### Remarks",
                    "The `MdmChangeTracker` property returns the `ChangeTracker` object that `TOM` uses to track changes to the metadata document. As fields in the `MdmDocument` are modified and removed, and new fields are added then appropriate methods on the `MdmChangeTracker` object should be called. These track the changes to the metadata, which are also saved when the table document is saved. When the table document is opened again the previously saved changes are re-applied to the `MdmDocument`.",
                ].join("\n"),
            },
            {
                name: "MdmDocument",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                readonly: true,
                note: [
                    "(property) IDataSet.MdmDocument: IDocument",
                    "-----------------------------",
                    "The metadata document loaded.",
                    "",
                    "### Remarks",
                    "The MDM Document is documented in the Data Model section of the Data Collection Developer Library.",
                ].join("\n"),
            },
            {
                name: "MdscName",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IDataSet.MdscName: String",
                    "-----------------------------",
                    "The name of the *DSC* used to load the metadata.",
                ].join("\n")
            },
            {
                name: "MetaDataLocation",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IDataSet.MetaDataLocation: String",
                    "-----------------------------",
                    "The location of the metadata.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                readonly: true,
                note: [
                    "(property) IDataSet.Parent: IDocument",
                    "-----------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `DataSet` object always returns a `Document` object",
                ].join("\n"),
            },
            {
                name: "Variables",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IVariableListItem"),
                readonly: true,
                note: [
                    "(property) IDataSet.Variables: IVariableListItem",
                    "-----------------------------",
                    "The `Variables` for the open data set.",
                    "",
                    "### Remarks",
                    "The `Variables` property can be used to manage the variables for the data set. `Variables` can be added, removed, renamed, and grouped using the `Variables` property.",
                ].join("\n"),
            },
            {
                name: "Version",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IDataSet.Version: String",
                    "-----------------------------",
                    "The version specification of the metadata loaded.",
                ].join("\n"),
            },
            {
                name: "CdscName",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IDataSet.CdscName: String",
                    "----------------------",
                    "The name of the *DSC* to be used to access the case data.",
                ].join("\n"),
            },
            {
                name: "DbLocation",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IDataSet.DbLocation: String",
                    "----------------------",
                    "The location of the case data for the table. The content of this string depends on the specific case data *DSC* that is used.",
                ].join("\n"),
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IDataSet.Description: String",
                    "----------------------",
                    "A user specified description of the contents of this data set. This can be used as an annotation on the table.",
                ].join("\n"),
            },
            {
                name: "Filter",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IDataSet.Filter: String",
                    "----------------------",
                    "The global filter for *CDSCs* that natively support case data filtering.",
                    "",
                    "### Remarks",
                    "Some CDSCs, for example *mrRdbDsc2*, support the ability to natively filter the case data. If the *CDSC* supports native case data filtering the `Filter` property can effectively be used to specify a global filter to be applied to all case data. ",
                    "Depending on the particular *CDSC* this filter can be highly efficient. Note however that if the *CDSC* currently selected doesn't implement case data filtering then attempting to set a value for the `Filter` property will cause an error.",
                    "When using the *dvHDATA* view of the data the filter is always applied at the top (*HDATA*) level.",
                    "The `Filter` property only currently applies to *ttAggregated* tables. *ttProfile* tables are unaffected, although this may change in the future.",
                ].join("\n"),
            },
            {
                name: "Project",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IDataSet.Project: String",
                    "----------------------",
                    "The specific project to use in the case of a *DSC* that supports multiple projects per database.",
                ].join("\n"),
            },
            {
                name: "View",
                returnType: createBuiltInDefPlaceHolder("DataSetView") ,
                definitionType: "property",
                note: [
                    "(property) IDataSet.View: DataSetView",
                    "----------------------",
                    "The view of the data set that is currently being used.",
                    "",
                    "### Remarks",
                    "If the data set only supports *VDATA* then this property can only be set to *dvVDATA*. If the data set only supports *HDATA* then this property can only be set to *dvHDATA*. If the data set support both *VDATA* and *HDATA* then this property can be used to select the view of the data to use. The view selected determines how field and variable names can be used in the table and axis specifications. If the data set supports both *HDATA* and *VDATA* then `View` is set to *dvHDATA* by default."
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "Load",
                definitionType: "method",
                arguments: [
                    {
                        name: "MetaData",
                        type: BasicTypeDefinitions.variant,
                        note: "The location of the metadata to use. The format of this string depends on the MDSC, but is typically a location of an .MDD or some other type of file. This can also be an existing MDM document object.",
                    },
                    {
                        name: "MDSC",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The metadata *DSC* to use e.g. *mrQvDsc*, or empty if no *MDSC* is required",
                    },
                    {
                        name: "DbLocation",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The location of the case data to use. The format of this string depends on the *CDSC*",
                    },
                    {
                        name: "CDSC",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The case data dsc to use e.g. *mrQdiDrsDsc*",
                    },
                    {
                        name: "Project",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The project name to use if the *CDSC* supports multiple projects. Otherwise this parameter is ignored.",
                    },
                    {
                        name: "Version",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "{..}",
                        note: "A version specified for the metadata to use. The default specification string is “{..}” (the 'SuperVersion') which means to use all locked versions in the metadata.",
                    },
                ],
                note: [
                    "(method) IDataSet.Load(MetaData: Variant, [MDSC: String = \"\"], [DbLocation: String = \"\"], [CDSC: String = \"\"], [Project: String = \"\"], [Version: String = {..}]): Void",
                    "----------------------",
                    "Loads the metadata and case data to be used.",
                    "",
                    "### Remarks",
                    "The metadata and case data to base the `Document` on can be specified in a number of ways:",
                    "+ A metadata document (MDD file) can be specified (default `DataSource` is used)",
                    "+ A metadata *DSC* and metadata location can be specified (default `DataSource` is used)",
                    "+ A *CDSC* and database location can be specified to override the default `DataSource` in the metadata",
                    "+ A specify version or superversion of the metadata can be specified.",
                    "",
                    "### Example",
                    "+ Only metadata specified. This can be a path to a .mdd file or an instantiated in-memory mdm document. e.g. `Load(\"c:\\projects\\museum.mdd\")`. or `Load(thisMddDoc)`",
                    "+ Metadata location and metadata *DSC*. The metadata *DSC* specified (e.g. mrSavDsc) is used to read the data. e.g. `Load(\"c:\\projects\\savfile.sav\", \"mrSavDsc\")`",
                    "+ Metadata and case-data location. If the `DbLocation` is specified (but without a CDSC), then the default CDSC is used but with the specified case data. e.g. `Load(\"c:\\skidemo\\skidemo.mdd\", , \"c:\\skidemo_new\")`",
                    "+ Metadata, Metadata DSC, and case-data.  The default CDSC specified in the metadata can be overridden with the specified case data CDSC and location. e.g. `Load(\"c:\\museum\\museum.qdi\", \"mrQdiDrsDSC\", \"c:\\museum\\museum.drs\", \"mrQdiDrsDSC\")`",
                    "+ Specific metadata version. The version or versions of the metadata to use can be specified using the Version parameter.  See the 'Version Expressions' topic in the Data Collection Developer Library for more information. e.g. `Load(\"c:\\projects\\museums.mdd\", , , , , \"{1..4:3, 7, 5, 11}\")`",
                ].join("\n"),
            },
            {
                name: "ValidateCaseData",
                definitionType: "method",
                note: [
                    "(method) IDataSet.ValidateCaseData(): Void",
                    "----------------------",
                    "Attempts to connect to the case data and returns an error if the case data can't be accessed",
                    "",
                    "### Remarks",
                    "The `CdscName`, `DbLocation`, and `Project` properties specify the case data to use when populating the tables. The actual connection to the case data isn't established until the `IDocument.Populate()` method is called. The `ValidateCaseData()` method can be used at any time to check that a connection to the case data can be established, without actually populating the tables. If the case data exists and can be accessed the `ValidateCaseData` method will return without error, otherwise it will return an error message describing why the case data can't be accessed.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IExports",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IExports",
            "-------------------------",
            "A collection of `Export` objects. Each `Export` object represents an export plug-in that can be used to export the tables in the document to a particular output format.",
            "",
            "### Remarks",
            "The `Exports` collection is automatically populated with `Export` objects when the `Document` object is initially created.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IExports.Count: Long",
                    "-------------------------",
                    "The number of `Export` objects in the collection.",
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IExport"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant
                },
                note: [
                    "(property) IExports.Item[Index: Variant]: IExport",
                    "-------------------------",
                    "Returns the specified `Export` object in the collection.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IDocument"),
                readonly: true,
                note: [
                    "(property) IExports.Parent: IDocument",
                    "-------------------------",
                    "The parent object",
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IExport"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        note: "The name used to reference the Export object within the collection.",
                    },
                    {
                        name: "ClassId",
                        type: BasicTypeDefinitions.string,
                        note: "The `ClassId` string of the class that implements the export.",
                    },
                    {
                        name: "CodeBase",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "The location of the codebase (the *CAB* file) for the export plug-in. See IExport.CodeBase",
                    },
                    {
                        name: "Description",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "\"\"",
                        note: "A description of the plug-in.",
                    },
                ],
                note: [
                    "(method) IExports.AddNew(Name: String, ClassId: String, [CodeBase: String = \"\"], [Description: String = \"\"]): IExport",
                    "-------------------------",
                    "Creates a new `Export` object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "Normally the `Exports` collection is populated with all installed export plug-ins when the `Document` object is created. The `AddNew` method can be used to dynamically add export plug-ins at run-time that have not been registered.",
                ].join("\n"),
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IExports.Clear(): Void",
                    "-------------------------",
                    "Removes all Export objects from the collection",
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "A reference to an `Export` object. This is either the integer position of the export within the collection or the name of the export.",
                    }
                ],
                note: [
                    "(method) IExports.Remove(Index: Variant): Void",
                    "-------------------------",
                    "Removes the specified `Export` object from the collection.",
                ].join("\n"),
            }
        ]
    },
    {
        name: "IExport",
        definitionType: "interface",
        note: [
            "(interface) IExport",
            "-------------------------",
            "Each `Export` object represents an export plug-in that can be used to export the tables in the document to a particular output format. The `Export` object serves to make the presence of the export plug-in transparent to the user of the `Table Object Model`.",
        ].join("\n"),
        properties: [
            {
                name: "ClassId",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IExport.ClassId: String",
                    "-------------------------",
                    "The `ClassId` string of the class that implements the export plug-in.",
                ].join("\n"),
            },
            {
                name: "CodeBase",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IExport.CodeBase: String",
                    "-------------------------",
                    "The location of the binary code for the plug-in. This will typically be the location of a signed CAB file for download from a web server. This is to enable the export plug-in to be downloaded and run on the client in a client/server situation.",
                ].join("\n")
            },
            {
                name: "Description",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IExport.Description: String",
                    "-------------------------",
                    "A description of the export plug-in",
                ].join("\n"),
            },
            {
                name: "IsServerOnly",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IExport.IsServerOnly: Boolean",
                    "-------------------------",
                    "If there is no `CodeBase` specified then `IsServerOnly` is *True*, because there is no code that can be downloaded and run on the client.",
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IExport.Name: String",
                    "-------------------------",
                    "The name of the `Export` object and the corresponding export plug-in",
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IExports"),
                readonly: true,
                note: [
                    "(property) IExport.Parent: IExports",
                    "-------------------------",
                    "The `Parent` property of the `Export` object always returns an `Exports` collection",
                ].join("\n")
            },
            {
                name: "Properties",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IProperties"),
                readonly: true,
                note: [
                    "(property) IExport.Properties: IProperties",
                    "-------------------------",
                    "The exact `Property` objects in the collection are dependent on the particular export plug-in. For more information, see `Exporting` Tables.",
                ].join("\n")
            },
        ],
        methods: [
            {
                name: "Export",
                definitionType: "method",
                returnType: BasicTypeDefinitions.variant ,
                arguments: [
                    {
                        name: "Destination",
                        type: BasicTypeDefinitions.variant,
                        optional: true,
                        note: "Normally the destination of the result of the export. The meaning of the `Destination` parameter is dependent on the particular export plug-in.",
                    },
                    {
                        name: "Tables",
                        type: BasicTypeDefinitions.variant,
                        optional: true,
                        note: "A table or list of tables to be exported. This is similar to the `Tables` parameter of the `IDocument.Populate` method.",
                    }
                ],
                note: [
                    "(method) IExport.Export([Destination: Variant], [Tables: Variant]): Variant",
                    "-------------------------",
                    "Invokes the export plug-in in order to export the specified tables.",
                    "",
                    "### Remarks",
                    "The `Destination` parameter is used as a short-cut. If the export plug-in has a `Destination` property then its value is set to the value of the `Destination` parameter. If the export plug-in does not have a destination property then the `Destination` parameter is ignored.",
                    "",
                    "### Example",
                    "```ds",
                    "TableDoc.Exports[\"mrHtmlExport\"].Export(\"C:\\tables\\agebygender.htm\", \"Table4\")",
                    "```",
                ].join("\n")
            }
        ]
    },
    {
        name: "IElements",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IElements",
            "----------------------",
            "A collection of Element objects.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IElements.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElement"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant
                },
                note: [
                    "(property) IElements.Item[Index: Variant]: IElement",
                    "-------------------------",
                    "Returns a specified element in the collection.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxis"),
                readonly: true,
                note: [
                    "(property) IElements.Parent: IElement | IAxis",
                    "-------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Elements` object will either return a `Net` or `Combine` Element or an `Axis` object."
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "Add",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IElement"),
                arguments: [
                    {
                        name: "ElementName",
                        type: BasicTypeDefinitions.string,
                        note: "The name of the MDM object. For an aggregated table it must be an element within the MDM variable which the axis is based on. For a profile table it must be the name of an MDM variable.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The position in the collection to insert the element. See the Index parameter of the IElements.AddNew method for more information.",
                    },
                ],
                note: [
                    "(method) IElements.Add(ElementName: String, [Index: Long = -1]): IElement",
                    "-------------------------",
                    "Creates a new `Element` object based on an MDM object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "For a table of type *ttAggregated* the `Add()` method adds an `Element` object based on an MDM `element` into the collection. The `ElementName` must be the name of an element in the MDM variable which the axis is based on. The name of the MDM element is also used as the name of the `Element` object that is created. Therefore, the name of elements added using the `AddNew` method should be chosen so that don't conflict with the name of any existing MDM element that you may wish to add later using this `Add` method. If an analysis element is added called 'mean' (using the `IElements.AddNew` method), this `Add` method will fail if you attempt to add an MDM element called 'mean' because the collection will already contain an element of that name.",
                    "For a table of type *ttProfile* the `Add()` method adds an `Element` object based on an MDM variable. The new `Element` object will have a type of eProfile.",
                    "",
                    "### Example",
                    "```ds",
                    "MyAgeAxis.Elements.Add(\"E65_years\")",
                    "```",
                ].join("\n"),
            },
            {
                name: "AddNew",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IElement"),
                arguments: [
                    {
                        name: "Name",
                        type: BasicTypeDefinitions.string,
                        note: "The name for the new element",
                    },
                    {
                        name: "Type",
                        type: createBuiltInDefPlaceHolder("ElementType"),
                        note: "The type of element to add",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The position in the collection to insert the element. The new element is inserted at the specified integer position. The index of the element that is currently at that position and all following elements is increased by one. If the index is not specified, or is specified as -1, then the element is appended to the end of the collection.",
                    }
                ],
                note: [
                    "(method) IElements.Add(ElementName: String, [Index: Long = -1]): IElement",
                    "-------------------------",
                    "Creates a new Element object and adds it to the collection.",
                    "",
                    "### Remarks",
                    "This is used to add new elements to the axis that do not exist in the base MDM field or variable (MDM elements are added using the IElements.Add method). The following ElementType values are valid as the Type parameter:",
                    "+ eBase",
                    "+ eUnweightedBase",
                    "+ eEffectiveBase",
                    "+ eMean",
                    "+ eStdDev",
                    "+ eStdErr",
                    "+ eSampleVar",
                    "+ eTValue",
                    "+ eTProb",
                    "+ eTotal",
                    "+ eSubTotal",
                    "+ eText",
                    "+ eMinimum",
                    "+ eMaximum",
                    "+ eMedian",
                    "+ eMode",
                    "+ ePercentile",
                    "+ eNet",
                    "+ eCombine",
                    "+ eExpression",
                    "+ eNumeric",
                    "+ ePairedPref",
                    "+ eNetDiffs",
                    "+ eDerived",
                    "+ eSum",
                    "",
                    "### Example",
                    "```ds",
                    "MyAgeAxis.Elements.AddNew(\"meanage\", eMean)   ' Add a factor based mean value",
                    "```"
                ].join("\n"),
            },
            {
                name: "AddNewFromMdmVariable",
                definitionType: "method",
                returnType: createBuiltInDefPlaceHolder("IElement"),
                arguments: [
                    {
                        name: "NewElementName",
                        type: BasicTypeDefinitions.string,
                        note: "The name to give to the new element.",
                    },
                    {
                        name: "MdmVariableName",
                        type: BasicTypeDefinitions.string,
                        note: "The name of the MDM variable. It must be a variable which exists in the MDM document.",
                    },
                    {
                        name: "MdmElementName",
                        type: BasicTypeDefinitions.string,
                        note: "The name of the MDM element. It must be an element within the specified MDM variable.",
                    },
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The position in the collection to insert the element.",
                    },
                ],
                note: [
                    "(method) IElements.AddNewFromMdmVariable(NewElementName: String, MdmVariableName: String, MdmElementName: String, [Index: Long = -1]): IElement",
                    "-------------------------",
                    "Creates a new `Element` object based on an MDM variable and element and adds it to the collection.",
                    "",
                    "### Remarks",
                    "Adds a new `Element` object based on an MDM variable and element into the collection. The `NewElementName` is the name to be given to the element created by `AddNewFromMdmVariable`. The `MdmVariableName` must be the name of an existing MDM variable, and the `MdmElementName` must be the name of an element within that variable.",
                    "If the MDM element is a category element, the newly created TOM element will be an expression element. If the MDM element is of any other type, the `TOM` element will be set to the same type as the one it is based on. If the MDM element has data, an expression of `\"MdmVariableName >= {MdmElementName}\"` is set on the TOM element.",
                    "Properties on the MDM element, such as decimal places and whether the element is hidden, are copied to the TOM element as it is created. Thereafter, the element behaves like one created with `IElements.AddNew` rather than IElements.Add in that, if a property on the MDM element is changed after the new element is created, the TOM element's property will remain unchanged.",
                    "",
                    "### Example",
                    "```ds",
                    "MyAgeAxis.Elements.AddNewFromMdmVariable(\"age65\", \"age\", \"E65_years\")",
                    "```",
                ].join("\n"),
            },
            {
                name: "Clear",
                definitionType: "method",
                note: [
                    "(method) IElements.Clear(): Void",
                    "-------------------------",
                    "Removes all `Element` objects from the collection",
                ].join("\n")
            },
            {
                name: "Remove",
                definitionType: "method",
                arguments: [
                    {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        note: "A reference to the object in the collection to remove. This is either the integer position of the object within the collection or the name of the Element object."
                    }
                ],
                note: [
                    "(method) IElements.Remove(Index: Variant): Void",
                    "-------------------------",
                    "Removes an `Element` object from the collection",
                ].join("\n")
            }
        ]
    },
    {
        name: "IElement",
        definitionType: "interface",
        note: [
            "(interface) IElement",
            "----------------------",
            "An `Element` is the smallest discrete unit in an axis. An element in a side axis corresponds to a row in the resulting two-dimensional table and an element in the top axis corresponds to a column. For an aggregated table an `Element` object typically corresponds to an MDM element (normally a category), but additional analysis elements that are not part of the MDM variable can also be created. For a profile table an `Element` object in the top axis corresponds to a variable to profile.",
        ].join("\n"),
        properties: [
            {
                name: "HasCellValues",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IElement.HasCellValues: Boolean",
                    "-------------------------",
                    "`HasCellValues` is *True* if there is a row or field in the `CellValues` ADO recordset corresponding to this Element object.",
                    "",
                    "### Remarks",
                    "If `HasCellValues` is *False* then there are no cell values corresponding to this element. This property will typically be False in the following situations:",
                    "+ For elements (except elements of type *eBase* and *eCategory*) that are part of an axis that is not located at the inner-most nest. `Elements` like *eMean*, *eMinimum*, *eSampleVar*, etc, only have `HasCellValues = True` if they are at the inner-most nest on the table.",
                    "+ For 'system' elements. A system element is generally any element marked as `'Hidden = True'` in the metadata, or an element of the type; *eSumWeightsSquared*, *eSumWeightsSquared*, *eSumN*, *eSumX*, *eSumXSquared*, or *eSumUnweightedN*.",
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IElement.Name: String",
                    "-------------------------",
                    "The name used to reference the `Element` object.",
                    "",
                    "### Remarks",
                    "If the element type is *eCategory* then there will also be an element with the same name in the associated MDM field or variable. If the element type is *eProfile* then there will exist an MDM variable of the same name."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElements"),
                readonly: true,
                isCollection: false,
                note: [
                    "(property) IElement.Parent: IElements",
                    "-------------------------",
                    "The parent object",
                    "",
                    "### Remarks",
                    "The `Parent` property of the `Element` object will return an `Elements` collection (either the `SubElements` collection of a `Net` or `Combine` element, or the `Elements` collection of a axis)",
                ].join("\n")
            },
            {
                name: "ShownOnTable",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IElement.ShownOnTable: Boolean",
                    "-------------------------",
                    "`ShownOnTable` is *True* if this element object is to be displayed on the table.",
                    "",
                    "### Remarks",
                    "This property is independent of the `HasCellValues` property. Normally `ShownOnTable` will be False if `HasCellValues` is *False*. But it is possible that the element should still be shown in the axis even if `HasCellValues` is *False*. This property will typically be *False* in the following situations:",
                    "+ For cell values that have been hidden due to a hide rule",
                    "+ In most situations where `HasCellValues = False`.",
                    "+ When `IsHidden = True`",
                ].join("\n")
            },
            {
                name: "Specification",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IElement.Specification: String",
                    "--------------------------",
                    "The specification of the element as it appears in the axis expression.",
                ].join("\n"),
            },
            {
                name: "Style",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                readonly: true,
                note: [
                    "(property) IElement.Style: IStyle",
                    "--------------------------",
                    "Controls the formatting of the element when displayed and exported.",
                ].join("\n")
            },
            {
                name: "SubElements",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElements"),
                readonly: true,
                note: [
                    "(property) IElement.SubElements: IElements",
                    "--------------------------",
                    "A collection of `Elements` objects that make up a net or combine element",
                    "",
                    "### Remarks",
                    "It is only possible to add elements to this collection if the element type is *eNet* or *eCombine*. Currently any type of element can be added to the `SubElements` collection, but this may be restricted in the future if it is determined that some elements are not valid.",
                ].join("\n")
            },
            {
                name: "Type",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ElementType") ,
                readonly: true,
                note: [
                    "(property) IElement.Type: ElementType",
                    "--------------------------",
                    "The type of element",
                ].join("\n")
            },
            {
                name: "AnalysisVariable",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IElement.AnalysisVariable: String",
                    "--------------------------",
                    "The name of the analysis variable used by an analysis element",
                    "",
                    "### Remarks",
                    "The `AnalysisVariable` property can optionally be specified for the following element types (if not specified then the factors of the preceding elements are used):",
                    "+ eMean",
                    "+ eStdDev",
                    "+ eStdErr",
                    "+ eSampleVar",
                    "+ eTValue",
                    "+ eTProb",
                    "",
                    "The `AnalysisVariable` property **MUST** be specified for the following element types:",
                    "+ eMinimum",
                    "+ eMaximum",
                    "+ eMedian",
                    "+ eMode",
                    "+ ePercentile",
                    "+ eNumeric",
                    "+ eSum",
                ].join("\n")
            },
            {
                name: "CalculationScope",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("CalculationScopeType") ,
                note: [
                    "(property) IElement.CalculationScope: CalculationScopeType",
                    "--------------------------",
                    "Determines the elements used in the calculation of some summary statistic elements",
                    "",
                    "### Remarks",
                    "The `CalculationScope` property currently affects *eMean*, *eStdDev*, *eStdErr*,*eSampleVar*, *eTValue* and *eTProb* elements that are calculated based on factors. It also affects the `Net` element.",
                    "When the `CalculationScope` property of one of these summary statistic elements is set to csAllElements, the calculation searches both the preceding and following elements for elements to include in the calculation.",
                    "When the `CalculationScope` property is set to *csPrecedingElements*, the calculation only searches the preceding elements for elements to include in the calculation.",
                    "The search for elements to include in the calculation of a summary statistic stops at:",
                    "+ any *eBase* element",
                    "+ the limits of the axis (i.e. the start or end of an axis)",
                    "+ the limits of a net (if the summary statistic element is inside a net)",
                    "",
                    "By default non-category elements, that can be filtered by an expression, are filtered by the net when added to a net. For example, the mean element in the net only includes the elements in the net. If the `CalculationScope` property of net element is set with *csAllElements*, the factor mean includes all elements, including elements in top and elements within nets. The default `CalculationScope` property for a net element is *csPrecedingElements*.",
                    "In versions prior to 2.2 the behavior of the *eMean*, *eStdDev*, *eStdErr*, and *eSampleVar* elements was equivalent to *csPrecedingElements*. The default `CalculationScope` for these elements when added via the `IElements.AddNew` method in version 2.2 and subsequent versions is *csAllElements*. Any *eMean*, *eStdDev*, *eStdErr*, or *eSampleVar* that exists in the metadata (and added via the `IElements.Add` method) will have a default of *csPrecedingElements* and therefore retain the original behavior.",
                    "Any element created in version 2.2 and later of TOM (by using `IElements.AddNew`) will have its `CalculationScope` property initially set to *csAllElements*. Any *eMean*, *eStdDev*, *eStdErr*, or *eSampleVar* element generated by adding a metadata element to TOM (using `IElements.Add`) will have its `CalculationScope` property initially set to *csPrecedingElements*. This preserves the original behavior for metadata elements. These default values will also apply for MTD files saved before version 2.2 when the CalculationScope property didn't exist.",
                ].join("\n")
            },
            {
                name: "ColumnText",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IElement.ColumnText: String",
                    "--------------------------",
                    "The text to insert in the cell for each column.",
                    "",
                    "### Remarks",
                    "This property is only valid for text elements and it is ignored when the text element is on the top axis. For a text element on the side axis, it inserts the text into the cell for each column. For example, if a side axis expression is specified as {.., T1 '' text() [ColumnText='-----'], T2 'Total' total()} then a row with ----- in each column will be displayed just above the total row.",
                ].join("\n")
            },
            {
                name: "CountsOnly",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.CountsOnly: Boolean",
                    "--------------------------",
                    "When set to *True*, this specifies that only the counts should be displayed for the row or column, regardless of what `CellItems` are specified for the table.",
                    "",
                    "### Remarks",
                    "This property is allowed on the following element types:",
                    "+ eCategory",
                    "+ eBase",
                    "+ eTotal",
                    "+ eSubTotal",
                    "+ eNet",
                    "+ eCombine",
                    "+ eExpression",
                    "+ eDerived",
                    "",
                    "A table cell will display only counts if either the row or the column has `CountsOnly` set to True",
                ].join("\n")
            },
            {
                name: "CutOffValue",
                definitionType: "property",
                returnType: BasicTypeDefinitions.double ,
                note: [
                    "(property) IElement.CutOffValue: Double",
                    "--------------------------",
                    "The cut off value for *ePercentile* elements",
                    "",
                    "### Remarks",
                    "The `CutOffValue` is only applicable to *ePercentile* elements. Attempting to set a value for the `CutOffValue` property for any other element type or *ePercentile* elements that are defined in the metadata will cause an error. The `CutOffValue` must be set between 0 and 100 percent.",
                    "The `CutOffValue` determines the percentile that the *ePercentile* element calculates, where a P-th percentile is the smallest value of a numeric variable that is greater than P percent of the values in a given set. For example a `CutOffValue` of 25 calculates V, the smallest value such that 25% of respondents have a value less than V.",
                    "The default `CutOffValue` is 50. This corresponds to the 50th percentile, which is identical to the *eMedian* element type.",
                ].join("\n")
            },
            {
                name: "Decimals",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IElement.Decimals: Long",
                    "--------------------------",
                    "The number of digits to be shown after the decimal place.",
                    "",
                    "### Remarks",
                    "The default value depends on the element type. The number of digits must be between 0 to 20 digits. Setting this property to zero cause the cell value to be displayed as an integer.",
                    "This property can only be set for the following element types (modify the `Decimals` property on the `CellItem` object for all others):",
                    "+ eUnweightedBase",
                    "+ eMean",
                    "+ eStdDev",
                    "+ eStdErr",
                    "+ eSampleVar",
                    "+ eTValue",
                    "+ eTProb",
                    "+ eTotal",
                    "+ eSubTotal",
                    "+ eMinimum",
                    "+ eMaximum",
                    "+ eMedian",
                    "+ eMode",
                    "+ ePercentile",
                    "+ eSum",
                    "+ eTableStatistic",
                ].join("\n")
            },
            {
                name: "Expression",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: false,
                isCollection: false,
                note: [
                    "(property) IElement.Expression: String",
                    "--------------------------",
                    "A custom expression that determines the value of the element when the table is populated",
                    "",
                    "### Remarks",
                    "The behavior of the `Expression` property depends on the element type:",
                    "+ The `expression` property can not be modified for the following element types; *eCategory*, *eTableStatistic*, *eTotal*, *eSubTotal*, *eText*, *eNetDiffs*, *ePairedPref*, *eEffectiveBase*, *eNet*, and *eCombine*.",
                    "+ For elements of type eNet and eCombine, the `Expression` property is read-only. The expression is dependent on the elements in the `SubElements` collection and controls the cases that are counted when the data is aggregated.",
                    "+ For elements of type eDerived the `Expression` property is read/write. Any valid *mrEvaluate* expression can be used. The expression creates a row or column derived from other rows and columns. The expression can only refer to elements in the same elements collection as the derived elements.",
                    "+ For all other element types not listed above, the property is read/write. Cases for which the expression evaluates to True are considered in the calculation of the element. The expression property doesn't have any effect on elements that are based on MDM elements (i.e. added via the `IElements.Add` method), for example *Base* and *Mean* elements that exist in a Quanvert dataset. This is because those elements already have case data associated with them.",
                ].join("\n")
            },
            {
                name: "Factor",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                note: [
                    "(property) IElement.Factor: Variant",
                    "--------------------------",
                    "The factor value for the element to use when calculating factor based analysis elements.",
                    "",
                    "### Remarks",
                    "Setting a value for this property will override the factor value that any associated MDM may have. Setting the factor property to Null will cause the MDM factor (if present) to be used again. Reading the `Factor` property will return the value of this property, if set, otherwise the `Factor` property of the associated MDM element, if available, otherwise *Null* will be returned.",
                ].join("\n")
            },
            {
                name: "IncludeInBase",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IncludeInBase: Boolean",
                    "--------------------------",
                    "Allows *eCategory* elements to be excluded from the calculation of the base",
                    "",
                    "### Remarks",
                    "By default the `IncludeInBase` property is *True*. It can only be set to *False* for *eCategory* elements. Setting it to *False* causes the category to be excluded from the calculation of the preceding *eBase*, *eUnweightedBase*, and *eEffectiveBase* elements. It also causes all cell items except for itCount to be suppressed for the row or column.",
                ].join("\n")
            },
            {
                name: "IsFixed",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IsFixed: Boolean",
                    "--------------------------",
                    "Fixes the position (index) of the element in the `ElementHeadings` collection when the table is sorted.",
                    "",
                    "### Remarks",
                    "If `IsFixed = False` then the element may be affected by the sorting process and will be moved relative to the surrounding objects. Elements of type *eNet*, *eCombine*, *eExpression*, and *eNumeric* have a default `IsFixed` value of *False*, *eCategory* and *eDerived* default to the `IElement.Fixed` property of the MDM element they're based upon (or *False* if they're not based on an MDM element). The default for all other element types (e.g. *eBase*, *eMean*, *eText* etc) is *True*, i.e. they're unaffected by sorting.",
                ].join("\n")
            },
            {
                name: "IsHidden",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IsHidden: Boolean",
                    "--------------------------",
                    "Determines if the element is shown on the table. The default value is taken from the corresponding MDM element.",
                    "",
                    "### Remarks",
                    "If `IsHidden = True` then the element is not shown on the table and the `ShownOnTable` property is *False*. 'System' element such as *eSumWeightsSquared*, *eSumN*, *eSumX*, *eSumXSquared*, or *eSumUnweightedN* have `IsHidden` set to *True* by default.",
                ].join("\n")
            },
            {
                name: "IsHiddenWhenColumn",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IsHiddenWhenColumn: Boolean",
                    "--------------------------",
                    "Hide the element if it appears as a column in the table.",
                    "",
                    "### Remarks",
                    "If the element exists within an axis that is used on the top of the table then the `ShownOnTable` will return *False* if `HiddenWhenRow` is set to *True*. The default value of this property is *False*.",
                ].join("\n")
            },
            {
                name: "IsHiddenWhenRow",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IsHiddenWhenRow: Boolean",
                    "--------------------------",
                    "Hide the element if it appears as a row in the table.",
                    "",
                    "### Remarks",
                    "If the element exists within an axis that is used on the side of the table then the `ShownOnTable` will return *False* if `HiddenWhenRow` is set to *True*. The default value of this property is *False*.",
                ].join("\n")
            },
            {
                name: "IsUnweighted",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElement.IsUnweighted: Boolean",
                    "--------------------------",
                    "When set to True all weighting is ignored for this element.",
                    "",
                    "### Remarks",
                    "This property is always *False* for the *eBase* element and *True* for the *eUnweightedBase* element. Trying to set this property for either of these element types has no effect.",
                    "This property will not have an effect on the values of element types that aren't generated from aggregated data. See the description of the `IElement.Weight` property for more information.",
                    "Setting `IsUnweighted` to *True* will clear the `IElement.Weight` property. Setting `IsUnweighted` to True for an element in a side axis will override any weight that might be specified for an element in the top axis (and vice versa) and also override any weight that might be specified for the table.",
                ].join("\n")
            },
            {
                name: "Label",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                isCollection: true,
                index: {
                    name: "Language",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                },
                note: [
                    "(property) IElement.Label[[Language: String = \"\"]]: String",
                    "--------------------------",
                    "The label for the element",
                    "",
                    "### Remarks",
                    "In the case of an element based on an MDM object, the label will typically be the label of the MDM object. If the element is not based on an MDM object then a default label will be generated. Both the default labels and the MDM object label can be overridden by specifying a new label for the element.",
                    "The `Label` property is read/write to enable the default label for non-MDM based elements to be overridden. If the `Language` parameter is not specified then the `IDocument.Language` property is used instead.",
                    "When the `Label` property is read, the following sequence is used to determine the value for the label:",
                    "+ If the `Language` parameter is missing then it is substituted with the current value of the `Language` property from the `IDocument` object.",
                    "+ An internal look-up is performed based on the language. If a label has been explicitly for that language set then that label is returned.",
                    "+ If no label has been explicitly set, but the element has an associated object in the MDM, then the required label is requested from the MDM. If the specific label required does not exist then the Label property of the MDM element is used (this returns a label based on the alternative rules in the MDM).",
                    "+ If no label has been explicitly set and there is no equivalent label in the MDM then a default label is generated.",
                ].join("\n")
            },
            {
                name: "Multiplier",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IElement.Multiplier: String",
                    "--------------------------",
                    "The name of the variable to use as the multiplier value when aggregating the data",
                    "",
                    "### Remarks",
                    "When aggregating the case data to produce the value for the itCount cell item, the count value is normally incremented by one for each case that meets the required conditions for that cell. If the name of a numeric variable is specified for the `Multiplier` property then the count value is instead incremented by the value for the numeric variable for that case.",
                    "When aggregating the case data to produce the value for a cell item that has an analysis variable specified, e.g. itSum, the value is incremented by the value of the specified analysis variable. If a `Multiplier` is specified for an element then the value is incremented by the product of the analysis variable value and the multiplier variable value.",
                    "The `Multiplier` property can only be specified for elements that are aggregated. This means the `Multiplier` property can not be set for the following element types:",
                    "+ eTableStatistic",
                    "+ eTotal",
                    "+ eSubTotal",
                    "+ eText",
                    "+ eNetDiffs",
                    "+ eEffectiveBase",
                    "+ ePairedPref",
                    "+ eDerived",
                    "+ eProfile",
                    "+ eProfileResult",
                    "",
                    "If a variable has already been specified for the `IElement.AnalysisVariable` property, then that variable takes precedence over the `Multiplier` property.",
                ].join("\n")
            },
            {
                name: "Weight",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IElement.Weight: String",
                    "--------------------------",
                    "The name of the variable to use as the weight value when aggregating the data",
                    "",
                    "### Remarks",
                    "When aggregating the case data to produce the value for an *itCount* cell item, the count value is either incremented by one or by the value of the *Multiplier* variable (if one has been specified). Weighting works by multiplying the increment that would normally have been used by the value of the weight variable for that case. In the case of a cell item that has an analysis variable specified (e.g. *itSum*) the weight value multiplies with both the analysis variable and the multiplier variable (if specified).",
                    "If a variable is specified for the `IElement.Weight` property then this overrides the table weight (`ITable.Weight`) for that row or column only. If a `Weight` property is specified for elements on both the side and top of the table then the `Weight` property specified for the element on the top axis takes priority over the side axis element whenever a conflict occurs (i.e. the weight variable for the column has priority).",
                    "The `IElement.Weight` property is *Null* by default which means the element will be weighted by the `ITable.Weight` value (if set). It's possible to force a particular element in a weighted table to be unweighted by setting the `IElement.IsUnweighted` property to *True*.",
                    "The `Weight` property can only be specified for elements that are aggregated. This means the Weight property can not be set for the following element types:",
                    "+ eTableStatistic",
                    "+ eTotal",
                    "+ eSubTotal",
                    "+ eText",
                    "+ eNetDiffs",
                    "+ eEffectiveBase",
                    "+ ePairedPref",
                    "+ eDerived",
                    "+ eProfile",
                    "+ eProfileResult",
                    "",
                    "In addition to this list, the `Weight` property can not be set for elements of type *eUnweightedBase* as these are always unweighted by definition.",
                    "A value can not be specified for the `IElement.Weight` property if `IElement.IsUnweighted` is set to *True*.",
                    "Also note that specifying weights on a per-element basis invalidates the *Column Proportions* and *Column Means* statistical tests.",
                ].join("\n")
            },
        ]
    },
    {
        name: "IElementHeadings",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) IElementHeadings",
            "----------------------",
            "A collection of `IElementHeading` objects",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IElementHeadings.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElementHeading"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) IElementHeadings.Item[Index: Variant]: IElementHeading",
                    "--------------------",
                    "Returns the specified `ElementHeading` in the collection.",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElements"),
                readonly: true,
                note: [
                    "(property) IElementHeadings.Parent: IElements | IElementHeading",
                    "--------------------",
                    "The parent object",
                ].join("\n")
            },
        ]
    },
    {
        name: "IElementHeading",
        definitionType: "interface",
        note: [
            "(interface) IElementHeading",
            "----------------------",
            "An `IElementHeading` object is an instance of a `IElement` object. In the case of a nested table, at the inner-most nest level there is a separate `IElementHeading` object corresponding to each `IElement` object in the outer axis. After a table has been populated, the order of the `IElementHeading` objects in the `IElementHeadings` collections represents the sorted order of the table.",
        ].join("\n"),
        properties: [
            {
                name: "Element",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElement"),
                readonly: true,
                note: [
                    "(property) IElementHeading.Element: IElement",
                    "--------------------",
                    "The `Element` object that this `IElementHeading` object is based on",
                ].join("\n")
            },
            {
                name: "HeadingId",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IElementHeading.HeadingId: String",
                    "--------------------",
                    "An id string assigned to the row or column",
                    "",
                    "### Remarks",
                    "`HeadingIds` are currently used to identify columns for the column proportions statistics test. `HeadingIds` are only assigned after the table has been populated and only to element headings at the inner-most nest on the top of the table, since those headings are the ones that correspond to columns in the table."
                ].join("\n")
            },
            {
                name: "Label",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                isCollection: true,
                index: {
                    name: "Language",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                },
                note: [
                    "(property) IElementHeading.Label[[Language: String = \"\"]]: String",
                    "--------------------",
                    "The label for the `ElementHeading`.",
                    "",
                    "### Remarks",
                    "The label of the `ElementHeading` is that same as the label for the `Element` that the `ElementHeading` is based upon."
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IElementHeading.Name: String",
                    "--------------------",
                    "The name used to reference the `ElementHeading` object.",
                    "",
                    "### Remarks",
                    "The name of the `ElementHeading` objects matches that of the `Element` object that it is based upon."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElementHeadings"),
                readonly: true,
                note: [
                    "(property) IElementHeading.Parent: IElementHeadings",
                    "--------------------",
                    "The parent object",
                ].join("\n")
            },
            {
                name: "ParentAxisHeading",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxisHeading"),
                readonly: true,
                note: [
                    "(property) IElementHeading.ParentAxisHeading: IAxisHeading",
                    "--------------------",
                    "The `AxisHeading` object that this `ElementHeading` is to be displayed under",
                ].join("\n"),
            },
            {
                name: "SubAxisHeadings",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxisHeadings"),
                readonly: true,
                note: [
                    "(property) IElementHeading.ParentAxisHeading: IAxisHeading",
                    "--------------------",
                    "The `AxisHeading` objects that are to be displayed under this `ElementHeading`",
                    "",
                    "### Remarks",
                    "In the case of a table containing nesting of axes, the `SubAxisHeadings` collection contains the `AxisHeading` objects that are to be displayed under the current element heading."
                ].join("\n"),
            },
            {
                name: "SubElementHeadings",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElementHeadings"),
                readonly: true,
                note: [
                    "(property) IElementHeading.SubElementHeadings: IElementHeadings",
                    "--------------------",
                    "The child element headings in the case of a heading based on a net element.",
                    "",
                    "### Remarks",
                    "Only an `IElementHeading` object that represents a net element will have sub element headings.",
                ].join("\n"),
            },
            {
                name: "IsSortedOn",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IElementHeading.IsSortedOn: Boolean",
                    "--------------------",
                    "*True* if the table has been sorted on the row or column corresponding to this `ElementHeading`",
                    "",
                    "### Remarks",
                    "The property is only set to *True* if the table has been populated and the `SortRow` or `SortColumn` property specifies that this `ElementHeading` is the one that the table is being sorted on."
                ].join("\n"),
            },
        ],
        methods: [
            {
                name: "GetSuppressed",
                definitionType: "method",
                returnType: BasicTypeDefinitions.boolean ,
                note: "(method) IElementHeading.GetSuppressed(): Boolean"
            },
            {
                name: "SetSuppressed",
                definitionType: "method",
                arguments: [
                    {
                        name: "newVal",
                        type: BasicTypeDefinitions.boolean,
                    }
                ],
                note: "(method) IElementHeading.SetSuppressed(newVal: Boolean): Void"
            }
        ]
    },
    {
        name: "IAxisHeadings",
        definitionType: "interface",
        note: [
            "(interface) IAxisHeadings",
            "----------------------",
            "A collection of `IAxisHeading` objects. The order of the `IAxisHeading` objects in the collection is modified by the sorting of the table.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IAxisHeadings.Count: Long",
                    "--------------------",
                    "The number of items in the collection."
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAxisHeading"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant
                },
                note: [
                    "(property) IAxisHeadings.Item[Index: Variant]: IAxisHeading",
                    "--------------------",
                    "Returns the specified `AxisHeading` in the collection.",
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IElements"),
                readonly: true,
                note: [
                    "(property) IAxisHeadings.Parent: IElementHeading | IElements",
                    "--------------------",
                    "The parent object",
                ].join("\n")
            },
        ]
    },
    {
        name: "IVariableListItem",
        definitionType: "interface",
        note: [
            "(interface) IVariableListItem",
            "----------------------",
            "The `VariableListItem` object is used to manage the variables for a data set.",
            "",
            "### Remarks",
            "Variables can be added, removed, renamed, and grouped using the `VariableListItem` object.",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) IVariableListItem.Count: Long",
                    "--------------------",
                    "The number of items in the collection.",
                    "",
                    "### Remarks",
                    "If the `IVariableListItem` is a folder, it returns the total items in the current folder. Otherwise, it simply returns 0."
                ].join("\n"),
            },
            {
                name: "IsFolder",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IVariableListItem.IsFolder: Boolean",
                    "--------------------",
                    "Defines whether current `IVariableListItem` is a folder.",
                ].join("\n"),
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IVariableListItem"),
                readonly: true,
                isCollection: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant
                },
                note: [
                    "(property) IVariableListItem.Item[Index: Variant]: IVariableListItem",
                    "--------------------",
                    "Return the specified item in the current folder.",
                ].join("\n")
            },
            {
                name: "MdmField",
                definitionType: "property",
                returnType: BasicTypeDefinitions.object,
                readonly: true,
                note: [
                    "(property) IVariableListItem.MdmField: Object",
                    "--------------------",
                    "Return the reference to the underlying MDM variable of current `IVariableListItem`.",
                ].join("\n")
            },
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IVariableListItem.Name: String",
                    "--------------------",
                    "The name of the variable list item.",
                    "",
                    "### Remarks",
                    "The name is the same as the underlying MDM variable name."
                ].join("\n")
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IVariableListItem"),
                readonly: true,
                note: [
                    "(property) IVariableListItem.Parent: IVariableListItem",
                    "--------------------",
                    "Parent name of the current item.",
                    "",
                    "### Remarks",
                    "*NULL* is returned if the variable list item does not have a parent."
                ].join("\n")
            },
        ]
    },
    {
        name: "IStyle",
        definitionType: "interface",
        note: [
            "(interface) IStyle",
            "------------------",
            "The `Style` object is used to set presentation styles for interview objects.",
            "",
            "### Remarks",
            "The `Style` object is available on questions, categories, labels, and navigation controls.",
            "While the `Style` object is loosely based on CSS, a design goal has been to make the Style object as generic as possible for all Players.",
            "With the properties and methods of a `Style` object, you can:",
            "+ Set the foreground and background colors.",
            "+ Set the font details.",
            "+ Set the size of the element.",
            "+ Set the border details for the element.",
            "+ Set the control type and properties.",
            "",
            "*Label*, *Question*, *Category*, and *Navigation* objects all have `Style` properties that reference `Style` objects. Different formatting goals require the use of different `Style` objects.",
            "To format the text of a *Banner*, *Question* or *Category*, use the `Style` object on the Label object for the *Banner*, *Question* or *Category*.",
            "",
            "### Example",
            "```ds",
            "' Set the color of the Header banner to purple",
            "IOM.Banners[\"Header\"].Style = \"purple\"",
            "",
            "' Set the question label for Q1 to blue",
            "Q1.Label.Style.Color = \"blue\"",
            "",
            "' Set the category labels for Q1 to green",
            "Q1.Categories[..].Label.Style.Color = \"green\"",
            "```",
            "The `Question Style` object can be used to format the input controls for the question.",
            "```ds",
            "' Set the input control for Q1 to use a droplist",
            "Q1.Style.Control.Type = ControlTypes.ctDropList",
            "",
            "' Q2 should be displayed in 3 rows",
            "Q2.Style.Orientation = Orientations.orRow",
            "Q2.Style.Rows = 3",
            "```",
            "The `Category Style` object can be used to format individual categories.",
            "```ds",
            "' Put a black border around the categories in a grid (loop presented in one Ask)",
            "Loop1[..].Q1.Categories[..].Style.Cell.BorderStyle = BorderStyles.bsSolid",
            "Loop1[..].Q1.Categories[..].Style.Cell.BorderColor = \"black\"",
            "Loop1[..].Q1.Categories[..].Style.Cell.BorderWidth = 1",
            "",
            "' Highlight a single category in a grid",
            "Loop1[\"Service1\"].Q1.Categories[\"Neutral\"].Style.Cell.BgColor = \"LightBlue\"",
            "```",
            "",
            "Formatting subheadings...",
            "NOTE: All sizes, whether fonts size, or cell sizes are measured in points.  There are 72 points to an inch and it is left to the Player to convert the point size to the output device.",
            "",
        ].join("\n"),
        methods: [
            {
                name: "CopyTo",
                definitionType: "method",
                arguments: [
                    {
                        name: "Destination",
                        type: createBuiltInDefPlaceHolder("IStyle"),
                    },
                    {
                        name: "AllCascadedStyles",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: 0
                    }
                ],
                note: [
                    "(method) IStyle.CopyTo(Destination: IStyle, [AllCascadedStyles: Boolean = 0]): Void",
                    "-------------------------------------",
                    "Copies the styles from one style object to another.",
                    "",
                    "### Remarks",
                    "The optional `AllCascadedStyles` property is used to switch between copying all of the cascaded styles and just the styles in the derived style object. By default, the `AllCascadedStyles` parameter is set to *False*.",
                    "**Note**. Default property values are not copied.",
                    "",
                ].join("\n"),
            }
        ],
        properties: [
            {
                name: "Audio",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IAudioStyle"),
                readonly: true,
                note: [
                    "(property) IStyle.Audio: IAudioStyle",
                    "-------------------------------------",
                    "The `Audio` property is used to set audio (play and record) styles.",
                    "",
                    "",
                ].join("\n"),
            },
            {
                name: "Cell",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICellStyle"),
                readonly: true,
                note: [
                    "(property) IStyle.Cell: ICellStyle",
                    "-------------------------------------",
                    "The `Cell` property is used to set cell styles.",
                    "",
                ].join("\n"),
            },
            {
                name: "Control",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IControlStyle"),
                readonly: true,
                note: [
                    "(property) IStyle.Control: IControlStyle",
                    "-------------------------------------",
                    "The `Control` property is used to set control styles.",
                    "",
                ].join("\n"),
            },
            {
                name: "Font",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IFontStyle"),
                readonly: true,
                note: [
                    "(property) IStyle.Font: IFontStyle",
                    "-------------------------------------",
                    "The `Font` property is used to set font styles.",
                    "",
                ].join("\n"),
            },
            {
                name: "IsEmpty",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                readonly: true,
                note: [
                    "(property) IStyle.IsEmpty: Boolean",
                    "-------------------------------------",
                    "*True* if no style properties have been set for the style object.",
                    "",
                    "### Remarks",
                    "If `IsEmpty` is *True* then all properties of this objects are either returning their default value or the corresponding property of the parent style object (if applicable).",
                    "",
                ].join("\n"),
            },
            {
                name: "Parent",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                readonly: true,
                note: [
                    "(property) IStyle.Parent: IStyle",
                    "-------------------------------------",
                    "This is a read-only property that returns the parent style.",
                    "",
                    "### Remarks",
                    "The property returns *NULL* if a parent does not exist for the `style` object.",
                    "",
                ].join("\n"),
            },
            {
                name: "Align",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("Alignments") ,
                note: [
                    "(property) IStyle.Align: Alignments",
                    "-------------------------------------",
                    "`Alignment` is in reference to the parent element:",
                    "",
                    "### Remarks",
                    "This property is used to set the element alignment.",
                    "Justify alignment is normally applicable to just text based alignment. It could also be used to specify even spacing for groups of controls.",
                ].join("\n"),
            },
            {
                name: "BgColor",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStyle.BgColor: String",
                    "-------------------------------------",
                    "Sets the background color for an element.",
                    "",
                    "### Remarks",
                    "The background color can be specified by name (e.g. aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, purple, red, silver, teal, white, and yellow) or by the RGB-value in hex (e.g. \"#000000\" is black and \"#FFFFFF\" is white).",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      partially supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Color",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStyle.Color: String",
                    "-------------------------------------",
                    "Sets the color for an element.",
                    "",
                    "### Remarks",
                    "Most often, the Color property is used to set the label text color. However, the Color property is also used to set control color when a particular element does not have a label. The color can be specified by name (e.g. aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, purple, red, silver, teal, white, and yellow) or by the RGB-value in hex (e.g. \"#000000\" is black and \"#FFFFFF\" is white).",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      partially supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Columns",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IStyle.Columns: Long",
                    "-------------------------------------",
                    "Sets the number of columns that a list is displayed over or the columns of a text box.",
                    "",
                    "### Remarks",
                    "The `Columns` property is used for `Column` orientation and the `Rows` property is used for `Row` orientation. By default, both of the `Column` and `Rows` properties are set to 1.",
                    "When column orientation is selected the `Column` property sets the number of columns lists are displayed in or the width of the text box for text questions.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      partially supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Cursor",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("CursorTypes") ,
                note: [
                    "(property) IStyle.Cursor: CursorTypes",
                    "-------------------------------------",
                    "Specifies the type of cursor that should be displayed above the element.",
                    "",
                    "### Remarks",
                    "The cursor can be one of *Auto*, *CrossHair*, *Default*, *Pointer*, *Move*, *EResize*, *NEResize*, *NResize*, *NWResize*, *WResize*, *SWResize*, *SResize*, *SEResize*, *Text*, *Wait*, and *Help*.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "ElementAlign",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ElementAlignments") ,
                note: [
                    "(property) IStyle.ElementAlign: ElementAlignments",
                    "-------------------------------------",
                    "This property is used to specify whether the element should be included on the next line or just to the left of the previous element:",
                    "",
                    "### Remarks",
                    "By default, the element alignment is set to `EAlignDefault`. The `ElementAlign` property is used to override the default alignment used by the player.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Height",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStyle.Height: String",
                    "-------------------------------------",
                    "Sets the vertical size of the element.",
                    "",
                    "### Remarks",
                    "The size can be set as a value or a percentage.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Image",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStyle.Image: String",
                    "-------------------------------------",
                    "The name of the image to use for the element. The image name will typically be the URL to an image file.",
                    "",
                    "### Remarks",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "ImagePosition",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ImagePositions") ,
                note: [
                    "(property) IStyle.ImagePosition: ImagePositions",
                    "-------------------------------------",
                    "The image position relative to the text.",
                    "",
                    "### Remarks",
                    "The image position can be *ImageLeft*, *ImageRight*, *ImageTop*, *ImageBottom*, or *ImageOnly*. The image only setting causes the *Player* to only display the image, even if there was text for the element.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Indent",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IStyle.Indent: Long",
                    "-------------------------------------",
                    "This read/write property returns the label for the navigation control.",
                    "",
                    "### Remarks",
                    "This property is used to specify how far to indent the element within the parent element. The units of measurement will change depending on the *Player*.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Orientation",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("Orientations") ,
                note: [
                    "(property) IStyle.Orientation: Orientations",
                    "-------------------------------------",
                    "The `Orientation` property is used to set the category list or grid orientation.",
                    "",
                    "### Remarks",
                    "The orientation can be either *Row* or *Column*. This property is specific to category formatting.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Rows",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IStyle.Rows: Long",
                    "-------------------------------------",
                    "Sets the number of rows that a list is displayed over or the rows of a multi-line text box.",
                    "",
                    "### Remarks",
                    "The `Columns` property is used for *Column* orientation and the `Rows` property is used for `Row` orientation. By default, both of the *Column* and *Rows* properties are set to 1.",
                    "When row orientation is selected the Row property sets the number of rows lists are displayed in or the height of multi-line text boxes for text questions.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "UseCascadedStyles",
                definitionType: "property",
                returnType: BasicTypeDefinitions.boolean ,
                note: [
                    "(property) IStyle.UseCascadedStyles: Boolean",
                    "-------------------------------------",
                    "A read/write property that is used to indicate whether the style object should return all cascaded styles, or to return just the styles set on the particular object.",
                    "",
                    "### Remarks",
                    "By default, `UseCascadedStyles` is set to True. This means that unless overridden, styles derived from parent style objects are returned by the style object.",
                    "",
                ].join("\n"),
            },
            {
                name: "VerticalAlign",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("VerticalAlignments") ,
                note: [
                    "(property) IStyle.VerticalAlign: VerticalAlignments",
                    "-------------------------------------",
                    "This property is used to set the element alignment.",
                    "",
                    "### Remarks",
                    "`Alignment` is in reference to the parent element.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "Width",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                note: [
                    "(property) IStyle.Width: String",
                    "-------------------------------------",
                    "Sets the horizontal size of the element.",
                    "",
                    "### Remarks",
                    "The width can be set as a value or a percentage.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
            {
                name: "ZIndex",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                note: [
                    "(property) IStyle.ZIndex: Long",
                    "-------------------------------------",
                    "Controls the ordering of overlapping elements, and defines which will be displayed 'on top'.",
                    "",
                    "### Remarks",
                    "Positive numbers are above the normal elements on the page, and negative numbers are below.",
                    "",
                    "+ *HTML*     supported",
                    "+ *TTY*      not supported",
                    "+ *Windows*  supported",
                    "",
                ].join("\n"),
            },
        ],
    },
    {
        name: "IValidation­Option",
        definitionType: "interface",
        note: [
            "(interface) IValidation­Option",
            "----------------------",
            "A validation option. Validation options are specific to each question type.",
        ].join("\n"),
        properties: [
            {
                name: "Name",
                definitionType: "property",
                returnType: BasicTypeDefinitions.string ,
                readonly: true,
                note: [
                    "(property) IValidation­Option.Name: String",
                    "--------------",
                    "The name of the validation option.",
                ].join("\n")
            },
            {
                name: "Value",
                definitionType: "property",
                returnType: BasicTypeDefinitions.variant ,
                note: [
                    "(property) IValidation­Option.Value: Variant",
                    "--------------",
                    "The current value of the validation option.",
                ].join("\n")
            }
        ]
    },
    {
        name: "IQuestion­Style",
        definitionType: "interface",
        note: [
            "(interface) IQuestion­Style",
            "----------------------",
            "The `QuestionStyle` object is used to define the default presentation styles used by each question type.",
            "",
            "### Remarks",
            "With the properties and methods of a `QuestionStyle` object, you can:",
            "+ Set the styles for the question input control.",
            "+ Set the styles for each type of label.",
            "+ Set the styles for each type of category.",
            "",
        ].join("\n"),
        properties: [
            {
                name: "Categories",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICategoryStyles"),
                readonly: true,
                note: [
                    "(property) IQuestion­Style.Categories: ICategoryStyles",
                    "--------------",
                    "The default styles for each type of category for this question type.",
                    "",
                    "### Remarks",
                    "The category styles set for each question type override the category styles set for `DefaultStyles.Categories`. Refer to the `DefaultStyles` object for a description of the available category types.",
                ].join("\n")
            },
            {
                name: "Labels",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyles"),
                readonly: true,
                note: [
                    "(property) IQuestion­Style.Labels: IStyles",
                    "--------------",
                    "The default styles for each type of label for this question type.",
                    "",
                    "### Remarks",
                    "The label styles set for each question type override the label styles set for `DefaultStyles.Labels`. Refer to the `DefaultStyles` object for a description of the available label types.",
                    "",
                ].join("\n")
            },
            {
                name: "Style",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                readonly: true,
                note: [
                    "(property) IQuestion­Style.Style: IStyle",
                    "--------------",
                    "The default styles for the question type.",
                    "",
                    "### Remarks",
                    "This property is used to define the presentation styles for the question input control.",
                    "",
                ].join("\n")
            }
        ]
    },
    {
        name: "ICategory­Style",
        definitionType: "interface",
        note: [
            "(interface) ICategory­Style",
            "----------------------",
            "The `CategoryStyle` object is used to define the default presentation styles used by each category type.",
            "",
            "### Remarks",
            "With the properties and methods of a `CategoryStyle` object, you can:",
            "+ Set the styles for the category input control.",
            "+ Set the styles for each type of label.",
            "",
        ].join("\n"),
        properties: [
            {
                name: "Label",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                readonly: true,
                note: [
                    "(property) ICategory­Style.Label: IStyle",
                    "--------------",
                    "The default styles for each type of label for this `Category` type.",
                    "",
                    "### Remarks",
                    "The label styles set for each category type override the label styles set for `DefaultStyles.Labels`. Refer to the `DefaultStyles` object for a description of the available label types.",
                    "",
                ].join("\n"),
            },
            {
                name: "Style",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("IStyle"),
                readonly: true,
                note: [
                    "(property) ICategory­Style.Style: IStyle",
                    "--------------",
                    "The default styles for the category type.",
                    "",
                    "### Remarks",
                    "This property is used to define the presentation styles for the category input control.",
                    "",
                ].join("\n")
            }
        ]
    },
    {
        name: "ICategory­Styles",
        definitionType: "interface",
        defaultProperty: "Item",
        note: [
            "(interface) ICategory­Styles",
            "----------------------",
            "A collection object that contains CategoryStyle objects.",
            "",
        ].join("\n"),
        properties: [
            {
                name: "Count",
                definitionType: "property",
                returnType: BasicTypeDefinitions.long ,
                readonly: true,
                note: [
                    "(property) ICategory­Styles.Count: Long",
                    "--------------",
                    "The number of items in the collection.",
                ].join("\n")
            },
            {
                name: "Item",
                definitionType: "property",
                returnType: createBuiltInDefPlaceHolder("ICategoryStyle"),
                readonly: true,
                index: {
                    name: "Index",
                    type: BasicTypeDefinitions.variant,
                },
                note: [
                    "(property) ICategory­Styles.Item[Index: Variant]: ICategoryStyle",
                    "--------------",
                    "Get the collection item at the specified location. (Default Property)",
                ].join("\n")
            }
        ]
    },
    {
        name: "ICoding",
        definitionType: "interface",
        note: [
            "(interface) ICoding",
            "----------------------",
            "The Coding object includes methods that can be used to categorize and band text, numeric, and date variables in the TOM document.",
            "",
        ].join("\n"),
        methods: [
            {
                name: "CreateCategorizedDBVariable",
                definitionType: "method",
                returnType: BasicTypeDefinitions.object,
                arguments: [
                    {
                        name: "DBVariableFullName",
                        type: BasicTypeDefinitions.string,
                        note: "The full name of the source DB question. The source variable must belongs to DB variable types (DB Array, Single Response DBQ or Multiple Response DBQ)."
                    },
                    {
                        name: "NewVariableName",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "",
                        note: "The name of the new variable. If the source DB question is not of type DB Array and NewVariableName is empty, the new variable is added as a helper field for the source variable, with name “DBCodes”. If the source DB question is not of type DB Array and NewVariableName is of the form “SourceVariableName.NewName” or “.NewName”, the new variable is added as a helper field for the source variable, with NewName as its name. If the source DB question is not of type DB Array and NewVariableName is of the form “NewName”, the new variable is added at the same level as the source variable with the given name. If the source DB question is of type DB Array, then the new variable is (and must be) added into the Fields collection of the DB Array with NewVariableName as its name, and NewVariableName should not contain “.”."
                    },
                    {
                        name: "MaxCategories",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1,
                        note: "The maximum number of categories to generate. -1 indicates no maximum. The maximum number of categories does not include the 'other' categories."
                    },
                    {
                        name: "GenerateOtherCategory",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: 1,
                        note: "Indicates whether or not to generate an 'other' category for uncategorized data. By default, an 'other' category is generated."
                    },
                    {
                        name: "SaveVariable",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: 1,
                        note: "Indicates whether or not to save the new variable to the MTD."
                    }
                ],
                note: [
                    "(method) ICoding.CreateCategorizedDBVariable(DBVariableFullName: String, [NewVariableName: String = \"\"], [MaxCategories: Long = -1], [GenerateOtherCategory: Boolean = True], [SaveVariable: Boolean = True]): Object",
                    "--------------------",
                    "Creates or updates a categorized, derived variable object from a DB variable. Database variables usually have underlying MDM types of Text, Long, Double and Date, and cannot be populated directly, thus categorized derived variables must be created instead.",
                    "+ `DBVariableFullName`: *String* - The full name of the source DB question. The source variable must belongs to DB variable types (DB Array, Single Response DBQ or Multiple Response DBQ).",
                    "+ `NewVariableName`: *String* - The name of the new variable. If the source DB question is not of type DB Array and NewVariableName is empty, the new variable is added as a helper field for the source variable, with name “DBCodes”. If the source DB question is not of type DB Array and `NewVariableName` is of the form `SourceVariableName.NewName` or `.NewName`, the new variable is added as a helper field for the source variable, with NewName as its name. If the source DB question is not of type DB Array and `NewVariableName` is of the form “NewName”, the new variable is added at the same level as the source variable with the given name. If the source DB question is of type DB Array, then the new variable is (and must be) added into the Fields collection of the DB Array with `NewVariableName` as its name, and `NewVariableName` should not contain '.'.",
                    "+ `MaxCategories`: *Long* - The maximum number of categories to generate. -1 indicates no maximum. The maximum number of categories does not include the 'other' categories.",
                    "+ `GenerateOtherCategory`: *Boolean* - Indicates whether or not to generate an 'other' category for uncategorized data. By default, an 'other' category is generated.",
                    "+ `SaveVariable`: *Boolean* - Indicates whether or not to save the new variable to the MTD.",
                    "",
                    "### Remarks",
                    "If the derived variable with name `NewVariableName` already exists, this method will update the existing derived variable by adding new elements and updating changed properties of existed elements, but not deleting removed elements. In this situation, parameter `MaxCategories`, `GenerateOtherCategory` and `SaveVariable` will not have any effect.",
                    "If the derived variable with name `NewVariableName` does not exist, this method will create a new derived variable.",
                    "If you want to create a new derived variable but it already exists, just delete the existing derived variable and call this method again.",
                    "See the following examples for more information.",
                    "",
                    "### Example",
                    "a) Categorize the DB variable 'name'.",
                    "```ds",
                    "CreateCategorizedDBVariable(\"name\")",
                    "```",
                    "The derived variable \"name.DBCodes\" is created as a helper field of \"name\".",
                    "",
                    "b) Categorize the DB variable 'person.age'.",
                    "```ds",
                    "CreateCategorizedDBVariable(\"person.age\", \"age.DBCodes\")",
                    "```",
                    "The derived variable \"person.age.DBCodes\" is created as a helper field of \"person.age\".",
                    "",
                    "c) Categorize the DB variable 'person.age'.",
                    "```ds",
                    "CreateCategorizedDBVariable(\"person.age\", \"age_derived\")",
                    "```",
                    "",
                    "d) Categorize the DB Array variable 'person.tvdays'.",
                    "```ds",
                    "CreateCategorizedDBVariable(\"person.tvdays\", \"tvdays_derived\")",
                    "```",
                    "The derived variable \"person.tvdays.tvdays_derived\" is (and must be) added into the Fields collection of \"person.tvdays\".",
                    "",
                ].join("\n"),
            },
            {
                name: "CreateCategorizedVariable",
                definitionType: "method",
                returnType: BasicTypeDefinitions.object,
                arguments: [
                    {
                        name: "SourceVariableName",
                        type: BasicTypeDefinitions.string,
                    },
                    {
                        name: "NewVariableName",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: ""
                    },
                    {
                        name: "NewCategoryLabelFormat",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "L{value}"
                    },
                    {
                        name: "CategorizationExpression",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: "",
                    },
                    {
                        name: "MaxCategories",
                        type: BasicTypeDefinitions.long,
                        optional: true,
                        defaultValue: -1
                    },
                    {
                        name: "GenerateOtherCategory",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: true,
                    },
                    {
                        name: "GenerateNoAnswerCategory",
                        type: BasicTypeDefinitions.boolean,
                        optional: true,
                        defaultValue: false
                    },
                    {
                        name: "NoAnswerCategoryLabel",
                        type: BasicTypeDefinitions.string,
                        optional: true,
                        defaultValue: ""
                    }
                ],
                note: [
                    "(method) ICoding.CreateCategorizedVariable(SourceVariableName: String, [NewVariableName: String = \"\"], [NewCategoryLabelFormat: String = L\"{value}\"], [CategorizationExpression: String = \"\"], [MaxCategories: Long = -1], [GenerateOtherCategory: Boolean = True], [GenerateNoAnswerCategory: Boolean = False], [NoAnswerCategoryLabel: String = \"\"]): Object",
                    "--------------------",
                    "Creates or updates a categorized, derived variable object from a DB variable. Database variables usually have underlying MDM types of Text, Long, Double and Date, and cannot be populated directly, thus categorized derived variables must be created instead.",
                    "+ `SourceVariableName`: *String* - The source variable's full name. The source variable data type must be Text, Long, Double, or Date.",
                    "+ `NewVariableName`: *String* - The name of the new variable. If the source DB question is not of type DB Array and NewVariableName is empty, the new variable is added as a helper field for the source variable, with name “DBCodes”. If the source DB question is not of type DB Array and `NewVariableName` is of the form `SourceVariableName.NewName` or `.NewName`, the new variable is added as a helper field for the source variable, with NewName as its name. If the source DB question is not of type DB Array and `NewVariableName` is of the form “NewName”, the new variable is added at the same level as the source variable with the given name. If the source DB question is of type DB Array, then the new variable is (and must be) added into the Fields collection of the DB Array with `NewVariableName` as its name, and `NewVariableName` should not contain '.'.",
                    "+ `NewCategoryLabelFormat`: *String* - The new variable's category label format string. A named insertion of '{value}' in this arugument will be replaced by a value that is queried from the source variable. It is also possible to use a format option. For more information, refer to the Label Text Insertion topic and Format topic in the Data Collection Developer Library. e.g. \"{value:U}\".",
                    "+ `CategorizationExpression`: *String* - The expression used to categorize the values in the source variable, e.g. “name”, “name.left(3)”. The default value is the source variable name. The new variable's categories are generated using the query statement `SELECT DISTINCT [CategorizationExpression] FROM [TABLE] ORDER BY [CategorizationExpression]`; If the table document's dataview is VDATA, the queried table is VDATA. Otherwise, the queried table is HDATA and the level is the same level as the source variable. The new variable's expression is '`Categorize([CategorizationExpression], \"[NewVariableRelativeName]\")`'.",
                    "+ `MaxCategories`: *Long* - The maximum number of categories to generate. -1 indicates no maximum. The maximum number of categories does not include the 'other' categories.",
                    "+ `GenerateOtherCategory`: *Boolean* - Indicates whether or not to generate an 'other' category for uncategorized data. By default, an 'other' category is generated.",
                    "+ `GenerateNoAnswerCategory`: *Boolean* - Indicates whether to generate a 'NoAnswer' category for empty or *NULL* data. By default, a 'NoAnswer' category is not created and empty or *NULL* data is returned as *NULL* (not asked).",
                    "+ `NoAnswerCategoryLabel`: *Boolean* - The 'NoAnswer' category label.",
                    "",
                    "### Remarks",
                    "This method creates a derived variable that categorizes a text, numeric, or date variable. By default a category is created for each unique value in the source variable, but an expression can be used to control how the variable is categorized. The new variable is created with the supplied name and label and is added to the tables document.",
                    "See the following examples for more information.",
                    "",
                    "### Example",
                    "a) Categorize the text variable 'name'. The derived categorization variable is created as the helper field \"name.Codes\"",
                    "```ds",
                    "CreateCategorizedVariable(\"name\")",
                    "```",
                    "",
                    "b) Categorize the text variable 'name' by the first character in the name.",
                    "```ds",
                    "CreateCategorizedVariable(\"name\", \"\", , \"name.left(1)\")",
                    "```",
                    "",
                    "c) Categorize the numeric variable 'visits'.",
                    "```ds",
                    "CreateCategorizedVariable(\"visits\")",
                    "```",
                    "",
                    "d) Categorize the date variable by month.",
                    "```ds",
                    "CreateCategorizedVariable(\"DataCollection.FinishTime\", , , \"DataCollection.FinishTime.Month()\")",
                    "```",
                    "",
                    "e) Categorize the numeric variable 'age', which is under level 'person'. The new variable is a helper field for the source variable.",
                    "```ds",
                    "CreateCategorizedVariable(\"person.age\", \"age.codes\", \"{html:&#123;}value{html:&#125;}\")",
                    "```",
                    "",
                    "f) Categorize the numeric variable 'age', which is under level 'person'. The new variable is added at the same level as the source variable.",
                    "```ds",
                    "CreateCategorizedVariable(\"person.age\", \"age_codes\", \"age: {html:&#123;}value{html:&#125;}\")",
                    "```",
                    "",
                ].join("\n"),
            },
            {
                name: "CreateCategorizedVariableCancel",
                definitionType: "method",
                note: [
                    "(method) ICoding.CreateCategorizedVariable(SourceVariableName: String, [NewVariableName: String = \"\"], [NewCategoryLabelFormat: String = L\"{value}\"], [CategorizationExpression: String = \"\"], [MaxCategories: Long = -1], [GenerateOtherCategory: Boolean = True], [GenerateNoAnswerCategory: Boolean = False], [NoAnswerCategoryLabel: String = \"\"]): Object",
                    "--------------------",
                    "Cancel an existing creation started via `CreateCategorizedVariable()`.",
                ].join("\n"),
            }
        ]
    }
]);

export const builtInQuesionInterface: BuiltInDefinition = {
    name: "IQuestion",
    definitionType: "interface",
    defaultProperty: "Item",
    note: [
        "(interface) IQuestion",
        "-----------------------------",
        "The `Question` object is used to represent a question in the interview.",
        "",
        "### Remarks",
        "With the properties and methods of a `Question` object, you can:",
        "+ Ask the question.",
        "+ Add and remove banners to the question.",
        "+ Show the question and its current response value.",
        "+ Get and set the current response value.",
        "+ Mark the question as preserved so that it cannot be re-asked.",
        "+ Determine the question type and response data type.",
        "+ Set the question label.",
        "+ Set the error labels and styles for the question.",
        "+ Set the styles for the question.",
        "+ List the sub-questions available for the question.",
        "+ Modify the validation of the question response.",
        "+ List the valid categorical responses for the question.",
        "+ Set the styles for each of the categorical responses.",
        "+ Get and set any custom properties for the question.",
        "+ Get and set additional interview paradata.",
        "",
        "There are three different types of `Question` object. The properties which are available, and the property defined as the default varies for each type:",
        "",
        "+ **Simple**: The *Simple* question type is a single ask, with a response type of *Long*, *Double*, *Text*, *Date*, *Categorical*, or *Boolean*. The Simple question type supports all of the properties except `Item` and `Count` and has `Value` as its default property.",
        "```ds",
        "' Example - Simple question usage",
        "' Ask Q1",
        "Q1.Ask()",
        "' Set Q1 color to red",
        "Q1.Style.Color = mr.Red",
        "```ds",
        "+ **Loop**: The *Loop* (*Categorical* or *Numeric*) question type defines an array of sub-questions. Each index or iteration of the array can contain one or more different sub-questions. The *Loop* question type supports all of the question properties except value and has `Item` as its default property.",
        "```ds",
        "' Multi-ask the loop",
        "Loop1.Ask()",
        "",
        "' Ask the sub-questions for Exhibit A",
        "Loop1[{ExhibitA}].Ask()",
        "",
        "' Ask the sub-question Rating for Exhibit B",
        "Loop1[{ExhibitB}].Rating.Ask()",
        "```",
        "+ **Block**: The *Block* (or Compound, Page) question type defines a list of sub-questions. The Block question type supports all of the question properties except Value and has Item as its default property.",
        "```ds",
        "' Ask all of the questions in the block",
        "Block1.Ask()",
        "",
        "' Ask Q1 from the block",
        "Block1.Q1.Ask()",
        "",
        "' Ask the Demo sub-question using Item",
        "Block1[\"Q1\"].Ask()",
        "```",
        "To support a consistent interface for all question types, as well as supporting a dynamic interface based on sub-question names, the names of sub-questions cannot match those of question object properties. To demonstrate why, if a sub-question was named 'Style', there needs to be a way to ask just the sub-question:",
        "```ds",
        "' Ask the sub-question of Block1",
        "Block1.Style.Ask()",
        "```",
        "Unfortunately, `Style` is also a property of the question object. It also needs to be possible to set a property on the style object:",
        "```ds",
        "' Set the default color for the block",
        "Block1.Style.Color = mr.Blue",
        "```",
        "Hence, there is a name clash between the `Style` sub-question and the `Style` question property. While it will still be possible to have sub-questions whose names match question properties, the question property will always take precedence:",
        "```ds",
        "' VALID: Set the default color for the block",
        "Block1.Style.Color = mr.Blue",
        "",
        "' INVALID: Ask the sub-question for the block",
        "Block1.Style.Ask()",
        "```",
        "The second statement is invalid because the `Style` question property takes precedence. As the `Style` object does not have an `Ask` method, the parser will raise an error. To use reserved property names as sub-question names, the Item method must be used to ask the question:",
        "```ds",
        "' VALID: Ask the sub-question for the block",
        "Block1[\"Style\"].Ask()",
        "```",
        "The list of keywords that should not be used as sub-question names:",
        "",
        "*Categories* *Count* *Errors* *Item* *Label* *LayoutTemplate* *ParentQuestion* *Properties* *QuestionName* *QuestionFullName* *QuestionInfo* *QuestionType* *Response* *Style* *Validation*",
    ].join("\n"),
    methods: [
        {
            name: "Ask",
            definitionType: "method",
            arguments: [
                {
                    name: "LabelArgs",
                    type: BasicTypeDefinitions.variant,
                    isCollection: true,
                    optional: false,
                }
            ],
            note: [
                "(method) Ask(LabelArgs: Variant[]): Void",
                "--------------------",
                "Asks a question in an interview.",
                "",
                "### Remarks",
                "The `Ask` method causes the Interview state machine to stop script execution, save the interview state, and to generate question output. The question output generated is dependent on the type of question and the properties that have been set on the interview, next page, and question objects.",
                "",
                "The `Ask` method is ignored if:",
                "",
                "+ `MustAnswer` is *False* AND",
                "+ The question is a *categorical* or *compound* question and there are no categories OR",
                "+ The question is a *categorical* or *compound* question and the only category is a NA (No Answer) category OR",
                "+ The question is a block, compound, page, or loop and it doesn't have any sub-questions.",
                "",
                "The most common situation in which a question is skipped automatically is when all responses or sub-questions have been filtered out due to the response given to a previous question.",
                "",
                "### Example",
                "```ds",
                "'  q1 and q2 are lists of brands",
                "IOM.MustAnswer = False",
                "q1.Ask()",
                "q2.Categories = q1.Response",
                "",
                "'  If the respondant doesn't choose any brands at q1 then q2 has",
                "'  no categories and the following line won't have any effect.",
                "q2.Ask()",
                "```",
                "If the question label has inserts then the `LabelArgs` parameter can be used to specify",
                "values for those inserts.  For example, if the question label for Spend was \"How",
                "much did you spend? (e.g. {ExampleValue:f})\" then the question could be asked as",
                "`Spend.Ask(123.45)` and 123.45 would be inserted into the label and formatted appropriately",
                "for the current locale, e.g. \"123.45\" or \"123,45\".",
                "",
                "This method is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "BuildDBFilter",
            definitionType: "method",
            returnType: BasicTypeDefinitions.string ,
            arguments: [
                {
                    name: "bstrFieldName",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    isCollection: false,
                    defaultValue: "L"
                }
            ],
            note: [
                "(method) BuildDBFilter([bstrFieldName: String = \"L\"]): String",
                "--------------------",
                "This method is used to build a database filter according to its response value.",
                "",
                "### Remarks",
                "This method is only supported by single and multiple response database questions. If the `bstrFieldName` is omitted, the `QuestionName` will be used as the `bstrFieldName`.",
                "",
                "### Example",
                "```ds",
                "Make.Ask() 'A DB multiple response question for favorite automobile makers.",
                "'Model is filtered based on the Make response. For example, if BMW and Audi is",
                "'selected above, the return value of Make.BuildDBFilter will be (MakeID='BMW') OR (MakeID='Audi').",
                "Model.DBFilter = Make.BuildDBFilter(\"MakeID\")",
                "Model.Ask()",
                "```",
            ].join("\n"),
        },
        {
            name: "ClearOffPathResponse",
            definitionType: "method",
            note: [
                "(method) ClearOffPathResponse(): Void",
                "--------------------",
                "Clears the off-path response to the question (if applicable)",
                "",
                "### Remarks",
                "Normally when a question becomes off-path the response in the case data is cleared (exactly when that happens depends on the OffPathDataMode property) but the response is kept so that it is presented to the respondent if the question is redisplayed. The `ClearOffPathResponse()` method can be used to clear the response to the question if the response is off-path. The `ClearOffPathResponse()` also clears the responses to any \"other specify\" and sub-questions that the question may have. Compare this to setting `Question.Info.OffPathResponse` to *Null* which will only clear the response of the immediate question object.",
                "The typical use of the `ClearOffPathResponse()` method is to clear all off-path responses (using `IOM.Questions[..].ClearOffPathResponse()`) when the respondent changes an answer that invalidates all off-path responses.",
                "For example, imagine an interview that asks which fruit the respondent likes the most, and then asks questions like why they like that fruit and how often they eat it. If the respondent navigates back to the question about which fruit they liked the most, and then changes their answer then the answers to the subsequent questions should be completely discarded as they might have been applicable to apples but the respondent might have now selected oranges as their favorite fruit.",
            ].join("\n"),
        },
        {
            name: "Delete",
            definitionType: "method",
            arguments: [
                {
                    name: "vtIndex",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false,
                }
            ],
            note: [
                "(method) Delete(vtIndex: Variant): Void",
                "--------------------",
                "This method is used to delete the given iteration of the question.",
                "",
                "### Remarks",
                "This method is only supported by unbound loop question."
            ].join("\n"),
        },
        {
            name: "Exists",
            returnType: BasicTypeDefinitions.boolean ,
            definitionType: "method",
            arguments: [
                {
                    name: "vtIndex",
                    type: BasicTypeDefinitions.variant,
                    isCollection: false,
                    optional: false
                }
            ],
            note: [
                "(method) Exists(vtIndex: Variant): Boolean",
                "--------------------",
                "This method is used to check given iteration exists or not.",
                "",
                "### Remarks",
                "This method is only supported by numeric loop question for now."
            ].join("\n"),
        },
        {
            name: "Preserve",
            definitionType: "method",
            note: [
                "(method) Preserve(): Void",
                "--------------------",
                "Preserves the response of a question such that the question can never be re-asked or reviewed.",
                "",
                "### Remarks",
                "`Preserve` could be used in CAPI where a respondent will only answer questions if they cannot be reviewed by the interviewer.",
                "This method is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "Show",
            definitionType: "method",
            arguments: [
                {
                    name: "LabelArgs",
                    type: BasicTypeDefinitions.variant,
                    isCollection: true,
                    optional: false,
                    index: {
                        name: "Index",
                        type: BasicTypeDefinitions.variant,
                        optional: false,
                        isCollection: false,
                    }
                }
            ],
            note: [
                "(method) Show(LableArgs: Variant[]): Void",
                "--------------------",
                "Shows a question with its associated value or values.",
                "",
                "### Remarks",
                "The `Show` method is identical to `Ask` method except that the user is not able to set a response value for the question.",
                "This method is not supported in mrDataManager 1.0",
            ].join("\n"),
        }
    ],
    properties: [
        {
            name: "Banners",
            returnType: createBuiltInDefPlaceHolder("ILabels"),
            definitionType: "property",
            readonly: true,
            isCollection: false,
            note: [
                "(property) Banners: ILabels",
                "--------------------",
                "A read-only property that returns a collection of Label objects.",
                "",
                "### Remarks",
                "Question banners are displayed only when the question is asked.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "Categories",
            returnType: createBuiltInDefPlaceHolder("ICategories"),
            definitionType: "property",
            readonly: true,
            isCollection: false,
            note: [
                "(property) Categories: ICategories",
                "--------------------",
                "A read-only property that returns a collection of category objects.",
                "",
                "### Remarks",
                "The `Categories` collection supports the standard collection properties and methods: `Item`, `Count`, and `_NewEnum`. The collection also supports a helper property, Filter.",
                "The categories properties is not used for *Block* or *Page* questions, but can be used for all other question types. For a Compound question, the `Categories` property returns the shared category list for the sub-questions. For a *categorical* loop question, the `Categories` property returns the categories which define the loop iterations. Finally, for a Simple question, this property returns the possible categorical responses for the question. All simple data types, except Boolean, can have categorical responses associated with them.",
            ].join("\n"),
        },
        {
            name: "Codes",
            returnType: createBuiltInDefPlaceHolder("ICategories"),
            definitionType: "property",
            readonly: true,
            isCollection: false,
            note: [
                "(property) Codes: ICategories",
                "--------------------",
                "A read only property that returns a collection of category objects.",
                "",
                "### Remarks",
                "The categories returned by the `Codes` property represent the alternative categorical responses for a question. Optionally used on simple questions, these categorical responses typically include categories such as *Don't Know*, *No Answer*, or *Refused*"
            ].join("\n"),
        },
        {
            name: "Count",
            definitionType: "property",
            returnType: BasicTypeDefinitions.long ,
            readonly: true,
            note: [
                "(property) Count: Long",
                "--------------------",
                "The number of items in the collection."
            ].join("\n"),
        },
        {
            name: "Errors",
            returnType: createBuiltInDefPlaceHolder("ILables"),
            definitionType: "property",
            readonly: true,
            isCollection: true,
            note: [
                "(property) Errors: ILabels",
                "--------------------",
                "This property returns a collection of label objects for the question error texts.",
                "",
                "### Remarks",
                "The `IQuestion.Errors` collection can be used to display errors associated with a question when the question is asked. The default formatting causes error texts to be displayed in red.",
                "After a question has been answered some standard validation is performed on the response. If one of these validation checks fails then an appropriate error is automatically added to the `Errors` collection and the question is re-asked, displaying the error message. If the standard validation checks pass and a custom validation function has been defined (using `IValidation`.Function) then that custom validation function is executed. That custom validation function can add additional errors to the `IQuestion.Errors` collection.",
                "The `IQuestion.Errors` collection is automatically cleared before the standard validation is performed.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "Info",
            returnType: createBuiltInDefPlaceHolder("IQuestionInfo"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) Info: IQuestionInfo",
                "--------------------",
                "This read-only property indicates whether the question is a `Database` question.",
                "",
                "### Remarks",
                "This property is not supported in mrDataManager 1.0"
            ].join("\n"),
        },
        {
            name: "IsDBQuestion",
            returnType: BasicTypeDefinitions.boolean ,
            definitionType: "property",
            readonly: true,
            note: [
                "(property) IsDBQuestion: Boolean",
                "--------------------",
                "This read-only property indicates whether the question is a Database question."
            ].join("\n"),
        },
        {
            name: "Label",
            returnType: createBuiltInDefPlaceHolder("ILabel"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) Label: ILabel",
                "--------------------",
                "This read-only property returns the label for the question.",
                "",
                "### Remarks",
                "The question label that is returned is based on the active language, context, and label type. The question label can be modified, but any changes will not be written back into the MDM."
            ].join("\n"),
        },
        {
            name: "OtherCategories",
            returnType: createBuiltInDefPlaceHolder("ICategories"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) OtherCategories: ICategories",
                "--------------------",
                "A read-only property that returns a collection of \"other specify\" categories.",
                "",
                "### Remarks",
                "The categories returned by the `OtherCategories` property represent the \"Other Specify\" categorical responses for a question.",
                "The `OtherCategories` collection is similar to the `Categories` collection except it is a flattened list and only contains categories that have an associated \"other specify\" question",
            ].join("\n"),
        },
        {
            name: "ParentQuestion",
            returnType: createBuiltInDefPlaceHolder("IQuestion"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) ParentQuestion: IQuestion",
                "--------------------",
                "A read-only property that returns the parent question if one exists.",
                "",
                "### Remarks",
                "*NULL* is returned if the question does not have a parent question."
            ].join("\n"),
        },
        {
            name: "Properties",
            returnType: createBuiltInDefPlaceHolder("IProperties"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) Properties: IProperties",
                "--------------------",
                "A read-only property that returns the properties for the question.",
                "",
                "### Remarks",
                "*NULL* is returned if the question does not have a parent question."
            ].join("\n"),
        },
        {
            name: "QuestionDataType",
            returnType: createBuiltInDefPlaceHolder("DataTypeContants") ,
            definitionType: "property",
            readonly: true,
            note: [
                "(property) QuestionDataType: DataTypeContants",
                "--------------------",
                "A read-only property that returns the question data type.",
                "",
                "### Remarks",
                "This property is only valid for questions with a `QuestionType` of *qtSimple*."
            ].join("\n"),
        },
        {
            name: "QuestionFullName",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: true,
            note: [
                "(property) QuestionFullName: String",
                "--------------------",
                "A read-only property that returns the full name of the question.",
                "",
                "### Remarks",
                "If the question is a sub-question of another question object, then the full-name will not match the name."
            ].join("\n"),
        },
        {
            name: "QuestionName",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: true,
            note: [
                "(property) QuestionName: String",
                "--------------------",
                "A read-only property that returns the name of the question or sub-question."
            ].join("\n"),
        },
        {
            name: "QuestionType",
            returnType: createBuiltInDefPlaceHolder("QuestionTypes") ,
            definitionType: "property",
            readonly: true,
            note: [
                "(property) QuestionType: QuestionTypes",
                "--------------------",
                "A read-only property that returns the question type.",
                "",
                "### Remarks",
                "The question type determines which properties are available."
            ].join("\n"),
        },
        {
            name: "Response",
            returnType: createBuiltInDefPlaceHolder("IResponse"),
            definitionType: "property",
            readonly: true,
            note: [
                "(property) Response: IResponse",
                "--------------------",
                "The read-only Response property returns the response object for the question.",
                "",
                "### Remarks",
                "The `response` object can be used to set and unset a question value, as well as setting the default value. The `Response` object is only available for *Simple* questions, for which it is the default property. The following examples show how the `Response` object can be used:",
                "```ds",
                "' Unset the response for Q1",
                "Q1.Response = NULL",
                "",
                "' Set the default value for Q1",
                "Q1.Response.Default = {Female}",
                "",
                "' Use the response value of Q1 in an expression",
                "Total.Response = Total.Response + Q1",
                "```",
            ].join("\n"),
        },
        {
            name: "Style",
            returnType: createBuiltInDefPlaceHolder("IStyle"),
            definitionType: "property",
            readonly: true,
            isCollection: false,
            note: [
                "(property) Response: IResponse",
                "--------------------",
                "This property returns a `Style` object for the question.",
                "",
                "### Remarks",
                "The `Style` object is used to override or reset the default presentation styles for the question. For *Loop*, *Block*, *Page*, and *Compound* question types, the `Style` object can be used to set styles for all of the sub-questions. Any styles set in a parent question can be further overridden in a sub-question.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "Validation",
            returnType: createBuiltInDefPlaceHolder("IValidation"),
            definitionType: "property",
            readonly: true,
            isCollection: false,
            note: [
                "(property) Validation: IValidation",
                "--------------------",
                "This read-only property that defines the validation for the question.",
                "",
                "### Remarks",
                "The validation object is used only with Simple question types.",
            ].join("\n"),
        },
        {
            name: "BannerTemplacte",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) BannerTemplacte: String",
                "--------------------",
                "This property is used to get or set the name of a `Banner` template for the question.",
                "",
                "### Remarks",
                "The banner template is used when replacing mrBanner tags.",
                "This property is not supported in mrDataManager 1.0"
            ].join("\n"),
        },
        {
            name: "DBFilter",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) DBFilter: String",
                "--------------------",
                "This property is used to get and set the `Database` filter for the question."
            ].join("\n"),
        },
        {
            name: "ErrorTemplate",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) ErrorTemplate: String",
                "--------------------",
                "This property is used to get or set the name of a `Error` template for the question.",
                "",
                "### Remarks",
                "The error template is used when replacing mrError tags.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "Item",
            returnType: createBuiltInDefPlaceHolder("IQuestion"),
            definitionType: "property",
            readonly: false,
            isCollection: true,
            index: {
                name: "Index",
                type: BasicTypeDefinitions.variant,
                isCollection: false,
            },
            note: [
                "(property) Item: Variant",
                "--------------------",
                "The `Item` property is used to return a sub-question. (Default Property)",
                "",
                "### Remarks",
                "The `Item` property is only available for the *Loop*, *Block*, *Compound*, and *Page* question types, for which it is the default property. The Item method is used to return the sub-questions from an iteration of a *Loop* or to return a sub-question from a *Block*, *Compound*, or *Page*. The `Item` property would not normally be used for *Blocks*, *Compounds* and *Pages*, except when a sub-question has the same name as a property.",
                "```ds",
                "' Item example: Ask the sub-questions on the loop",
                "Loop1[{ExA}].Ask() ' Equivalent to: Loop1.Item[{ExA}].Ask()",
                "",
                "' Item example: Block sub-question uses reserved name",
                "Block1[\"Style\"].Ask()",
                "```",
                "The index parameter on `Item` is optional.  If the index is not specified, then the property",
                "sets or gets the Response value.",
                "```ds",
                "' Equivalent to Q1.Response = {Female}",
                "Q1 = {Female}",
                "",
                "' Equivalent to TotalQ.Response = TotalQ.Response + 1",
                "TotalQ = TotalQ + 1",
                "```",
            ].join("\n"),
        },
        {
            name: "LayoutTemplate",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) LayoutTemplate: String",
                "--------------------",
                "This read/write property is used to get or set the layout template for the question.",
                "",
                "### Remarks",
                "The layout template is typically the name of a file which defines where the questions on a page should be rendered.",
                "This property is not supported in mrDataManager 1.0"
            ].join("\n"),
        },
        {
            name: "MustAnswer",
            returnType: BasicTypeDefinitions.boolean ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) MustAnswer: Boolean",
                "--------------------",
                "This read/write property is used to enable or disable automatic no answer questions.",
                "",
                "### Remarks",
                "If the `MustAnswer` property is set, the question must be answered. If `MustAnswer` is set to *False*, then any questions with a default value or a no answer (NA) special response will automatically be answered. If `MustAnswer` is set to *False* and a question does not have a *default* or *NA* as a valid response, then the question needs to be answered before proceeding to the next question.",
                "If no value is set for this property then the `MustAnswer` setting of the parent question is used, i.e. the iterations of a loop or the questions in a block will use the MustAnswer setting for the loop or block question respectively. Top level questions will use the `IOM.MustAnswer` (which has a default of *True*) if no `MustAnswer` value has been set.",
            ].join("\n"),
        },
        {
            name: "NarBarTemplate",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) NarBarTemplate: String",
                "--------------------",
                "This property is used to get or set the name of a `NavBar` template for the question.",
                "",
                "### Remarks",
                "The navigation bar template is used when replacing *mrNavBar* tags.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "QuestionFilter",
            returnType: BasicTypeDefinitions.variant ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) QuestionFilter: Variant",
                "--------------------",
                "The sub-questions of this question that are to be asked.",
                "",
                "### Remarks",
                "This is similar to the `Filter` property of `ICategories` and `ICategory`. It determines the sub-questions that are returned by the Item property when using a numeric index and by the `For-Each` enumerator. It also affects the value returned by the `Count` property. All questions are still accessible from the `Item` property using the question name. Unlike the `Filter` property of `ICategories` and `ICategory`, this `Filter` property only affects the immediate sub-questions.",
                "For a categorical loop the `QuestionFilter` property can be a categorical value or a range expression, e.g. *{Monday, Tuesday, Wednesday}* or \"Monday..Wednesday\"",
                "For a numeric loop the `QuestionFilter` property can be a range expression or a numeric value. A numeric value is interpreted as a range expression expression of \"..n\" where n is the numeric value, e.g. the following are equivalent:",
                "```ds",
                "PersonLoop.QuestionFilter '\"..5\"",
                " ",
                "PersonLoop.QuestionFilter `5",
                "```",
                "",
                "A typical example of filtering a numeric loop would be to reduce the number if iterations asked based on the response to a previous question, e.g:",
                "```ds",
                "' Filter the numeric loop sub-questions based on a previous question ",
                "PersonLoop.QuestionFilter = PeopleInHousehold",
                "```",
                "For a compound, block, or page question the `QuestionFilter` property is a range expression containing a list of the questions to ask, e.g.",
                "```ds",
                "Demographics.QuestionFilter ' \"age, gender, education\"",
                "```",
                "The `QuestionFilter` is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "QuestionOrder",
            returnType: createBuiltInDefPlaceHolder("OrderConstants") ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) QuestionOrder: OrderConstants",
                "--------------------",
                "The order of the sub-questions of this question.",
                "",
                "### Remarks",
                "Setting the order property controls the sequence in which `Questions` objects are returned by the Item property when using a numeric index and also by the `For-Each` enumerator.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        },
        {
            name: "QuestionTemplate",
            returnType: BasicTypeDefinitions.string ,
            definitionType: "property",
            readonly: false,
            isCollection: false,
            note: [
                "(property) QuestionTemplate: String",
                "--------------------",
                "This property is used to get or set the name of a question template for the question.",
                "",
                "### Remarks",
                "The question template is used when replacing mrData tags that do not specify a question element.",
                "This property is not supported in mrDataManager 1.0",
            ].join("\n"),
        }
    ]
};

export const builtInIDocumentInterface: BuiltInDefinition =     {
    name: "IDocument",
    definitionType: "interface",
    note: [
        "(interface) IDocument",
        "-----------------------------",
        "The **Table Object Model (TOM)** document is at the root of the object model and is the only object which is publicly creatable. The `Document` object represents a book of tables.",
    ].join("\n"),
    properties: [
        {
            name: "Axes",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IAxes"),
            readonly: true,
            isCollection: true,
            index: {
                name: "Index",
                type: BasicTypeDefinitions.variant,
            },
            note: [
                "(property) IDocument.Axes[Index: Variant]: IAxes",
                "--------------------",
                "A collection of axis objects that can be reused on multiple tables.",
                "",
                "### Remarks",
                "This is intended to be used as a 'toolbox' of reusable axis objects. Axis objects can be created and stored in this collection and then used on multiple tables. Note that when the axis is used, it is copied to each individual table. Therefore the axis on a particular table can be modified without affecting other tables that also used the same axis."
            ].join("\n"),
        },
        {
            name: "Coding",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ICoding"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Coding: ICoding",
                "--------------------",
                "The `Coding` object includes methods that can be used to `categorize` and *band text*, *numeric*, and *date* variables in the TOM document.",
            ].join("\n"),
        },
        {
            name: "CreatedByVersion",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.CreatedByVersion: String",
                "--------------------",
                "Returns the version number of the `TOM.DLL` that created the `Document`.",
            ].join("\n"),
        },
        {
            name: "DataSet",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IDataSet"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.DataSet: IDataSet",
                "--------------------",
                "The data set that this table document is based upon. The data set consists of metadata and associated case data.",
            ].join("\n"),
        },
        {
            name: "Default",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Default: ITableDefaults",
                "--------------------",
                "The `Default` property has various settings that are automatically copied to a new table",
                "",
                "### Remarks",
                "The `IDocument.Default` property specifies the default settings for new `ttAggregated` tables (added via the `ITables.AddNew()` method).",
                "The `IDocument.ProfileDefault` property specifies the default settings for new `ttProfile` tables."
            ].join("\n"),
        },
        {
            name: "Exports",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IExports"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Exports: IExports",
                "--------------------",
                "Collection of `Export` objects. `Exports` are used to publish the resulting tables in a variety of formats.",
            ].join("\n"),
        },
        {
            name: "Filters",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IFilters"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Filters: IFilters",
                "--------------------",
                "A collection of table filters which may be set up in advance for use on tables.",
                "",
                "### Remarks",
                "This is intended to be used as a 'toolbox' of reusable `filter` objects. `Filter` objects can be created and stored in this collection and then used on multiple tables. Note than when the filter is used, it is copied to each individual table. Therefore the filter on a particular table can be modified without affecting other tables that also used the same filter."
            ].join("\n"),
        },
        {
            name: "Global",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ITableGlobals"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Global: ITableGlobals",
                "--------------------",
                "The `TableGlobals` are various settings that are applied to all tables in the document. The settings are merged together with the per-table settings."
            ].join("\n"),
        },
        {
            name: "GroupedTables",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ITableListNode"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.GroupedTables: ITableListNode",
                "--------------------",
                "Tables arranged into groups",
                "",
                "### Remarks",
                "The `IDocument.Tables` property is a flat collection of tables. The tables in that collection can be given a hierarchical arrangement using the `GroupedTables` property."
            ].join("\n"),
        },
        {
            name: "IsPopulating",
            definitionType: "property",
            returnType: BasicTypeDefinitions.boolean ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.IsPopulating: Boolean",
                "--------------------",
                "Returns *True* if the `Document` is currently populating."
            ].join("\n"),
        },
        {
            name: "LastUpdatedByVersion",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.LastUpdatedByVersion: String",
                "--------------------",
                "Returns the version number of the `TOM.DLL` that last updated the `Document`."
            ].join("\n"),
        },
        {
            name: "LicensedFeatures",
            definitionType: "property",
            returnType: BasicTypeDefinitions.long ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.LicensedFeatures: Long",
                "--------------------",
                "The features of the document for which a valid license exists.",
                "",
                "### Remarks",
                "The `LicensedFeatures` property returns a binary 'OR' of `LicensableFeature` enumerated values. The `LicensableFeature` values that are set depends on the licenses that have been installed."
            ].join("\n"),
        },
        {
            name: "Parent",
            definitionType: "property",
            returnType: BasicTypeDefinitions.null ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Parent: Null",
                "--------------------",
                "The parent object",
                "",
                "### Remarks",
                "The `Parent` property of the `Document` object always returns *Null*"
            ].join("\n"),
        },
        {
            name: "PopulateProgress",
            definitionType: "property",
            returnType: BasicTypeDefinitions.long ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.PopulateProgress: Long",
                "--------------------",
                "Returns the percentage completion of the population run",
                "",
                "### Remarks",
                "The `PopulateProgress` property can be used to indicate on a progress bar the percentage of completion of the current population run. Note that the `PopulateProgress` doesn't increase linearly with time as the population process consists of multiple stages and it's not possible to accurately calculate in advance how long each stage will take to complete."
            ].join("\n"),
        },
        {
            name: "PopulateStatus",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.PopulateStatus: String",
                "--------------------",
                "Returns a description of the current population status.",
                "",
                "### Remarks",
                "The `PopulateStatus` is updated as the population run progresses."
            ].join("\n"),
        },
        {
            name: "ProfileDefault",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ITableDefaults"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.ProfileDefault: ITableDefaults",
                "--------------------",
                "The `ProfileDefault` property has various setting that are automatically copied to a new profile table.",
                "",
                "### Remarks",
                "The `IDocument.DefaultProfile` property specifies the default settings for new *ttProfile* tables (added via the `ITables.AddNewProfile()` method).",
                "The `IDocument.Default` property specifies the default settings for new *ttAggregated* tables."
            ].join("\n"),
        },
        {
            name: "Properties",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IProperties"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Properties: IProperties",
                "--------------------",
                "A collection of user added Property objects relating to the document.",
                "",
                "### Remarks",
                "The `IDocument.Properties` collection can be used to store user added properties relating to the table document. Any properties added will be saved and loaded as part of the table document but will not otherwise have any effect on TOM. The contents of the `IDocument.Properties` collection will be included in the Tables XML returned by `IDocument.GetTablesXml()` but not in the script returned by `IDocument.GenerateScript()`",
                "",
                "### Example",
                "```ds",
                "Dim DocCreator",
                "",
                "Set DocCreator = TableDoc.Properties.CreateProperty()",
                "DocCreator.Name = \"DocumentCreator\"",
                "DocCreator.Value = \"Sam Smith, Acme Research Limited\"",
                "TableDoc.Properties.Add(DocCreator)",
                "",
                "Debug.Echo(\"Document Creator: \" + TableDoc.Properties.Item[\"DocCreator\"])",
                "```",
            ].join("\n"),
        },
        {
            name: "Statistics",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("IStatistics"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Statistics: IStatistics",
                "--------------------",
                "A collection of Statistic objects that define statistical tests that are available for applying to tables.",
                "",
                "### Remarks",
                "Chi-Square, column means, column proportions, paired preference, net difference, Tukey and Fisher Exact tests are currently available."
            ].join("\n"),
        },
        {
            name: "Tables",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("ITables"),
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.Tables: ITables",
                "--------------------",
                "This collection of tables contained in the document. This is the default property."
            ].join("\n"),
        },
        {
            name: "TOMVersion",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: true,
            isCollection: false,
            note: [
                "(property) IDocument.TOMVersion: String",
                "--------------------",
                "Returns the version number of the `TOM.DLL`"
            ].join("\n"),
        },
        {
            name: "Context",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.Context: String",
                "--------------------",
                "The document context.",
                "",
                "### Remarks",
                "The context set via this property becomes the current context for the data set (or more precisely, the MDM Document) that this table document is based on."
            ].join("\n"),
        },
        {
            name: "Description",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.Description: String",
                "--------------------",
                "A user specified string that can be used to describe the contents of this table document."
            ].join("\n"),
        },
        {
            name: "ImageLocation",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.ImageLocation: String",
                "--------------------",
                "The location of the images referenced by the elements.",
                "",
                "### Remarks",
                "If the `IStyle.Image` property doesn't refer to an absolute HTTP address then the ImageLocation property should be used to specify the location of the images. Any export that makes use of the `IStyle.Image` property will typically prefix relative image locations directly with the value of the `ImageLocation` property. For this reason, make sure the `ImageLocation` ends with a forwardslash or backslash as appropriate.",
                "Typical values for this property might be:",
                "+ An empty string if the images reside in the same location as the exported table document.",
                "+ A local path, e.g. \"C:\\images\\\"",
                "+ A URL to an HTTP server, e.g. \"HTTP://www.server.com/images/\"",
            ].join("\n"),
        },
        {
            name: "KeepLogFiles",
            definitionType: "property",
            returnType: BasicTypeDefinitions.boolean ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.KeepLogFiles: Boolean",
                "--------------------",
                "Keep the temporary files created during the call to IDocument.Populate",
                "",
                "### Remarks",
                "If KeepLogFiles is False (the default value) then the temporary files created during the call to IDocument.Populate are deleted. Setting KeepLogFiles to True will stop the log files from being deleted. The temporary files and log files created are stored in the location specified by the IDocument.LogFilePath property."
            ].join("\n"),
        },
        {
            name: "LabelType",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.LabelType: String",
                "--------------------",
                "The document label type.",
                "",
                "### Remarks",
                "The label type set via this property becomes the current label type for the data set (or more precisely, the MDM Document) that this table document is based on."
            ].join("\n"),
        },
        {
            name: "Language",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.Language: String",
                "--------------------",
                "The document language. The language can be the three-character language code (such as \"ENU\"), the language long name, which is the localized name of the language and the country where it is spoken, such as \"English (United States)\" or the XML-name.",
                "",
                "### Remarks",
                "The language set via this property becomes the current language for the data set (or more precisely, the MDM Document) that this table document is based on."
            ].join("\n"),
        },
        {
            name: "LogFilePath",
            definitionType: "property",
            returnType: BasicTypeDefinitions.string ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.LogFilePath: String",
                "--------------------",
                "The location used to write temporary files and log files created when a table is populated.",
                "",
                "### Remarks",
                "If a location is not specified for the `LogFilePath` property then the system temporary directory is used. The exact files produced and their content is undefined, but the information they contain is useful for Technical Support purposes. The files are normally discarded automatically unless `IDocument.KeepLogFiles` is set to *True*."
            ].join("\n"),
        },
        {
            name: "OpenOption",
            definitionType: "property",
            returnType: createBuiltInDefPlaceHolder("OpenOptions") ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.OpenOption: OpenOptions",
                "--------------------",
                "The options used when opening data sets."
            ].join("\n"),
        },
        {
            name: "OutputLocaleId",
            definitionType: "property",
            returnType: BasicTypeDefinitions.long ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.OutputLocaleId: Long",
                "--------------------",
                "Sets the locale id used for any error messages descriptions.",
                "",
                "### Remarks",
                "This must be a valid locale id (LCID). Fallback mechanisms are used if the specified `OutputLocaleId` is not supported."
            ].join("\n"),
        },
        {
            name: "ProfileSpecialElements",
            definitionType: "property",
            returnType: BasicTypeDefinitions.boolean ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.ProfileSpecialElements: Boolean",
                "--------------------",
                "If set to *True*, special data elements, such as *Net* and *Base* elements, will be included in profile table results.",
                "",
                "### Remarks",
                "The `ProfileSpecialElements` property is set to *False* by default, meaning that special data elements will not be included in profile tables"
            ].join("\n"),
        },
        {
            name: "RawStatisticsDataEnabled",
            definitionType: "property",
            returnType: BasicTypeDefinitions.boolean ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.RawStatisticsDataEnabled: Boolean",
                "--------------------",
                "Controls the generation of raw statistical data during execution of the Populate method.",
                "",
                "### Remarks",
                "If `RawStatisticsDataEnabled` is set to *True* then raw statistical data is generated during execution of the `Populate` method and is able from the `RawStatisticsData` property. The default value for `RawStatisticsDataEnabled` is *False*."
            ].join("\n"),
        },
        {
            name: "SaveProfileResults",
            definitionType: "property",
            returnType: BasicTypeDefinitions.boolean ,
            readonly: false,
            isCollection: false,
            note: [
                "(property) IDocument.SaveProfileResults: Boolean",
                "--------------------",
                "If *True* the populated results for profile tables are included in saved `Table Document` files",
                "",
                "### Remarks",
                "The `SaveProfileResults` property is *True* by default. Setting the property to *False* causes all profile tables to be saved as if they were unpopulated."
            ].join("\n"),
        }
    ],
    methods: [
        {
            name: "Clear",
            definitionType: "method",
            note: [
                "(method) IDocument.Clear(): Void",
                "--------------------",
                "Returns the `Document` to its initial state.",
                "",
                "### Remarks",
                "The `Clear` method performs the following actions:",
                "+ All tables are removed from the document",
                "+ The `Axes` and `Filters` collections of the document are cleared",
                "+ The `Statistics` collection of the document is restored to its initial state",
                "+ The `Reset` method on the `TableDefaults` object is invoked to restore all default settings.",
                "+ The `Clear` method on the `TableGlobals` object is invoked to remove all global settings.",
                "+ The `DataSet` property of the `Document` is cleared, removing the reference to the metadata.",
            ].join("\n"),
        },
        {
            name: "GenerateScript",
            definitionType: "method",
            returnType: BasicTypeDefinitions.string ,
            arguments: [
                {
                    name: "Tables",
                    type: BasicTypeDefinitions.variant,
                    optional: true,
                    note: "A list of tables to include in the generated script.",
                },
                {
                    name: "Type",
                    type: createBuiltInDefPlaceHolder("ScriptType"),
                    optional: true,
                    defaultValue: "stMRS",
                    note: "The type of script to generate. Currently only stMRS (mrScriptBasic) script is possible",
                },
                {
                    name: "Options",
                    type: BasicTypeDefinitions.variant,
                    optional: true,
                    note: "Reserved for future use",
                }
            ],
            note: [
                "(method) IDocument.GenerateScript([Tables: Variant], [Type: ScriptType], [Options: Variant]): String",
                "--------------------",
                "Generates a script representation of the table document.",
                "",
                "### Parameters",
                "+ ***Tables*** - A list of tables to include in the generated script.",
                "+ ***Type*** - The type of script to generate. Currently only *stMRS* (mrScriptBasic) script is possible",
                "+ ***Options*** - Reserved for future use",
                "",
                "### Return Value",
                "A string containing the script",
                "",
                "### Remarks",
                "The script that is created by this method will create a new `Document` object, load the correct dataset, set up default and global settings, define the tables, populate them, and finally configure the exports and export the tables.",
                "It is intended that this method will be invoked by a GUI that is using the `Table Object Model`. A user would use the GUI to define, populate, view, and export tables. The user could then select a 'View Script' option which would cause the GUI to invoke this method and return the resulting script to the user. The user could then modify the script in Professional and re-run it to automatically regenerate the tables. The script could also be run as a batch job via *mrScriptCL.exe*.",
                "Note that for security reasons the `DataSet.Load` method will not include the full paths to the metadata and case data. If full paths were included then in a client server situation it would allow the user to see the full path to the data on the server. A comment will be included in the generated script if path information has been removed.",
            ].join("\n")
        },
        {
            name: "GetObjectFromID",
            definitionType: "method",
            returnType: BasicTypeDefinitions.object,
            arguments: [
                {
                    name: "ID",
                    type: BasicTypeDefinitions.string,
                    optional: false
                }
            ],
            note: [
                "(method) IDocument.GetObjectFromID(ID: String): Object",
                "--------------------",
                "Get the object corresponding to an object ID",
                "",
                "### Remarks",
                "The ObjectID property on the IPersistObject interface on some of objects can be used to get an ID string for that object. This GetObjectFromID method can be used to retrieve the object corresponding to an object ID."
            ].join("\n")
        },
        {
            name: "GetTablesXml",
            definitionType: "method",
            returnType: BasicTypeDefinitions.string ,
            arguments: [
                {
                    name: "Tables",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    note: "A list of tables to include in the generated script. See the Tables parameter of IDocument.Populate for more information on the valid values for this parameter.",
                },
                {
                    name: "Options",
                    type: BasicTypeDefinitions.long,
                    optional: true,
                    defaultValue: "xmlIncludeResults",
                    note: "A binary '`OR`' of `XmlOption` enumerated values which control the contents of the returned Tables XML"
                }
            ],
            note: [
                "(method) IDocument.GetTablesXml([Tables: Variant], [Options: Long = xmlIncludeResults]): String",
                "--------------------",
                "Generates an XML representation of the table document.",
                "",
                "### Parameters",
                "+ ***Tables*** - A list of tables to include in the generated script.",
                "+ ***Options*** - A binary '`OR`' of `XmlOption` enumerated values which control the contents of the returned `Tables` XML",
                "",
                "### Return Value",
                "A string containing the `Tables` XML",
            ].join("\n"),
        },
        {
            name: "Open",
            definitionType: "method",
            arguments: [
                {
                    name: "Source",
                    type: BasicTypeDefinitions.variant,
                    note: "Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                },
                {
                    name: "IncludeResults",
                    type: BasicTypeDefinitions.boolean,
                    optional: true,
                    defaultValue: "1",
                    note: "If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the Open method slightly faster."
                }
            ],
            note: [
                "(method) IDocument.Open(Source: Variant, [IncludeResults: Boolean = 1]): String",
                "--------------------",
                "Opens a previously saved table document.",
                "",
                "### Parameters",
                "+ ***Source*** - Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                "+ ***IncludeResults*** - If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the `Open` method slightly faster.",
                "",
                "### Remarks",
                "The `Open` method can \"open\" the table document from a file on disk or read it out of a previously loaded `XML DOM` document."
            ].join("\n"),
        },
        {
            name: "OpenWithDataSet",
            definitionType: "method",
            arguments: [
                {
                    name: "Source",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    note: "Either the name of a previously saved table document file or an XML DOM object into which a table document has already been loaded.",
                },
                {
                    name: "IncludeResults",
                    type: BasicTypeDefinitions.boolean,
                    optional: false,
                    note: "If the previously saved table document had been populated then it may contain cell values. If IncludeResults is False then these values will not be loaded with the rest of the document. This will make the call to the Open method slightly faster.",
                },
                {
                    name: "MetaData",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    note: "The location of the metadata to use. The format of this string depends on the MDSC, but is typically a location of an .MDD or some other type of file. This can also be an existing MDM document object.",
                },
                {
                    name: "MDSC",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                    note: "The metadata DSC to use e.g. *mrQvDsc*, or empty if no MDSC is required",
                },
                {
                    name: "DbLocation",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                    note: "The location of the case data to use. The format of this string depends on the CDSC",
                },
                {
                    name: "CDSC",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                    note: "The case data dsc to use e.g. *mrQdiDrsDsc*",
                },
                {
                    name: "Project",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "\"\"",
                    note: "The project name to use if the CDSC supports multiple projects. Otherwise this parameter is ignored.",
                },
                {
                    name: "Version",
                    type: BasicTypeDefinitions.string,
                    optional: true,
                    defaultValue: "{..}",
                    note: "A version specified for the metadata to use. The default specification string is \"{..}\" (the 'SuperVersion') which means to use all locked versions in the metadata.",
                },
            ],
            note: [
                "(method) IDocument.OpenWithDataSet(Source: Variant, [IncludeResults: Boolean = 1], MetaData: Variant, [MDSC: String = \"\"], [DbLocation: String = \"\"], [CDSC: String = \"\"], [Project: String = \"\"], [Version: String = {..}]): String",
                "--------------------",
                "Opens a previously saved table document with the specified metadata and case data.",
                "",
                "### Parameters",
                "+ ***Source*** - Either the name of a previously saved table document file or an `XML DOM` object into which a table document has already been loaded.",
                "+ ***IncludeResults*** - If the previously saved table document had been populated then it may contain cell values. If `IncludeResults` is *False* then these values will not be loaded with the rest of the document. This will make the call to the `Open` method slightly faster.",
                "+ ***MetaData*** - The location of the metadata to use. The format of this string depends on the `MDSC`, but is typically a location of an *.MDD* or some other type of file. This can also be an existing MDM document object.",
                "+ ***MDSC*** - The metadata DSC to use e.g. *mrQvDsc*, or empty if no `MDSC` is required",
                "+ ***DbLocation*** - The location of the case data to use. The format of this string depends on the `CDSC`",
                "+ ***CDSC*** - The case data dsc to use e.g. *mrQdiDrsDsc*",
                "+ ***Project*** - The project name to use if the `CDSC` supports multiple projects. Otherwise this parameter is ignored.",
                "+ ***Version*** - A version specified for the metadata to use. The default specification string is \"{..}\" (the 'SuperVersion') which means to use all locked versions in the metadata.",
                "",
                "### Remarks",
                "The `IDocument.Open` method automatically reloads the metadata that is specified in the saved table document. The `IDocument.OpenWithDataSet` method is used to override the metadata and case data information that is stored in the saved table document. If this method is used any information about the metadata and case data stored in the saved file is ignored. `IDocument.OpenWithDataSet` is typically used if the location of the metadata has changed since the document was last saved."
            ].join("\n"),
        },
        {
            name: "Populate",
            definitionType: "method",
            returnType: BasicTypeDefinitions.boolean ,
            arguments: [
                {
                    name: "Tables",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    note: [
                        "A list of tables to populate. If this parameter is not specified, then all tables in the document are populated. ",
                        "    - An empty string means populate no tables (the method call does nothing)",
                        "    - A value of \"*\" means populate all tables",
                        "    - A string containing the name of a single table populates just that table",
                        "    - A comma separated list of table names will populate all tables in the list",
                        "    - An array of table names will populate all tables specified in the array",
                    ].join("\n"),
                }
            ],
            note: [
                "(method) IDocument.Populate(Tables: Variant): Boolean",
                "--------------------",
                "Populates the `CellValues` of the required document tables.Return *True* if all tables are populated successfully; return *False* if any of the tables fail during population.",
                "",
                "### Parameters",
                "+ ***Tables*** - A list of tables to populate. If this parameter is not specified, then all tables in the document are populated. A restricted set of tables can be specified using any of the following techniques:",
                "    - An empty string means populate no tables (the method call does nothing)",
                "    - A value of \"*\" means populate all tables",
                "    - A string containing the name of a single table populates just that table",
                "    - A comma separated list of table names will populate all tables in the list",
                "    - An array of table names will populate all tables specified in the array",
                "",
                "### Return Value",
                "Return *True* if all tables are populated successfully; return *False* if any of the tables fail during population.",
            ].join("\n"),
        },
        {
            name: "PopulateBegin",
            definitionType: "method",
            arguments: [
                {
                    name: "Tables",
                    type: BasicTypeDefinitions.variant,
                    optional: false
                }
            ],
            note: [
                "(method) IDocument.PopulateBegin(Tables: Variant): Void",
                "--------------------",
                "Begin an asynchronous population run",
                "",
                "### Return Value",
                "The `PopulateBegin()` method is identical to the `Populate()` method except that it is asynchronous. This means that the `PopulateBegin()` method returns immediately and the population will occur in the background.",
                "No method or property of the object model should be accessed while population is occurring, other than the `PopulateCancel()` method and the PopulateStatus, PopulateProgress, and IsPopulating properties.",
                "If `PopulateBegin()` is used the `OnPopulateError` event should be used to monitor for errors that occur during population. The end of population can be detected by either polling the `IsPopulating` property or waiting for the `OnPopulateComplete` event.",
            ].join("\n"),
        },
        {
            name: "PopulateCancel",
            definitionType: "method",
            note: [
                "(method) IDocument.PopulateCancel(): Void",
                "--------------------",
                "Cancel an existing population started via `Populate()` or `PopulateBegin()`"
            ].join("\n"),
        },
        {
            name: "RefreshFromMetadata",
            definitionType: "method",
            arguments: [
                {
                    name: "ForceRefresh",
                    type: BasicTypeDefinitions.boolean,
                    optional: true,
                    defaultValue: "0"
                }
            ],
            note: [
                "(method) IDocument.RefreshFromMetadata([ForceRefresh: Boolean = 0]): Void",
                "--------------------",
                "Updates all axes in all tables from the metadata if `UseMetadataDefinition` is *True*",
                "",
                "### Remarks",
                "The `RefreshFromMetadata` method updates axes which have the `UseMetadataDefinition` property set to True based on the current definition in the metadata. This is useful if the metadata has changed since the tables in the document were defined.",
                "The axes are automatically refresh from the metadata definition when the table is populated.",
                "It is assumed the metadata will not be modified while the table document is open. The `Axis` objects track when they have been synchronized with metadata and will not refresh if they are up to date. If the metadata does change while the table document is open the `ForceRefresh` parameter can be used to force the axis to refresh itself.",
            ].join("\n"),
        },
        {
            name: "Save",
            definitionType: "method",
            arguments: [
                {
                    name: "Destination",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                    note: "Either the name of a file to save the table document to, or an empty `XML DOM` object. If a file name is specified, and the file already exists, then it is overwritten without warning.",
                },
                {
                    name: "IncludeResults",
                    type: BasicTypeDefinitions.boolean,
                    optional: true,
                    defaultValue: "1",
                    note: "If the parameter is *False*, then the cell values for all tables are not saved. This makes the call to the `Save` method slightly faster and the resulting document smaller.",
                }
            ],
            note: [
                "(method) IDocument.Save(Destination: Variant, [IncludeResults: Boolean = 1]): Void",
                "--------------------",
                "Saves the table document to the specified location.",
                "",
                "### Parameters",
                "+ ***Destination*** - Either the name of a file to save the table document to, or an empty `XML DOM` object. If a file name is specified, and the file already exists, then it is overwritten without warning.",
                "+ ***IncludeResults*** - If the parameter is *False*, then the cell values for all tables are not saved. This makes the call to the `Save` method slightly faster and the resulting document smaller.",
                "",
                "### Remarks",
                "The Save method can \"save\" the table document to either a file on disk or to an in-memory `XML DOM`.",
                "The cell values for profile tables are not saved if `IDocument.SaveProfileResults` is *False*, even if the `IncludeResults` parameter of the `Save()` method is *True*."
            ].join("\n"),
        },
        {
            name: "SaveWithoutDataSet",
            definitionType: "method",
            arguments: [
                {
                    name: "Destination",
                    type: BasicTypeDefinitions.variant,
                    optional: false,
                },
                {
                    name: "IncludeResults",
                    type: BasicTypeDefinitions.boolean,
                    optional: true,
                    defaultValue: "1"
                }
            ],
            note: [
                "(method) IDocument.SaveWithoutDataSet(Destination: Variant, [IncludeResults: Boolean = 1]): Void",
                "--------------------",
                "Saves the table document without any dataset information.",
                "",
                "### Remarks",
                "The `SaveWithoutDataSet()` method is similar to the `Save()` method except that it doesn't save any information on the dataset (i.e. metadata or case data). The file can only be opened again using the `OpenWithDataSet()` method. Attempting to open a file that doesn't contain dataset information using the `Open()` method will cause an error.",
            ].join("\n"),
        }
    ]
};




