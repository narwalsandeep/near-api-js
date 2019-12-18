'use strict';

import sha256 from 'js-sha256';
import BN from 'bn.js';

import { Enum, Assignable } from './utils/enums';
import { serialize, deserialize } from './utils/serialize';
import { KeyType, PublicKey } from './utils/key_pair';
import { Signer } from './signer';

export class FunctionCallPermission extends Assignable {
    allowance?: BN;
    receiverId: string;
    methodNames: String[];
}

export class FullAccessPermission extends Assignable {}

export class AccessKeyPermission extends Enum {
    functionCall: FunctionCallPermission;
    fullAccess: FullAccessPermission;
}

export class AccessKey extends Assignable {
    nonce: number;
    permission: AccessKeyPermission;
}

export function fullAccessKey(): AccessKey {
    if (arguments.length != 0) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected none`);
    }
    return new AccessKey({ nonce: 0, permission: new AccessKeyPermission({fullAccess: new FullAccessPermission({})}) });
}

export function functionCallAccessKey(receiverId: string, methodNames: String[], allowance?: BN): AccessKey {
    return new AccessKey({ nonce: 0, permission: new AccessKeyPermission({functionCall: new FunctionCallPermission({receiverId, allowance, methodNames})})});
}

export class IAction extends Assignable {}

class CreateAccount extends IAction {}
class DeployContract extends IAction { code: Uint8Array; }
class FunctionCall extends IAction { methodName: string; args: Uint8Array; gas: BN; deposit: BN; }
class Transfer extends IAction { deposit: BN; }
class Stake extends IAction { stake: BN; publicKey: PublicKey; }
class AddKey extends IAction { publicKey: PublicKey; accessKey: AccessKey; }
class DeleteKey extends IAction { publicKey: PublicKey; }
class DeleteAccount extends IAction { beneficiaryId: string; }

export function createAccount(): Action {
    if (arguments.length != 0) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected none`);
    }
    return new Action({createAccount: new CreateAccount({}) });
}

export function deployContract(code: Uint8Array): Action {
    if (arguments.length != 1) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected code`);
    }
    return new Action({ deployContract: new DeployContract({code}) });
}

export function functionCall(methodName: string, args: Uint8Array, gas: number, deposit: BN): Action {
    if (arguments.length != 4) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected methodName, args, gas, deposit`);
    }
    return new Action({functionCall: new FunctionCall({methodName, args, gas, deposit }) });
}

export function transfer(deposit: BN): Action {
    if (arguments.length != 1) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected deposit`);
    }
    return new Action({transfer: new Transfer({ deposit }) });
}

export function stake(stake: BN, publicKey: PublicKey): Action {
    if (arguments.length != 2) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected stake and publicKey`);
    }
    return new Action({stake: new Stake({ stake, publicKey }) });
}

export function addKey(publicKey: PublicKey, accessKey: AccessKey): Action {
    if (arguments.length != 2) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected publicKey and accessKey`);
    }
    return new Action({addKey: new AddKey({ publicKey, accessKey}) });
}

export function deleteKey(publicKey: PublicKey): Action {
    if (arguments.length != 1) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected publicKey`);
    }
    return new Action({deleteKey: new DeleteKey({ publicKey }) });
}

export function deleteAccount(beneficiaryId: string): Action {
    if (arguments.length != 1) {
        throw new Error(`Wrong number of arguments ${arguments.length}: expected beneficiaryId`);
    }
    return new Action({deleteAccount: new DeleteAccount({ beneficiaryId }) });
}

class Signature extends Assignable {
    keyType: KeyType;
    data: Uint8Array;
}

export class Transaction extends Assignable {
    signerId: string;
    publicKey: PublicKey;
    nonce: number;
    receiverId: string;
    actions: Action[];
    blockHash: Uint8Array;

    encode(): Uint8Array {
        return serialize(SCHEMA, this);
    }

    static decode(bytes: Buffer): Transaction {
        return deserialize(SCHEMA, Transaction, bytes);
    }
}

export class SignedTransaction extends Assignable {
    transaction: Transaction;
    signature: Signature;

    encode(): Uint8Array {
        return serialize(SCHEMA, this);
    }

    static decode(bytes: Buffer): SignedTransaction {
        return deserialize(SCHEMA, SignedTransaction, bytes);
    }
}

export class Action extends Enum {
    createAccount: CreateAccount;
    deployContract: DeployContract;
    functionCall: FunctionCall;
    transfer: Transfer;
    stake: Stake;
    addKey: AddKey;
    deleteKey: DeleteKey;
    deleteAccount: DeleteAccount;
}

export const SCHEMA = new Map<Function, any>([
    [Signature, {kind: 'struct', fields: [
        ['keyType', 'u8'],
        ['data', [64]]
    ]}],
    [SignedTransaction, {kind: 'struct', fields: [
        ['transaction', Transaction],
        ['signature', Signature]
    ]}],
    [Transaction, { kind: 'struct', fields: [
        ['signerId', 'string'],
        ['publicKey', PublicKey],
        ['nonce', 'u64'],
        ['receiverId', 'string'],
        ['blockHash', [32]],
        ['actions', [Action]]
    ]}],
    [PublicKey, { kind: 'struct', fields: [
        ['keyType', 'u8'],
        ['data', [32]]
    ]}],
    [AccessKey, { kind: 'struct', fields: [
        ['nonce', 'u64'],
        ['permission', AccessKeyPermission],
    ]}],
    [AccessKeyPermission, {kind: 'enum', field: 'enum', values: [
        ['functionCall', FunctionCallPermission],
        ['fullAccess', FullAccessPermission],
    ]}],
    [FunctionCallPermission, {kind: 'struct', fields: [
        ['allowance', {kind: 'option', type: 'u128'}],
        ['receiverId', 'string'],
        ['methodNames', ['string']],
    ]}],
    [FullAccessPermission, {kind: 'struct', fields: []}],
    [Action, {kind: 'enum', field: 'enum', values: [
        ['createAccount', CreateAccount],
        ['deployContract', DeployContract],
        ['functionCall', FunctionCall],
        ['transfer', Transfer],
        ['stake', Stake],
        ['addKey', AddKey],
        ['deleteKey', DeleteKey],
        ['deleteAccount', DeleteAccount],
    ]}],
    [CreateAccount, { kind: 'struct', fields: [] }],
    [DeployContract, { kind: 'struct', fields: [
        ['code', ['u8']]
    ]}],
    [FunctionCall, { kind: 'struct', fields: [
        ['methodName', 'string'],
        ['args', ['u8']],
        ['gas', 'u64'],
        ['deposit', 'u128']
    ]}],
    [Transfer, { kind: 'struct', fields: [
        ['deposit', 'u128']
    ]}],
    [Stake, { kind: 'struct', fields: [
        ['stake', 'u128'],
        ['publicKey', PublicKey]
    ]}],
    [AddKey, { kind: 'struct', fields: [
        ['publicKey', PublicKey],
        ['accessKey', AccessKey]
    ]}],
    [DeleteKey, { kind: 'struct', fields: [
        ['publicKey', PublicKey]
    ]}],
    [DeleteAccount, { kind: 'struct', fields: [
        ['beneficiaryId', 'string']
    ]}],
]);

export function createTransaction(signerId: string, publicKey: PublicKey, receiverId: string, nonce: number, actions: Action[], blockHash: Uint8Array): Transaction {
    return new Transaction({ signerId, publicKey, nonce, receiverId, actions, blockHash });
}

export async function signTransaction(receiverId: string, nonce: number, actions: Action[], blockHash: Uint8Array, signer: Signer, accountId?: string, networkId?: string): Promise<[Uint8Array, SignedTransaction]> {
    const publicKey = await signer.getPublicKey(accountId, networkId);
    const transaction = createTransaction(accountId, publicKey, receiverId, nonce, actions, blockHash);
    const message = serialize(SCHEMA, transaction);
    const hash = new Uint8Array(sha256.sha256.array(message));
    const signature = await signer.signMessage(message, accountId, networkId);
    const signedTx = new SignedTransaction({
        transaction,
        signature: new Signature({ keyType: publicKey.keyType, data: signature.signature })
    });
    return [hash, signedTx];
}
