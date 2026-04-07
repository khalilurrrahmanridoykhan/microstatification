/** @package */
export declare class Language {
    readonly sourceLanguage: string;
    readonly description: string;
    readonly tag: string;
    readonly directionality: string;
    constructor(sourceLanguage: string, description: string, tag: string, directionality: string);
}
/**
 * @package
 *
 * Parses a language string into a {@link Language}. Guesses missing properties.
 * TODO: this should be refactored (more than it has been since this comment was
 * initially written).
 *
 * @see
 * {http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry}
 */
export declare const parseLanguage: (sourceLanguage: string, sample: string) => Language;
