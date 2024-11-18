import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE, DogContext, Result } from '@/canisters/bone_dog/bone_dog.did';
import { idlFactory } from '@/canisters/bone_dog/bone_dog.did';
export let canisterId: string;
if (process.env.CANISTER_ID_BONE_DOG) {
  canisterId = process.env.CANISTER_ID_BONE_DOG;
  // console.log(canisterId);
} else if (process.env.BONE_DOG_CANISTER_ID) {
  canisterId = process.env.BONE_DOG_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function dog_info(canisterIdparams?: string): Promise<DogContext> {
  let Actor: _SERVICE;
  if (canisterIdparams) {
    Actor = await createWalletActor(canisterIdparams, idlFactory);
  } else {
    Actor = await createWalletActor(canisterId, idlFactory);
  }
  return Actor.dog_info();
}
export async function cycles(canisterIdparams?: string): Promise<bigint> {
  let Actor: _SERVICE;
  if (canisterIdparams) {
    Actor = await createActor(canisterIdparams, idlFactory);
  } else {
    Actor = await createActor(canisterId, idlFactory);
  }
  return Actor.cycles();
}
