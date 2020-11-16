import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import EmberObject from "@ember/object";

export default Controller.extend({
    toast: service(),
    toastOptions: EmberObject.create({
		closeButton: false,
		positionClass: "toast-top-center",
		progressBar: false,
		timeOut: "1500"
	}),
    verifyCode0:'',verifyCode1:'',verifyCode2:'',verifyCode3:'',verifyCode4:'',verifyCode5:'',
    //需要专门处理验证码是否正确，这里先拿此变量充当
    codeIsTrue: true,
    actions: {
        /**
		* @description: 输入验证码，自动跳转
		* @param {number} index: 当前所在的code input
		*/
		codeInputchange(index, event) {
            if($(`#code${index}`)[0].value && event.target.keyCode !== 8) {
                if(index < 5) {
                    $(`#code${index+1}`).focus()
                }else {
                    if(!this.codeIsTrue) {
                        //验证码输入错误，6位数字清空，显示错误提示
                        this.toast.error( "", "incorrect verification code", this.toastOptions )
                        for(let i = 0; i < 6; i++) {
                            this.set(`verifyCode${i}`, '')
                        }
                    } else {
                        // 进入添写个人信息界面
                        console.log('进入添写个人信息界面')
                        this.transitionToRoute('/accountSetting')
                    }
                }
            }  
		}
    }
});
