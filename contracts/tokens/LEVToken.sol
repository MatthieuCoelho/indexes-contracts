// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "contracts/interfaces/IBurnable.sol";
import "contracts/interfaces/IMintable.sol";
import "contracts/utilities/PancakeswapUtilities.sol";

contract LEVToken is ERC20, IBurnable, IMintable, Ownable {
    uint256 _createdAtBlock;
    uint256 _initialSupply;

    // the LEV token! Masterchef contract is the owner and can mint
    constructor(
        address initialSupplyTarget,
        uint256 initialSupply
    ) ERC20("Levyathan", "LEV") {
        _mint(initialSupplyTarget, initialSupply);
        _initialSupply = initialSupply;
        _createdAtBlock = block.number;
    }

    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }

    function getCreatedAtBlock() external view returns(uint) {
        return _createdAtBlock;
    }

    function mint(address receiver, uint256 amount) override external onlyOwner {
        _mint(receiver, amount);
    }
}
