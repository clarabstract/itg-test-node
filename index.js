const server = require('server');
const { get, error } = require('server/router');
// This is refers to a private method that I shouldn't be accessing normally. It is needed
// because server.js does not support patch() out the box. It would be preferable to have
// this added upstream, or use a different http server alltogether, but we are iterating
// quickly here!
const generic = require('server/router/generic');
const { status } = require('server/reply');
const { getInterest, updateInterest }  = require('./interestStore');
const {
	getPaymentsPerYear,
	periodPayment,
	perPeriodInterestRate,
	principalForPayment,
	validateAmortizationPeriod,
	validateDownPayment,
	validatePaymentSchedule,

} = require('./mortgage');

server({security: {csrf: false}}, [
  get('/payment-amount', ctx => {
  	let { askingPrice, downPayment, paymentSchedule, amortizationPeriod } = ctx.query;
  	askingPrice = parseFloat(askingPrice)
  	downPayment = parseInt(downPayment)
  	amortizationPeriod = parseInt(amortizationPeriod)
  	const errors = [];
	validateDownPayment(errors, askingPrice, downPayment);
	validatePaymentSchedule(errors, paymentSchedule);
	validateAmortizationPeriod(errors, amortizationPeriod);
  	if (errors.length > 0) {
  		return status(422).json({errors},);
  	}
  	const interestRate = getInterest();
  	const paymentsPerYear = getPaymentsPerYear(paymentSchedule);
  	const periodRate = perPeriodInterestRate(
  		interestRate,
  		paymentsPerYear,
  		2,
	);
	const paymentPerPeriod = periodPayment(
		askingPrice,
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
		},
	});
  }),
  get('/mortgage-amount', ctx => {
  	let { paymentAmount, downPayment, paymentSchedule, amortizationPeriod } = ctx.query;
  	paymentAmount = parseFloat(paymentAmount)
  	downPayment = parseInt(downPayment)
  	amortizationPeriod = parseInt(amortizationPeriod)
  	const errors = [];
	validatePaymentSchedule(errors, paymentSchedule);
	validateAmortizationPeriod(errors, amortizationPeriod);
  	if (errors.length > 0) {
  		return status(422).json({errors},);
  	}
  	const interestRate = getInterest();
  	const paymentsPerYear = getPaymentsPerYear(paymentSchedule);
  	const periodRate = perPeriodInterestRate(
  		getInterest(),
  		paymentsPerYear,
  		2,
	);
	const maximumMortgage = principalForPayment(
		paymentAmount,
		paymentsPerYear * amortizationPeriod,
		periodRate
	);
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
	})
  }),
  generic('PATCH', '/interest-rate', ctx => {
  	const newInterestRate = ctx.data.interestRate;
  	const oldInterestRate = getInterest();
  	updateInterest(newInterestRate);

  	return status(200).json({newInterestRate, oldInterestRate});
  }),
  error(ctx => status(500).json({error: ctx.error.message}))
]);
