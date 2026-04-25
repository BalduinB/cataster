import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { health } from "./health.impl";

export default Impl.make(api).pipe(Layer.provide(health), Impl.finalize);
