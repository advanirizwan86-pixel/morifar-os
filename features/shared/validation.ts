export type ValidationResult<T>={success:true;data:T}|{success:false;errors:Record<string,string>};
export function requiredText(form:FormData,key:string,min=1,max=500){const value=String(form.get(key)??"").trim();if(value.length<min)return{value,error:`${key} is required`};if(value.length>max)return{value,error:`${key} is too long`};return{value}}
export function validEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
