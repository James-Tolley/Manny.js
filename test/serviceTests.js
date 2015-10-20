/*global describe*/
describe('Services', function() {
	require('./serviceTests/accountCreation');
	require('./serviceTests/authentication');
	require('./serviceTests/authorization');
	require('./serviceTests/role');
	require('./serviceTests/userRole');
});