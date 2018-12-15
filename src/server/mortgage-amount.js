const { get } = require('server/router');
const { status } = require('server/reply');
const { getInterest }  = require('../interestStore');
const {
	getCompoundPeriod,
	getPaymentsPerYear,
	perPeriodInterestRate,
	principalForPayment,
	validateAmortizationPeriod,
	validateLocation,
	validatePaymentAmount,
	validatePaymentSchedule,

} = require('../mortgage');

module.exports = get('/mortgage-amount', ctx => {
	let { paymentAmount, downPayment, paymentSchedule, amortizationPeriod, location } = ctx.query;
	paymentAmount = parseFloat(paymentAmount);
	downPayment = parseInt(downPayment);
	amortizationPeriod = parseInt(amortizationPeriod);
	location = location === undefined ? 'us' : location;
	const errors = [];
	validatePaymentAmount(errors, paymentAmount);
	validatePaymentSchedule(errors, paymentSchedule);
	validateAmortizationPeriod(errors, amortizationPeriod);
	validateLocation(errors, location);
	if (errors.length > 0) {
		return status(422).json({errors});
	}
	const interestRate = getInterest();
	const paymentsPerYear = getPaymentsPerYear(paymentSchedule);
	const periodRate = perPeriodInterestRate(
		getInterest(),
		paymentsPerYear,
		getCompoundPeriod(location)
	);
	let maximumMortgage = principalForPayment(
		paymentAmount,
		paymentsPerYear * amortizationPeriod,
		periodRate
	);
	if (!isNaN(downPayment)) {
		maximumMortgage += downPayment;
	}
	return status(200).json({
		maximumMortgage,
		info: {
			paymentsPerYear,
			periodRate,
			paymentAmount,
			interestRate,
			paymentSchedule,
			amortizationPeriod,
		},
	});
});
