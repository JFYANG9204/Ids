/* eslint-disable @typescript-eslint/naming-convention */
import { ErrorTemplates, makeErrorTemplates } from "./errors";


export const ErrorMessages: ErrorTemplates = makeErrorTemplates({
    ArgumentIsNotOptional:           "参数'%0'不是可选的.",
    ArrayIndexTypeMustBeInteger:     "数组索引值必须为整型.",
    BinaryOperatorLostLeft:          "二元操作符缺少左值.",
    BinaryOperatorTypeUnmatched:     "二元操作符左右值类型不一致.",
    CaseShouldBeforeCaseElse:        "'Case'分支需要在'Case Else'分支之前.",
    CategoryExcludeRangeLostBoundary:"'Categorical'类型值中的排除区间需要同时有上限和下限.",
    CategoryExcludeRangeTypeError:   "'Categorical'类型值中的排除区间上下限类型不一致.",
    ConstVarCannotBeAssigned:        "'Const'变量无法被赋值.",
    ConstVarMustInitValue:           "'Const'声明变量必须赋初始值.",
    DontAllowDeclareFunction:        "'%0' 语句块中不能声明函数.",
    EventParamRedeclared:            "参数'%0'已声明.",
    EventNeedParam:                  "EventSection需要参数 '%0'",
    EventParamCantSetMeanwhile:      "EventSection参数 '%0' 不能同时配置.",
    ExpectToken:                     "应为'%0'.",
    IdentifierIsNotFunction:         "'%0'不是函数或方法，无法通过'()'调用.",
    InvalidArrayDefinition:          "无效的数组定义.",
    InvalidIdentifier:               "无效标识符 '%0'.",
    InvalidEventName:                "Event名无效，应为'OnBeforeJobStart,OnAfterMetaDataTransformation,OnJobStart,OnNextCase,OnBadCase,OnJobEnd,OnAfterJobEnd'中的一个.",
    InvalidEventParam:               "无效的EventSection参数.",
    InvalidDigit:                    "无效的%0进制数字.",
    InvalidLoggingParameter:         "无效的Logging参数，应为'Group,Path,Alias,FileSize'.",
    InvalidNumber:                   "无效数字.",
    InvalidNumberRadix:              "无效数字, '&'后应为'H','h','O','o'.",
    InvalidObjectScripting:          "无效的对象字符串.",
    InvalidOrUnexpectedToken:        "无效的标识符.",
    InvalidPreprocessor:             "无效的预处理关键字，应为'include','define','undef','if','elif','else','endif','error','line'",
    InvalidEnumIdentifier:           "无效的枚举类型值.",
    LineMarkRedeclaration:           "行标记'%0'已存在.",
    LineMarkIsNotExist:              "行标记'%0'未声明.",
    LoggingNeedParam:                "Logging缺少参数,需要'Group,Path,Alias,[FileSize]'",
    EventSectionCanOnlyUseInDms:     "Section只能在DMS文件中使用.",
    EventSectionNameRedeclared:      "Section名已经声明.",
    EventSectionNotDeclared:         "名为'%0'的Event未声明.",
    ExpressionNeedReturn:            "语句需要返回值.",
    FunctionNeedReturn:              "'Function'定义的函数需要返回值,如果不需要返回值,请改用'Sub'声明.",
    MissingSemicolon:                "缺少';'.",
    MissingRightParen:               "缺少')'.",
    MissingParenObject:              "缺少父级对象.",
    MissingProperty:                 "缺少名为'%0'的属性或方法.",
    MacroHasNoInitValue:             "宏定义未定义对应值，不能用于操作符计算.",
    NumberIdentifier:                "数字后不能紧跟标识符.",
    NumberIsTooLong:                 "数字超过32位数字范围(-2147483648~2147483647)",
    NeedType:                        "需要类型为'%0'的返回值.",
    UnknownFunction:                 "未知名为'%0'的函数或方法.",
    UnexpectedKeyword:               "不应为关键字 '%0'.",
    UnexpectedToken:                 "不应为 '%0'.",
    UnterminatedComment:             "未终结的块注释.",
    UnterminatedString:              "未终结的字符串.",
    UnmatchedVarType:                "类型为'%0'的值不能分配给类型为'%1'的变量.",
    UnmatchedIndexType:              "没有登记为'%0'的索引类型.",
    UnknownMetadataProperty:         "未知名为'%0'的元数据属性.",
    VarIsNotDeclared:                "变量'%0'未声明.",
    VarIsReadonly:                   "变量或属性为只读.",
    VarRedeclaration:                "变量'%0'被重定义.",
    IncludeFileExistError:           "被包含文件存在错误.",
    IncorrectFunctionArgumentNumber: "函数或方法'%0'定义了%1个参数，此处接收了%2个参数.",
    PropertyOrMethodNotInInterface:  "接口'%0'中不存在名为'%1'的属性或方法.",
    PropertyOrMethodNotInObject:     "对象'%0'中不存在名为'%1'的属性或方法.",
    PropertyOrObjectIsNotCollection: "属性或对象不是集合.",
    PropertyOrObjectHasNoReturn:     "属性或方法没有返回值.",
    PreIncludeFileDontExist:         "路径'%0'对应文件不存在.",
    InterfaceOrObjectHasNoCorrectPropertyOrMethod: "类型为'%0'的接口或对象不包含名为'%1'的属性或方法.",
    InterfaceOrObjectHasNoCorrectProperty: "类型为'%0'的接口或对象不包含名为'%1'的属性.",
    ReadonlyPropertCannotBeLeft:     "属性'%0'是只读的.",
    FunctionCannotBeLeft:            "函数不能作为赋值语句的左值.",
    OperatorCanOnlyBeUsedInPreprocessor: "运算符'%0'只能在预处理中使用.",
    StringLineFeedNeedNewlineChar:   "字符串需要换行符('\\' 或 '_').",
    PropertyAutoImplementAlreadyExist: "属性自动实现'%0'已存在.",
    TypeReferenceCanOnlyBeUsedInDeclareFile: "'As'类型声明只能在声明文件(.d.mrs)中使用.",
    KeywordCanOnlyBeUsedInDeclareFile: "'%0'关键字只能在声明文件(.d.mrs)中使用.",
    // Axis
    AxisElementRedeclared:           "Axis表达式元素'%0'被重定义.",
    AxisInvalidCharactor:            "无效字符.",
    AxisUnknownProperty:             "未知名为'%0'的Axis表达式元素属性.",
    AxisUnknownElement:              "未知名为'%0'的Axis表达式元素类型.",
    // Metadata
    MetadataCategoricalAlreadyExist:    "名为'%0'的Categorical项已存在.",
    MetadataRangeDontAllowExclude:      "此类型元数据区间不允许使用排除符'^'.",
    MetadataRangeDontAllowStep:         "此类型元数据区间不允许使用'step'.",
    MetadataRangeDontAllowSingle:       "此类型元数据区间不允许使用单值.",
    MetadataInvalidUsageType:           "无效的元数据使用类型.",
    MetadataUnkownProperty:             "未知的元数据属性.",
    MetadataInvalidCategoryElementType: "未知的元数据Category元素类型.",
    MetadataInvalidLanguage:            "未知的元数据语言.",
    MetadataInvalidUserContext:         "未知的元数据用户上下文类型.",
    MetadataInvalidLabelType:           "未知的元数据标签类型.",
    MetadataKeyCantExistMeanwhile:      "元数据关键字'%0'不能与'%1'同时使用.",
    MetadataDontAllowValueRange:        "元数据类型不允许设置取值区间.",
    MetadataParamSequenceError:         "元数据参数'%0'应在'%1'之前.",
    MetadataLackNecessaryProperty:      "缺少必需的元数据属性'%0'.",
}, "DATACOLLECTION_SCRIPT_PARSER_SYNTAX_ERROR");

export const WarningMessages: ErrorTemplates = makeErrorTemplates({
    RedundantTypeConvertion:             "多余的类型转换.",
    AssignmentMaybeObject:               "赋值结果为对象，且不具备类型为基础类型的默认属性，应使用'Set'语句.",
}, "DATACOLLECTION_SCRIPT_PARSER_SYNTAX_WARNING");
