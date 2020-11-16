import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import { computed } from "@ember/object";
import PhSigV4AWSClientFactory from "../../lib/PhSigV4AWSClientFactory"
const CryptoJS = require("crypto-js");

export default Controller.extend({
    password: '',
    toast: service(),
    ajax: service(),
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
    }),
    queryParams: ['redirect_uri','email'],
    //还没有检测邮箱是否在系统中的逻辑，先拿此变量充当。
    isInSystem: true,
    signInDisabled: computed('password', function() {
		if(this.password) {
			return false
		}
		return true
    }),
    init() {
        this._super(...arguments);
        window.onload = function() {
            $('.input_initial').focus()
        }
        window.addEventListener('keydown', event => {
			if(event.keyCode === 13) {
				$('#signInButton').click()
			}
			return
        })
    },
    actions: {
        toWelcomePage() {
			this.transitionToRoute(`/welcome?redirect_uri=${this.model.redirect_uri}`)
        },
        forgotPassword() {
			this.transitionToRoute(`/forgotPassword?email=${this.model.email}&redirect_uri=${this.model.redirect_uri}`)
		},
        /**
		* @description: 登录按钮：验证密码是否正确
		*/
		async signIn() {
            const ajax = this.get("ajax")
            const factory = PhSigV4AWSClientFactory
            const config = {
                accessKey: "10EC20D06323077893326D4388B18ED12D08F45BEB066308279D890FDFEB872F",
                secretKey: "7A2A70C890EB8D3BFDE11F0C2FEBCB856A9151002A9D21AF3D5525B04F81C3F65340A646C74E5BFF6E672FC4740D96B0",
                sessionToken: '',
                region: 'cn-northwest-1',
                sessionToken: "",
                region: "cn-northwest-1",
                apiKey: undefined,
                defaultContentType: "application/vnd.api+json",
                defaultAcceptType: "application/vnd.api+json"
            }
            const invokeUrl = "https://2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn/v0"
            const endpoint = /(^https?:\/\/[^\/]+)/g.exec( invokeUrl )[1]
            const pathComponent = invokeUrl.substring( endpoint.length )
            const sigV4ClientConfig = {
                accessKey: this.actions.Decrypt(config.accessKey),
                secretKey: this.actions.Decrypt(config.secretKey),
                sessionToken: config.sessionToken,
                serviceName: "execute-api",
                region: config.region,
                endpoint: endpoint,
                defaultContentType: config.defaultContentType,
                defaultAcceptType: config.defaultAcceptType
            }
            const client = factory.PhSigV4AWSClientFactory.newClient( sigV4ClientConfig )
            const password = CryptoJS.SHA256(this.password).toString()
            let req = {
				verb: "GET",
				path: "/v0/oauth/login",
				queryParams: {
					email: this.model.email,
					password: password
				},
				body: {}
			}
            //AWS_IAM方式
			const request = client.makeRequest( req )

            //验证账号密码是否匹配，匹配成功则继续获取code，失败则toast.error
            try {
                const loginSuccess = await ajax.request(  request.url , {
                    headers: request.headers
                } )

                //获取code的值,并跳转到redircet_uri+queryParams
                const client_id = this.actions.Decrypt("AB07EE4BF5CE23954C217D69F0E7784A3C5C5FACCEBD4995E44DE28B8692CDA3")
                const client_secret = this.actions.Decrypt("621C5702E82D67783AE1D88DFA26FF5FFB357C8E219B29526EE50C578D8EAB8395DF6BF83BF5F121A8E686B2246A9937815CFD936CCBAA138713E5579FAF6A3D9A487BCF6C663212441502F32A90D686")
                const state = CryptoJS.MD5(`${client_id}${new Date().getTime()}`).toString()
                let reqCode = {
                    verb: "GET",
                    path: "/v0/oauth/authorization",
                    queryParams: {
                        client_id: client_id,
                        response_type: "code",
                        user_id: loginSuccess.uid,
                        redirect_uri: `${this.model.redirect_uri}/oauth-callback`,
                        state
                    },
                    body: {}
                }
                //AWS_IAM方式
                const requestCode = client.makeRequest( reqCode )
                try {
                    const result = await ajax.request( requestCode.url , {
                        headers: requestCode.headers
                    })

                    const authorizationParams = {}

                    for (const item of result.split('&')) {
                        const obj = item.split('=')
                        authorizationParams[obj[0]] = obj[1]
                    }
                    if (authorizationParams.state !== state) {
                        this.toast.warning( "", "Please retry", this.toastOptions )
                        return
                    }
                    const callBackParm = [
                        `client_id=${client_id}`,
                        `code=${authorizationParams.code}`,
                        `redirect_uri=${authorizationParams.redirect_uri}`,
                        `grant_type=authorization_code`,
                        `state=${authorizationParams.state}`].join("&")
                    window.location = `${authorizationParams.redirect_uri}?${callBackParm}`
                } catch {
                    this.toast.warning( "", "Please retry", this.toastOptions )
                }
            } catch (error) {
                this.toast.error( "", "wrong password", this.toastOptions )
                this.set('password', '')
                console.log('error', error)
            }
        },
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
        },
        Encrypt(word) {
        	let srcs = CryptoJS.enc.Utf8.parse(word);
        	let encrypted = CryptoJS.AES.encrypt(srcs,
        		CryptoJS.enc.Utf8.parse("1234123412ABCDEF"),
        		{ iv: CryptoJS.enc.Utf8.parse('ABCDEF1234123412'), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        	return encrypted.ciphertext.toString().toUpperCase();
        }
    }
});
