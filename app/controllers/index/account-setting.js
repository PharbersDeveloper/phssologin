import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";

export default Controller.extend({
    //userName为用户的id
	userName: '',
	firstName: '',
	lastName: '',
    password: '',
    toast: service(),
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
	}),
    //set your account 输入全部正确
	accountSuccess: computed('userName', 'firstName', 'lastName', 'password', function() {
		if(this.userName && this.firstName && this.lastName && this.password) {
			return true
		}else {
			return false
		}
	}),
    actions: {
        /**
		* @description: 判断填写的名字和密码格式是否正确
		*/
		accountSetting() {
			if(this.accountSuccess) {
                this.toast.success( "", "Set successfully", this.toastOptions )
			} else {
				//提示填写的格式错误
                console.log('名字和email填写的格式错误')
                this.toast.error( "", "Incorrect username or password, please retry.", this.toastOptions )
			}
		},
    }
});
