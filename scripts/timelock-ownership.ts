import { ethers, network } from "hardhat";

import { BigNumber } from "@ethersproject/bignumber";
import { Interface } from "ethers/lib/utils";

const devTeam = "0x9d687619DE58580270a992332252479aF5dbbe10";
const env = network.name;
const addresses = require(`../addresses-${env}.json`);

const getTimelock = async () => {
  const timelockFactory = await ethers.getContractFactory("TimelockController");
  return timelockFactory.attach(addresses.timelock);
};

async function main() {
  // transfer timelock ownership to the multisig
  const [owner] = await ethers.getSigners();
  const timelock = await getTimelock();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();
  if (!adminRole) {
    console.error("error");
    return;
  }
  await timelock.grantRole(adminRole, devTeam);
  await timelock.revokeRole(adminRole, owner.address);

  //  const indexPoolFactory = await ethers.getContractFactory("IndexPool", {
  //    libraries: {
  //      PancakeswapUtilities: addresses.pancakeUtilities,
  //    },
  //  });
  //  const LI = await indexPoolFactory.attach(addresses.LI);
  //  await LI.transferOwnership(timelock.address);
  //  const DBI = await indexPoolFactory.attach(addresses.DBI);
  //  await DBI.transferOwnership(timelock.address);

  console.log("done");
}

const getAdminRole = async () => {
  const timelock = await getTimelock();
  return timelock.TIMELOCK_ADMIN_ROLE();
};

const getProposerRole = async () => {
  const timelock = await getTimelock();
  return timelock.PROPOSER_ROLE();
};

const getExecutorRole = async () => {
  const timelock = await getTimelock();
  return timelock.EXECUTOR_ROLE();
};

const getGrantProposerRoleCallData = async (account: string) => {
  const adminRole = await getAdminRole();
  const abi = ["function grantRole(bytes32, address)"];
  const iface = new Interface(abi);
  return iface.encodeFunctionData("grantRole", [adminRole, account]);
};

const grantProposerExecuterRole = async () => {
  const timelock = await getTimelock();
  const proposerRole = await getProposerRole();
  const executorRole = await getExecutorRole();
  await timelock.grantRole(proposerRole, devTeam);
  await timelock.grantRole(executorRole, devTeam);
  return "done";
};

const getChangeTimelockCalldata = (newDelay: number) => {
  const abi = ["function updateDelay(uint256)"];
  const iface = new Interface(abi);

  return iface.encodeFunctionData("updateDelay", [newDelay]);
};

const setTimelockDuration = async (duration: number) => {
  const TimelockControllerFactory = await ethers.getContractFactory(
    "TimelockController"
  );
  const timelock = TimelockControllerFactory.attach(addresses.timelock);
  console.log("scheduling...");

  await timelock.schedule(
    addresses.timelock,
    0,
    getChangeTimelockCalldata(duration),
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    30
  );
  console.log("Scheduled.");
};

const executeSetTimelockDuration = async (duration: number) => {
  const timelock = await getTimelock();
  const tx = await timelock.execute(
    addresses.timelock,
    0,
    getChangeTimelockCalldata(duration),
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  await tx.wait();
};

const revokeAdminRole = async (account: string) => {
  const timelock = await getTimelock();
  const adminRole = await getAdminRole();
  await timelock.revokeRole(adminRole, account);
};

revokeAdminRole("0x6DeBA0F8aB4891632fB8d381B27eceC7f7743A14");
