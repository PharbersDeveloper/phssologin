import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import PhSigV4AWSClientFactory from "../../lib/PhSigV4AWSClientFactory"
import { computed  } from '@ember/object';

export default Controller.extend({
    ajax: service(),
    toast: service(),
    cookies: service(),
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
    }),
    sendCodeDisabled: computed('codeTimeout',function() {
        if(this.codeTimeout) {
            return true
        }
        return false
    }),
    verifyCode0:'',verifyCode1:'',verifyCode2:'',verifyCode3:'',verifyCode4:'',verifyCode5:'',
    init() {
        this._super(...arguments);

        window.onload = function() {
            $('#resetCode0').focus()
        }
        let timesout = setInterval(() => {
            this.set('codeTimeout', this.cookies.read('sendCodeDate'))
            if(!this.get('codeTimeout')) {
                clearInterval(timesout)
            }
        }, 500);
    },
    actions: {
        toForgotPage() {
			this.transitionToRoute(`/forgotPassword?redirect_uri=${this.model.redirect_uri}`)
        },
        /**
		* @description: 输入验证码，自动跳转
		* @param {number} index: 当前所在的code input
		*/
		codeInputchange(index, event) {
            if($(`#resetCode${index}`)[0].value && event.keyCode !== 8) {
                if(index < 5) {
                    $(`#resetCode${index+1}`).focus()
                }else {
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
                        verb: "GET",
                        path: "/v0/phact/verifyCode",
                        queryParams: {
                            key: userEmail,
                            code: `${this.verifyCode0}${this.verifyCode1}${this.verifyCode2}${this.verifyCode3}${this.verifyCode4}${this.verifyCode5}`
                        },
                        body: {}
                    }
        
                    const request = client.makeRequest( req )
        
                    const ajax = this.get("ajax")

                    ajax.request(  request.url , {
                        headers: request.headers
                    } ).then( response => {
                        // 进入重置密码界面
                        console.log('进入重置密码界面')
                        for(let i = 0; i < 6; i++) {
                            this.set(`verifyCode${i}`, '')
                        }
                        this.transitionToRoute(`/resetPasswordPage?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
                    }).catch( err => {
                        //验证码输入错误，6位数字清空，显示错误提示
                        this.toast.error( "", "incorrect verification code", this.toastOptions )
                        for(let i = 0; i < 6; i++) {
                            this.set(`verifyCode${i}`, '')
                        }
                        $('#resetCode0').focus()
                    })
                }
            }  
            //按下删除键
            if( index !== 0 && event.keyCode === 8 && $(`#resetCode${index}`)[0].value === '') {
                $(`#resetCode${index-1}`)[0].value = ''
                $(`#resetCode${index-1}`).focus()
            }
        },
        resendCode() {
            this.set('codeTimeout', 1)
            let userEmail = this.model.email
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
            const ajax = this.get("ajax")

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
                this.cookies.write('sendCodeDate', (new Date()).getTime(),{
                    domain: ".pharbers.com",
                    path: "/",
                    maxAge: 60
                })
                let timesout = setInterval(() => {
                    this.set('codeTimeout', this.cookies.read('sendCodeDate'))
                    if(!this.get('codeTimeout')) {
                        clearInterval(timesout)
                    }
                }, 500);
                console.log('false')
            }).catch( err => {
                this.toast.warning( "", "Please retry", this.toastOptions )
                this.set('codeTimeout', undefined)
            })
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
