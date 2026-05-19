import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: ReturnType<typeof createFFmpegProxy> | null = null;

function createFFmpegProxy() {
  let worker: Worker | null = null;
  let loaded = false;
  let msgId = 0;
  const resolvers: Record<number, (v: unknown) => void> = {};
  const rejecters: Record<number, (v: unknown) => void> = {};

  function send(type: string, data: unknown, transfer: Transferable[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      resolvers[id] = resolve;
      rejecters[id] = reject;
      worker?.postMessage({ id, type, data }, transfer);
    });
  }

  return {
    get loaded() { return loaded; },
    async load(config: { coreURL: string; wasmURL: string }) {
      if (loaded) return true;
      const workerURL = await toBlobURL(
        "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js",
        "text/javascript"
      );
      worker = new Worker(workerURL, { type: undefined as unknown as WorkerType });
      worker.onmessage = ({ data: { id, type, data } }) => {
        if (type === "LOAD") {
          loaded = true;
          resolvers[id]?.(data);
        } else if (type === "ERROR") {
          rejecters[id]?.(data);
        } else {
          resolvers[id]?.(data);
        }
        delete resolvers[id];
        delete rejecters[id];
      };
      await send("LOAD", config);
      return true;
    },
    writeFile(path: string, data: Uint8Array) {
      return send("WRITE_FILE", { path, data }, [data.buffer as ArrayBuffer]);
    },
    readFile(path: string) {
      return send("READ_FILE", { path, encoding: "binary" });
    },
    deleteFile(path: string) {
      return send("DELETE_FILE", { path });
    },
    exec(args: string[]) {
      return send("EXEC", { args, timeout: -1 });
    },
  };
}

export async function getFFmpeg() {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = createFFmpegProxy();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function convertAudio(
  inputData: Uint8Array,
  inputName: string,
  outputName: string,
  extraArgs: string[] = []
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  await ffmpeg.writeFile(inputName, inputData);
  await ffmpeg.exec(["-i", inputName, ...extraArgs, outputName]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  return data as Uint8Array;
}
