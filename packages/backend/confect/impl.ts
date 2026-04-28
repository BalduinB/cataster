import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { health } from "./health.impl";
import { locations } from "./locations.impl";
import { osm } from "./osm.impl";
import { species } from "./species.impl";
import { trees } from "./trees.impl";

export default Impl.make(api).pipe(
  Layer.provide(health),
  Layer.provide(locations),
  Layer.provide(species),
  Layer.provide(trees),
  Layer.provide(osm),
  Impl.finalize,
);
