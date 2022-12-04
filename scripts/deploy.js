const main = async () => {
  const domainContractFactory = await hre.ethers.getContractFactory("Domains");
  const domainContract = await domainContractFactory.deploy("ac");
  await domainContract.deployed();

  console.log("Contract deployed to:", domainContract.address);

  let txn = await domainContract.register("ezio", {
    value: hre.ethers.utils.parseEther("0.1"),
  });
  await txn.wait();
  console.log("Minted domain ezio.ac");

  txn = await domainContract.setRecord(
    "ezio",
    "Nothing Is True, Everything Is Permitted."
  );
  await txn.wait();
  console.log("Set record for ezio.ac");

  const address = await domainContract.getAddress("ezio");
  console.log("Owner of domain ezio:", address);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
