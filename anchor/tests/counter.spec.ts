import { BankrunProvider} from "anchor-bankrun";
import {startAnchor} from "solana-bankrun";
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import {Voting} from '../target/types/voting';

const IDL = require('../target/idl/voting.json');
const votingAddress = new PublicKey("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

describe('voting', () => {

  let context;
  let provider;
  let votingProgram;

  beforeAll(async() => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "Which is your favourite Blockchain?",
      new  anchor.BN(0),
      new anchor.BN(1821246880),
    ).rpc();

    //Grab the Poll account Address
    const [pollAddress] = PublicKey.findProgramAddressSync(
      //This is how we grab the buffer from u64
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      //Program Address
      votingAddress,
    )

    //Fetch the Poll Account off this address
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    //Printing the poll account
    console.log(poll);

    //Checking the poll id is equal to 1 or not.
    expect(poll.pollId.toNumber()).toEqual(1);

    //checking the Description
    expect(poll.description).toEqual("Which is your favourite Blockchain?");

    //Check poll start is less than Poll Empty
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("initialize candidate", async() => {
    await votingProgram.methods.initializeCandidate(
      "SOLANA",
      new anchor.BN(1),
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "ETHEREUM",
      new anchor.BN(1),
    ).rpc();

    const [EthereumAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le',8), Buffer.from("ETHEREUM")],
      votingAddress
    );
  
    const EthereumCandidate = await votingProgram.account.candidate.fetch(EthereumAddress);
    console.log(EthereumCandidate);
    expect(EthereumCandidate.candidateVotes.toNumber()).toEqual(0);


    const [SolanaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le',8), Buffer.from("SOLANA")],
      votingAddress
    );
  
    const SolanaCandidate = await votingProgram.account.candidate.fetch(SolanaAddress);
    console.log(SolanaCandidate);
    expect(SolanaCandidate.candidateVotes.toNumber()).toEqual(0);
  })


  //Testing the Voting Contract
  it("vote",async() => {
    await votingProgram.methods
      .vote("SOLANA",
        new anchor.BN(1)
      ).rpc()

      const [SolanaAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le',8), Buffer.from("SOLANA")],
        votingAddress
      );
        
    const SolanaCandidate = await votingProgram.account.candidate.fetch(SolanaAddress);
    console.log(SolanaCandidate);
    expect(SolanaCandidate.candidateVotes.toNumber()).toEqual(1);

  });

});
