import Route from '@ember/routing/route';
import { hash } from "rsvp"

export default Route.extend({
    queryParams: {
		redirect_uri: {
			refreshModel: true
		}
    },
    model(params) {
        return hash( {
            redirect_uri: params.redirect_uri
		} )
    }
});
