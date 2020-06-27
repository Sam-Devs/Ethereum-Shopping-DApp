pragma solidity >=0.5.0 <0.6.0;

contract Marketplace {
    string public name;

    uint public productCount = 0;

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }
    mapping(uint => Product) public products;

    constructor () public {
        name = "Ethereum Marketplace DApp";
    }

    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event PurchaseProduct(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    function createProduct(string memory _name, uint _price) public {
        // Require a name
        require(bytes(_name).length > 0);
        // Require price
        require(_price > 0);
        // To increase product
        productCount++;
        // Create product;
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);
        // Trigger the event

        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchasedProduct(uint _id) public payable {
        // Fetch the products
        Product memory _product = products[_id];
        // Fetch the owner
        address payable _seller = _product.owner;
        // Validity of the product
        require(_product.id > 0 && _product.id <= productCount);
        // Require that there is enough Ether in the transaction
        require(msg.value >= _product.price);
        // Require that product has been purchased
        require(!_product.purchased);
        // Require that the buyer is not the seller
        require(_seller != msg.sender);
        // Transfer of Ownership to the buyer 
        _product.owner = msg.sender;
        // Mark as purchased
        _product.purchased = true;
        // Update the product
        products[_id] = _product;
        // Pay the seller by sending Ether
        address (_seller).transfer(msg.value);
        // Trigger an event
        emit PurchaseProduct(productCount, _product.name, _product.price, msg.sender, true);
    }


}