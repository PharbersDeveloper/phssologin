import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import { computed } from '@ember/object';
import PhSigV4AWSClientFactory from "../../lib/PhSigV4AWSClientFactory"
const CryptoJS = require("crypto-js");

export default Controller.extend({
    newPassword: '',
    confirmPassword: '',
	toast: service(),
	ajax: service(),
	newPassword: '',
	confirmPassword: '',
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
	}),
	newPasswordComputed: computed('newPassword', function () {
		//如果还没有输入新密码则不监听
		if (this.newPassword.length === 0 ) {
			return 2
		}
		//每个条件如果通过则为1，不通过则为0
		if (this.newPassword.length >= 8) {
			this.set('atLeast8', 1)
		} else {
			this.set('atLeast8', 0)
		}
		if (/\d{1,}/.test(this.newPassword)) {
			this.set('haveNumber', 1)
		} else {
			this.set('haveNumber', 0)
		}
		if (/[A-Z]{1,}/.test(this.newPassword)) {
			this.set('haveCapital', 1)
		} else {
			this.set('haveCapital', 0)
		}
		if (/[a-z]{1,}/.test(this.newPassword)) {
			this.set('haveMinuscules', 1)
		} else {
			this.set('haveMinuscules', 0)
		}
		if (this.atLeast8 === 1 && this.haveNumber === 1 && this.haveCapital === 1 && this.haveMinuscules === 1) {
			
			return 1  //如果新密码满足这四个条件，则返回1
		}
		return 0   //否则返回0
	}),
	changePasswordDisabled: computed('newPasswordComputed', function() {
		if(this.newPasswordComputed === 1) {
			return false
		}
		return true
	}),
    actions: {
        /**
		* @description: 重置密码按钮：验证密码格式是否正确
		*/
		resetButton() {
			
			if(this.newPassword === this.confirmPassword) {
				let submitPassword = CryptoJS.SHA256(this.confirmPassword).toString()
				const factory = PhSigV4AWSClientFactory
				let userEmail = this.model.email
				const config = {
					accessKey: "10EC20D06323077893326D4388B18ED12D08F45BEB066308279D890FDFEB872F",
                    secretKey: "7A2A70C890EB8D3BFDE11F0C2FEBCB856A9151002A9D21AF3D5525B04F81C3F65340A646C74E5BFF6E672FC4740D96B0",
					sessionToken: '',
					region: 'cn-northwest-1',
					sessionToken: "",
					region: "cn-northwest-1",
					apiKey: undefined,
					defaultContentType: "application/json",
					defaultAcceptType: "application/json"
				}
				const invokeUrl = "https://2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn/v0"
				const endpoint = /(^https?:\/\/[^\/]+)/g.exec( invokeUrl )[1]
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
				let req = {
					verb: "POST",
					path: "/v0/phact/forgotPassword",
					body: {
						"email": userEmail,
						"password": submitPassword
					}
				}

				const request = client.makeRequest( req )

				const ajax = this.get("ajax")

				ajax.request(  request.url , {
					method: "POST",
					headers: request.headers,
					data: {
						"email": userEmail,
						"password": submitPassword
					}
				} ).then(value => {
					this.transitionToRoute(`/resetSuccessPage?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
				}).catch(err => {
					this.toast.warning( "", "Please retry", this.toastOptions )
				})
			} else {
				//提示填写的格式错误
                this.toast.error( "", "The two passwords are inconsistent", this.toastOptions )
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
        }
    }
});
