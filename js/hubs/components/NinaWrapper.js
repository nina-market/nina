import React from "react";
import {
  AudioPlayerContextProvider,
} from "@nina-protocol/nina-sdk/esm/contexts/Audio/Audio";
import {
  ReleaseContextProvider,
} from "@nina-protocol/nina-sdk/esm/contexts/Release/Release";
import {
  HubContextProvider,
} from "@nina-protocol/nina-sdk/esm/contexts/Hub/Hub";
import {
  NinaContextProvider,
} from "@nina-protocol/nina-sdk/esm/contexts/Nina/Nina";
import NinaClient from "@nina-protocol/nina-sdk/esm/client"
import { AnchorProvider } from "@project-serum/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
const NinaWrapper = ({ children, network }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'processed',
  })

  const ninaClient = NinaClient(provider, network);
  console.log('ninaClient: ', ninaClient)
  console.log('AudioPlayerContextProvider: ', AudioPlayerContextProvider)
  return (
    <NinaContextProvider ninaClient={ninaClient}>
      <ReleaseContextProvider>
        <AudioPlayerContextProvider>
          <HubContextProvider>{children}</HubContextProvider>
        </AudioPlayerContextProvider>
      </ReleaseContextProvider>
    </NinaContextProvider>
  );
};

export default NinaWrapper;
