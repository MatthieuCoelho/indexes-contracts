import { ethers, network } from "hardhat";

import { Interface } from "@ethersproject/abi";
import fs from "fs";

const env = network.name;
const addrs = require(`../addresses-${env}.json`);

const getTimelock = async () => {
  const TimelockControllerFactory = await ethers.getContractFactory(
    "TimelockController"
  );
  return TimelockControllerFactory.attach(addrs.timelock);
};

const getBurnerStaker = async () => {
  const burnerStakerFactory = await ethers.getContractFactory("BurnerStaker");
  return burnerStakerFactory.attach(addrs.burnerStaker);
};

const deployBurnerStaker = async () => {
  const burnerStakerFactory = await ethers.getContractFactory("BurnerStaker");
  const burnerStaker = await burnerStakerFactory.deploy();
  return burnerStaker.address;
};

const getAddStakingPoolCallData = (token: string, weight: number) => {
  const abi = ["function add(uint256, address, bool)"];
  const iface = new Interface(abi);

  return iface.encodeFunctionData("add", [weight, token, true]);
};

const getSetWeightCallData = (poolId: number, weight: number) => {
  const abi = ["function set(uint256, uint256, bool)"];
  const iface = new Interface(abi);

  return iface.encodeFunctionData("set", [poolId, weight, true]);
};

const deployAndSchedule = async () => {
  const burnerStaker = await deployBurnerStaker();

  addrs.burnerStaker = burnerStaker;
  console.log(addrs);
  fs.writeFileSync(`addresses-${env}.json`, JSON.stringify(addrs, null, 2));

  const timelock = await getTimelock();

  console.log("deployed burner. Scheduling...");
  await timelock.schedule(
    addrs.masterChef,
    0,
    getAddStakingPoolCallData(burnerStaker, 7000),
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    30
  );
};

const execute = async () => {
  console.log("lets execute");
  //const timelock = await getTimelock();
  //await timelock.execute(
  //  addrs.masterChef,
  //  0,
  //  getAddStakingPoolCallData(addrs.burnerStaker, 7000),
  //  "0x0000000000000000000000000000000000000000000000000000000000000000",
  //  "0x0000000000000000000000000000000000000000000000000000000000000000"
  //);

  const burnerStaker = await getBurnerStaker();
  await burnerStaker.stake(addrs.masterChef, 6, addrs.tokens.LEV);
  console.log("done");
};

const burn = async () => {
  const burner = await getBurnerStaker();
  await burner.burnToken();
};

const setPoolWeightSchedule = async () => {
  const timelock = await getTimelock();

  await timelock.schedule(
    addrs.masterChef,
    0,
    getSetWeightCallData(6, 0),
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    30
  );
};

const setPoolWeightExecute = async () => {
  const timelock = await getTimelock();

  await timelock.execute(
    addrs.masterChef,
    0,
    getSetWeightCallData(6, 0),
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
};

const main = async () => {
  // deployAndSchedule();
  // execute();
  // burn();

  // setPoolWeightSchedule();
  setPoolWeightExecute();
};

main();
