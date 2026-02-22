// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { CounterSimulator } from "./counter-simulator.js";

setNetworkId(NetworkId.Undeployed);

describe("Anchor circuit", () => {
  it("updates lastAnchor and increments round", () => {
    const simulator = new CounterSimulator();
    const before = simulator.getLedger();
    expect(before.round).toEqual(0n);
    // 0x… を Field として渡す（bigint 化）
    const hashField = BigInt("0x1234");
    const after = simulator.anchor(hashField);
    expect(after.round).toEqual(1n);
    expect(after.lastAnchor).toEqual(hashField);
  });
});
