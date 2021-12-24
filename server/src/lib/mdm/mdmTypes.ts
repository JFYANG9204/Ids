import { type } from "os";


export interface MdmCollection<T> {
    deleted: T[];
    values?: T[];
}

export interface MdmSettings {
    properties?: MdmProperties;
    templates?: MdmTemplates;
    styles?: MdmStyles;
}

export interface MdmLabeled {
    labels?: MdmLabels;
    labelStyles?: MdmLabelStyles;
    notes?: MdmNotes;
}

export interface MdmRange {
    min?: string;
    max?: string;
    minType?: string;
    maxType?: string;
    rangeExp?: string;
}

export interface MdmConnection {
    name: string;
    dbLocation: string;
    cdscName: string;
    project: string;
    id: string;
}

export interface MdmDataSources {
    default?: string;
    connections: MdmConnection[];
}

export interface MdmProperty {
    name: string;
    value: string;
    type: string;
    context: string;
    properties?: MdmProperty[];
    styles?: MdmStyles;
}

export type MdmProperties = MdmProperty[];
export type MdmTemplates = MdmProperties;
export type MdmLabelStyles = MdmProperties;
export type MdmNotes = MdmProperties;
export type MdmStyles = MdmProperties;

export interface MdmText {
    context: string;
    language: string;
    text: string;
}

export interface MdmLabels {
    context: string;
    texts: MdmText[];
}

export interface MdmCategory extends MdmSettings, MdmLabeled {
    id: string;
    name: string;
    fixed?: string;
    noFilter?: string;
    otherLocal?: string;
    missing?: string;
    exclusive?: string;
    factorValue?: string;
    factorType?: string;
    keycode?: string;
    expression?: string;
    otherVariable?: MdmReference;
    multiplierVariable?: MdmReference;
}

export interface MdmElement extends MdmCategory {
    type: string;
}

export interface MdmCategories extends MdmCollection<MdmCategory | MdmElement | MdmCategories>, MdmLabeled {
    globalNamespace: string;
    id?: string;
    name?: string;
    categoriesRef?: string;
    inline?: string;
    refName?: string;
    fixed?: string;
    noFilter?: string;
}

export interface MdmDefinitionVariable extends MdmSettings, MdmLabeled {
    id: string;
    name: string;
    type: string;
    validation?: string;
    categories?: MdmCategories;
    noCaseData?: string;
}

export type MdmDefinitionField = MdmDefinitionVariable | MdmCategories;

export interface MdmReference {
    id: string;
    name: string;
    ref: string;
}

export type MdmPage = MdmReference;

export interface MdmPages extends MdmCollection<MdmPage> {
    name: string;
    globalNamespace: string;
}

export interface MdmSubFields extends MdmCollection<MdmReference | MdmBlockVarDefinition | MdmLoopDesign> {
    name: string;
    globalNamespace: string;
}

export interface MdmScript {
    name: string;
    default: string;
    text: string;
}

export interface MdmScriptType extends MdmCollection<MdmScript> {
    type: string;
    context: string;
    interviewModes: string;
    useKeycodes: string;
}

export type MdmScripts = MdmCollection<MdmScriptType>;

export interface MdmRoutingItem {
    name: string;
    item: string;
}

export interface MdmRouting {
    context: string;
    interviewModes: string;
    useKeycodes: string;
    ritems?: MdmRoutingItem[];
}

export interface MdmRoutings {
    name: string;
    scripts?: MdmScripts;
    routing?: MdmRouting[];
}

export interface MdmBlockVarDefinition extends MdmLabeled, MdmSettings {
    id: string;
    name: string;
    globalNamespace: string;
    fields?: MdmSubFields;
    routings?: MdmRoutings;
    types?: MdmTypes;
    pages?: MdmPages;
}

export interface MdmHelperFields extends MdmCollection<MdmBlockVarDefinition | MdmReference> {
    id: string;
    name: string;
    globalNamespace: string;
};

export interface MdmVarDefinition extends MdmLabeled, MdmSettings, MdmRange {
    id: string;
    name: string;
    type: string;
    categories?: MdmCategories;
    helperFields?: MdmHelperFields;
}

export interface MdmOtherVarDefinition extends MdmLabeled, MdmSettings {
    id: string;
    name: string;
    type: string;
    usageType: string;
    isOtherOrMulti: "other" | "multi";
}

export type MdmMultiVarDefinition = MdmOtherVarDefinition;

export type MdmDefinition = MdmVarDefinition | MdmOtherVarDefinition | MdmCategories | MdmMultiVarDefinition;

export interface MdmSystem extends MdmCollection<MdmBlockVarDefinition> {
    name: string;
    globalNamespace: string;
}

export interface MdmVarInstance {
    name: string;
    sourceType: string;
    variable: string;
    fullName: string;
}


export type MdmSystemRouting = MdmRouting[];
export type MdmMappings = MdmVarInstance[];

//  Design

export type MdmTypes = MdmPages;

export interface MdmLoopSubFieldsDesign extends MdmSettings, MdmLabeled {
    name: string;
    globalNamespace: string;
    types?: MdmTypes;
    fields?: MdmSubFields;
    pages?: MdmPages;
}

export interface MdmLoopRange {
    upperbound?: string;
    lowerbound?: string;
}

export type MdmLoopRanges = MdmLoopRange[];

export interface MdmLoopDesign extends MdmLabeled, MdmSettings {
    id: string;
    name: string;
    globalNamespace?: string;
    isGrid?: string;
    iteratorType: string;
    type: string;
    categories?: MdmCategories;
    ranges?: MdmLoopRanges;
    types?: MdmTypes;
    fields?: MdmLoopSubFieldsDesign;
    pages?: MdmPages;
}

export type MdmFieldDesignItem = MdmBlockVarDefinition | MdmLoopDesign | MdmReference;
export interface MdmFieldDesign extends MdmCollection<MdmFieldDesignItem> {
    name: string;
    globalNamespace: string;
}

export interface MdmDesign extends MdmSettings {
    fields?: MdmFieldDesign;
    types?: MdmTypes;
    pages?: MdmPages;
    routings?: MdmRoutings;
}

export interface MdmLanguage {
    name: string;
    id: string;
    properties?: MdmProperties;
}

export interface MdmLanguages extends MdmCollection<MdmLanguage> {
    base: string;
}

export interface MdmAlternative {
    name: string;
}

export type MdmAlternatives = MdmCollection<MdmAlternative>;

export interface MdmContext {
    name: string;
    alternatives?: MdmAlternatives;
}

export interface MdmContexts extends MdmCollection<MdmContext> {
    base: string;
}

export type MdmLabelTypes = MdmContexts;
export type MdmRoutingContexts = MdmContexts;
export type MdmScriptTypes = MdmContexts;

export interface MdmUser {
    name: string;
    fileVersion: string;
    comment: string;
}

export interface MdmSaveLog {
    fileVersion: string;
    versionSet: string;
    userName: string;
    date: string;
    count: string;
    user?: MdmUser;
}

export type MdmSaveLogs = MdmSaveLog[];

export interface MdmAtom {
    name: string;
}

export type MdmAtoms = MdmAtom[];

export interface MdmCategoryId {
    name: string;
    value: string;
}

export type MdmCategoryMap = MdmCategoryId[];

export interface MdmMetadata extends MdmLabeled, MdmSettings {
    mdmCreateVersion: string;
    mdmLastVersion: string;
    id: string;
    dataVersion: string;
    dataSubVersion: string;
    systemVariable: string;
    dbFilterValidation: string;
    xmlns: string;
    dataSources?: MdmDataSources;
    definition?: Map<string, MdmDefinition>;
    system?: MdmSystem;
    systemRouting?: MdmSystemRouting;
    mappings?: MdmMappings;
    design?: MdmDesign;
    languages?: MdmLanguages;
    contexts?: MdmContexts;
    labelTypes?: MdmLabelTypes;
    routingContexts?: MdmRoutingContexts;
    scriptTypes?: MdmScriptTypes;
    saveLogs?: MdmSaveLogs;
    atoms?: MdmAtoms;
    categoryMap?: MdmCategoryMap;
}

