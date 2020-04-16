import * as k8sclient from "kubernetes-client";
import { promises as fs, watch } from "fs";
import _ from "lodash";
import * as _fp from "lodash/fp";
import { calculateFullHeapSize } from "./useParseCPU";
import fetch from "node-fetch";
const id = new Date().toISOString();

const functionName = "add-memory";
const addMemoryPath = "http://192.168.64.5.nip.io/add_memory";
const csvName = __dirname + "/fill_somefiles.csv";

const client = new k8sclient.Client1_13({
  config: k8sclient.config.fromKubeconfig(),
  version: "1.13"
});

async function restart() {
  await waitForPodToBeOkay();
  await client.api.v1
    .namespaces("default")
    .pods.delete({ qs: { labelSelector: `function=${functionName}` } });
  await waitForPodToBeOkay();
}

async function waitForPodToBeOkay() {
  let health = "",
    watchdog = 0;
  do {
    watchdog++;
    const pod = await client.api.v1
      .namespaces("default")
      .pods.get({ qs: { labelSelector: `function=${functionName}` } });
    if (pod.body.items[0].status.phase !== "Running") {
      await sleep(100);
    } else {
      health = "OK";
    }
  } while (health !== "OK" && watchdog < 10000);
  health = "";
  watchdog = 0;
  do {
    watchdog++;
    try {
      const res = await client.api.v1
        .namespaces("default")
        .services(`${functionName}:http-function-port`)
        .proxy("healthz")
        .get();
      health = res.body;
    } catch (e) {}
    if (health !== "OK") {
      await sleep(100);
    }
  } while (health !== "OK" && watchdog < 1000);
  if (health !== "OK") {
    throw new Error("POD DID NOT GOT READY");
  }
}

async function tryMultipleTimes<T>(cb: () => Promise<T>): Promise<T> {
  let watchdog = 0;
  do {
    watchdog++;
    try {
      const ret = await cb();
      return ret;
    } catch (e) {
      await sleep(100);
    }
  } while (watchdog < 10000);
  throw new Error(`Multime time failed to get a function. ${cb.name}`);
}

async function runUserCodeNTimes(
  n: number,
  attemptsRemaining = 2
): Promise<{
  correctCalls: number;
  errorCalls: number;
}> {
  if (n === 0 || attemptsRemaining === 0)
    return { correctCalls: 0, errorCalls: n };
  let correctCalls = 0,
    errorCalls = 0;
  for (let i = 0; i < n; i++) {
    const res = await fetch(addMemoryPath).catch(() => ({ status: 520 }));
    res.status;
    res.status === 200 ? correctCalls++ : errorCalls++;
  }
  const nextAttempt = await runUserCodeNTimes(
    errorCalls,
    attemptsRemaining - 1
  );
  return {
    correctCalls: correctCalls + nextAttempt.correctCalls,
    errorCalls: errorCalls - nextAttempt.correctCalls
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
  setTimeout(() => console.log(msg), 0);
}
const main = async () => {
  await fs.writeFile(
    csvName,
    "target;tries;memory_in_mbs;errors;memory_in_bytes\n"
  );
  const functionService = client.api.v1
    .namespaces("default")
    .services(`${functionName}:http-function-port`);
  //restart the whole pod to count the memory
  await restart();

  log("Starting to run the loop");
  let target_runs = 5000,
    tries = 0,
    errors = 0;
  const step = Math.floor(target_runs / 5);
  log(`Starting run #${target_runs} makign ${target_runs} calls`);
  for (tries = 0; tries < target_runs; tries++) {
    const res = await fetch(addMemoryPath).catch(() => ({ status: 520 }));
    res.status === 200 ?? errors++;
    const {
      body: memory
    }: { body: NodeJS.MemoryUsage } = await tryMultipleTimes(() =>
      functionService.proxy("heapz").get()
    );
    fs.appendFile(
      csvName,
      "" +
        target_runs +
        ";" +
        tries +
        ";" +
        (memory.heapUsed / 1024 / 1024)
          .toString()
          .split(".")
          .join(",") +
        ";" +
        errors +
        ";" +
        memory.heapUsed +
        ";\n"
    );
    if (tries % step === 0) {
      log(`  Step ${tries} with ${errors} so far.`);
    }
  }
};
main();
