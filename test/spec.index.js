'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('sinon-chai'));

const sessionAccess = require('../index');

describe('sessionAccess', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            method: 'GET',
            get: sinon.stub().withArgs('content-type').returns('application/json'),
            session: {
                a: 1,
                b: { b: 1 },
                c: [ 1, 2, 3 ],
                d: 5,
                e: 'string'
            }
        };
        res = {};
        res.status = sinon.stub().returns(res);
        res.json = sinon.stub().returns(res);
        next = sinon.stub();
    });

    it('should be a function', () => {
        sessionAccess.should.be.a('function');
    });

    it('should return a middleware function', () => {
        let middleware = sessionAccess();
        middleware.should.be.a.function;
        middleware.length.should.equal(3);
    });

    it('should send session as json on a GET request', () => {
        let middleware = sessionAccess();
        middleware(req, res, next);
        res.json.should.have.been.calledWithExactly(req.session);
        next.should.not.have.been.called;
    });

    it('should return an error if the content type of a POST request is incorrect', () => {
        req.get.returns('text/plain');
        req.method = 'POST';
        let middleware = sessionAccess();
        middleware(req, res, next);
        res.status.should.have.been.calledWithExactly(400);
        res.json.should.have.been.calledWithExactly(sinon.match({
            status: 'BAD_CONTENTTYPE'
        }));
    });

    it('should return an error if there is no session on a POST requests', () => {
        req.session = null;
        req.method = 'POST';
        let middleware = sessionAccess();
        middleware(req, res, next);
        res.status.should.have.been.calledWithExactly(500);
        res.json.should.have.been.calledWithExactly(sinon.match({
            status: 'NO_SESSION'
        }));
    });

    it('should update session on a POST request', () => {
        req.method = 'POST';
        req.body = { a: 2, b: { b2: 2 }, c: [5], e: null };
        let middleware = sessionAccess();
        middleware.sessionAccess.parser = sinon.stub().yields();
        middleware(req, res, next);
        req.session.should.deep.equal({
            a: 2,
            b: { b: 1, b2: 2 },
            c: [ 5, 2, 3 ],
            d: 5,
            e: null
        });
        res.json.should.have.been.calledWithExactly({
            status: 'OK',
            updates: { a: 2, b: { b2: 2 }, c: [5], e: null }
        });
        next.should.not.have.been.called;
    });

    it('should only update whitelisted session items on a POST request', () => {
        req.method = 'POST';
        req.body = { a: 2, b: { b2: 2 }, c: [5], e: null };
        let middleware = sessionAccess({ whitelist: [
            'b.b2',
            'e'
        ]});
        middleware.sessionAccess.parser = sinon.stub().yields();
        middleware(req, res, next);
        req.session.should.deep.equal({
            a: 1,
            b: { b: 1, b2: 2 },
            c: [ 1, 2, 3 ],
            d: 5,
            e: null
        });
        res.json.should.have.been.calledWithExactly({
            status: 'OK',
            updates: { b: { b2: 2 }, e: null }
        });
        next.should.not.have.been.called;
    });


    it('should return an error from the JSON parser', () => {
        req.method = 'POST';
        let middleware = sessionAccess();
        let err = new Error();
        middleware.sessionAccess.parser = sinon.stub().yields(err);
        middleware(req, res, next);
        next.should.have.been.calledWithExactly(err);
    });

    it('should call the next callback for any other request type', () => {
        req.method = 'OPTIONS';
        let middleware = sessionAccess();
        middleware(req, res, next);
        next.should.have.been.calledWithExactly();
    });


});
