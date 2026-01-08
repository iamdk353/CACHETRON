import { useState, type Dispatch, type SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SingleSetForm({
  autoTTL,
}: {
  autoTTL: boolean;
  setAutoTTL: Dispatch<SetStateAction<boolean>>;
}) {
  const [keyName, setKeyName] = useState("");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  /* ---------- SET ---------- */
  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      key: keyName,
      value,
    };

    if (!autoTTL) {
      payload.ttl = Number(ttl);
    }

    await fetch("http://localhost:3001/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setValue("");
    setTtl("");
  };

  /* ---------- GET ---------- */
  const handleGet = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(
      `http://localhost:3001/get?key=${encodeURIComponent(keyName)}`
    );

    const data = await res.json();
    setResult(data.value ?? "null");
  };

  return (
    <div className="space-y-10">
      {/* ---------- SET FORM ---------- */}
      <form onSubmit={handleSet} className="space-y-7 max-w-sm">
        <div className="space-y-1">
          <Label>Key</Label>
          <Input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="cache:key"
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Value</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="some value"
            required
          />
        </div>

        {!autoTTL && (
          <div className="space-y-1">
            <Label>TTL (seconds)</Label>
            <Input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              placeholder="60"
              required
            />
          </div>
        )}

        <Button type="submit">Save</Button>
      </form>

      {/* ---------- GET FORM ---------- */}
      <form onSubmit={handleGet} className="space-y-7 max-w-sm">
        <Button type="submit">Get</Button>

        {result !== null && (
          <div className="space-y-1">
            <Label>Value</Label>
            <Input value={result} readOnly />
          </div>
        )}
      </form>
    </div>
  );
}
