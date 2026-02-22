declare module "contract" {
  import type * as __compactRuntime from "@midnight-ntwrk/compact-runtime";

  export namespace Counter {
    export type Witnesses<T> = {};
    export type ImpureCircuits<T> = {
      increment(
        context: __compactRuntime.CircuitContext<T>,
      ): __compactRuntime.CircuitResults<T, []>;
      anchor(
        context: __compactRuntime.CircuitContext<T>,
        hash_0: bigint,
      ): __compactRuntime.CircuitResults<T, []>;
    };
    export type PureCircuits = {};
    export type Circuits<T> = {
      increment(
        context: __compactRuntime.CircuitContext<T>,
      ): __compactRuntime.CircuitResults<T, []>;
      anchor(
        context: __compactRuntime.CircuitContext<T>,
        hash_0: bigint,
      ): __compactRuntime.CircuitResults<T, []>;
    };
    export type Ledger = {
      readonly round: bigint;
      readonly lastAnchor: bigint;
    };
    export type ContractReferenceLocations = any;
    export class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
      witnesses: W;
      circuits: Circuits<T>;
      impureCircuits: ImpureCircuits<T>;
      constructor(witnesses: W);
      initialState(
        context: __compactRuntime.ConstructorContext<T>,
      ): __compactRuntime.ConstructorResult<T>;
    }
    export function ledger(state: __compactRuntime.StateValue): Ledger;
    export const pureCircuits: PureCircuits;
  }

  export type CounterPrivateState = { privateCounter: number };
  export const witnesses: {};
}
