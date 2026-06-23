const ENV = window.ENV || {};

export const CONFIG = {
  apiUrl:          ENV.apiUrl          || "/api",
  nodeName:        ENV.nodeName        || "coredns-node",
  bridgePort:      ENV.bridgePort      || "3000",
  appTitle:        ENV.appTitle        || "CoreDNS Manager",
  refreshInterval: Number(ENV.refreshInterval) || 0,
  authEnabled:     ENV.authEnabled     === "true",
  // Le credenziali non escono mai dal server — auth via session cookie httpOnly
};

export const RECORD_TYPES = ["A","AAAA","CNAME","MX","TXT","NS","PTR","SRV","CAA"];

export const TABS = [
  { id: "zones",    label: "Zone DNS",      icon: "globe"   },
  { id: "reverse",  label: "Reverse Zone",  icon: "reverse" },
  { id: "query",    label: "Query DNS",     icon: "search"  },
  { id: "corefile", label: "Corefile",      icon: "file"    },
  { id: "info",     label: "Informazioni",  icon: "info"    },
];
