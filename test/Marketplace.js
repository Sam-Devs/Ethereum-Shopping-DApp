const Marketplace = artifacts.require('./Marketplace.sol');

require('chai')
	.use(require('chai-as-promised'))
	.should();

contract('Marketplace', async ([deployer, seller, buyer]) => {
	let marketplace;

	before(async () => {
		marketplace = await Marketplace.deployed();
	});

	describe('deployment', async () => {
		it('deploys', async () => {
			const address = await marketplace.address;
			assert.notEqual(address, '0x0');
			assert.notEqual(address, '');
			assert.notEqual(address, null);
			assert.notEqual(address, undefined);
		});

		it('has a name', async () => {
			const name = await marketplace.name();
			assert.equal(name, 'Ethereum Marketplace DApp');
		});
	});

	describe('products', async () => {
		let result, productCount;

		before(async () => {
			result = await marketplace.createProduct('Samsung S10', web3.utils.toWei('1', 'Ether'), { from: seller });
			productCount = await marketplace.productCount();
		});

		it('creates products', async () => {
			// To Test Successfully
			assert.equal(productCount, 1);
			const event = result.logs[0].args;
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
			assert.equal(event.name, 'Samsung S10', 'name is correct');
			assert.equal(event.price, '1000000000000000000', 'price is correct');
			assert.equal(event.owner, seller, 'seller is correct');
			assert.equal(event.purchased, false, 'purchase is correct');

			// To Test Failure
			// If product doesn't have a name
			await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;
			// If product doesn't have a price || price < 0
			await marketplace.createProduct('Samsung S10', 0, { from: seller }).should.be.rejected;
		});

		it('list products', async () => {
			const products = await marketplace.products(productCount);
			assert.equal(products.id.toNumber(), productCount.toNumber(), 'id is correct');
			assert.equal(products.name, 'Samsung S10', 'name is correct');
			assert.equal(products.price, '1000000000000000000', 'price is correct');
			assert.equal(products.owner, seller, 'seller is correct');
			assert.equal(products.purchased, false, 'purchase is correct');
		});

		it('sells products', async () => {
			// Track seller balance before purchase
			let oldSellerBalance;
			oldSellerBalance = await web3.eth.getBalance(seller);
			oldSellerBalance = new web3.utils.BN(oldSellerBalance);

			result = await marketplace.purchasedProduct(productCount, {
				from: buyer,
				value: web3.utils.toWei('1', 'Ether'),
			});

			const event = result.logs[0].args;
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
			assert.equal(event.name, 'Samsung S10', 'name is correct');
			assert.equal(event.price, '1000000000000000000', 'price is correct');
			assert.equal(event.owner, buyer, 'buyer is correct');
			assert.equal(event.purchased, true, 'purchase is correct');

			// Seller recieves funds
			let newSellerBalance;
			newSellerBalance = await web3.eth.getBalance(seller);
			newSellerBalance = new web3.utils.BN(newSellerBalance);

			let price;
			price = web3.utils.toWei('1', 'Ether');
			price = new web3.utils.BN(price);

			console.log(oldSellerBalance, newSellerBalance, price);

			const expectedBalance = oldSellerBalance.add(price);

			assert.equal(newSellerBalance.toString(), expectedBalance.toString());

			// Failure: Tries to buy a product that doesn't exist
			await marketplace.purchasedProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be
				.rejected;
			// Failure: Buyer tries to buy without Ether
			await marketplace.purchasedProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') })
				.should.be.rejected;
			// Failure: Deployer tries to buy the product
			await marketplace.purchasedProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether') })
				.should.be.rejected;
			//Failure: Buyer tries to buy again
			await marketplace.purchasedProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') })
				.should.be.rejected;
		});
	});
});
