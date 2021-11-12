import DS from 'ember-data';
import ENV from "accounts/config/environment"
import { computed } from '@ember/object';
import PhSigV4AWSClientFactory from "../lib/PhSigV4AWSClientFactory"
import PhSigV4ClientUtils from "../lib/PhSigV4ClientUtils"
import PhUrlTemplate from "../lib/PhUrlTemplate"

export default DS.JSONAPIAdapter.extend({
    request: computed( "oauthRequest", function() {
		var endpoint = /(^https?:\/\/[^\/]+)/g.exec(ENV.invokeUrl)[1];
		const pathComponent = ENV.invokeUrl.substring(endpoint.length)
		const factory = PhSigV4AWSClientFactory
		const utils = PhSigV4ClientUtils
		const uriTemp = PhUrlTemplate
        const config = {
            accessKey: "10EC20D06323077893326D4388B18ED12D08F45BEB066308279D890FDFEB872F",
            secretKey: "7A2A70C890EB8D3BFDE11F0C2FEBCB856A9151002A9D21AF3D5525B04F81C3F65340A646C74E5BFF6E672FC4740D96B0",
            sessionToken: '',
            region: 'cn-northwest-1',
            apiKey: undefined,
            endpoint: endpoint,
            defaultContentType: "application/json",
            defaultAcceptType: "application/json"
        }
        const sigV4ClientConfig = {
            accessKey: this.Decrypt(config.accessKey),
            secretKey: this.Decrypt(config.secretKey),
            sessionToken: config.sessionToken,
            serviceName: "execute-api",
            region: config.region,
            endpoint: config.endpoint,
            defaultContentType: config.defaultContentType,
            defaultAcceptType: config.defaultAcceptType
        }
        const client = factory.PhSigV4AWSClientFactory.newClient( sigV4ClientConfig )

        let req = {
            verb: this.get('verb'),
            path: this.get('path'),
			queryParams: this.get('queryParams'),
            body: this.get('body')
        }

        const request = client.makeRequest( req )
        return request
    }),
    Decrypt(word) {
        const CryptoJS = require("crypto-js");
        let encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        let decrypt = CryptoJS.AES.decrypt(srcs,
            CryptoJS.enc.Utf8.parse("1234123412ABCDEF"),
            { iv: CryptoJS.enc.Utf8.parse('ABCDEF1234123412'), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );
        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }
});
