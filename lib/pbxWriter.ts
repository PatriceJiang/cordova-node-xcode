/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 'License'); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

///<reference path="./index.d.ts" />

import * as pbxProj from './pbxProject';
import * as util from 'util';
import { EventEmitter } from 'events';
import { Contents, PbxObject, PbxItemValue, PbxObjectItem, WriterOption } from '.';
const f = util.format;
const INDENT = '\t';
const COMMENT_KEY = /_comment$/;
const QUOTED = /^"(.*)"$/;

// indentation
function i(x: number): string {
    if (x <= 0)
        return '';
    else
        return INDENT + i(x - 1);
}

function comment(key: string, parent: PbxObject) {
    var text = (parent as any)[key + '_comment'];

    if (text)
        return text as string;
    else
        return null;
}

// copied from underscore
function isObject(obj: any) {
    return obj === Object(obj)
}

function isArray(obj: any) {
    return Array.isArray(obj)
}


class PbxWriter extends EventEmitter {

    contents: Contents;
    sync: boolean;
    indentLevel: number;
    omitEmptyValues?: boolean;
    buffer: string = "";

    constructor(contents: Contents, options?: WriterOption) {
        super();
        if (!options) {
            options = {}
        }
        if (options.omitEmptyValues === undefined) {
            options.omitEmptyValues = false
        }

        this.contents = contents;
        this.sync = false;
        this.indentLevel = 0;
        this.omitEmptyValues = options.omitEmptyValues
    }

    write(...args: any[]) {
        var fmt = f.apply(null, arguments as any);

        if (this.sync) {
            this.buffer += f("%s%s", i(this.indentLevel), fmt);
        } else {
            // do stream write
        }
    }
    writeFlush(...args: any[]) {
        var oldIndent = this.indentLevel;

        this.indentLevel = 0;

        this.write.apply(this, arguments as any)

        this.indentLevel = oldIndent;
    }

    writeSync() {
        this.sync = true;
        this.buffer = "";

        this.writeHeadComment();
        this.writeProject();

        return this.buffer;
    }

    writeHeadComment() {
        if (this.contents.headComment) {
            this.write("// %s\n", this.contents.headComment)
        }
    }
    writeProject() {
        var proj = this.contents.project,
            key: string, cmt: string, obj: PbxItemValue;

        this.write("{\n")

        if (proj) {
            this.indentLevel++;

            for (key in proj) {
                // skip comments
                if (COMMENT_KEY.test(key)) continue;

                cmt = comment(key, proj as any)!;
                obj = proj[key];

                if (isArray(obj)) {
                    this.writeArray(obj as PbxObject[], key)
                } else if (isObject(obj)) {
                    this.write("%s = {\n", key);
                    this.indentLevel++;

                    if (key === 'objects') {
                        this.writeObjectsSections(obj as { [key: string]: PbxObject })
                    } else {
                        this.writeObject(obj as PbxObject)
                    }

                    this.indentLevel--;
                    this.write("};\n");
                } else if (this.omitEmptyValues && (obj === undefined || obj === null)) {
                    continue;
                } else if (cmt) {
                    this.write("%s = %s /* %s */;\n", key, obj, cmt)
                } else {
                    this.write("%s = %s;\n", key, obj)
                }
            }

            this.indentLevel--;
        }

        this.write("}\n")
    }
    writeObject(object: PbxObject) {
        var key: string, obj: PbxObjectItem, cmt;

        for (key in object) {
            if (COMMENT_KEY.test(key)) continue;

            cmt = comment(key, object as any);
            obj = object[key];

            if (isArray(obj)) {
                this.writeArray(obj as PbxObject[], key)
            } else if (isObject(obj)) {
                this.write("%s = {\n", key);
                this.indentLevel++;

                this.writeObject(obj as PbxObject)

                this.indentLevel--;
                this.write("};\n");
            } else {
                if (this.omitEmptyValues && (obj === undefined || obj === null)) {
                    continue;
                } else if (cmt) {
                    this.write("%s = %s /* %s */;\n", key, obj, cmt)
                } else {
                    this.write("%s = %s;\n", key, obj)
                }
            }
        }
    }
    writeObjectsSections(objects: { [key: string]: PbxObject }) {
        var key, obj;

        for (key in objects) {
            this.writeFlush("\n")

            obj = objects[key];

            if (isObject(obj)) {
                this.writeSectionComment(key, true);

                this.writeSection(obj);

                this.writeSectionComment(key, false);
            }
        }
    }
    writeArray(arr: PbxObject[], name: string) {
        var i, entry;

        this.write("%s = (\n", name);
        this.indentLevel++;

        for (i = 0; i < arr.length; i++) {
            entry = arr[i]

            if (entry.value && entry.comment) {
                this.write('%s /* %s */,\n', entry.value, entry.comment);
            } else if (isObject(entry)) {
                this.write('{\n');
                this.indentLevel++;

                this.writeObject(entry);

                this.indentLevel--;
                this.write('},\n');
            } else {
                this.write('%s,\n', entry);
            }
        }

        this.indentLevel--;
        this.write(");\n");
    }

    writeSectionComment(name: string, begin?: boolean) {
        if (begin) {
            this.writeFlush("/* Begin %s section */\n", name)
        } else { // end
            this.writeFlush("/* End %s section */\n", name)
        }
    }
    writeSection(section: PbxObject) {
        var key: string, obj: PbxObjectItem, cmt: string | null;

        // section should only contain objects
        for (key in section) {
            if (COMMENT_KEY.test(key)) continue;

            cmt = comment(key, section);
            obj = section[key]

            if ((obj as any).isa == 'PBXBuildFile' || (obj as any).isa == 'PBXFileReference') {
                this.writeInlineObject(key, cmt!, obj as PbxObject);
            } else {
                if (cmt) {
                    this.write("%s /* %s */ = {\n", key, cmt);
                } else {
                    this.write("%s = {\n", key);
                }

                this.indentLevel++

                this.writeObject(obj as PbxObject)

                this.indentLevel--
                this.write("};\n");
            }
        }
    }

    writeInlineObject(n: string, d: string, r: PbxObject) {
        var output: string[] = [];
        var self = this

        var inlineObjectHelper = function (name: string, desc: string, ref: PbxObject) {
            var key: string, cmt: string | null, obj: PbxObjectItem;

            if (desc) {
                output.push(f("%s /* %s */ = {", name, desc));
            } else {
                output.push(f("%s = {", name));
            }

            for (key in ref) {
                if (COMMENT_KEY.test(key)) continue;

                cmt = comment(key, ref);
                obj = ref[key] as any;

                if (isArray(obj)) {
                    output.push(f("%s = (", key));

                    for (var i = 0; i < (obj as any).length; i++) {
                        output.push(f("%s, ", (obj as PbxObject[])[i]))
                    }

                    output.push("); ");
                } else if (isObject(obj)) {
                    inlineObjectHelper(key, cmt!, obj as PbxObject)
                } else if (self.omitEmptyValues && (obj === undefined || obj === null)) {
                    continue;
                } else if (cmt) {
                    output.push(f("%s = %s /* %s */; ", key, obj, cmt))
                } else {
                    output.push(f("%s = %s; ", key, obj))
                }
            }

            output.push("}; ");
        }

        inlineObjectHelper(n, d, r as PbxObject);

        this.write("%s\n", output.join('').trim());
    }

}

export = PbxWriter;
