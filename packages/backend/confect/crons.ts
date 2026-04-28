import { CronJob, CronJobs } from "@confect/server";
import { Cron } from "effect";

import refs from "./_generated/refs";

const dailyAtTwoAm = Cron.unsafeParse("0 2 * * *");

/**
 * Runs every minute to keep system species (`species.orgId === null`) in
 * sync with the `DEFAULT_SPECIES` constant. The mutation is idempotent —
 * the `(orgId=null, botanicalName)` index makes lookups O(1) and patches
 * are no-ops when nothing changed — so this is effectively a "deploy-time
 * init" check that also self-heals if a row is ever lost.
 *
 * Removing entries from `DEFAULT_SPECIES` does **not** delete the
 * corresponding rows; system catalog deletions are an explicit operation.
 */
const hourly = Cron.unsafeParse("0 * * * *");

const dailyCrons = CronJobs.make().add(
  CronJob.make(
    "recompute next tree controls",
    dailyAtTwoAm,
    refs.internal.trees.recomputeNextControlDates,
    {},
  ),
);

export default dailyCrons.add(
  CronJob.make(
    "seed system species",
    hourly,
    refs.internal.species.seedDefaults,
    {},
  ),
);
