const token=process.env.MORIFAR_JOB_TOKEN;if(!token||token.length<32)throw new Error('Notification job secret not configured');
const response=await fetch('http://127.0.0.1:3000/api/jobs/notifications',{method:'POST',headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(60000)});
if(!response.ok)throw new Error(`Notification job failed: ${response.status}`);console.log(await response.text());
