const figlet = require("figlet");
const fs = require("fs");
const inquirer = require("inquirer");
const os = require("os");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const secretKey = process.env.SECRET_KEY;
const filePath = process.pkg
  ? path.join(os.tmpdir(), "wallets.json")
  : path.resolve(__dirname, "../wallets.json");

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
    return JSON.parse(fs.readFileSync(filePath, "utf8")) || [];
  } catch (_) {
    return [];
  }
};

const saveEncryptedWallet = async (wallet) => {
  const encryptedWallets = await readEncryptedWallets();
  const encryptedWallet = await wallet.encrypt(secretKey);
  encryptedWallets.push(JSON.parse(encryptedWallet));
  const data = JSON.stringify(encryptedWallets, null, 2);
  fs.writeFileSync(filePath, data);
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
  } while (!filter(wallet));

  await saveEncryptedWallet(wallet);

  console.log("\n-----------------------------------");
  console.log("⚡ Address:", wallet.address);
  console.log("⚡ Mnemonic:", wallet.mnemonic.phrase);
  console.log("⚡ Private Key:", wallet.privateKey);
  console.log("-----------------------------------\n");
};

const generateWalletWithSameCharacter = async (length, type) => {
  const message = `MENCARI WALLET DENGAN PANJANG KARAKTER CANTIK DI ${
    type === 1
      ? "AWAL"
      : type === 2
      ? "AKHIR"
      : type === 3
      ? "AWAL ATAU AKHIR"
      : "AWAL DAN AKHIR"
  } >= (${length})`;

  const filter = (wallet) => {
    const isPrefixCantik = isAllCharactersSame(
      wallet.address.substring(2, 2 + length)
    );
    const isSuffixCantik = isAllCharactersSame(
      wallet.address.substring(wallet.address.length - length)
    );
    if (type === 1) return isPrefixCantik;
    if (type === 2) return isSuffixCantik;
    if (type === 3) return isPrefixCantik || isSuffixCantik;
    return isPrefixCantik && isSuffixCantik;
  };

  await generateWalletWithFilter(filter, message);
};

const generateWalletWithPrefixAndSuffix = async (prefix, suffix) => {
  const message = `MENCARI WALLET DENGAN AWALAN (${prefix}) DAN AKHIRAN (${suffix})`;

  const filter = (wallet) => {
    const isSameWithPrefix = wallet.address.slice(2).startsWith(prefix);
    const isSameWithSuffix = wallet.address.endsWith(suffix);
    return isSameWithPrefix && isSameWithSuffix;
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
        { name: "1. Awal", value: 1 },
        { name: "2. Akhir", value: 2 },
        { name: "3. Awal atau Akhir", value: 3 },
        { name: "4. Awal dan Akhir", value: 4 },
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
  const address = encryptedWallets.length
    ? encryptedWallets.map((e, i) => ({
        name: i + 1 + ". 0x" + e.address,
        value: i + 1,
      }))
    : [{ name: "⛔", disabled: "Belum ada wallet." }];

  const answers1 = await prompt([
    {
      type: "list",
      name: "menu",
      message: "Pilih Address:",
      choices: [
        ...address,
        { name: "⬅️ Kembali", value: 0 },
        { name: "Github:", disabled: "https://github.com/baguspangestu" },
      ],
    },
  ]);

  if (answers1.menu === 0) return;

  const answers2 = await prompt([
    {
      type: "list",
      name: "menu",
      message: "Opsi:",
      choices: [
        { name: "1. Lihat", value: 1 },
        { name: "2. Hapus", value: 2 },
        { name: "⬅️ Kembali", value: 0 },
        { name: "Github:", disabled: "https://github.com/baguspangestu" },
      ],
    },
  ]);

  if (answers2.menu === 1) {
    const wallet = await ethers.Wallet.fromEncryptedJson(
      JSON.stringify(encryptedWallets[answers1.menu - 1], null, 2),
      secretKey
    );

    console.log("\n-----------------------------------");
    console.log("⚡ Address:", wallet.address);
    console.log("⚡ Mnemonic:", wallet.mnemonic.phrase);
    console.log("⚡ Private Key:", wallet.privateKey);
    console.log("-----------------------------------\n");
  } else if (answers2.menu === 2) {
    const answers3 = await prompt([
      {
        type: "list",
        name: "menu",
        message: "Yakin ingin menghapus Wallet ini?",
        choices: [
          { name: "1. Batal", value: 1 },
          { name: "2. Yakin", value: 2 },
        ],
      },
    ]);

    if (answers3.menu === 2) {
      encryptedWallets.splice([answers1.menu - 1], 1);
      const data = JSON.stringify(encryptedWallets, null, 2);
      fs.writeFileSync(filePath, data);
      console.log("\n-----------------------------------");
      console.log("✔️ Berhasil menghapus wallet.");
      console.log("-----------------------------------\n");
    }
  }

  await myWallets();
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
