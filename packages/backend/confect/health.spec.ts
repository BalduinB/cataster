import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

const ping = FunctionSpec.publicQuery({
  name: "ping",
  args: Schema.Struct({}),
  returns: Schema.Struct({
    ok: Schema.Literal(true),
    now: Schema.Number,
  }),
});

export const health = GroupSpec.make("health").addFunction(ping);
