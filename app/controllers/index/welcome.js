import Controller from '@ember/controller';
import { computed  } from '@ember/object';
import PhSigV4AWSClientFactory from "../../lib/PhSigV4AWSClientFactory"
import { inject as service } from "@ember/service"
import EmberObject from "@ember/object";

export default Controller.extend({
    ajax: service(),
    toast: service(),
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
    }),
    queryParams: ['redirect_uri'],
    userEmail: '',
    //密码格式输入是否正确，即是否显示input底部提示
    emailRight: true,
    isContinue: false,
	continueDisabled: computed('userEmail', 'isContinue', function() {
		if(this.userEmail &&!this.isContinue) {
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
				$('#continueButton').click()
			}
			return
		})
    },
    actions: {
        sendVerificationCode() {
            let emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            let userEmail = this.userEmail
            if(!emailReg.test(userEmail)) {
                //这里是email格式错误，可以用几个全局变量来充当错误提示和input的class；
                //或者使用一个变量来判断并通过if else修改handlebars。
                this.set('emailRight', false)
                console.log('email格式错误')
            } else {
                this.set("isContinue", true) 
                const factory = PhSigV4AWSClientFactory
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
                    verb: "GET",
                    path: "/v0/phact/verifyEmail",
                    queryParams: {
                        email: userEmail
                    },
                    body: {}
                }
    
                const request = client.makeRequest( req )
    
                const ajax = this.get("ajax")

                ajax.request(  request.url , {
                    headers: request.headers
                } ).then( response => {
                    //进入登录流程
                    this.set("isContinue", false) 
                    this.transitionToRoute(`/signIn?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
                }).catch( err => {
                    //进入注册流程
                    this.set("isContinue", false) 
                    this.toast.warning( "", "Email not registered", this.toastOptions )
                    // this.transitionToRoute(`/verifyPage?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
                })
                this.set('emailRight', true)
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
