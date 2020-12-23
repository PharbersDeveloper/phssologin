import Controller from '@ember/controller';
import { computed  } from '@ember/object';
import PhSigV4AWSClientFactory from "../../lib/PhSigV4AWSClientFactory"
import { inject as service } from "@ember/service"
import EmberObject from "@ember/object";

export default Controller.extend({
    ajax: service(),
    toast: service(),
    cookies: service(),
    language:'',
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
    }),
    isSendCode: false,
    userEmail: computed( 'model.email', function() {
        return this.model.email
    }),
    confirmDisabled: computed('userEmail', 'isSendCode', function() {
		if(this.userEmail && !this.isSendCode) {
			return false
		}
		return true
    }),
    init() {
        this._super(...arguments);
        var type = navigator.appName;
        　　if (type == "Netscape"){
            　　var lang = navigator.language;//获取浏览器配置语言，支持非IE浏览器
        　　}else{
            　　var lang = navigator.userLanguage;//获取浏览器配置语言，支持IE5+ == navigator.systemLanguage
        　　};
		　　var newLang = lang.substr(0, 2);//获取浏览器配置语言前两位
	        this.set("language", newLang);

        window.onload = function() {
            $('#forgot-input').focus()
        }
        window.addEventListener('keydown', event => {
			if(event.keyCode === 13) {
				$('#forgotButton').click()
            }
            $('#forgot-input').focus() 
			return
        })
    },
    actions: {
        /**
        * @description: 检查用户输入的email格式；检查此邮箱是否在系统内。
        */
        async sendVerificationCode() {
            let emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            let userEmail = this.userEmail

            if(!emailReg.test(userEmail)) {

                //这里是email格式错误，可以用几个全局变量来充当错误提示和input的class；
                //或者使用一个变量来判断并通过if else修改handlebars。
                this.set('emailRight', false)
            } else {
                this.set("isSendCode", true) 
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
                let req = {
                    verb: "GET",
                    path: "/v0/phact/verifyEmail",
                    queryParams: {
                        email: userEmail,
                    },
                    body: {}
                }
    
                const request = client.makeRequest( req )
    
                const ajax = this.get("ajax")
    
                ajax.request(  request.url , {
                    headers: request.headers
                } ).then( value => {
                    let sendCodeReq = {
                        verb: "GET",
                        path: "/v0/phact/sendCode",
                        queryParams: {
                            to: userEmail,
                        },
                        body: {}
                    }
                    const sendCodeRequest = client.makeRequest( sendCodeReq )
                    ajax.request(  sendCodeRequest.url , {
                        headers: sendCodeRequest.headers
                    } ).then(value => {
                        //进入重置密码流程
                        this.cookies.write('sendCodeDate', (new Date()).getTime(),{
                            domain: ".pharbers.com",
                            path: "/",
                            maxAge: 60
                        })
                        this.set("isSendCode", false)
                        this.transitionToRoute(`/resetVerifyPage?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
                    }).catch( err => {
                        if(this.language=="zh"){
                            this.toast.warning( "", "请重新输入", this.toastOptions )
                        }else{
                            this.toast.warning( "", "Please retry", this.toastOptions )
                        }  
                        this.set("isSendCode", false)
                    })
                    
                }).catch( err => {
                    //进入注册流程
                    console.log('进入注册流程')
                    this.set("isSendCode", false)
                    if(this.language=="zh"){
                        this.toast.warning( "", "邮箱未注册", this.toastOptions )
                    }else{
                        this.toast.warning( "", "Email not registered", this.toastOptions )
                    }  
                   
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
