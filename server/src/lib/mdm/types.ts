

export interface DeleteCollection<T> {
    deleted?: T[];
    values: T[];
}

export interface Styles extends DeleteCollection<Property> {
}

export interface LabelStyles extends Properties {
}

export interface Property {
    name: string;
    value: string;
    type: string;
    context: string;
    ds?: string;
    styles?: Styles;
}

export interface Properties {
    unversioned?: Property[];
    values: Property[];
}

export const EMPTY_PROPERTIES: Properties = { values: [] };

export interface Notes {
    values: Properties;
}

export interface Connection {
    name: string;
    dbLocation: string;
    cdscName: string;
    project: string;
    id: string;
    aliasVariables?: AliasVariable[];
    documentProperties?: Property[];
}

export const EMPTY_CONNECTION: Connection = {
    name: "",
    dbLocation: "",
    cdscName: "",
    project: "",
    id: ""
};

export interface DataSources {
    default: string;
    connections: Connection[];
}

export const EMPTY_DATASOURCES: DataSources = { default: "", connections: [] };

export interface Label {
    context: string;
    language: string;
    text: string;
}

export interface Labels {
    context: string;
    texts: Label[];
}

export const EMPTY_LABELS: Labels = { context: "", texts: [] };

export interface Category {
    id: string;
    name: string;
    fixed?: string;
    nofilter?: string;
    missing?: string;
    exclusive?: string;
    otherLocal?: string;
    properties?: Properties;
    templates?: Properties;
    labels?: Labels;
    labelStyles?: LabelStyles;
    otherVariable?: Reference;
    notes?: Notes;
}

export interface Element {
    id: string;
    name: string;
    type: string;
    labels?: Labels;
}

export interface Categories extends DeleteCollection<Category> {
    id?: string;
    name?: string;
    labels?: Labels;
    globalNamespace?: string;
    categories?: Categories;
    elements?: Element[];
    properties?: Properties;
    templates?: Properties;
}

export interface Axis {
    expression: string;
}

export interface FieldDefinitionBase {
    id: string;
    name: string;
    usageType?: string;
    notes?: Notes;
    properties?: Properties;
    templates?: Properties;
}

export interface HelperFields extends FieldDefinitionBase, DeleteCollection<Reference> {
    globalNamespace?: string;
}

export interface Variable extends FieldDefinitionBase, MDMRange {
    type: string;
    labels?: Labels;
    categories?: Categories;
    helperFields?: HelperFields;
    expression?: string;
    sourceType?: string;
    axis?: Axis;
}

export interface OtherVariable extends FieldDefinitionBase {
    type: string;
    labels?: Labels;
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

export interface References extends DeleteCollection<Reference | LoopField | BlockField> {
    name: string;
    globalNamespace: string;
}

export interface FieldDesignBase {
    name: string;
    templates?: Properties;
    properties?: Properties;
    labels?: Labels;
}

export interface System extends DeleteCollection<BlockField> {
    name: string;
    globalNamespace: string;
}

export const EMPTY_SYSTEM: System = { values: [], name: "", globalNamespace: "" };

export interface BlockSubFields extends DeleteCollection<Reference | LoopField | BlockField> {
    name: string;
    globalNamespace: string;
}

export interface BlockField extends FieldDesignBase {
    id: string;
    globalNamespace: string;
    types?: References;
    fields?: BlockSubFields;
    routings?: Routings;
    pages?: References;
}

export interface LoopSubFields {
    types?: References;
    fields?: References;
    pages?: References;
}

export interface LoopField extends FieldDesignBase {
    id: string;
    type: string;
    isGrid?: string;
    iteratorType?: string;
    categories?: Categories;
    classes?: LoopSubFields;
}

export interface Script {
    name: string;
    default: string;
    text: string;
}

export interface ScriptType extends DeleteCollection<Script> {
    type: string;
    context: string;
    interviewModes: string;
    useKeycodes: string;
}

export interface Scripts extends DeleteCollection<ScriptType> {
}

export interface Routings {
    name?: string;
    scripts?: Scripts;
    ritems: Routing[];
}

export const EMPTY_ROUTINGS: Routings = { ritems: [] };

export interface MDMXmlDesign {
    fields?: BlockSubFields;
    types?: References;
    pages?: References;
    routings?: Routings;
    properties?: Properties;
}

export interface Language {
    name: string;
    id: string;
    properties?: Properties;
}

export interface Languages extends DeleteCollection<Language> {
    base: string;
}

export const EMPTY_LANGUAGES: Languages = { base: "", values: [] };

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

export const EMPTY_CONTEXTS: Contexts = { base: "", values: [] };

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
    users: UserSaveLog[];
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
    dataSources: DataSources;
    properties: Properties;
    templates: Properties;
    labels: Labels;
    definition: (FieldDefinitionBase | Categories)[];
    system: System;
    systemRouting: Routings;
    mappings: VarInstance[];
    design: MDMXmlDesign;
    languages: Languages;
    contexts: Contexts;
    labelTypes: Contexts;
    routingContexts: Contexts;
    scriptTypes: Contexts;
    saveLogs: SaveLog[];
    atoms: { name: string }[];
    categoryMap: { name: string, value: string }[];
    versionList: undefined;
}

