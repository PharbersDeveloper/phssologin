import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import { computed  } from '@ember/object';

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
    sendCodeDisabled: computed('codeTimeout',function() {
        if(this.codeTimeout) {
            return true
        }
        return false
    }),
    verifyCode0:'',verifyCode1:'',verifyCode2:'',verifyCode3:'',verifyCode4:'',verifyCode5:'',
    // timeOut() {
    //     if(document.cookie.indexOf('sendCodeDate') !== -1) {
    //         return this.timeOut()
    //     } else {
    //         this.set('codeTimeout', null)
    //         return
    //     }
    // },
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
        let timesout = setInterval(() => {
            this.set('codeTimeout', this.cookies.read('sendCodeDate'))
            if(!this.get('codeTimeout')) {
                clearInterval(timesout)
            }
        }, 500);

        window.addEventListener('keydown', event => {
            if($('#resetCode0')[0] && !$('#resetCode0')[0].value) {
                for(let i = 0; i < 6; i++) {
                    this.set(`verifyCode${i}`, '')
                }
                $('#resetCode0').focus()
            }
        })
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
                    let userEmail = this.model.email
                    const applicationAdapter = this.store.adapterFor('application')
                    const ajax = this.get("ajax")

                    // applicationAdapter.set('path', "/phact/verifyCode")
                    // applicationAdapter.set('verb', "GET")
                    // applicationAdapter.set('queryParams', {
                    //     key: userEmail,
                    //     code: `${this.verifyCode0}${this.verifyCode1}${this.verifyCode2}${this.verifyCode3}${this.verifyCode4}${this.verifyCode5}`
                    // })
                    applicationAdapter.set('path', "/phusercodecheck")
                    applicationAdapter.set('verb', "POST")
                    applicationAdapter.set('queryParams', {})
                    applicationAdapter.set('body', {
                        "email": userEmail,
                        "code": `${this.verifyCode0}${this.verifyCode1}${this.verifyCode2}${this.verifyCode3}${this.verifyCode4}${this.verifyCode5}`
                    })
                    applicationAdapter.toggleProperty('oauthRequest')
                    const request = applicationAdapter.get('request')
                    ajax.request(  request.url , {
                        headers: request.headers,
                        type: "POST",
                        data:  JSON.stringify(applicationAdapter.get('body'))
                    } ).then( response => {
                        // 进入重置密码界面
                        console.log('进入重置密码界面')
                        for(let i = 0; i < 6; i++) {
                            this.set(`verifyCode${i}`, '')
                        }
                        this.transitionToRoute(`/resetPasswordPage?email=${userEmail}&redirect_uri=${this.model.redirect_uri}`)
                    }).catch( err => {
                        //验证码输入错误，6位数字清空，显示错误提示
                        if(this.language=="zh"){
                            this.toast.error( "", "验证码错误", this.toastOptions )
                        }else{
                            this.toast.error( "", "incorrect verification code", this.toastOptions )
                        }

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
            $('#resetCode0').focus()
            let userEmail = this.model.email
            const applicationAdapter = this.store.adapterFor('application')
            const ajax = this.get("ajax")

            applicationAdapter.set('path', "/phact/sendCode")
            applicationAdapter.set('verb', "GET")
            applicationAdapter.set('queryParams', {
                to: userEmail
            })
            applicationAdapter.toggleProperty('oauthRequest')
            const sendCodeRequest = applicationAdapter.get('request')
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
                if(this.language=="zh"){
                    this.toast.success( "", "密码重置成功", this.toastOptions )
                }else{
                    this.toast.success( "", "Resend code successfully", this.toastOptions )
                }

            }).catch( err => {
                console.log('err',err)
                if(this.language=="zh"){
                    this.toast.warning( "", "请重试", this.toastOptions )
                }else{
                    this.toast.warning( "", "Please retry", this.toastOptions )
                }

                this.set('codeTimeout', undefined)
            })
        }
    }
});
