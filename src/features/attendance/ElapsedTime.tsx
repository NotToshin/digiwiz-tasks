export function formatElapsed(seconds:number) {
 const whole=Math.max(0,Math.floor(seconds));
 const hours=Math.floor(whole/3600);
 const minutes=Math.floor(whole/60)%60;
 return [hours,minutes,whole%60].map(value=>String(value).padStart(2,'0')).join(':');
}
export default function ElapsedTime({seconds}:{seconds:number}) {
 return <output aria-label="Working time">{formatElapsed(seconds)}</output>;
}
