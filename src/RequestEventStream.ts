/* eslint-disable */
import { workspace } from "vscode";
import { FetchStream } from "./FetchStream";
import AbortController from "abort-controller";

let abortController = new AbortController();

export async function stopEventStream() {
    abortController.abort();
}

export async function postEventStream(prompt: string, msgCallback: (data: string) => any, doneCallback: () => void, errorCallback: (err: any) => void) {
    const serverAddress = workspace.getConfiguration("CodeShell").get("ServerAddress") as string;
    const maxtokens = workspace.getConfiguration("CodeShell").get("ChatMaxTokens") as number;

    const modelEnv = workspace.getConfiguration("CodeShell").get("RunEnvForLLMs") as string;
    var uri = "";
    var body = {};
    if ("CPU with llama.cpp" == modelEnv) {
        uri = "/completion"
        body = {
            "prompt": prompt,
            "n_predict": maxtokens, "temperature": 0.2, "repetition_penalty": 1.2,
            "top_k":40,  "top_p":0.95, "stream": true, "stop": ["</s>"],
        };
    }
    if ("GPU with TGI toolkit" == modelEnv) {
        uri = "/generate_stream"
        body = {
            'inputs': prompt,
            'parameters': {
                'max_new_tokens': maxtokens,
                'temperature': 0.6, 'top_p': 0.95, 'do_sample': true, 'repetition_penalty': 1.2, 
                'stop': ["|<end>|", "|end|", "<|endoftext|>", "## human"]
            }
        };
    }
    abortController = new AbortController();
    new FetchStream({
        url: serverAddress + uri,
        requestInit: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: abortController.signal
        },
        onmessage: msgCallback,
        ondone: doneCallback,
        onerror: errorCallback
    });

}