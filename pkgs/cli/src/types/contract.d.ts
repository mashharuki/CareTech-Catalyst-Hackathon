declare module 'contract' {
  export type CounterPrivateState = {
    privateCounter: number;
  };

  export const witnesses: unknown;

  export const Counter: {
    ledger: (data: unknown) => { round: bigint };
    Contract: new (witnessesInput: unknown) => {
      callTx: {
        increment: () => Promise<unknown>;
      };
    };
  };
}
