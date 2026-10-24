/** Provisional shape: confirm fields, enums, units and envelope with Person 3. */
export type HazardDirection = "front"|"front-left"|"front-right"|"left"|"right"|"rear"|"unknown";
export type HazardSeverity = "low"|"medium"|"high"|"critical";
export interface HazardEvent { id?:string; type:"hazard"; hazard:string; direction:HazardDirection; severity:HazardSeverity; timestamp?:string; distance_m?:number; confidence?:number; }
export type HazardInput = HazardEvent|unknown;
export function parseHazardEvent(input:HazardInput):HazardEvent|null {
 if(typeof input!=="object"||input===null)return null; const v=input as Record<string,unknown>;
 const dirs:HazardDirection[]=["front","front-left","front-right","left","right","rear","unknown"], sevs:HazardSeverity[]=["low","medium","high","critical"];
 if(v.type!=="hazard"||typeof v.hazard!=="string"||!v.hazard.trim()||!dirs.includes(v.direction as HazardDirection)||!sevs.includes(v.severity as HazardSeverity))return null;
 if(v.distance_m!==undefined&&(typeof v.distance_m!=="number"||!Number.isFinite(v.distance_m)||v.distance_m<0))return null;
 if(v.timestamp!==undefined&&(typeof v.timestamp!=="string"||Number.isNaN(Date.parse(v.timestamp))))return null;
 if(v.confidence!==undefined&&(typeof v.confidence!=="number"||!Number.isFinite(v.confidence)||v.confidence<0||v.confidence>1))return null;
 return {id:typeof v.id==="string"?v.id:undefined,type:"hazard",hazard:v.hazard.trim(),direction:v.direction as HazardDirection,severity:v.severity as HazardSeverity,timestamp:typeof v.timestamp==="string"?v.timestamp:new Date().toISOString(),distance_m:v.distance_m as number|undefined,confidence:v.confidence as number|undefined};
}
export const severityRank:Record<HazardSeverity,number>={low:1,medium:2,high:3,critical:4};