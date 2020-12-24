import Route from "@ember/routing/route"
import { inject as service } from "@ember/service"

export default Route.extend( {
	intl: service(),

	beforeModel( { targetName } ) {
		this._super( ...arguments )
		//   this.intl.setLocale(['en-us']);
		// this.get( "intl" ).setLocale( ["zh-cn"],["en-us"] )
		// 读取浏览器语言，设置显示语言
		　var type = navigator.appName;
        　　if (type == "Netscape"){
            　　var lang = navigator.language;//获取浏览器配置语言，支持非IE浏览器
        　　}else{
            　　var lang = navigator.userLanguage;//获取浏览器配置语言，支持IE5+ == navigator.systemLanguage
        　　};
		　　var lang = lang.substr(0, 2);//获取浏览器配置语言前两位
		
        　　if (lang == "zh"){
			　　this.get('intl').set('locale', "zh-cn");
        　　}else if (lang == "en"){		　
			　this.get('intl').set('locale', "en-us");
		　　};
		

		window.console.log( "target route:" + targetName )
	}
} )