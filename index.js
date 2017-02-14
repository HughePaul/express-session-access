'use strict';

const _ = require('lodash');
const bodyParser = require('body-parser');

module.exports = options => {
    options = options || {};
    let whitelist = options.whitelist;

    let sessionAccess = {
        parser: bodyParser.json(options),

        handler(req, res, next) {
            if (req.method === 'GET') {
                return sessionAccess.getSession(req, res, next);
            }
            if (req.method === 'POST') {
                return sessionAccess.setSession(req, res, next);
            }
            return next();
        },

        getSession(req, res, next) {
            return res
                .json(req.session);
        },

        setSession(req, res, next) {
            if (req.get('content-type') !== 'application/json') {
                return res
                    .status(400)
                    .json({ status: 'BAD_CONTENTTYPE', error: 'Bad content type' });
            }

            if (!req.session || typeof req.session !== 'object') {
                return res
                    .status(500)
                    .json({ status: 'NO_SESSION', error: 'No session available' });
            }

            sessionAccess.parser(req, res, err => {
                if (err) {
                    return next(err);
                }

                let updates = whitelist ? _.pick(req.body, whitelist) : req.body;
                _.merge(req.session, updates);

                return res
                    .json({ status: 'OK', updates: updates });
            });
        }
    };

    sessionAccess.handler.sessionAccess = sessionAccess;

    return sessionAccess.handler;
};
