

export interface DeleteCollection<T> {
    deleted?: T[];
    values: T[];
}

export interface Property {
    name: string;
    value: string;
    type: string;
    context: string;
    ds?: string;
}

export interface Properties {
    unversioned?: Property[];
    values: Property[];
}

export interface Notes {
    values?: Properties;
}

export interface Connection {
    name: string;
    dbLocation: string;
    cdscName: string;
    project: string;
    id: string;
    aliasVariables: AliasVariable[];
    documentProperties: Property[];
}

export interface DataSources {
    default: string;
    connections: Connection[];
}

export interface Label {
    context: string;
    language: string;
    text?: string;
}

export interface Labels {
    context: string;
    texts: Label[];
}

export interface Category {
    id: string;
    name: string;
    fixed?: string;
    missing?: string;
    exclusive?: string;
    otherLocal?: string;
    properties?: Properties;
    labels?: Labels;
    otherVariable?: Reference;
}

export interface Categories extends DeleteCollection<Category> {
    globalNamespace?: string;
}

export interface FieldDefinitionBase {
    id: string;
    name: string;
    type: string;
    usageType?: string;
    notes?: Notes;
    properties?: Properties;
}

export interface HelperFields extends FieldDefinitionBase, DeleteCollection<Reference> {
    globalNamespace?: string;
}

export interface Variable extends FieldDefinitionBase {
    type: string;
    max?: string;
    maxType?: string;
    min?: string;
    minType?: string;
    labels?: Labels;
    categories?: Categories;
}

export interface OtherVariable extends FieldDefinitionBase {
}

export interface MDMRange {
    effectiveMaxValue?: string;
    effectiveMinValue?: string;
    minValue?: string;
    maxValue?: string;
    minType?: string;
    maxType?: string;
}

export interface SubAlias {
    index: string;
    name: string;
}

export interface AliasVariable extends MDMRange {
    fullName: string;
    aliasName: string;
    nativeValues?: { fullName: string, value: string }[];
    subAlias?: SubAlias[];
    properties?: Properties;
}

export interface RoutingItem {
    name: string;
    item: string;
}

export interface Routing {
    context: string;
    interviewModes: string;
    useKeyCodes: string;
    ritem?: RoutingItem[];
}

export interface VarInstance {
    name: string;
    sourceType: string;
    variable: string;
    fullName: string;
}

export interface Reference {
    id: string;
    name: string;
    ref: string;
}

export interface References {
    name: string;
    globalNamespace: string;
    refs?: Reference[];
}

export interface FieldDesignBase {
    name: string;
    globalNamespace: string;
    templates?: Properties;
    properties?: Properties;
    labels?: Labels;
    fields?: References;
}

export interface BlockField extends FieldDesignBase {
    id: string;
    types?: References;
    pages?: References;
}

export interface LoopFields extends FieldDesignBase {
    subFields: FieldDesignBase[];
    categories?: Categories;
}

export interface Script {
    name: string;
    default: string;
    text: string;
}

export interface ScriptType {
    type: string;
    context: string;
    interviewModes: string;
    useKeycodes: string;
    script: Script;
}

export interface ScriptTypes {
    values: ScriptType;
    deleted?: ScriptType[];
}

export interface Routings {
    scripts: ScriptTypes;
    ritems: Routing[];
}

export interface MDMXmlDesign {
    fields: (Reference | BlockField | LoopFields)[];
    types: References;
    pages: References;
    routings?: Routings;
    properties: Properties;
}

export interface Language {
    name: string;
    id: string;
    properties: Properties;
}

export interface Languages extends DeleteCollection<Language> {
    base: string;
}

export interface Alternative {
    name: string;
}

export interface Context {
    name: string;
    alternatives?: DeleteCollection<Alternative>;
}

export interface Contexts extends DeleteCollection<Context> {
    base: string;
}

export interface UserSaveLog {
    name: string;
    fileVersion: string;
    comment: string;
}

export interface SaveLog {
    fileVersion: string;
    versionSet: string;
    userName: string;
    date: string;
    count: string;
    user: UserSaveLog;
}

export interface Metadata {
    mdmCreateVersion: string;
    mdmLastVersion: string;
    id: string;
    dataVersion: string;
    dataSubVersion: string;
    systemVariable: string;
    dbFilterValidataion: string;
    xmlns: string;
    datasources: DataSources;
    properties: Properties;
    templates: Properties;
    definitions: FieldDefinitionBase[];
    system: DeleteCollection<BlockField>[];
    routings: Routings[];
    mappings: VarInstance[];
    design: MDMXmlDesign;
    languages: Languages;
    contexts: Context;
    labelTypes: Context;
    routingContexts: Context;
    scriptTypes: Context;
    saveLogs: SaveLog[];
    atoms: { name: string }[];
    categoryMap: { name: string, value: string }[];
}

