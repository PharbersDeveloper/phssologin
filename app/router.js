import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
	location: config.locationType,
	rootURL: config.rootURL
});

Router.map(function() {
	this.route('index', {path: '/'}, function() {
		this.route('welcome');
		this.route('verifyPage');
		this.route('accountSetting');
		this.route('signIn');
    	this.route('forgotPassword');
    	this.route('resetVerifyPage');
    	this.route('resetPasswordPage');
    	this.route('resetSuccessPage');
	});
});

export default Router;
