var routing = require('../src/lib/routing');

/*global describe, it*/
describe("Routing Library", function() {
	describe("GetRoute", function() {
		
		
		it('Should replace the id parameter with a primative', function() {
			
			var url = routing.getRoute(':id', 1);
			url.should.equal('1');
		});
		
		it('Should replace optional parameters', function() {
			var url = routing.getRoute(':id?', 1);
			url.should.equal('1');
		});
		
		it('Should replace multiple parameters with an object', function() {
			
			var url = routing.getRoute('/:id/children/:childid', {
				id: 1,
				childId: 2
			});
			
			url.should.equal('/1/children/2');
		});
		
		it('Should not partially match against the wrong parameter', function() {
			var url = routing.getRoute('/:idofparent/children/:id', {
				id: 2,
				idofparent: 1
			});
			url.should.equal('/1/children/2');
		});
		
		it('Should clear optional parameters if not specified', function() {
			var url = routing.getRoute('/:id/children/:childid?', {
				id: 1
			});
			url.should.equal('/1/children/');			
		});
		
		it('Should not clear mandatory parameters if not specified', function() {
			var url = routing.getRoute('/:id/children/:childid', {
				id: 1
			});
			url.should.equal('/1/children/:childid');			
		});		
		
		
	})
})