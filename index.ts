import * as k8sclient from "kubernetes-client";
import { promises as fs, watch } from "fs";
import _ from "lodash";
import * as _fp from "lodash/fp";
import { calculateFullHeapSize } from "./useParseCPU";
import fetch from "node-fetch";
const id = new Date().toISOString();

const functionName = "get-all-wines";
const addMemoryPath = "http://192.168.64.5.nip.io/wines";
const csvName = __dirname + "/wine_somefiles.csv";

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

async function runUserCodeNTimes(n: number, attemptsRemaining = 2): Promise<{
  correctCalls: number;
  errorCalls: number;
}> {
  if (n === 0 || attemptsRemaining === 0) return { correctCalls: 0, errorCalls: n };
  let correctCalls = 0, errorCalls = 0;
  for (let i = 0; i < n; i++) {
    const res = await fetch(addMemoryPath).catch(() => ({ status: 520 }))
    res.status;
    res.status === 200 ? correctCalls++ : errorCalls++;
  }
 // const val = await _.chain(
 //   _.times(n).map(() =>
 //     fetch(addMemoryPath).catch(() => ({ status: 520 }))
 //   )
 // )
 //   .thru(a => Promise.all(a))
 //   .value()
 //   .then(res =>
 //   );
  const nextAttempt = await runUserCodeNTimes(errorCalls, attemptsRemaining - 1);
  return {
    correctCalls: correctCalls + nextAttempt.correctCalls,
    errorCalls: errorCalls - nextAttempt.correctCalls
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const main = async () => {
  await fs.writeFile(csvName, "times_run;memory_used;\n");
  const functionService = client.api.v1
    .namespaces("default")
    .services(`${functionName}:http-function-port`);
  //restart the whole pod to count the memory
  console.log("Restarting to start from scratch...");
  await restart();

  console.log("Starting to run the loop");
  for (let i = 0; i < 1000; i++) {
    console.log(`Starting run #${i}`);
    await waitForPodToBeOkay();
    const { correctCalls, errorCalls } = await runUserCodeNTimes(i * 10);
    console.log(
      `Runned ${correctCalls} calls, with ${errorCalls} skipped. Now killing the user code`
    );
    await tryMultipleTimes(() => functionService.proxy("kill").get());
    console.log(`Killed the server, now getting logging names`);
    const logNames: any = await tryMultipleTimes(() =>
      functionService.proxy("get_log_names").get()
    );
    console.log(`Got the logs names, now downloading`);
    const logs: any[] = await Promise.all(
      logNames.body.map(name => functionService.proxy("log/" + name).get())
    );
    console.log(`Got the log files, saving in the csv.`);
    await fs.appendFile(
      csvName,
      "" +
        correctCalls +
        ";" +
        calculateFullHeapSize(logs[0].body.head) +
        ";" +
        errorCalls +
        ";\n"
    );
    await restart();
  }
};
main();
