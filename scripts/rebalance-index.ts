import * as R from "ramda";

import { ethers, network } from "hardhat";

import { computeTargetWeights } from "./calculate-weights";
import { expandTo18Decimals } from "../test/utils";
import { getPancakeRouter } from "../test/pancakeswap";
import { indexesDesc } from "./deploy-index";

const env = network.name;
const addrs = require(`../addresses-${env}.json`);

const rebalance = async (indexAddress: string) => {
  const indexFactory = await ethers.getContractFactory("IndexPool", {
    libraries: {
      PancakeswapUtilities: addrs.pancakeUtilities,
    },
  });
  const index = indexFactory.attach(indexAddress);
  const composition = await index.getComposition();

  const symbol = (await index.symbol()) as "LI" | "DBI" | "SI";
  const indexDesc = indexesDesc[symbol];
  const router = await getPancakeRouter(addrs.pancakeRouter);

  if (false && network.name === "localhost") {
    console.log("buy the index");
    const tx = await index.buyIndex(expandTo18Decimals(2).div(100), {
      value: expandTo18Decimals(1).div(10),
    });
    await tx.wait();
  }
  // console.log("calculating taget weights...");
  // let newWeights = await computeTargetWeights(
  //   indexDesc.underlyingTokens,
  //   indexDesc.weights,
  //   router,
  //   addrs.tokens.WBNB,
  //   addrs.tokens.BUSD
  // );
  //newWeights = newWeights.map((w) => Math.round(w * 2.9));
  //  const newWeights = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

  console.log("composition:", composition);

  //  newWeights[0] *= 0.99;

  const weights = composition[1];
  let newWeights: number[] = [];
  newWeights.push(weights[0]);
  newWeights.push(weights[1]);
  newWeights.push(weights[2]);
  newWeights[0] += 2;
  newWeights[1] -= 2;

  console.log("try with weights", newWeights);
  console.log("sum", R.sum(newWeights));
  //newWeights = newWeights.map((w) => (w >= 2 ** 16 ? (w = 2 ^ 16) : w));
  //newWeights = newWeights.map((w) => Math.floor(w * 0.7));
  //newWeights = newWeights.map((w, index) =>
  //  w > prevWeights[index] ? (w = prevWeights[index]) : w
  //);

  try {
    const tx = await index.changeWeights(newWeights, { gasLimit: 1000000 });
    console.log("waiting for tx...", tx.hash);
    await tx.wait();
  } catch (err) {
    console.log("didnt work", err.message);
  }
};

rebalance(addrs.SI);
