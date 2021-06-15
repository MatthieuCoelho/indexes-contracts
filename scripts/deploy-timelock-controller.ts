import { ethers } from "hardhat";

const main = async () => {
  const timelockFactory = await ethers.getContractFactory("TimelockController");
  const [multisigWallet] = await ethers.getSigners();
  return timelockFactory.deploy(
    //    24 * 3600,
    30,
    [multisigWallet.address],
    [multisigWallet.address]
  );
};

main();

export default main;
