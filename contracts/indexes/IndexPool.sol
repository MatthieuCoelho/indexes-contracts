//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";
import "contracts/utilities/PancakeswapUtilities.sol";


contract IndexPool is ERC20 {

  uint256 constant POOL_FEES = 1e16; // 1% fees
  address private immutable _indexController;
  IUniswapV2Router02 private _pancakeRouter;
  IUniswapV2Factory private _pancakeFactory;
  ERC20 private immutable _BUSD;
  address[] _underlyingTokens;
  uint256[] _targetWeights;
  uint8[] _categories;


  event Mint(address indexed to, uint amount, uint cost);
  event Burn(address indexed from, uint amount, uint paid);

  constructor(
    string memory name,
    string memory symbol,
    address[] memory underlyingTokens,
    uint256[] memory targetWeights,
    address BUSD,
    address router,
    address indexController,
    uint8[] memory categories
  ) ERC20(name, symbol) {
    require(targetWeights.length == underlyingTokens.length, "Tokens and weights don't have same sizes");
    require(underlyingTokens.length >= 2, "At least 2 underlying tokens are needed");

    _underlyingTokens = underlyingTokens;
    _BUSD = ERC20(BUSD);
    _pancakeRouter = IUniswapV2Router02(router);
    _pancakeFactory = IUniswapV2Factory(_pancakeRouter.factory());
    _targetWeights = targetWeights;
    _indexController = indexController;
    _categories = categories;
  }

  function mint(uint256 BUSDIn, uint256 minAmountOut) public {
    _BUSD.transferFrom(msg.sender, address(this), BUSDIn);

    uint256 totalTokensBought = 0;
    uint256 totalSpent = 0;
    for (uint i = 0; i < _underlyingTokens.length; i++) {
      (uint256 boughtAmount, uint256 spent) = PancakeswapUtilities.buyToken(
        address(_BUSD),
        _underlyingTokens[i],
        address(this),
        minAmountOut * _targetWeights[i],
        _pancakeRouter);

      totalTokensBought += boughtAmount;
      totalSpent += spent;
    }

    uint256 amountOut = totalTokensBought / _sum(_targetWeights);
    totalSpent += _collectFee(totalSpent);

    // refund the extra BUSD
    _BUSD.transfer(msg.sender, BUSDIn - totalSpent);

    _mint(msg.sender, amountOut);
    emit Mint(msg.sender, amountOut, totalSpent);
  }

  function burn(uint256 amount) public {
    require(amount <= balanceOf(msg.sender), "Insufficient balance");

    uint256 totalTokensSold = 0;
    uint256 amountToPayUser = 0;

    for (uint i = 0; i < _underlyingTokens.length; i++) {
      uint256 sellAmount = (amount * _targetWeights[i]);
      (uint256 amountOut, uint256 amountIn) = PancakeswapUtilities.sellToken(
        _underlyingTokens[i],
        address(_BUSD),
        address(this),
        sellAmount,
        _pancakeRouter
      );

      totalTokensSold += amountIn;
      amountToPayUser += amountOut;
    }
    uint256 amountToBurn = totalTokensSold / _sum(_targetWeights);
    amountToPayUser -= _collectFee(amountToPayUser);
    _BUSD.transfer(msg.sender, amountToPayUser);

    _burn(msg.sender, amountToBurn);
    emit Burn(msg.sender, amountToBurn, amountToPayUser);
  }

  function getPoolPriceBUSD() public view returns (uint256) {
    uint256 total = 0;
    for (uint256 i = 0; i < _underlyingTokens.length; i++) {
      total += getTokenPriceBUSD(_underlyingTokens[i]) * _targetWeights[i];
    }
    return total;
  }

  function getTokenPriceBUSD(address token) public view returns (uint256) {
    address pairBUSDAddr = _pancakeFactory.getPair(address(_BUSD), token);
    require(pairBUSDAddr != address(0), "Cannot find pair BUSD-token");
    IUniswapV2Pair pairBUSD = IUniswapV2Pair(pairBUSDAddr);
    (uint reserveBUSD, uint reserveToken) = PancakeswapUtilities.getReservesOrdered(pairBUSD, address(_BUSD), token);
    return _pancakeRouter.quote(1e18, reserveToken, reserveBUSD);
  }

  function _sum(uint256[] memory items) private pure returns (uint256) {
    uint256 total = 0;
    for (uint i = 0; i < items.length; i++) {
      total += items[i];
    }
    return total;
  }

  function _collectFee(uint256 amount) private returns(uint256) {
    uint256 fee = (amount * POOL_FEES) / 1e18;
    _BUSD.transfer(_indexController, fee);
    return fee;
  }
}
