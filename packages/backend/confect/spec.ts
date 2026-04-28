import { Spec } from "@confect/core";

import { health } from "./health.spec";
import { locations } from "./locations.spec";
import { osm } from "./osm.spec";
import { species } from "./species.spec";
import { trees } from "./trees.spec";

export default Spec.make()
    .add(health)
    .add(locations)
    .add(species)
    .add(trees)
    .add(osm);
