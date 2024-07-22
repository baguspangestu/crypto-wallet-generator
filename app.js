const figlet = require("figlet");
const fs = require("fs").promises;
const inquirer = require("inquirer");
const { ethers } = require("ethers");
require("dotenv").config();

const secretKey = process.env.SECRET_KEY;
const filePath = "wallets.json";

const prompt = inquirer.createPromptModule();

const title = async (text) => {
  await figlet(text, { font: "Big" }, (err, data) => {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
  });
};

const isAllCharactersSame = (str) => new Set(str).size <= 1;

const readEncryptedWallets = async () => {
  try {
    const file = await fs.readFile(filePath, "utf8");
    return JSON.parse(file) || [];
  } catch (err) {
    return [];
  }
};

const saveEncryptedWallet = async (wallet) => {
  const encryptedWallets = await readEncryptedWallets();
  const encryptedWallet = await wallet.encrypt(secretKey);
  encryptedWallets.push(JSON.parse(encryptedWallet));
  await fs.writeFile(filePath, JSON.stringify(encryptedWallets, null, 2));
};

const generateWalletWithFilter = async (filter, message) => {
  let wallet;
  let attempts = 0;
  const startTime = Date.now();

  console.log("");
  console.log(message);

  do {
    wallet = ethers.Wallet.createRandom();
    const time = ((Date.now() - startTime) / 1000).toFixed(2);
    process.stdout.write(
      `\r🔥 Attempts: ${++attempts}x, Time: ${time}s -> ${wallet.address}`
    );
  } while (filter(wallet));

  await saveEncryptedWallet(wallet);

  console.log("\n-----------------------------------");
  console.log("⚡ Address:", wallet.address);
  console.log("⚡ Mnemonic:", wallet.mnemonic.phrase);
  console.log("⚡ Private Key:", wallet.privateKey);
  console.log("-----------------------------------\n");
};

const generateWalletWithSameCharacter = async (length, type) => {
  const message = `MENCARI WALLET DENGAN PANJANG KARAKTER CANTIK DI AWAL ${
    type === 1 ? "ATAU" : "DAN"
  } AKHIR >= (${length})`;

  const filter = (wallet) => {
    const isPrefixCantik = isAllCharactersSame(
      wallet.address.substring(2, 2 + length)
    );
    const isSuffixCantik = isAllCharactersSame(
      wallet.address.substring(wallet.address.length - length)
    );
    if (type === 1) return !(isPrefixCantik || isSuffixCantik);
    return !(isPrefixCantik && isSuffixCantik);
  };

  await generateWalletWithFilter(filter, message);
};

const generateWalletWithPrefixAndSuffix = async (prefix, suffix) => {
  const message = `MENCARI WALLET DENGAN AWALAN (${prefix}) DAN AKHIRAN (${suffix})`;

  const filter = (wallet) => {
    const isSameWithPrefix = wallet.address.slice(2).startsWith(prefix);
    const isSameWithSuffix = wallet.address.endsWith(suffix);
    return !(isSameWithPrefix && isSameWithSuffix);
  };

  await generateWalletWithFilter(filter, message);
};

const generateWalletCantik = async () => {
  const answers = await prompt([
    {
      type: "number",
      name: "length",
      message: "Panjang Karakter Cantik:",
    },
    {
      type: "list",
      name: "type",
      message: "Tipe Pencarian:",
      choices: [
        { name: "1. Awal atau Akhir", value: 1 },
        { name: "2. Awal dan Akhir", value: 2 },
      ],
    },
  ]);

  await generateWalletWithSameCharacter(answers.length || 1, answers.type || 1);
};

const generateWalletCustom = async () => {
  const answers = await prompt([
    {
      type: "input",
      name: "prefix",
      message: "Masukan Awalan:",
    },
    {
      type: "input",
      name: "suffix",
      message: "Masukan Akhiran:",
    },
  ]);

  await generateWalletWithPrefixAndSuffix(
    answers.prefix || "",
    answers.suffix || ""
  );
};

const myWallets = async () => {
  const encryptedWallets = await readEncryptedWallets();

  if (!encryptedWallets.length) {
    console.log("\n-----------------------------------");
    console.log("⛔ Belum ada wallet");
    console.log("-----------------------------------\n");
    return;
  }

  for (let index = 0; index < encryptedWallets.length; index++) {
    const encryptedWallet = encryptedWallets[index];
    const wallet = await ethers.Wallet.fromEncryptedJson(
      JSON.stringify(encryptedWallet, null, 2),
      secretKey
    );

    if (index === 0) console.log("\n-----------------------------------");
    console.log("⚡ Address:", wallet.address);
    console.log("⚡ Mnemonic:", wallet.mnemonic.phrase);
    console.log("⚡ Private Key:", wallet.privateKey);
    console.log(
      `-----------------------------------${
        index === encryptedWallets.length - 1 ? "\n" : ""
      }`
    );
  }
};

const generateWallet = async () => {
  const answers = await prompt([
    {
      type: "list",
      name: "menu",
      message: "Generate Wallet:",
      choices: [
        { name: "1. Wallet Cantik", value: 1 },
        { name: "2. Wallet Custom", value: 2 },
        { name: "⬅️ Kembali", value: 0 },
        { name: "Github:", disabled: "https://github.com/baguspangestu" },
      ],
    },
  ]);

  if (answers.menu === 1) {
    await generateWalletCantik();
  } else if (answers.menu === 2) {
    await generateWalletCustom();
  }
};

const mainMenu = async () => {
  try {
    const answers = await prompt([
      {
        type: "list",
        name: "menu",
        message: "Silakan pilih menu:",
        choices: [
          { name: "1. Daftar Walletku", value: 1 },
          { name: "2. Generate Wallet", value: 2 },
          { name: "✖️ Tutup", value: 0 },
          { name: "Github:", disabled: "https://github.com/baguspangestu" },
        ],
      },
    ]);

    if (answers.menu === 1) {
      await myWallets();
      await mainMenu();
    } else if (answers.menu === 2) {
      await generateWallet();
      await mainMenu();
    } else {
      process.exit(0);
    }
  } catch (_) {
    process.exit(0);
  }
};

(async () => {
  console.clear();
  await title("Crypto Wallet Generator");
  console.log("");
  await mainMenu();
})();
