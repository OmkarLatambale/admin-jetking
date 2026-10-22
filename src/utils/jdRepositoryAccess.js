export const JD_REPOSITORY_PLACEMENT_OFFICER_EMAILS = [
  "nagpurmahal.placement@jetking.com",
  "wardha.placement@jetking.com",
  "wakad.placement@jetking.com",
  "swargate.placement@jetking.com",
  "vasai.placement@jetking.com",
  "thane.placement@jetking.com",
  "bor.placement@jetking.com",
  "dadar.placement@jetking.com",
  "durg.placement@jetking.com",
  "vashi.placement@jetking.com",
  "mn.placement@jetking.com",
  "kukatpally.placement@jetking.com",
  "shn.placement@jetking.com",
  "kochi.placement@jetking.com",
  "amp.placement@jetking.com",
  "vashiplacementofficer@test.com",
  "gur.placement@jetking.com",
  "dhanbad.placement@jetking.com",
  "balasore.placement@jetking.com",
  "bbn.placement@jetking.com",
  "en.placement3@jetking.com",
  "en.placement@jetking.com",
  "elgin.placement@jetking.com",
  "chd.placement@jetking.com",
  "jammu.placement@jetking.com",
  "orai@jetking.com",
  "azadpur.placement@jetking.com",
  "bhopal.placement@jetking.com",
  "grp@jetking.com",
  "gwalior.placement@jetking.com",
  "ind.placement@jetking.com",
  "kanpur.placement@jetking.com",
  "lko.placement@jetking.com",
  "albd.placement@jetking.com",
  "placement.southex@jetking.com",
  "varanasi.placement@jetking.com",
  "vkp.placement@jetking.com",
  "noida.placement@jetking.com",
  "mohali@jetking.com",
  "orai.placement@jetking.com"
];

const JD_REPOSITORY_PLACEMENT_OFFICER_EMAIL_SET = new Set(
  JD_REPOSITORY_PLACEMENT_OFFICER_EMAILS
);

export const normalizeEmail = (email) => (email || "").trim().toLowerCase();

export const isApprovedJdPlacementOfficer = (user) =>
  user?.role === "placement_officer" &&
  JD_REPOSITORY_PLACEMENT_OFFICER_EMAIL_SET.has(normalizeEmail(user?.email));

export const canViewJdRepository = (user) =>
  ["admin", "super_admin", "tpo", "academic_head"].includes(user?.role) ||
  isApprovedJdPlacementOfficer(user);

export const canUploadJd = (user) =>
  ["admin", "super_admin", "tpo"].includes(user?.role) ||
  isApprovedJdPlacementOfficer(user);

