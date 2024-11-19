import{a as c,r,j as s,S as l,C as y,b as C,d as b,R as k}from"./index2.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=c("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=c("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=c("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]),d="http://localhost:5001";function M(){const[h,m]=r.useState([]),[o,n]=r.useState(null),[i,x]=r.useState({}),[a,p]=r.useState(null),[u,j]=r.useState("");r.useEffect(()=>{f()},[]);const f=async()=>{try{const e=await fetch(`${d}/api/sessions`);if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();m(t),n(null)}catch(e){console.error("Error fetching sessions:",e),n("Failed to fetch sessions")}},v=e=>{x(t=>({...t,[e]:!t[e]}))},g=e=>e<1024?e+" B":e<1024*1024?(e/1024).toFixed(1)+" KB":(e/(1024*1024)).toFixed(1)+" MB",N=e=>new Date(e).toLocaleString(),S=async e=>{try{const t=await fetch(`${d}/api/sessions/${e.path}`);if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const w=await t.json();p(e),j(w.content),n(null)}catch(t){console.error("Error fetching file content:",t),n("Failed to fetch file content")}};return s.jsx("div",{className:"h-screen bg-white",children:s.jsxs("div",{className:"p-4",children:[s.jsx("h1",{className:"text-lg font-bold mb-4",children:"Saved Sessions"}),o&&s.jsx("div",{className:"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm",children:o}),s.jsxs("div",{className:"grid grid-cols-2 gap-4 h-[calc(100vh-100px)]",children:[s.jsx(l,{className:"h-full",children:s.jsx("div",{className:"space-y-2",children:h.map(e=>s.jsx(y,{className:"shadow-sm",children:s.jsxs(C,{className:"p-3",children:[s.jsxs("div",{className:"flex items-center gap-2 cursor-pointer",onClick:()=>v(e.title),children:[i[e.title]?s.jsx(E,{size:16}):s.jsx(F,{size:16}),s.jsx("h3",{className:"font-medium",children:e.title})]}),i[e.title]&&s.jsx("div",{className:"mt-2 pl-6 space-y-2",children:e.files.map(t=>s.jsxs("div",{className:`
                              flex items-center gap-2 p-2 rounded cursor-pointer
                              ${(a==null?void 0:a.path)===t.path?"bg-blue-50":"hover:bg-gray-50"}
                            `,onClick:()=>S(t),children:[s.jsx(z,{size:14}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsx("div",{className:"text-sm truncate",children:t.filename}),s.jsxs("div",{className:"text-xs text-gray-500",children:[N(t.modified)," - ",g(t.size)]})]})]},t.path))})]})},e.title))})}),s.jsx(l,{className:"h-full border rounded p-4",children:a?s.jsxs("div",{children:[s.jsx("h3",{className:"font-medium mb-2",children:a.filename}),s.jsx("pre",{className:"text-sm whitespace-pre-wrap",children:u})]}):s.jsx("div",{className:"text-gray-500 text-center mt-4",children:"Select a file to view its content"})})]})]})})}b.createRoot(document.getElementById("root")).render(s.jsx(k.StrictMode,{children:s.jsx(M,{})}));
