import Route from "@ember/routing/route"
import { hash } from "rsvp"

export default Route.extend({
    model(params, transition) {
        let redirect_uri = transition.to.queryParams.redirect_uri
        return hash( {
            redirect_uri: redirect_uri
		} )
    }
});


