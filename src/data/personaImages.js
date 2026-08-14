const PERSONA_IMAGE_FILES = {
  P01: "grace_teo.png",
  P02: "daniel_ong.png",
  P03: "Kavitha.png",
  P04: "kumar.png",
  P05: "su_mei.png",
  P06: "Jason_koh.png",
  P07: "Aidah.png",
  P08: "marcus_lee.png",
  P09: "Vanessa_chua.png",
  P10: "zhi_yong.png",
  P11: "Farhan.png",
  P12: "Michelle_goh.png",
  P13: "Yusof.png",
  P14: "Meera.png",
  P15: "Book_keng.png",
  P16: "Geok_hoon.png",
};

export function getPersonaImageUrl(persona) {
  const file = PERSONA_IMAGE_FILES[persona?.id];
  if (!file) return null;
  return `/practice_clients/${file}`;
}
