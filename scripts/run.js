const main = async () => {
  const [owner, otherUser] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory("Domains");
  const domainContract = await domainContractFactory.deploy("ac");
  await domainContract.deployed();
  console.log("Contract deployed to: ", domainContract.address);
  console.log("Contract deployed by: ", owner.address);

  let contractBalance = await hre.ethers.provider.getBalance(
    domainContract.address
  );

  console.log(
    "Contract Balance: ",
    hre.ethers.utils.formatEther(contractBalance)
  );

  let txn = await domainContract.register("ezio", {
    value: hre.ethers.utils.parseEther("0.1"),
  });
  await txn.wait();

  await domainContract.getAllNames();

  const domainOwner = await domainContract.getAddress("ezio");
  console.log("Owner of domain:", domainOwner);

  contractBalance = await hre.ethers.provider.getBalance(
    domainContract.address
  );

  console.log(
    "Contract Balance: ",
    hre.ethers.utils.formatEther(contractBalance)
  );

  try {
    txn = await domainContract.connect(otherUser).withdraw();
    await txn.wait();
  } catch (error) {
    console.log("Could not rob contract");
  }

  let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
  console.log(
    "Balance of owner before withdrawal:",
    hre.ethers.utils.formatEther(ownerBalance)
  );

  txn = await domainContract.connect(owner).withdraw();
  await txn.wait();

  // Fetch balance of contract & owner
  contractBalance = await hre.ethers.provider.getBalance(
    domainContract.address
  );
  ownerBalance = await hre.ethers.provider.getBalance(owner.address);

  console.log(
    "Contract balance after withdrawal:",
    hre.ethers.utils.formatEther(contractBalance)
  );
  console.log(
    "Balance of owner after withdrawal:",
    hre.ethers.utils.formatEther(ownerBalance)
  );

  // let secondtxn = await domainContract.register("ezio", {
  //   value: hre.ethers.utils.parseEther("0.1"),
  // });
  // await secondtxn.wait();

  let thirdtxn = await domainContract.register("amunet", {
    value: hre.ethers.utils.parseEther("0.1"),
  });
  await thirdtxn.wait();

  await domainContract.getAllNames();
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
};

runMain();
