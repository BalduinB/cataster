import { CronJob, CronJobs } from "@confect/server";
import { Cron } from "effect";

import refs from "./_generated/refs";

const dailyAtTwoAm = Cron.unsafeParse("0 2 * * *");

export default CronJobs.make().add(
  CronJob.make(
    "recompute next tree controls",
    dailyAtTwoAm,
    refs.internal.trees.recomputeNextControlDates,
    {},
  ),
);
