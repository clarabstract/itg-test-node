const mortgage = require('./mortgage');
describe('mortgage.mortgageInsurance()', () => {
	it('should throw if given a downPayment below 5%', () => {
		expect(() => mortgage.mortgageInsurance(100, 4.9)).toThrow();
	})
	it('should throw if given a downPayment 5% or higher', () => {
		expect(() => mortgage.mortgageInsurance(100, 5)).not.toThrow();
		expect(() => mortgage.mortgageInsurance(100, 5.1)).not.toThrow();
	})

})
