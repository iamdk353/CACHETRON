// import { AppWindowIcon, CodeIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CacheChart from "./Graph";
import Playground from "./Playground";

export function Home() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Tabs defaultValue="account">
        <div className="h-20 w-full flex items-center justify-between px-7">
          <p className="font-semibold text-3xl ">Cachetron Control Center</p>
          <TabsList>
            <TabsTrigger value="account" className="">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="password" className="">
              Playground
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="account" className="">
          <div className="px-10">
            <p>Vizualize the performance of Cache System</p>
          </div>
          <CacheChart />
        </TabsContent>
        <TabsContent value="password">
          <Playground />
        </TabsContent>
      </Tabs>
    </div>
  );
}
