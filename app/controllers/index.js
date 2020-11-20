import Controller from "@ember/controller"

export default Controller.extend( {
    actions: {
        toWelcomePage() {
			this.transitionToRoute(`/welcome?redirect_uri=${this.model.redirect_uri}`)
        }
    }
} )
