import Controller from '@ember/controller';
import { computed  } from '@ember/object';
import { inject as service } from "@ember/service"
import EmberObject from "@ember/object";

export default Controller.extend({
    ajax: service(),
    toast: service(),
    store: service(),
    language:'',
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
        var type = navigator.appName;
	　　if (type == "Netscape"){
		　　var lang = navigator.language;//获取浏览器配置语言，支持非IE浏览器
	　　}else{
		　　var lang = navigator.userLanguage;//获取浏览器配置语言，支持IE5+ == navigator.systemLanguage
	　　}
	　　var newLang = lang.substr(0, 2);//获取浏览器配置语言前两位
		this.set("language", newLang);
        window.onload = function() {
            $('#welcome-input').focus()
        }

        window.addEventListener('keydown', event => {
			if(event.keyCode === 13) {
				$('#continueButton').click()
            }
            $('#welcome-input').focus()
			return
        })
    },
    actions: {
        sendVerificationCode() {
            const applicationAdapter = this.store.adapterFor('application')
            const ajax = this.get("ajax")
            let emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            let userEmail = this.userEmail
            if(!emailReg.test(userEmail)) {
                //这里是email格式错误，可以用几个全局变量来充当错误提示和input的class；
                //或者使用一个变量来判断并通过if else修改handlebars。
                this.set('emailRight', false)
                console.log('email格式错误')
            } else {
                this.set("isContinue", true)

                applicationAdapter.set('path', "/phpwd/verifyemail")
				applicationAdapter.set('verb', "GET")
                applicationAdapter.set('queryParams', {
                    email: userEmail
                })
                applicationAdapter.toggleProperty('oauthRequest')
                const request = applicationAdapter.get('request')
                ajax.request(  request.url , {
                    headers: request.headers
                } ).then( response => {
                    //进入登录流程
                    this.set("isContinue", false)
                    this.transitionToRoute(`/signIn?email=${userEmail}&redirect_uri=${this.model.redirect_uri}&state=${this.model.state}&client_id=${this.model.client_id}&scope=${this.model.scope}`)
                }).catch( err => {
                    //进入注册流程
                    this.set("isContinue", false)
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
