"use client";

import CacheRatioAreaChart from "./Graph";
import { Slider } from "@/components/ui/slider";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";

const Playground = () => {
  const [setValue, setSetValue] = useState<number[]>([1]);
  const [getValue, setGetValue] = useState<number[]>([1]);

  const [setLink, setSetLink] = useState(
    "http://localhost:3001/set/bulk?count=1"
  );
  const [getLink, setGetLink] = useState(
    "http://localhost:3001/get/bulk?count=1"
  );

  const [loadingSet, setLoadingSet] = useState(false);
  const [loadingGet, setLoadingGet] = useState(false);

  const sendRequest = async (url: string, method: "GET" | "POST") => {
    try {
      await fetch(url, { method });
    } catch (e) {
      console.error("Request failed", e);
    }
  };

  return (
    <div>
      <p className="px-10">
        Stimulate real-time traffic using Cachetron Playground
      </p>

      <CacheRatioAreaChart isPlayground />

      <div className="flex justify-between p-10">
        {/* ---------- SET ---------- */}
        <div>
          <p>Simulating High-Traffic SET Requests</p>

          <Input
            className="my-4 w-full"
            value={setLink}
            onChange={(e) => setSetLink(e.target.value)}
          />

          <Slider
            defaultValue={[1]}
            max={100}
            step={1}
            onValueChange={(v) => {
              setSetValue(v);
              setSetLink(`http://localhost:3001/set/bulk?count=${v[0]}`);
            }}
          />

          <Button
            className="m-4"
            disabled={loadingSet}
            onClick={async () => {
              setLoadingSet(true);
              await sendRequest(setLink, "POST");
              setLoadingSet(false);
            }}
          >
            {loadingSet ? "Sending..." : `Start ${setValue[0]} SET Requests`}
          </Button>
        </div>

        {/* ---------- GET ---------- */}
        <div>
          <p>Simulating High-Traffic GET Requests</p>

          <Input
            className="my-4 w-full"
            value={getLink}
            onChange={(e) => setGetLink(e.target.value)}
          />

          <Slider
            defaultValue={[1]}
            max={100}
            min={1}
            className="mb-3"
            step={1}
            onValueChange={(v) => {
              setGetValue(v);
              setGetLink(`http://localhost:3001/get/bulk?count=${v[0]}`);
            }}
          />

          <Button
            disabled={loadingGet}
            onClick={async () => {
              setLoadingGet(true);
              await sendRequest(getLink, "GET");
              setLoadingGet(false);
            }}
          >
            {loadingGet ? "Sending..." : `Start ${getValue[0]} GET Requests`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Playground;
