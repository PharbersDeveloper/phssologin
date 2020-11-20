import Controller from '@ember/controller';

export default Controller.extend({
    init() {
        this._super(...arguments);
        
        window.addEventListener('keydown', event => {
			if(event.keyCode === 13) {
				$('#resetSuccessButton').click()
			}
			return
        })
    },
    actions: {
        toSignIn() {
            this.transitionToRoute(`/signIn?email=${this.model.email}&redirect_uri=${this.model.redirect_uri}`)
        }
    }
});
