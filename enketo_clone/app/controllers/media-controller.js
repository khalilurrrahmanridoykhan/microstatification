/**
 * @module media-controller
 */

const url = require('url');
const communicator = require('../lib/communicator');
const request = require('@cypress/request');
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const debug = require('debug')('enketo:media-controller');
const { ResponseError } = require('../lib/custom-error');
const mediaLib = require('../lib/media');

module.exports = (app) => {
    app.use(`${app.get('base path')}/media`, router);
};

router.get('/get/*', getMedia);

function _isPrintView(req) {
    const refererQuery =
        req.headers && req.headers.referer
            ? url.parse(req.headers.referer).query
            : null;

    return !!(refererQuery && refererQuery.includes('print=true'));
}

/**
 * @param {module:api-controller~ExpressRequest} req - HTTP request
 * @param {module:api-controller~ExpressResponse} res - HTTP response
 * @param {Function} next - Express callback
 */
async function getMedia(req, res, next) {
    try {
        const hostURLOptions = mediaLib.getHostURLOptions(req);
        const url = await mediaLib.getHostURL(hostURLOptions);

        if (url == null) {
            throw new ResponseError(404, 'Not found');
        }

        const { auth, cookie } = hostURLOptions;
        const options = communicator.getUpdatedRequestOptions({
            url,
            auth,
            headers: {
                cookie,
            },
        });

        // Remove method for Digest Auth bug workaround
        delete options.method;

        // Custom logic: Save media file locally when requested
        const saveMediaLocally = (stream, filename) => {
            const mediaDir = path.join(__dirname, '../../submission/media');
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true });
            }
            const filePath = path.join(mediaDir, filename);
            const writeStream = fs.createWriteStream(filePath);
            stream.pipe(writeStream);
            // Optionally handle errors or finish event
        };

        // Extract filename from request path
        const segments = req.path.split('/');
        const filename = segments[segments.length - 1];

        if (_isPrintView(req)) {
            request.head(options, (error, response) => {
                if (error) {
                    next(error);
                } else {
                    const contentType = response.headers['content-type'];
                    if (
                        contentType.startsWith('audio') ||
                        contentType.startsWith('video')
                    ) {
                        res.status(204).end();
                    } else {
                        const mediaStream = request.get(options);
                        saveMediaLocally(mediaStream, filename);
                        mediaStream
                            .on('error', (error) => _handleMediaRequestError(error, next))
                            .pipe(res)
                            .on('error', (error) => _handleMediaRequestError(error, next));
                    }
                }
            });
        } else {
            const mediaStream = request.get(options);
            saveMediaLocally(mediaStream, filename);
            mediaStream
                .on('error', (error) => _handleMediaRequestError(error, next))
                .pipe(res)
                .on('error', (error) => _handleMediaRequestError(error, next));
        }
    } catch (error) {
        next(error);
    }
}

function _handleMediaRequestError(error, next) {
    debug(
        `error retrieving media from OpenRosa server: ${JSON.stringify(error)}`
    );
    if (!error.status) {
        error.status = error.code && error.code === 'ENOTFOUND' ? 404 : 500;
    }
    next(error);
}
