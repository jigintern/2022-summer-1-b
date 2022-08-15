import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";

// 変数宣言 //
let formJson = JSON.stringify({});

//let userName = ""; //投稿者(名前)
//let photo; //画像データ(暫定)
//let latitude; //緯度
//let longitude; //経度
//let type = ""; //自販機の種類
//let drinks = []; //売っている飲み物とか？
// 更に拡張できそう

console.log("Listening on http://localhost:8000");

serve(async (req) => {
  const pathName = new URL(req.url).pathname;

  if (req.method === "GET" && pathName === "/submit") {
    return new Response(formJson, {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST" && pathName === "/submit") {
    const requestJson = await req.json();
    const userName = requestJson.userName;
    const latitude = requestJson.latitude;
    const longitude = requestJson.longitude;
    const photo = requestJson.photo;

    const result = JSON.stringify({userName, latitude, longitude, photo});

    console.log("[POSTED]");
    console.log("result: " + result);

    formJson = result;
    return new Response(result);
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
}).then(r => {});