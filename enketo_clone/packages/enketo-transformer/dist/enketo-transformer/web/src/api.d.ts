/**
 * @module api
 *
 * @description This is not a robust, secure web API. It is just a quick starting point.
 * This repo is not used in production as a web API (only as a library).
 *
 * See inventory of work to be done here: https://github.com/enketo/enketo-transformer/labels/web-api-only.
 *
 * PRs are very welcome!
 */
import express from 'express';
/** @package */
export declare const api: (app: express.Application) => void;
/**
 * Exported for backwards compatibility, prefer named imports.
 */
export default api;
