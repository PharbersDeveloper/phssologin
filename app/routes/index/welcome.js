import Route from '@ember/routing/route';
import { hash } from "rsvp"

export default Route.extend({
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
