import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { abi } from "../constants/abis";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useSnackbar } from "react-simple-snackbar";
//merkle tree param
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const tokens = require("../constants/tokens.json");

export const injected = new InjectedConnector();

export default function Home() {
  const [openSnackbar, closeSnackbar] = useSnackbar();
  const [hasMetamask, setHasMetamask] = useState(false);
  const [amount, setAmount] = useState(1);
  const [verified, setVerified] = useState(false);
  const [proofs, setProof] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [PersonalAmount, setPersonalAmount] = useState(0);
  const [claimed, setClaimed] = useState("");

  const contractAddress = "0x665cb2100139417Bdf49A2b410DB842615baA167";

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
      //    inWL();
    }
  });

  const {
    active,
    activate,
    chainId,
    account,
    onChangeAccount,
    library: provider,
  } = useWeb3React();

  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await activate(injected);
        setHasMetamask(true);
      } catch (e) {
        console.log(e);
      }
    }
  }

  async function inWL() {
    if (active) {
      //get address wl
      let tab = [];
      tokens.map((token) => {
        tab.push(token.address);
      });
      const leaves = tab.map((addr) => keccak256(addr));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getRoot().toString("hex");
      const leaf = keccak256(account);
      const proof = tree.getHexProof(leaf);
      console.log("root:", "0x" + root); //0x8bef28f0ac54da10614be726622f54ce02e3736d8f100ee126f3bfed268ef0ef
      // console.log("proof:", proof); // true
      setProof(proof);
      setVerified(tree.verify(proof, leaf, root));
      console.log("verified?", tree.verify(proof, leaf, root)); // true
    }
  }

  useEffect(() => {
    if (active) {
      inWL();
    }
  }, [active]);

  async function execute() {
    if (active) {
      const signer = provider.getSigner();
      // const contractAddress = "0x10C33D5E79d3e76d099247aBb72B6d6C3c3c24B5";
      const contract = new ethers.Contract(contractAddress, abi, signer);

      //open to public
      const paused = await contract.paused();
      const whitelistMintEnabled = await contract.whitelistMintEnabled();

      try {
        if (verified && paused == true && whitelistMintEnabled == true) {
          let sym = await contract.whitelistMint(amount, proofs, {
            value: await contract.cost(),
          });
          console.log(sym);
        } else if (paused == false) {
          let sym = await contract.mint(amount, {
            value: await contract.cost(),
          });
          console.log(sym);
        }
      } catch (error) {
        openSnackbar(error.message);
        console.log(error);
      }
    } else {
      console.log("Please install MetaMask");
    }
  }

  const decrementMintAmount = () => {
    let newMintAmount = amount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = amount + 1;
    if (newMintAmount > 5) {
      newMintAmount = 5;
    }
    setAmount(newMintAmount);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mouth Breathers Claiming dapp</title>
        <meta name="description" content="Mouth Breathers Dapp Nft claim" />
      </Head>

      <main className={styles.main}>
        <Image src="/logo.png" alt="Mouth Logo" width={1920} height={605} />
        <h1 className={styles.title}>A BREATH OF FRESH RARE</h1>
        <p>Mint Price (0.1 ETH + Gas).</p>
        <p>Maximum of 5 Mouth Breathers per transaction.</p>
        <div className={styles.grid}>
          {/* <div className={styles.card}> */}
          {hasMetamask ? (
            active ? (
              <section>
                <button
                  className={styles.sidebtn}
                  onClick={() => decrementMintAmount()}
                >
                  -
                </button>
                <button
                  className={styles.btn}
                  onClick={() => execute()}
                >
                  {" "}
                  Mint {amount}
                </button>
                <button
                  className={styles.sidebtn}
                  onClick={() => incrementMintAmount()}
                >
                  +
                </button>
              </section>
            ) : (
              <button className={styles.btn} onClick={() => connect()}>
                CONNECT
              </button>
            )
          ) : (
            "Install Metamask"
          )}
        </div>
        {/* </div> */}
      </main>
    </div>
  );
}
