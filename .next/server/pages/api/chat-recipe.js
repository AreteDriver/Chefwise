"use strict";(()=>{var e={};e.id=524,e.ids=[524],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},2079:e=>{e.exports=import("openai")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},9761:(e,t,n)=>{n.a(e,async(e,r)=>{try{n.r(t),n.d(t,{config:()=>d,default:()=>c,routeModule:()=>p});var o=n(1802),s=n(7153),i=n(6249),a=n(4724),u=e([a]);a=(u.then?(await u)():u)[0];let c=(0,i.l)(a,"default"),d=(0,i.l)(a,"config"),p=new o.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/chat-recipe",pathname:"/api/chat-recipe",bundlePath:"",filename:""},userland:a});r()}catch(e){r(e)}})},4724:(e,t,n)=>{n.a(e,async(e,r)=>{try{n.r(t),n.d(t,{default:()=>i});var o=n(2079),s=e([o]);let a=new(o=(s.then?(await s)():s)[0]).default({apiKey:process.env.OPENAI_API_KEY}),u=`You are ChefWise, an enthusiastic and helpful AI cooking assistant. You help people discover recipes, answer cooking questions, and provide meal suggestions.

Your personality:
- Friendly and conversational
- Ask clarifying questions to understand preferences
- Offer multiple options when appropriate
- Provide detailed recipes when requested
- Give cooking tips and substitutions

When someone asks about recipes:
1. Ask about dietary restrictions, preferences, or cooking time if not mentioned
2. Offer 2-3 options based on their needs
3. When they choose one, provide a detailed recipe with ingredients and steps
4. Be ready to modify or suggest alternatives

Keep responses concise but helpful. Use emojis occasionally to be friendly.`;async function i(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{messages:n}=e.body;if(!n||!Array.isArray(n))return t.status(400).json({error:"Messages are required"});try{let e=(await a.chat.completions.create({model:"gpt-3.5-turbo",messages:[{role:"system",content:u},...n],temperature:.8,max_tokens:500})).choices[0].message.content;t.status(200).json({message:e})}catch(e){console.error("OpenAI Error:",e),t.status(500).json({error:"Failed to get response"})}}r()}catch(e){r(e)}})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=9761);module.exports=n})();