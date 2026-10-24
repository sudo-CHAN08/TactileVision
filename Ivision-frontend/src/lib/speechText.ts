import type { HazardEvent } from "@/types/hazard";

type LanguagePack = {
  welcome: string;
  cameraReady: string;
  cameraStopped: string;
  findGuidance: string;
  serviceUnavailable: string;
  permissionDenied: string;
  sceneUnavailable: string;
  objectUnavailable: string;
  textUnavailable: string;
  cameraAligned: string;
  cameraTiltDown: string;
  cameraTiltUp: string;
  severity: Record<HazardEvent["severity"], string>;
  direction: Record<HazardEvent["direction"], string>;
  distance: (value: number) => string;
  hazardTemplate: (severity: string, hazard: string, direction: string, distance: string) => string;
};

const packs: Record<string, LanguagePack> = {
  "hi-IN": {
    welcome: "Ivision तैयार है। शुरू करने के लिए कैमरा चालू करें।",
    cameraReady: "कैमरा चालू है। खतरे की पहचान सेवा जुड़ी नहीं है।",
    cameraStopped: "कैमरा बंद है। सहायता रोक दी गई है।",
    findGuidance: "वस्तु खोजें चुना गया है। वस्तु का नाम लिखें।",
    serviceUnavailable: "यह सुविधा अभी विज़न सेवा से जुड़ी नहीं है।",
    permissionDenied: "कैमरे की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें।",
    sceneUnavailable: "दृश्य का वर्णन उपलब्ध नहीं है। विज़न सेवा जुड़ी नहीं है।",
    objectUnavailable: "वस्तु की पहचान उपलब्ध नहीं है। विज़न सेवा जुड़ी नहीं है।",
    textUnavailable: "पाठ पढ़ना उपलब्ध नहीं है। विज़न सेवा जुड़ी नहीं है।",
    cameraAligned: "कैमरे का कोण सही है।",
    cameraTiltDown: "कैमरा नीचे की ओर है। फोन थोड़ा ऊपर उठाएँ।",
    cameraTiltUp: "कैमरा ऊपर की ओर है। फोन थोड़ा नीचे करें।",
    severity: { low: "कम", medium: "मध्यम", high: "उच्च", critical: "अत्यावश्यक" },
    direction: { front: "सामने", "front-left": "सामने बाईं ओर", "front-right": "सामने दाईं ओर", left: "बाईं ओर", right: "दाईं ओर", rear: "पीछे", unknown: "दिशा ज्ञात नहीं" },
    distance: (value) => `, ${value} मीटर दूर`,
    hazardTemplate: (severity, hazard, direction, distance) => `${severity} खतरे की चेतावनी। ${hazard}, ${direction}${distance}.`,
  },
  "bn-IN": {
    welcome: "আইভিশন প্রস্তুত। শুরু করতে ক্যামেরা চালু করুন।",
    cameraReady: "ক্যামেরা চালু। বিপদ শনাক্তকরণ পরিষেবা সংযুক্ত নয়।",
    cameraStopped: "ক্যামেরা বন্ধ। সহায়তা থামানো হয়েছে।",
    findGuidance: "বস্তু খোঁজা নির্বাচিত হয়েছে। বস্তুর নাম লিখুন।",
    serviceUnavailable: "এই সুবিধাটি এখনো ভিশন পরিষেবার সঙ্গে যুক্ত নয়।",
    permissionDenied: "ক্যামেরার অনুমতি মেলেনি। ব্রাউজার সেটিংসে অনুমতি দিয়ে আবার চেষ্টা করুন।",
    sceneUnavailable: "দৃশ্যের বিবরণ পাওয়া যাচ্ছে না। ভিশন পরিষেবা সংযুক্ত নয়।",
    objectUnavailable: "বস্তু শনাক্ত করা যাচ্ছে না। ভিশন পরিষেবা সংযুক্ত নয়।",
    textUnavailable: "লেখা পড়া যাচ্ছে না। ভিশন পরিষেবা সংযুক্ত নয়।",
    cameraAligned: "ক্যামেরার কোণ ঠিক আছে।",
    cameraTiltDown: "ক্যামেরা নিচের দিকে। ফোনটি একটু তুলুন।",
    cameraTiltUp: "ক্যামেরা ওপরের দিকে। ফোনটি একটু নামান।",
    severity: { low: "কম", medium: "মাঝারি", high: "উচ্চ", critical: "জরুরি" },
    direction: { front: "সামনে", "front-left": "সামনে বামে", "front-right": "সামনে ডানে", left: "বামে", right: "ডানে", rear: "পেছনে", unknown: "দিক অজানা" },
    distance: (value) => `, ${value} মিটার দূরে`,
    hazardTemplate: (severity, hazard, direction, distance) => `${severity} বিপদ সতর্কতা। ${hazard}, ${direction}${distance}.`,
  },
  "ta-IN": {
    welcome: "ஐவிஷன் தயார். தொடங்க கேமராவை இயக்குங்கள்.",
    cameraReady: "கேமரா இயக்கத்தில் உள்ளது. அபாயக் கண்டறிதல் சேவை இணைக்கப்படவில்லை.",
    cameraStopped: "கேமரா அணைக்கப்பட்டது. உதவி நிறுத்தப்பட்டது.",
    findGuidance: "பொருளைக் கண்டறிதல் தேர்ந்தெடுக்கப்பட்டது. பொருளின் பெயரை உள்ளிடுங்கள்.",
    serviceUnavailable: "இந்த வசதி இன்னும் பார்வைச் சேவையுடன் இணைக்கப்படவில்லை.",
    permissionDenied: "கேமரா அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதித்து மீண்டும் முயற்சிக்கவும்.",
    sceneUnavailable: "காட்சியின் விளக்கம் கிடைக்கவில்லை. பார்வைச் சேவை இணைக்கப்படவில்லை.",
    objectUnavailable: "பொருள் அடையாளம் கிடைக்கவில்லை. பார்வைச் சேவை இணைக்கப்படவில்லை.",
    textUnavailable: "உரையைப் படிக்க முடியவில்லை. பார்வைச் சேவை இணைக்கப்படவில்லை.",
    cameraAligned: "கேமரா கோணம் சரியாக உள்ளது.",
    cameraTiltDown: "கேமரா கீழ்நோக்கி உள்ளது. போனைச் சற்றே உயர்த்துங்கள்.",
    cameraTiltUp: "கேமரா மேல்நோக்கி உள்ளது. போனைச் சற்றே தாழ்த்துங்கள்.",
    severity: { low: "குறைந்த", medium: "நடுத்தர", high: "அதிக", critical: "மிக அவசர" },
    direction: { front: "முன்புறம்", "front-left": "முன்புற இடது", "front-right": "முன்புற வலது", left: "இடது", right: "வலது", rear: "பின்புறம்", unknown: "திசை தெரியவில்லை" },
    distance: (value) => `, ${value} மீட்டர் தொலைவில்`,
    hazardTemplate: (severity, hazard, direction, distance) => `${severity} அபாய எச்சரிக்கை. ${hazard}, ${direction}${distance}.`,
  },
  "es-ES": {
    welcome: "Ivision está listo. Enciende la cámara para comenzar.",
    cameraReady: "La cámara está encendida. La detección de peligros no está conectada.",
    cameraStopped: "Cámara apagada. Asistencia detenida.",
    findGuidance: "Buscar objeto seleccionado. Escribe el nombre del objeto.",
    serviceUnavailable: "Esta función todavía no está conectada al servicio de visión.",
    permissionDenied: "Se denegó el permiso de cámara. Permítelo en la configuración del navegador e inténtalo de nuevo.",
    sceneUnavailable: "La descripción de la escena no está disponible. El servicio de visión no está conectado.",
    objectUnavailable: "La identificación del objeto no está disponible. El servicio de visión no está conectado.",
    textUnavailable: "La lectura de texto no está disponible. El servicio de visión no está conectado.",
    cameraAligned: "El ángulo de la cámara está nivelado.",
    cameraTiltDown: "La cámara apunta hacia abajo. Sube un poco el teléfono.",
    cameraTiltUp: "La cámara apunta hacia arriba. Baja un poco el teléfono.",
    severity: { low: "baja", medium: "media", high: "alta", critical: "crítica" },
    direction: { front: "delante", "front-left": "delante a la izquierda", "front-right": "delante a la derecha", left: "a la izquierda", right: "a la derecha", rear: "detrás", unknown: "dirección desconocida" },
    distance: (value) => `, a ${value} metros`,
    hazardTemplate: (severity, hazard, direction, distance) => `Alerta ${severity}. ${hazard}, ${direction}${distance}.`,
  },
};

function resolvePack(language: string): LanguagePack | undefined {
  const code = language === "system" && typeof navigator !== "undefined" ? navigator.language : language;
  const normalized = code.toLowerCase();
  return packs[code] ?? Object.entries(packs).find(([locale]) => locale.toLowerCase().startsWith(`${normalized.split("-")[0]}-`))?.[1];
}

export function localizeAppSpeech(text: string, language: string) {
  const pack = resolvePack(language);
  if (!pack) return text;
  const exact: Record<string, string> = {
    "Ivision is ready. Turn on the camera to begin.": pack.welcome,
    "Camera preview ready. Hazard detection is not connected.": pack.cameraReady,
    "Camera is on. Hazard detection is not connected.": pack.cameraReady,
    "Camera off. Assistance stopped.": pack.cameraStopped,
    "Find object selected. Enter the object name in the question field.": pack.findGuidance,
    "This feature is not connected to a vision service yet.": pack.serviceUnavailable,
    "Camera permission was denied. Allow camera access in browser settings, then try again.": pack.permissionDenied,
    "Scene description unavailable. This feature is not connected to a vision service yet.": pack.sceneUnavailable,
    "Object identification unavailable. This feature is not connected to a vision service yet.": pack.objectUnavailable,
    "Text reading unavailable. This feature is not connected to a vision service yet.": pack.textUnavailable,
    "Camera angle aligned.": pack.cameraAligned,
    "Camera angled down. Raise the phone slightly.": pack.cameraTiltDown,
    "Camera angled up. Lower the phone slightly.": pack.cameraTiltUp,
  };
  if (text.includes("Camera permission was denied")) return pack.permissionDenied;
  return exact[text] ?? text;
}

export function localizeHazardSpeech(event: HazardEvent, language: string) {
  const pack = resolvePack(language);
  if (!pack) return `${event.severity} alert. ${event.hazard}, ${event.direction.replaceAll("-", " ")}${event.distance_m === undefined ? "" : `, ${event.distance_m} meters away`}.`;
  const distance = event.distance_m === undefined ? "" : pack.distance(event.distance_m);
  return pack.hazardTemplate(pack.severity[event.severity], event.hazard, pack.direction[event.direction], distance);
}






