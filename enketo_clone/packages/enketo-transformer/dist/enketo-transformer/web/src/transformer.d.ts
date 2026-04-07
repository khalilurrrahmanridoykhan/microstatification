import type LibXMLJS from 'libxmljs';
import { NAMESPACES } from './shared';
import { escapeURLPath } from './url';
export type TransformPreprocess = (this: typeof LibXMLJS, doc: LibXMLJS.Document) => LibXMLJS.Document;
type NodeOnly<T> = [typeof ENV] extends ['web'] ? undefined : T;
export interface Survey {
    xform: string;
    markdown?: boolean;
    media?: Record<string, string>;
    openclinica?: boolean | number;
    /**
     * @deprecated
     *
     * Only supported in Node environments.
     */
    preprocess?: NodeOnly<TransformPreprocess>;
    theme?: string;
}
export type TransformedSurvey<T = unknown> = Omit<T, keyof Survey> & {
    form: string;
    languageMap: Record<string, string>;
    model: string;
    transformerVersion: string;
};
export type Transform = <T extends Survey>(survey: T) => Promise<TransformedSurvey<T>>;
/**
 * Performs XSLT transformation on XForm and process the result.
 */
export declare const transform: Transform;
export declare const version: string;
export declare const sheets: {
    xslForm: string;
    xslModel: string;
};
export { escapeURLPath, NAMESPACES };
/**
 * Exported for backwards compatibility, prefer named imports from enketo-transformer's index module.
 */
declare const _default: {
    transform: Transform;
    version: string;
    NAMESPACES: {
        readonly xmlns: "http://www.w3.org/2002/xforms";
        readonly orx: "http://openrosa.org/xforms";
        readonly h: "http://www.w3.org/1999/xhtml";
        readonly xsl: "http://www.w3.org/1999/XSL/Transform";
    };
    sheets: {
        xslForm: string;
        xslModel: string;
    };
    escapeURLPath: (value: string) => string;
};
export default _default;
