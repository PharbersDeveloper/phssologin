import Controller from '@ember/controller';
import { computed  } from '@ember/object';
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
	　　}
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
                const applicationAdapter = this.store.adapterFor('application')
                const ajax = this.get("ajax")

                applicationAdapter.set('path', "/phact/verifyEmail")
                applicationAdapter.set('verb', "GET")
                applicationAdapter.set('queryParams', {
                    email: userEmail
                })
                applicationAdapter.toggleProperty('oauthRequest')
                const request = applicationAdapter.get('request')
                ajax.request(  request.url , {
                    headers: request.headers
                } ).then( value => {
                	// Send Email
                    applicationAdapter.set('path', "/phresetpasswd")
                    applicationAdapter.set('verb', "POST")
					applicationAdapter.set('body', {
						content_type: "forget_password",
						target_address: [userEmail],
						subject: "Pharbers Platform: Reset Possword",
						attachments: []
					})
                    applicationAdapter.set('queryParams', {})
                    applicationAdapter.toggleProperty('oauthRequest')
                    const sendCodeRequest = applicationAdapter.get('request')

					ajax.request(  sendCodeRequest.url , {
                        headers: sendCodeRequest.headers,
						type: "POST",
						data:  JSON.stringify(applicationAdapter.get('body'))
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
        }
    }
});
