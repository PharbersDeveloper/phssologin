import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import { computed } from "@ember/object";

export default Controller.extend({
	password: '',
	language: '',
	toast: service(),
	ajax: service(),
	toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
	}),
	queryParams: ['redirect_uri', 'email'],
	isSignIn: false,
	signInDisabled: computed('password', 'isSignIn', function () {
		if (this.password && !this.isSignIn) {
			return false
		}
		return true
	}),
	init() {
		this._super(...arguments);
		var type = navigator.appName;
		if (type == "Netscape") {
			var lang = navigator.language;//获取浏览器配置语言，支持非IE浏览器
		} else {
			var lang = navigator.userLanguage;//获取浏览器配置语言，支持IE5+ == navigator.systemLanguage
		};
		var newLang = lang.substr(0, 2);//获取浏览器配置语言前两位
		this.set("language", newLang);


		window.onload = function () {
			$('#signIn-input').focus()
		}
		window.addEventListener('keydown', event => {
			if (event.keyCode === 13) {
				$('#signInButton').click()
			}
			$('#signIn-input').focus()
			return
		})
	},
	actions: {
		toWelcomePage() {
			this.transitionToRoute(`/welcome?client_id=${this.model.client_id}&redirect_uri=${this.model.redirect_uri}&state=${this.model.state}&scope=${this.model.scope}`)
		},
		forgotPassword() {
			this.transitionToRoute(`/forgotPassword?email=${this.model.email}&redirect_uri=${this.model.redirect_uri}&state=${this.model.state}&client_id=${this.model.client_id}`)
		},
		/**
		* @description: 登录按钮：验证密码是否正确
		*/
		async signIn() {
			this.set("isSignIn", true)
			const CryptoJS = require("crypto-js");
			const applicationAdapter = this.store.adapterFor('application')
			const ajax = this.get("ajax")
			const password = CryptoJS.SHA256(this.password).toString()
			
			applicationAdapter.set('path', "/phoauth/login")
			applicationAdapter.set('verb', "GET")
			applicationAdapter.set('queryParams', {
				account: this.model.email,
				password: password
			})
			applicationAdapter.toggleProperty('oauthRequest')
			const request = applicationAdapter.get('request')
			//验证账号密码是否匹配，匹配成功则继续获取code，失败则toast.error
			try {
				const loginSuccess = await ajax.request(request.url, {
					headers: request.headers
				})

				//获取code的值,并跳转到redircet_uri+queryParams
				const client_id = this.model.client_id ? this.model.client_id : this.actions.Decrypt("AB07EE4BF5CE23954C217D69F0E7784A3C5C5FACCEBD4995E44DE28B8692CDA3")
				const state = this.model.state ? this.model.state : "xyz"
				//AWS_IAM方式
				applicationAdapter.set('path', "/phoauth/authorization")
				applicationAdapter.set('verb', "GET")
				applicationAdapter.set('queryParams', {
					user_id: loginSuccess.uid,
					client_id,
					response_type: "code",
					redirect_uri: `${unescape(this.model.redirect_uri)}`,
					state
				})
				applicationAdapter.toggleProperty('oauthRequest')
				const requestCode = applicationAdapter.get('request')
				try {
					const result = await ajax.request(unescape(requestCode.url), {
						headers: requestCode.headers
					})

					const authorizationParams = {}
					for (const item of result.redirectUri.split('&')) {
						const obj = item.split('=')
						authorizationParams[obj[0]] = obj[1]
					}
					if (authorizationParams.state !== state) {
						if (this.language == "zh") {
							this.toast.warning("", "请重新输入", this.toastOptions)
						} else {
							this.toast.warning("", "Please retry", this.toastOptions)
						}
						this.set("isSignIn", false)
						return
					}
					window.location = `${result.redirectUri}`
				} catch {
					if (this.language == "zh") {
						this.toast.warning("", "请重新输入", this.toastOptions)
					} else {
						this.toast.warning("", "Please retry", this.toastOptions)
					}
					this.set("isSignIn", false)
				}
			} catch (error) {
				if (this.language == "zh") {
					this.toast.error("", "密码错误", this.toastOptions)
				} else {
					this.toast.error("", "wrong password", this.toastOptions)
				}
				this.set('password', '')
				this.set("isSignIn", false)
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
