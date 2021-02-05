import Route from '@ember/routing/route';
import { hash } from "rsvp"

export default Route.extend({
	beforeModel(transition) {
		const queryParams = transition.to.queryParams
		if(!queryParams.client_id) {
			window.location.href = queryParams.redirect_uri
		}
		// let client_id = queryParams.client_id,
		// 	redirect_uri = queryParams.redirect_uri,
		// 	state = JSON.parse(window.atob(queryParams.state)),
		// 	nowTime = new Date().getTime()

		// if( state.client_id !== client_id || state.redirect_uri !== redirect_uri || ( state.time + 300000 ) < nowTime) {
		// 	window.location.href = redirect_uri.replace('//','||').split('/')[0].replace('||', '//')
		// }
	},
	queryParams: {
		redirect_uri: {
			refreshModel: true
		},
		state: {
			refreshModel: true
		},
		client_id: {
			refreshModel: true
		},
		scope: {
			refreshModel: true
		}
	},
	model(params) {
		return hash({
			redirect_uri: params.redirect_uri,
			state: params.state,
			client_id: params.client_id,
			scope: params.scope
		})
	}
});
