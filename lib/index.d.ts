import { strictEqual } from "assert";
import { type } from "os";

declare interface FileReference {
    lastKnownFileType:string;
    explicitFileType?:string;
    basename:string;
    customFramework?:boolean;
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

declare interface FileOption extends BaseOption, GroupOption {
    lastKnownFileType:string;
    defaultEncoding?:string;
    explicitFileType?:string;
    sourceTree?:SourceTreeType;
    weak?:boolean;
    settings?: {[key:string]:string[]|string};
    compilerFlags?:string;
    sign?:boolean;
}

declare type PbxItemValue = string | PbxObject| PbxObject[]| {[key:string]:PbxObject};
declare type PbxObjectItem = string|PbxObject|PbxObject[];
declare interface PbxObject {
    [key:string]:PbxObjectItem;
}

declare interface Project {
    [key:string]:PbxItemValue
}
declare interface Contents {
    headComment?:string;
    project?: Project;
}