import Route from "@ember/routing/route"
import { inject as service } from "@ember/service"

export default Route.extend( {
	intl: service(),

	beforeModel( { targetName } ) {
		this._super( ...arguments )
		//   this.intl.setLocale(['en-us']);
		this.get( "intl" ).setLocale( ["zh-cn"],["en-us"] )
		window.console.log( "1target route:" + targetName )
	}
} )