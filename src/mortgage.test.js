const mortgage = require('./mortgage');
describe('mortgage module', () => {
	describe('.mortgageInsurance()', () => {
		it('should throw if given a downPayment below 5%', () => {
			expect(() => mortgage.mortgageInsurance(100, 4.9)).toThrow();
		});
		it('should use the 3.15% insurance rate if given a downPayment between 5% and 9.99%', () => {
			expect(mortgage.mortgageInsurance(100, 5)).toEqual((100 - 5) * 0.0315);
			expect(mortgage.mortgageInsurance(100, 7)).toEqual((100 - 7) * 0.0315);
			expect(mortgage.mortgageInsurance(100, 9.99)).toEqual((100 - 9.99) * 0.0315);
		});
		it('should use the 2.4% insurance rate if given a downPayment between 10% and 14.99%', () => {
			expect(mortgage.mortgageInsurance(100, 10)).toEqual((100 - 10) * 0.024);
			expect(mortgage.mortgageInsurance(100, 12)).toEqual((100 - 12) * 0.024);
			expect(mortgage.mortgageInsurance(100, 14.99)).toEqual((100 - 14.99) * 0.024);
		});
		it('should use the 1.8% insurance rate if given a downPayment between 15% and 19.99%', () => {
			expect(mortgage.mortgageInsurance(100, 15)).toEqual((100 - 15) * 0.018);
			expect(mortgage.mortgageInsurance(100, 17)).toEqual((100 - 17) * 0.018);
			expect(mortgage.mortgageInsurance(100, 19.99)).toEqual((100 - 19.99) * 0.018);
		});
		it('should return $0 if given a downPayment of 20% or higher', () => {
			expect(mortgage.mortgageInsurance(100, 20)).toEqual(0);
			expect(mortgage.mortgageInsurance(100, 50)).toEqual(0);
			expect(mortgage.mortgageInsurance(100, 100)).toEqual(0);
		});
	});
	describe('.minDownPayment()', () => {
		it('should be 5% for the first $500,000 of an asking price', () => {
			expect(mortgage.minDownPayment(100)).toEqual(5);
			expect(mortgage.minDownPayment(100000)).toEqual(5000);
			expect(mortgage.minDownPayment(500000)).toEqual(25000);
		});
		it('should be 10% for the any amount left over after $500,000', () => {
			expect(mortgage.minDownPayment(500100)).toEqual(25010);
			expect(mortgage.minDownPayment(1000000)).toEqual(75000);
		});
	});
});
