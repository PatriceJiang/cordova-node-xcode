import { strictEqual } from "assert";
import { type } from "os";
import { basename } from "path";

declare interface FileReference {
    lastKnownFileType:string;
    explicitFileType?:string;
    basename:string;
    customFramework?:boolean;
    fileRef?:string;
    settings?: Settings;
    uuid?:string;
    path?:string;
    group?:string;
    plugin?:boolean;
    dirname?:string;
}


declare interface BaseOption {

}

declare interface GroupOption extends BaseOption {
    basename:string;
    customFramework:boolean;
    embed?:boolean;
}

declare interface WriterOption extends BaseOption {
    omitEmptyValues?:boolean;
}

declare type SourceTreeType = '"<group>"'|'"<absolute>"'|"BUILT_PRODUCTS_DIR"|'SDKROOT';

declare type ISAType = "PBXBuildFile" | "PBXFileReference";
declare type Settings = {[key:string]:string[]|string};
declare interface FileOption extends BaseOption, GroupOption {
    lastKnownFileType:string;
    defaultEncoding?:string;
    explicitFileType?:string;
    sourceTree?:SourceTreeType;
    weak?:boolean;
    settings?: {[key:string]:string[]|string};
    compilerFlags?:string;
    sign?:boolean;
    target?:string;
    group?:string;
    plugin?:boolean;
    variantGroup?:boolean;
}

declare interface FrameworkOption extends FileOption {
    link?:boolean;
    embed?:boolean;
}

declare type PbxItemValue = string | PbxObject| PbxObject[]| {[key:string]:PbxObject};
declare type PbxObjectItem = string|PbxObject|PbxObject[];
declare interface PbxObject {
    [key:string]:PbxObjectItem;
}

declare interface PbxFileObject {
    isa:"PBXBuildFile";
    fileRef:string;
    fileRef_comment: string;
    settings?: Settings;
}

declare interface PbxFileReferenceObject {
    isa:"PBXFileReference";
    name: string;
    path: string;
    sourceTree?: SourceTreeType;
    fileEncoding: string|number;
    lastKnownFileType: string;
    explicitFileType?: string;
    includeInIndex?: number;
}

declare interface PbxGroupChildObject {
    value:string;
    comment:string;
}

declare interface PbxCopyFilesBuildPhaseobject {
    name?:string;
    dstPath?:string;
    dstSubfolderSpec?:number;
}
declare interface PbxShellScriptBuildPhaseobject {
    name?:string;
    inputPaths?:[];
    outputPaths?:[];
    shellPath?:string;
    shellScript?:string;
}
declare interface ProjectObject {
    // [key:string]:PbxItemValue
    objects:{[key:string]:PbxObject}
}
declare interface Contents {
    headComment?:string;
    project?: ProjectObject;
}

declare interface PbxTarget {
    name:string;
}

declare interface PbxNativeTarget extends PbxTarget {
    buildPhases: any[]
}