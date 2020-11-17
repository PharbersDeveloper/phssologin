import Route from '@ember/routing/route';
import ENV from "../../config/environment"

export default Route.extend({
    redirect_uri: ENV.redirectUri,
    beforeModel() {
        this.transitionTo(`/welcome?redirect_uri=${this.redirect_uri}`)
    }
});