import type { SelectOption } from "@/components/SearchableSelect";

export const NIGERIA_STATES: SelectOption[] = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
].map((state) => ({ value: state, label: state, description: state === "FCT" ? "Federal Capital Territory" : undefined }));

export const STATE_FILTER_OPTIONS: SelectOption[] = [{ value: "", label: "All states", description: "Search Nigeria's states and FCT" }, ...NIGERIA_STATES];

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Any status", description: "All evidence states" },
  { value: "confirmed", label: "Confirmed", description: "Multiple or official corroborating sources" },
  { value: "developing", label: "Developing", description: "Credible reports with details still changing" },
  { value: "unconfirmed", label: "Unconfirmed", description: "Single-source or incomplete corroboration" },
];

export const CASUALTY_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Any reported impact", description: "Do not restrict by impact type" },
  { value: "killed", label: "People killed", description: "Records with one or more reported deaths" },
  { value: "injured", label: "People injured", description: "Records with one or more reported injuries" },
  { value: "kidnapped", label: "People abducted", description: "Records with one or more reported abductions" },
];

export const SORT_OPTIONS: SelectOption[] = [
  { value: "date_desc", label: "Newest first", description: "Most recent incident dates first" },
  { value: "date_asc", label: "Oldest first", description: "Earliest incident dates first" },
  { value: "casualties_desc", label: "Most affected", description: "Highest reported victim impact first" },
];
