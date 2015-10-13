var Controller = require('../../src/controllers/Controller');

/*global describe, it*/
describe("Controller", function() {
	describe("GetRoute", function() {
		
		var controller = new Controller('');
		
		it('Should replace the id parameter with a primative', function() {
			
			var url = controller.getRoute(':id', 1);
			url.should.equal('1');
		});
		
		it('Should replace optional parameters', function() {
			var url = controller.getRoute(':id?', 1);
			url.should.equal('1');
		});
		
		it('Should replace multiple parameters with an object', function() {
			
			var url = controller.getRoute('/:id/children/:childid', {
				id: 1,
				childId: 2
			});
			
			url.should.equal('/1/children/2');
		});
		
		it('Should not partially match against the wrong parameter', function() {
			var url = controller.getRoute('/:idofparent/children/:id', {
				id: 2,
				idofparent: 1
			});
			url.should.equal('/1/children/2');
		});
		
		it('Should clear optional parameters if not specified', function() {
			var url = controller.getRoute('/:id/children/:childid?', {
				id: 1
			});
			url.should.equal('/1/children/');			
		});
		
		it('Should not clear mandatory parameters if not specified', function() {
			var url = controller.getRoute('/:id/children/:childid', {
				id: 1
			});
			url.should.equal('/1/children/:childid');			
		});		
		
		
	})
})