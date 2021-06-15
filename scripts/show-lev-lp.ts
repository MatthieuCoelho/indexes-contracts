import { ethers } from "hardhat";
import { network } from "hardhat";

const main = async () => {
  const env = network.name;
  const addresses = require(`../addresses-${env}.json`);
  const pair = await ethers.getContractAt(
    "IUniswapV2Pair",
    "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b"
  );
  const reserves = await pair.getReserves();
  console.log(reserves[0].toString(), reserves[1].toString());
};

main();
