import Controller from '@ember/controller';

export default Controller.extend({
    actions: {
        toSignIn() {
            this.transitionToRoute(`/signIn?email=${this.model.email}&redirect_uri=${this.model.redirect_uri}`)
        }
    }
});
