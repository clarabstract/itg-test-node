const { get } = require('server/router');
const { status } = require('server/reply');
const { getInterest }  = require('../interestStore');
const {
	getCompoundPeriod,
	getPaymentsPerYear,
	mortgageInsurance,
	periodPayment,
	perPeriodInterestRate,
	validateAmortizationPeriod,
	validateAskingPrice,
	validateDownPayment,
	validateLocation,
	validatePaymentSchedule,

} = require('../mortgage');

module.exports = get('/payment-amount', ctx => {
	let { askingPrice, downPayment, paymentSchedule, amortizationPeriod, location } = ctx.query;
	askingPrice = parseFloat(askingPrice);
	downPayment = parseInt(downPayment);
	amortizationPeriod = parseInt(amortizationPeriod);
	location = location === undefined ? 'us' : location;
	const errors = [];
	validateAskingPrice(errors, askingPrice);
	validateDownPayment(errors, askingPrice, downPayment);
	validatePaymentSchedule(errors, paymentSchedule);
	validateAmortizationPeriod(errors, amortizationPeriod);
	validateLocation(errors, location);
	if (errors.length > 0) {
		return status(422).json({errors});
	}
	const interestRate = getInterest();
	const paymentsPerYear = getPaymentsPerYear(paymentSchedule);
	const periodRate = perPeriodInterestRate(
		interestRate,
		paymentsPerYear,
		getCompoundPeriod(location)
	);
	const mortgageInsuranceAdded = mortgageInsurance(askingPrice, downPayment);
	const principalRequired = askingPrice + mortgageInsuranceAdded - downPayment;
	const paymentPerPeriod = periodPayment(
		principalRequired,
		paymentsPerYear * amortizationPeriod,
		periodRate
	);
	return status(200).json({
		paymentPerPeriod,
		info: {
			paymentsPerYear,
			periodRate,
			askingPrice,
			interestRate,
			paymentSchedule,
			amortizationPeriod,
			location,
			mortgageInsuranceAdded,
			principalRequired,
		},
	});
});
