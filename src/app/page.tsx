import { Arena } from "./arena";
import { seedConfig } from "@/lib/harness/seed";

export default function Home() {
  return <Arena seed={seedConfig()} />;
}
