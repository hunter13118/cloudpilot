// Maps catalog icon keys → lucide components (enterprise icon set per blueprint).
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Container,
  Database,
  DoorOpen,
  Flame,
  Gauge,
  HardDrive,
  KeyRound,
  ListChecks,
  Lock,
  Network,
  Radio,
  Search,
  Server,
  Share2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

const MAP = {
  "bar-chart-3": BarChart3,
  boxes: Boxes,
  "brain-circuit": BrainCircuit,
  container: Container,
  database: Database,
  "door-open": DoorOpen,
  flame: Flame,
  gauge: Gauge,
  "hard-drive": HardDrive,
  "key-round": KeyRound,
  "list-checks": ListChecks,
  lock: Lock,
  network: Network,
  radio: Radio,
  search: Search,
  server: Server,
  "share-2": Share2,
  shield: Shield,
  sparkles: Sparkles,
  zap: Zap,
};

export default function Icon({ name, size = 16, className = "" }) {
  const Cmp = MAP[name] ?? Boxes;
  return <Cmp size={size} className={className} />;
}
