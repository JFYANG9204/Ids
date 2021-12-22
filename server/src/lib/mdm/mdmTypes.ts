

export interface MdmCollection<T> {
    deleted?: T[];
    values: T[];
}

export interface MdmSettings {
    properties?: Properties;
    templates?: Templates;
}

export interface MdmLabeled {
    labels?: Labels;
    labelStyles?: LabelStyles;
}

export interface Connection {
    name: string;
    dbLocation: string;
    cdscName: string;
    project: string;
    id: string;
}

export interface DataSources {
    default: string;
    connections: Connection[];
}

export interface Property {
    name: string;
    value: string;
    type: string;
    context: string;
    properties?: Property[];
}

export type Properties = Property[];
export type Templates = Properties;
export type LabelStyles = Properties;

export interface Text {
    context: string;
    language: string;
    text: string;
}

export interface Labels {
    context: string;
    texts: Text[];
}

export interface Category extends MdmSettings, MdmLabeled {
    id: string;
    name: string;
}

export interface Categories extends MdmCollection<Category>, MdmLabeled {
    globalNamespace: string;
    id?: string;
    name?: string;
}

export interface DefinitionVariable extends MdmSettings, MdmLabeled {
    id: string;
    name: string;
    type: string;
    categories?: Categories;
}

export type MdmDefinitionField = DefinitionVariable | Categories;

export interface MdmReference {
    id: string;
    name: string;
    ref: string;
}

export type Page = MdmReference;

export interface Pages extends MdmCollection<Page> {
    name: string;
    globalNamespace: string;
}

export interface MdmSubFields extends MdmCollection<MdmReference> {
    name: string;
    globalNamespace: string;
}

export interface Script {
    name: string;
    default: string;
    text: string;
}

export interface ScriptType extends MdmCollection<Script> {
    type: string;
    context: string;
    interviewModes: string;
    useKeycodes: string;
}

export type Scripts = MdmCollection<ScriptType>;

export interface RoutingItem {
    name: string;
    item: string;
}

export interface Routing {
    context: string;
    interviewModes: string;
    useKeycodes: string;
    ritems?: RoutingItem[];
}

export interface Routings {
    name: string;
    scripts?: Scripts;
    routing?: Routing[];
}

export interface MdmBlockVarDefinition extends MdmLabeled, MdmSettings {
    id: string;
    name: string;
    globalNamespace: string;
    fields?: MdmSubFields;
    routings?: Routings;
    pages?: Pages;
}

export type HelperFields = MdmCollection<MdmBlockVarDefinition>;




