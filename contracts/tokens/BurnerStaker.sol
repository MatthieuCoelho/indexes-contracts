//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/interfaces/IBurnable.sol";

import "../staking/MasterChef.sol";

// This contract is a token with a supply of 1e18 that's staked on an unusable staking pool in order to burn the reward tokens
contract BurnerStaker is ERC20, Ownable {

	uint256 public poolId;
	MasterChef public masterChef;
	address public rewardToken;

	constructor() ERC20("BurnerStaker", "BURNER") {
	  _mint(address(this), 1e18);
	}

	// Stake the full supply, can only be called once
	function stake(MasterChef _masterChef, uint256 _poolId, address _rewardToken) public onlyOwner {
	  require(balanceOf(address(this)) > 0, "ALREADY_STAKED");
	  poolId = _poolId;
	  masterChef = _masterChef;
	  rewardToken = _rewardToken;

	  _approve(address(this), address(masterChef), 1e18);
	  masterChef.deposit(poolId, 1e18);
	}

	// Withdraw and burn the reward
	function burnToken() external {
	  masterChef.withdraw(poolId, 0);
	  uint256 balance = ERC20(rewardToken).balanceOf(address(this));
	  IBurnable(rewardToken).burn(balance);
	}
}