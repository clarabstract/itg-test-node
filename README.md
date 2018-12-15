# IT Glue Test Assignment

## Installation

Requires Node.js v8.10.0 or higher.

[Yarn v0.27.5](https://yarnpkg.com/en/docs/install) or higher is recommended.

Run `yarn` once in the project directory to install all dependencies.


## Running

```
yarn start
```

Server will be available at [http://localhost:3000/](http://localhost:3000/payment-amount?askingPrice=100000&amortizationPeriod=1&paymentSchedule=monthly).

## Code Quality Scripts

- `yarn test` to run the test suite
- `yarn test:cov` to run the test suite with coverage information
- `yarn lint` to run eslint
- `yarn lint:fix` to automatically fix simple linting issues
