import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";
import { computed } from '@ember/object';

export default Controller.extend({
    newPassword: '',
    confirmPassword: '',
	toast: service(),
	ajax: service(),
	newPassword: '',
	confirmPassword: '',
	language:'',
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
        window.addEventListener('keydown', event => {
			if(event.keyCode === 13) {
				$('#resetPasswordButton').click()
			}
			return
        })
    },
    actions: {
        /**
		* @description: 重置密码按钮：验证密码格式是否正确
		*/
		resetButton() {
			const CryptoJS = require("crypto-js");
			if(this.newPassword === this.confirmPassword) {
				let submitPassword = CryptoJS.SHA256(this.confirmPassword).toString()
				let userEmail = this.model.email
				const applicationAdapter = this.store.adapterFor('application')
				const ajax = this.get("ajax")
				
				applicationAdapter.set('path', "/v0/phact/forgotPassword")
				applicationAdapter.set('verb', "POST")
                applicationAdapter.set('body', {
                    "email": userEmail,
					"password": submitPassword
                })
                applicationAdapter.toggleProperty('oauthRequest')
                const request = applicationAdapter.get('request')
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
					if(this.language=="zh"){
                        this.toast.warning( "", "请重新输入", this.toastOptions )
                    }else{
                        this.toast.warning( "", "Please retry", this.toastOptions )
                    }  
					
				})
			} else {
				//提示填写的格式错误
				if(this.language=="zh"){
					this.toast.error( "", "两个密码不一致", this.toastOptions )
				}else{
					this.toast.error( "", "The two passwords are inconsistent", this.toastOptions )
				}  
			}
		}
    }
});
