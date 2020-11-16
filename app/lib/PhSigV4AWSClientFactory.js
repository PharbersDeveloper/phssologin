/*
 * Copyright 2010-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */


import PhSigV4ClientUtils from "./PhSigV4ClientUtils"
const CryptoJS = require("crypto-js");
// const PhSigV4ClientUtils  = require("./PhSigV4ClientUtils").default


let PhSigV4AWSClientFactory = {}
PhSigV4AWSClientFactory.newClient = function (config) {
    const AWS_SHA_256 = 'AWS4-HMAC-SHA256';
    const AWS4_REQUEST = 'aws4_request';
    const AWS4 = 'AWS4';
    const X_AMZ_DATE = 'x-amz-date';
    const X_AMZ_SECURITY_TOKEN = 'x-amz-security-token';
    const HOST = 'host';
    const AUTHORIZATION = 'Authorization';

    function hash(value) {
        return CryptoJS.SHA256(value);
    }

    function hexEncode(value) {
        return value.toString(CryptoJS.enc.Hex);
    }

    function hmac(secret, value) {
        return CryptoJS.HmacSHA256(value, secret, {asBytes: true});
    }

    function buildCanonicalRequest(method, path, queryParams, headers, payload) {
        return method + '\n' +
            buildCanonicalUri(path) + '\n' +
            buildCanonicalQueryString(queryParams) + '\n' +
            buildCanonicalHeaders(headers) + '\n' +
            buildCanonicalSignedHeaders(headers) + '\n' +
            hexEncode(hash(payload));
    }

    function hashCanonicalRequest(request) {
        return hexEncode(hash(request));
    }

    function buildCanonicalUri(uri) {
        return encodeURI(uri);
    }

    function buildCanonicalQueryString(queryParams) {
        if (Object.keys(queryParams).length < 1) {
            return '';
        }

        let sortedQueryParams = [];
        for (const property in queryParams) {
            if (queryParams.hasOwnProperty(property)) {
                sortedQueryParams.push(property);
            }
        }
        sortedQueryParams.sort();

        let canonicalQueryString = '';
        for (let i = 0; i < sortedQueryParams.length; i++) {
            canonicalQueryString += sortedQueryParams[i] + '=' + fixedEncodeURIComponent(queryParams[sortedQueryParams[i]]) + '&';
        }
        return canonicalQueryString.substr(0, canonicalQueryString.length - 1);
    }

    function fixedEncodeURIComponent (str) {
        let newStr = encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });

        newStr = newStr.replace(/%26/g, "&")
        newStr = newStr.replace(/%3D/g, "=")

        return newStr

    //   return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    //     return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    //   });
    }

    function buildCanonicalHeaders(headers) {
        let canonicalHeaders = '';
        let sortedKeys = [];
        for (const property in headers) {
            if (headers.hasOwnProperty(property)) {
                sortedKeys.push(property);
            }
        }
        sortedKeys.sort();

        for (let i = 0; i < sortedKeys.length; i++) {
            canonicalHeaders += sortedKeys[i].toLowerCase() + ':' + headers[sortedKeys[i]] + '\n';
        }
        return canonicalHeaders;
    }

    function buildCanonicalSignedHeaders(headers) {
        let sortedKeys = [];
        for (const property in headers) {
            if (headers.hasOwnProperty(property)) {
                sortedKeys.push(property.toLowerCase());
            }
        }
        sortedKeys.sort();

        return sortedKeys.join(';');
    }

    function buildStringToSign(datetime, credentialScope, hashedCanonicalRequest) {
        return AWS_SHA_256 + '\n' +
            datetime + '\n' +
            credentialScope + '\n' +
            hashedCanonicalRequest;
    }

    function buildCredentialScope(datetime, region, service) {
        return datetime.substr(0, 8) + '/' + region + '/' + service + '/' + AWS4_REQUEST
    }

    function calculateSigningKey(secretKey, datetime, region, service) {
        return hmac(hmac(hmac(hmac(AWS4 + secretKey, datetime.substr(0, 8)), region), service), AWS4_REQUEST);
    }

    function calculateSignature(key, stringToSign) {
        return hexEncode(hmac(key, stringToSign));
    }

    function buildAuthorizationHeader(accessKey, credentialScope, headers, signature) {
        return AWS_SHA_256 + ' Credential=' + accessKey + '/' + credentialScope + ', SignedHeaders=' + buildCanonicalSignedHeaders(headers) + ', Signature=' + signature;
    }

    let awsSigV4Client = { };
    if(config.accessKey === undefined || config.secretKey === undefined) {
        return awsSigV4Client;
    }
    awsSigV4Client.accessKey = PhSigV4ClientUtils.assertDefined(config.accessKey, 'accessKey');
    awsSigV4Client.secretKey = PhSigV4ClientUtils.assertDefined(config.secretKey, 'secretKey');
    awsSigV4Client.sessionToken = config.sessionToken;
    awsSigV4Client.serviceName = PhSigV4ClientUtils.assertDefined(config.serviceName, 'serviceName');
    awsSigV4Client.region = PhSigV4ClientUtils.assertDefined(config.region, 'region');
    awsSigV4Client.endpoint = PhSigV4ClientUtils.assertDefined(config.endpoint, 'endpoint');

    awsSigV4Client.makeRequest = function (request) {
        const verb = PhSigV4ClientUtils.assertDefined(request.verb, 'verb');
        const path = PhSigV4ClientUtils.assertDefined(request.path, 'path');
        let queryParams = PhSigV4ClientUtils.copy(request.queryParams);
        if (queryParams === undefined) {
            queryParams = {};
        }
        let headers = PhSigV4ClientUtils.copy(request.headers);
        if (headers === undefined) {
            headers = {};
        }

        //If the user has not specified an override for Content type the use default
        if(headers['Content-Type'] === undefined) {
            headers['Content-Type'] = config.defaultContentType;
        }

        //If the user has not specified an override for Accept type the use default
        if(headers['Accept'] === undefined) {
            headers['Accept'] = config.defaultAcceptType;
        }

        let body = PhSigV4ClientUtils.copy(request.body);
        if (body === undefined || verb === 'GET') { // override request body and set to empty when signing GET requests
            body = '';
        }  else {
            body = JSON.stringify(body);
        }

        //If there is no body remove the content-type header so it is not included in SigV4 calculation
        if(body === '' || body === undefined || body === null) {
            delete headers['Content-Type'];
        }

        let datetime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:\-]|\.\d{3}/g, '');
        
        headers[X_AMZ_DATE] = datetime;
        // const parser = document.createElement('a');
        // parser.href = awsSigV4Client.endpoint;
        headers[HOST] = "2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn"

        const canonicalRequest = buildCanonicalRequest(verb, path, queryParams, headers, body);
        const hashedCanonicalRequest = hashCanonicalRequest(canonicalRequest);
        const credentialScope = buildCredentialScope(datetime, awsSigV4Client.region, awsSigV4Client.serviceName);
        const stringToSign = buildStringToSign(datetime, credentialScope, hashedCanonicalRequest);
        const signingKey = calculateSigningKey(awsSigV4Client.secretKey, datetime, awsSigV4Client.region, awsSigV4Client.serviceName);
        const signature = calculateSignature(signingKey, stringToSign);
        
        headers[AUTHORIZATION] = buildAuthorizationHeader(awsSigV4Client.accessKey, credentialScope, headers, signature);
        if(awsSigV4Client.sessionToken !== undefined && awsSigV4Client.sessionToken !== '') {
            headers[X_AMZ_SECURITY_TOKEN] = awsSigV4Client.sessionToken;
        }
        delete headers[HOST];

        let url = config.endpoint + path;
        const queryString = buildCanonicalQueryString(queryParams);
        if (queryString !== '') {
            url += '?' + queryString;
        }

        //Need to re-attach Content-Type if it is not specified at this point
        if(headers['Content-Type'] === undefined) {
            headers['Content-Type'] = config.defaultContentType;
        }

        return {
            method: verb,
            url: url,
            headers: headers,
            data: body,
            timeout: 30000
        };
        // return axios(signedRequest);
    };

    return awsSigV4Client;
};

// module.exports = { PhSigV4AWSClientFactory }
export {PhSigV4AWSClientFactory}
