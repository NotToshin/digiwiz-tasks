export function calendarStatuses(month:string,today:string,start:string,weekdays:number[],holidays:string[],days:Record<string,number>) {
 const first=new Date(month+'-01T00:00:00Z');
 const last=new Date(first);
 last.setUTCMonth(last.getUTCMonth()+1,0);
 const result:Record<string,string>={};
 for(let day=1;day<=last.getUTCDate();day++){
  const date=month+'-'+String(day).padStart(2,'0');
  if(date<start)continue;
  if(Object.hasOwn(days,date)) result[date]='Worked';
  else if(holidays.includes(date)) result[date]='Holiday';
  else if(!weekdays.includes(new Date(date+'T00:00:00Z').getUTCDay())) result[date]='Off';
  else if(date<today) result[date]='Leave';
 }
 return result;
}
