import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

const ping = FunctionSpec.publicQuery({
    name: "ping",
    args: () => Schema.Struct({}),
    returns: () =>
        Schema.Struct({
            ok: Schema.Literal(true),
            now: Schema.Number,
        }),
});

export default GroupSpec.make().addFunction(ping);
